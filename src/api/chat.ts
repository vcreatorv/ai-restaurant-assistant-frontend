import { ApiError, BASE, apiFetch, getCSRF } from "./client";
import type {
  ApiChat,
  ApiChatList,
  ApiChatWithMessages,
  ApiErrorBody,
  SSEDone,
  SSEMeta,
} from "./types";

export function listChats(params?: { limit?: number; offset?: number }): Promise<ApiChatList> {
  const q = new URLSearchParams();
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  if (params?.offset !== undefined) q.set("offset", String(params.offset));
  const qs = q.toString();
  return apiFetch<ApiChatList>(`/chats${qs ? `?${qs}` : ""}`);
}

export function getActiveChat(): Promise<ApiChat> {
  return apiFetch<ApiChat>("/chats/active");
}

export function getChat(
  id: string,
  params?: { messages_limit?: number; messages_before?: string },
): Promise<ApiChatWithMessages> {
  const q = new URLSearchParams();
  if (params?.messages_limit !== undefined) q.set("messages_limit", String(params.messages_limit));
  if (params?.messages_before !== undefined) q.set("messages_before", params.messages_before);
  const qs = q.toString();
  return apiFetch<ApiChatWithMessages>(`/chats/${id}${qs ? `?${qs}` : ""}`);
}

export function createChat(title?: string): Promise<ApiChat> {
  return apiFetch<ApiChat>("/chats", {
    method: "POST",
    body: JSON.stringify(title !== undefined ? { title } : {}),
  });
}

export function deleteChat(id: string): Promise<void> {
  return apiFetch<void>(`/chats/${id}`, { method: "DELETE" });
}

/**
 * SSE-обработчики для sendMessage. Сервер возвращает события `meta`, `token`,
 * `done`, `error` через text/event-stream.
 */
export type SSEHandlers = {
  onMeta?: (meta: SSEMeta) => void;
  onToken?: (delta: string) => void;
  onDone?: (info: SSEDone) => void;
  onStreamError?: (err: { code: string; message: string }) => void;
};

/**
 * Отправляет сообщение в чат и читает SSE-поток ответа ассистента.
 * Используется fetch + ReadableStream (а не EventSource), чтобы поддержать
 * POST с CSRF-заголовком и cookie-сессию.
 */
export async function sendMessage(
  chatId: string,
  content: string,
  handlers: SSEHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  const csrf = getCSRF();
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const res = await fetch(`${BASE}/chats/${chatId}/messages`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => null)) as { error?: ApiErrorBody } | null;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "stream_failed",
      body?.error?.message ?? "Stream failed",
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE-блоки разделяются пустой строкой (\n\n либо \r\n\r\n).
    let sep = findSeparator(buffer);
    while (sep) {
      const block = buffer.slice(0, sep.index);
      buffer = buffer.slice(sep.index + sep.length);
      dispatchBlock(block, handlers);
      sep = findSeparator(buffer);
    }
  }
  if (buffer.trim().length > 0) dispatchBlock(buffer, handlers);
}

function findSeparator(s: string): { index: number; length: number } | null {
  const a = s.indexOf("\n\n");
  const b = s.indexOf("\r\n\r\n");
  if (a === -1 && b === -1) return null;
  if (a === -1) return { index: b, length: 4 };
  if (b === -1) return { index: a, length: 2 };
  return a < b ? { index: a, length: 2 } : { index: b, length: 4 };
}

function dispatchBlock(block: string, h: SSEHandlers): void {
  let event = "message";
  const dataLines: string[] = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine;
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return;
  const data = dataLines.join("\n");
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return;
  }
  switch (event) {
    case "meta":
      h.onMeta?.(parsed as SSEMeta);
      break;
    case "token":
      h.onToken?.((parsed as { delta: string }).delta);
      break;
    case "done":
      h.onDone?.(parsed as SSEDone);
      break;
    case "error":
      h.onStreamError?.(parsed as { code: string; message: string });
      break;
  }
}
