import { useSyncExternalStore } from "react";

/*
 * Маркер «сейчас в чате используется мой черновик промпта».
 * Хранится в sessionStorage. На бэкенде usecase чата при входящем сообщении
 * от пользователя с role=admin читает таблицу prompt_drafts по admin_id —
 * этот фронтовый флаг нужен только для UI-индикации.
 */

const KEY = "prompt-draft-test";
const EVENT = "prompt-draft-change";

export function setPromptDraftTest(name: string | null) {
  if (name) sessionStorage.setItem(KEY, name);
  else sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function getPromptDraftTest(): string | null {
  return sessionStorage.getItem(KEY);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function usePromptDraftTest(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(KEY),
    () => null,
  );
}
