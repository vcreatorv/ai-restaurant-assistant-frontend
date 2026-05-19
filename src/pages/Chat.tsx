import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, Plus, ChevronRight, SquarePen, AlertCircle, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
import { DishImage } from "@/components/DishImage";
import { DishSheet } from "@/components/DishSheet";
import { QtyStepper } from "@/components/QtyStepper";
import { TypingIndicator } from "@/components/TypingIndicator";
import { chatHistory, type ChatMessage, type Dish, type CartItem } from "@/data/mock";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp } from "@/state/store";
import { createChat, getActiveChat, getChat, sendMessage } from "@/api/chat";
import type { ApiChatSuggestion, ApiMessage } from "@/api/types";
import { listChatSuggestions, trackSuggestionClick } from "@/api/suggestions";
import { allergenLabel, dietaryLabel } from "@/data/dietaryLabels";

/** Fallback на случай если бэк недоступен. Совпадает с миграционным seed'ом. */
const fallbackSuggestions: ApiChatSuggestion[] = [
  { id: -1, text: "Что-то острое и лёгкое" },
  { id: -2, text: "Хочу сытное на двоих" },
  { id: -3, text: "Подойдёт под белое вино" },
  { id: -4, text: "До 500 рублей" },
];

function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/*
 * Бэкенд встраивает в content финальный JSON-блок с recommended_dish_ids.
 * По системному промпту он должен быть в ```json …``` обёртке, но LLM иногда отдают
 * голый JSON без бэктиков — ловим оба варианта.
 *
 * Из стрима блок приходит токенами; прячем его «хвост» из отображаемого текста,
 * пока он не дописан до конца. Финальные ids считаем источником истины
 * (meta-событие SSE может тоже содержать RAG-кандидатов).
 */
const JSON_BLOCK_RE = /```json\s*(\{[\s\S]*?\})\s*```/;
const BARE_JSON_RE = /\{\s*"recommended_dish_ids"\s*:\s*\[[^\]]*\]\s*\}/;
// Открывающие маркеры стрима — либо ```json, либо начало голого ключа.
const JSON_OPEN_FENCED_RE = /```json/i;
const JSON_OPEN_BARE_RE = /\{\s*"recommended_dish_ids/;

function extractRecommended(content: string): { text: string; ids?: number[] } {
  // 1. Сначала пытаемся снять обёрнутый блок (предпочтительный формат).
  let match: { full: string; json: string; index: number } | null = null;
  const fenced = JSON_BLOCK_RE.exec(content);
  if (fenced) {
    match = { full: fenced[0], json: fenced[1], index: fenced.index };
  } else {
    // 2. Fallback: голый JSON-блок где-то в тексте.
    const bare = BARE_JSON_RE.exec(content);
    if (bare) {
      match = { full: bare[0], json: bare[0], index: bare.index };
    }
  }
  if (!match) return { text: content };
  let ids: number[] | undefined;
  try {
    const parsed = JSON.parse(match.json) as { recommended_dish_ids?: unknown };
    if (Array.isArray(parsed.recommended_dish_ids)) {
      ids = parsed.recommended_dish_ids.filter((x): x is number => typeof x === "number");
    }
  } catch {
    // оставляем ids = undefined; текст всё равно вычистим
  }
  const text = (content.slice(0, match.index) + content.slice(match.index + match.full.length)).trim();
  return { text, ids };
}

/**
 * Скрывает «хвост» сообщения, как только мы видим начало JSON-блока (фенс ```json
 * или голый ключ "recommended_dish_ids"). До закрытия блока он точно не нужен в UI.
 */
function stripPartialJsonBlock(content: string): string {
  const fencedStart = content.search(JSON_OPEN_FENCED_RE);
  const bareStart = content.search(JSON_OPEN_BARE_RE);
  const candidates = [fencedStart, bareStart].filter((i) => i >= 0);
  if (candidates.length === 0) return content;
  const start = Math.min(...candidates);
  return content.slice(0, start).trimEnd();
}

function mapApiMessage(m: ApiMessage): ChatMessage {
  const time = new Date(m.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (m.role === "user") {
    return { id: m.id, role: "user", text: m.content, time };
  }
  const { text, ids } = extractRecommended(m.content);
  return {
    id: m.id,
    role: "assistant",
    text,
    time,
    recommendedDishIds: ids ?? m.recommended_dish_ids,
  };
}

function GuestChatGate() {
  return (
    <>
      <Header title="Ассистент" />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--color-brand)]/10 flex items-center justify-center text-[var(--color-brand)]">
            <MessageCircle size={28} strokeWidth={1.8} />
          </div>
          <h2 className="text-[20px] font-semibold leading-tight text-[var(--color-fg)]">
            Войдите, чтобы общаться с ассистентом
          </h2>
          <p className="text-[14px] leading-relaxed text-[var(--color-fg-muted)]">
            Персональные рекомендации с учётом ваших пищевых ограничений и история диалогов доступны после входа.
          </p>
          <Link
            to="/login"
            className="tap mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-[15px] font-semibold text-white"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="tap text-[13px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            Нет аккаунта? Зарегистрироваться
          </Link>
        </div>
      </div>
    </>
  );
}

export default function Chat() {
  const { session, mockMode } = useApp();
  if (!mockMode && (!session || session.is_guest)) {
    return <GuestChatGate />;
  }
  return <ChatBody />;
}

function ChatBody() {
  const { addToCart, setCartQuantity, cart, profile, mockMode } = useApp();
  // В реальном режиме приветствие — виртуальный префикс, не часть messages.
  // В mock-режиме оставляем демо-историю как есть.
  const [messages, setMessages] = useState<ChatMessage[]>(mockMode ? chatHistory : []);
  const showWelcome = !mockMode;
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [cardsLayout, setCardsLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(!mockMode);
  const [suggestions, setSuggestions] = useState<ApiChatSuggestion[]>(fallbackSuggestions);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Грузим подсказки одним запросом на mount. При ошибке остаёмся на fallback.
  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    listChatSuggestions()
      .then((r) => {
        if (cancelled) return;
        if (r.items.length > 0) setSuggestions(r.items);
      })
      .catch(() => {
        // молча: fallback уже стоит
      });
    return () => {
      cancelled = true;
    };
  }, [mockMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, thinking]);

  // Загрузка активного чата при монтировании. В mock-режиме используем локальную историю.
  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    (async () => {
      try {
        const active = await getActiveChat();
        if (cancelled) return;
        setChatId(active.id);
        const full = await getChat(active.id, { messages_limit: 100 });
        if (cancelled) return;
        setMessages(full.messages.map(mapApiMessage));
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // profile.firstName сознательно не в deps — welcome подставится один раз при загрузке.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  function sendMock(text: string) {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      time: nowTime(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    const reply =
      "Хорошо, под этот запрос подойдёт несколько вариантов. Ризотто с белыми грибами — насыщенно, но не утяжеляет. Бургер Truffle для самой плотной трапезы. Карбонара — классика без сливок. Боул с лососем — сбалансированный вариант с белком.";
    const recommendedIds = [8, 4, 2, 3];

    setTimeout(() => {
      setThinking(false);
      setStreaming(true);
      const id = `a-${Date.now()}`;
      setStreamingId(id);
      setMessages((m) => [
        ...m,
        { id, role: "assistant", text: "", time: nowTime(), recommendedDishIds: undefined },
      ]);
      let idx = 0;
      const tick = setInterval(() => {
        idx += 2;
        setMessages((m) =>
          m.map((msg) => (msg.id === id ? { ...msg, text: reply.slice(0, idx) } : msg)),
        );
        if (idx >= reply.length) {
          clearInterval(tick);
          setMessages((m) =>
            m.map((msg) => (msg.id === id ? { ...msg, recommendedDishIds: recommendedIds } : msg)),
          );
          setStreaming(false);
          setStreamingId(null);
        }
      }, 18);
    }, 1600);
  }

  async function sendApi(text: string) {
    if (!chatId) return;
    const trimmed = text.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      time: nowTime(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    // placeholder для ответа ассистента — добавим только после первого события.
    let placeholderId: string | null = null;
    const ensurePlaceholder = (id: string, ids?: number[]) => {
      placeholderId = id;
      setThinking(false);
      setStreaming(true);
      setStreamingId(id);
      setMessages((m) => [
        ...m,
        { id, role: "assistant", text: "", time: nowTime(), recommendedDishIds: ids },
      ]);
    };

    try {
      let buffered = "";
      let metaIds: number[] | undefined;
      await sendMessage(chatId, trimmed, {
        onMeta: (meta) => {
          // meta может прийти как до, так и после первых token'ов.
          // ids из meta — RAG-кандидаты; если позже найдём JSON-блок в тексте, он
          // приоритетнее. Поэтому здесь ничего не показываем, только запоминаем.
          metaIds =
            meta.recommended_dish_ids && meta.recommended_dish_ids.length > 0
              ? meta.recommended_dish_ids
              : undefined;
          if (!placeholderId) ensurePlaceholder(meta.message_id);
        },
        onToken: (delta) => {
          if (!placeholderId) ensurePlaceholder(`a-${Date.now()}`);
          buffered += delta;
          const id = placeholderId;
          const visible = stripPartialJsonBlock(buffered);
          setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: visible } : msg)));
        },
        onDone: (info) => {
          if (!placeholderId) return;
          const id = placeholderId;
          const { text, ids } = extractRecommended(buffered);
          // Server-side recommended_dish_ids — авторитативный источник: бэкенд уже
          // парсит JSON-блок ответа LLM и применяет fallback по тексту. Если поле
          // пришло (даже пустым массивом) — это финальное решение, не падаем на
          // metaIds (там лежат ВСЕ RAG-кандидаты, 8+4 штук — если их показать,
          // юзер получит «много блюд» вместо одного реально упомянутого).
          // Fallback на JSON в тексте / metaIds только если сервер вообще не вернул
          // поле (старая версия бэкенда без done.recommended_dish_ids).
          const finalIds =
            info.recommended_dish_ids !== undefined
              ? info.recommended_dish_ids
              : (ids ?? metaIds);
          setMessages((m) =>
            m.map((msg) =>
              msg.id === id ? { ...msg, text, recommendedDishIds: finalIds } : msg,
            ),
          );
        },
        onStreamError: (err) => {
          // Тех. детали — в консоль для отладки, в чат — короткое user-friendly сообщение.
          console.error("[chat] stream error:", err);
          if (!placeholderId) ensurePlaceholder(`a-${Date.now()}`);
          const id = placeholderId;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === id
                ? { ...msg, text: "Что-то пошло не так. Попробуйте ещё раз.", isError: true }
                : msg,
            ),
          );
        },
      });
      // Страховка: если сервер закрыл стрим без события done.
      if (placeholderId) {
        const id = placeholderId;
        const { text, ids } = extractRecommended(buffered);
        if (ids || text !== buffered) {
          const finalIds = ids ?? metaIds;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === id ? { ...msg, text, recommendedDishIds: finalIds } : msg,
            ),
          );
        }
      }
    } catch (e) {
      console.error("[chat] send failed:", e);
      if (!placeholderId) {
        const id = `a-err-${Date.now()}`;
        setMessages((m) => [
          ...m,
          {
            id,
            role: "assistant",
            text: "Что-то пошло не так. Попробуйте ещё раз.",
            time: nowTime(),
            isError: true,
          },
        ]);
      }
    } finally {
      setThinking(false);
      setStreaming(false);
      setStreamingId(null);
    }
  }

  function send(text: string) {
    if (!text.trim() || streaming || thinking || chatLoading) return;
    if (mockMode) {
      sendMock(text);
    } else {
      void sendApi(text);
    }
  }

  async function startNewChat() {
    if (streaming || thinking) return;
    if (mockMode) {
      setMessages([]);
      return;
    }
    setChatLoading(true);
    try {
      const chat = await createChat();
      setChatId(chat.id);
      setMessages([]);
    } catch {
      // если не удалось — оставим текущий чат как есть
    } finally {
      setChatLoading(false);
    }
  }

  // quickAdd принимает messageId — id ассистент-сообщения, из которого пришла рекомендация.
  // Используется для аналитики «в корзину из чата» (cart_additions.source='chat').
  function quickAdd(dishId: number, messageId?: string) {
    addToCart(dishId, 1, undefined, { source: "chat", messageId });
  }

  return (
    <>
      <Header
        compact
        title="Чат"
        right={
          <button
            onClick={() => void startNewChat()}
            title="Новый диалог"
            aria-label="Новый диалог"
            className="tap p-1.5 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
          >
            <SquarePen size={16} />
          </button>
        }
      />

      <ContextBar profile={profile} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {/* Временный переключатель — для сравнения двух раскладок карточек.
            Будет убран после выбора финального варианта. */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[var(--color-fg-subtle)] uppercase tracking-wider font-semibold">
            Карточки
          </span>
          <button
            onClick={() => setCardsLayout("horizontal")}
            className={cn(
              "tap px-2.5 py-1 rounded-full font-medium transition-colors",
              cardsLayout === "horizontal"
                ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                : "bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] border border-[var(--color-border)]",
            )}
          >
            Горизонтально
          </button>
          <button
            onClick={() => setCardsLayout("vertical")}
            className={cn(
              "tap px-2.5 py-1 rounded-full font-medium transition-colors",
              cardsLayout === "vertical"
                ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                : "bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)] border border-[var(--color-border)]",
            )}
          >
            Вертикально
          </button>
        </div>

        {showWelcome && <WelcomeBubble firstName={profile.firstName} />}

        {messages.map((m) => (
          <Bubble
            key={m.id}
            message={m}
            isStreamingThis={m.id === streamingId}
            onOpenDish={(d) => setOpenDish(d)}
            onAdd={quickAdd}
            onSetQty={setCartQuantity}
            cart={cart}
            layout={cardsLayout}
          />
        ))}
        {thinking && (
          <div className="flex gap-2 items-start">
            <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-warm)] to-[var(--color-brand)] flex items-center justify-center text-white text-[12px] font-semibold">
              S
            </div>
            <div className="rounded-2xl rounded-tl-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] px-3.5 py-2.5">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      <div className="flex-none px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              // Аналитика: трекаем клик до отправки. Для fallback-подсказок (id<0) не трекаем.
              if (s.id > 0) void trackSuggestionClick(s.id);
              send(s.text);
            }}
            className="
              tap shrink-0 px-3 py-1.5 rounded-full
              text-[12px] text-[var(--color-fg-muted)]
              border border-[var(--color-border)]
              hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]
            "
          >
            {s.text}
          </button>
        ))}
      </div>

      <div className="flex-none px-3 pt-2 pb-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="
            flex items-end gap-2 p-2
            rounded-[1.25rem] bg-[var(--color-bg-elev)]
            border border-[var(--color-border)]
            focus-within:border-[var(--color-brand)] transition-colors
          "
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Спросите ассистента…"
            rows={1}
            className="
              flex-1 resize-none bg-transparent outline-none px-2 py-2
              text-[15px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]
              max-h-32 scrollbar-thin
            "
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming || thinking || chatLoading}
            className="
              tap shrink-0 w-10 h-10 rounded-full
              bg-[var(--color-brand)] text-[var(--color-brand-fg)]
              flex items-center justify-center
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      <DishSheet dish={openDish} onClose={() => setOpenDish(null)} />
    </>
  );
}

/*
 * ContextBar — тонкая полоска "что я учёл" вместо стикерной карточки.
 * Чёткая, незаметная, расширяется по тапу (можно потом).
 */
/*
 * AssistantMarkdown — рендер ответа ассистента через react-markdown.
 * Поддерживает только то, что мы реально просим в system-промпте:
 * **жирный** для названий блюд и пустые строки между абзацами.
 * Заголовки/списки/код инлайнятся как обычный текст (промпт явно их запрещает,
 * но если LLM вдруг сгенерит — пусть рендерится не как блок).
 *
 * Каретка стрима показывается на ВНУТРЕННЕМ последнем элементе через CSS-class на враппере.
 */
function AssistantMarkdown({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className={cn("space-y-2 [&_p]:m-0 [&_strong]:font-semibold", isStreaming && "assistant-streaming")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Заголовки рендерим как обычный жирный абзац — мы их не используем, но и не падаем.
          h1: ({ children }) => <p className="font-semibold">{children}</p>,
          h2: ({ children }) => <p className="font-semibold">{children}</p>,
          h3: ({ children }) => <p className="font-semibold">{children}</p>,
          // Списки промпт запрещает, но если LLM пришлёт — рендерим компактно.
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-0.5">{children}</ol>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

/**
 * ContextBar — индикатор активных ограничений профиля (аллергены + диета).
 *
 * Лежит отдельной flex-none-панелью МЕЖДУ header'ом и скролл-областью сообщений,
 * а не внутри прокручивающегося контента. Это не контент диалога, а состояние
 * фильтра — логичнее держать его всегда на виду, не sticky-имитацией.
 */
function ContextBar({ profile }: { profile: { firstName: string; allergens: string[]; dietary: string[] } }) {
  // В профиле хранятся канонические коды (nuts/dairy/...); для UI переводим в русские лейблы.
  const items = [
    ...profile.allergens.map(allergenLabel),
    ...profile.dietary.map(dietaryLabel),
  ];
  if (items.length === 0) return null;
  return (
    <div className="flex-none px-4 pt-2 pb-2 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
      <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elev)]/60 px-3.5 py-2">
        <div className="flex items-center gap-2 flex-wrap text-[12px] leading-tight">
          <span className="text-[var(--color-fg-subtle)] font-medium uppercase tracking-wider text-[10.5px]">
            Ограничения
          </span>
          {items.map((it, idx) => (
            <span key={`${it}-${idx}`} className="text-[var(--color-fg)]">
              {it}
              {idx < items.length - 1 && <span className="text-[var(--color-fg-subtle)]"> · </span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bubble({
  message,
  isStreamingThis,
  onOpenDish,
  onAdd,
  onSetQty,
  cart,
  layout,
}: {
  message: ChatMessage;
  isStreamingThis: boolean;
  onOpenDish: (d: Dish) => void;
  /**
   * onAdd с опциональным messageId — id assistant-сообщения, из которого
   * взято блюдо. Передаётся в analytics (cart_additions.source='chat').
   */
  onAdd: (dishId: number, messageId?: string) => void;
  onSetQty: (dishId: number, qty: number) => void;
  cart: CartItem[];
  layout: "horizontal" | "vertical";
}) {
  // Привязываем messageId один раз; вниз передаём «частично-applied» onAdd —
  // под-компоненты остаются с простой сигнатурой (dishId) => void.
  const onAddBound =
    message.role === "assistant"
      ? (dishId: number) => onAdd(dishId, message.id)
      : (dishId: number) => onAdd(dishId);
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-[var(--color-brand)] text-[var(--color-brand-fg)] px-4 py-2.5 text-[14.5px] leading-relaxed shadow-sm">
          {message.text}
          <div className="text-[10.5px] opacity-70 mt-1 text-right">{message.time}</div>
        </div>
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="flex gap-2 items-start">
        <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)] flex items-center justify-center">
          <AlertCircle size={15} />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 px-4 py-2.5 text-[14px] leading-relaxed text-[var(--color-fg)]">
          {message.text}
          <div className="text-[10.5px] text-[var(--color-fg-subtle)] mt-1">{message.time}</div>
        </div>
      </div>
    );
  }

  const isStreaming = isStreamingThis && message.text.length > 0;
  const recIds = message.recommendedDishIds ?? [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-start">
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-warm)] to-[var(--color-brand)] flex items-center justify-center text-white text-[12px] font-semibold">
          S
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
          <AssistantMarkdown text={message.text} isStreaming={isStreaming} />
          <div className="text-[10.5px] text-[var(--color-fg-subtle)] mt-1">{message.time}</div>
        </div>
      </div>

      {recIds.length > 0 && layout === "horizontal" && (
        <RecsHorizontal
          ids={recIds}
          onOpen={onOpenDish}
          onAdd={onAddBound}
          onSetQty={onSetQty}
          cart={cart}
        />
      )}
      {recIds.length > 0 && layout === "vertical" && (
        <RecsVertical
          ids={recIds}
          onOpen={onOpenDish}
          onAdd={onAddBound}
          onSetQty={onSetQty}
          cart={cart}
        />
      )}
    </div>
  );
}

/* ----- Карточки: горизонтальный rail (текущий) ----- */
function RecsHorizontal({
  ids,
  onOpen,
  onAdd,
  onSetQty,
  cart,
}: {
  ids: number[];
  onOpen: (d: Dish) => void;
  onAdd: (dishId: number) => void;
  onSetQty: (dishId: number, qty: number) => void;
  cart: CartItem[];
}) {
  const { getDishById } = useApp();
  return (
    <div className="-mx-4 px-4 flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
      {ids.map((id) => {
        const d = getDishById(id);
        if (!d) return null;
        const qty = cart.find((c) => c.dishId === id)?.quantity ?? 0;
        return (
          <article
            key={id}
            onClick={() => onOpen(d)}
            role="button"
            className={cn(
              "tap shrink-0 w-[180px] text-left",
              "rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)]",
              "hover:border-[var(--color-brand)] hover:shadow-md",
              "overflow-hidden flex flex-col relative",
              !d.isAvailable && "opacity-65",
            )}
          >
            <DishImage dish={d} className="h-[110px] w-full rounded-none" />
            <div className="p-2.5 space-y-1.5 flex flex-col flex-1">
              <div className="text-[13px] font-semibold leading-tight text-[var(--color-fg)] line-clamp-2 flex-1">
                {d.name}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-[var(--color-fg)] tabular-nums">
                  {formatPrice(d.priceMinor)}
                </span>
                <CardCartControl
                  qty={qty}
                  available={d.isAvailable}
                  onAdd={(e) => {
                    e.stopPropagation();
                    if (d.isAvailable) onAdd(d.id);
                  }}
                  onInc={(e) => {
                    e.stopPropagation();
                    onSetQty(d.id, qty + 1);
                  }}
                  onDec={(e) => {
                    e.stopPropagation();
                    onSetQty(d.id, qty - 1);
                  }}
                />
              </div>
              <div className="flex items-center text-[11px] text-[var(--color-brand)] font-medium">
                Подробнее <ChevronRight size={11} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ----- Карточки: вертикальная раскладка (вариант для сравнения) -----
   Карточки идут стопкой, каждая — горизонтальная (миниатюра слева, текст справа).
   Помещаются в продолжение сообщения ассистента. */
function RecsVertical({
  ids,
  onOpen,
  onAdd,
  onSetQty,
  cart,
}: {
  ids: number[];
  onOpen: (d: Dish) => void;
  onAdd: (dishId: number) => void;
  onSetQty: (dishId: number, qty: number) => void;
  cart: CartItem[];
}) {
  const { getDishById } = useApp();
  return (
    <div className="ml-9 space-y-2">
      {ids.map((id) => {
        const d = getDishById(id);
        if (!d) return null;
        const qty = cart.find((c) => c.dishId === id)?.quantity ?? 0;
        return (
          <article
            key={id}
            onClick={() => onOpen(d)}
            role="button"
            className={cn(
              "tap w-full text-left",
              "rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)]",
              "hover:border-[var(--color-brand)] hover:shadow-md",
              "overflow-hidden flex gap-3 p-2.5",
              !d.isAvailable && "opacity-65",
            )}
          >
            <DishImage dish={d} className="w-[88px] h-[88px] shrink-0" size="sm" />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h4 className="text-[14px] font-semibold leading-tight text-[var(--color-fg)] line-clamp-2">
                {d.name}
              </h4>
              <p className="text-[11.5px] text-[var(--color-fg-muted)] line-clamp-2">
                {d.description}
              </p>
              <div className="flex items-center justify-between gap-2 mt-auto">
                <span className="text-[14px] font-semibold text-[var(--color-fg)] tabular-nums">
                  {formatPrice(d.priceMinor)}
                </span>
                <CardCartControl
                  qty={qty}
                  available={d.isAvailable}
                  onAdd={(e) => {
                    e.stopPropagation();
                    if (d.isAvailable) onAdd(d.id);
                  }}
                  onInc={(e) => {
                    e.stopPropagation();
                    onSetQty(d.id, qty + 1);
                  }}
                  onDec={(e) => {
                    e.stopPropagation();
                    onSetQty(d.id, qty - 1);
                  }}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* Унифицированный контрол: одиночная "+" пока блюдо не в корзине, степпер после. */
function CardCartControl({
  qty,
  available,
  onAdd,
  onInc,
  onDec,
}: {
  qty: number;
  available: boolean;
  onAdd: (e: React.MouseEvent) => void;
  onInc: (e: React.MouseEvent) => void;
  onDec: (e: React.MouseEvent) => void;
}) {
  if (qty > 0) {
    return <QtyStepper qty={qty} onIncrement={onInc} onDecrement={onDec} />;
  }
  return (
    <button
      onClick={onAdd}
      disabled={!available}
      className="
        tap w-8 h-8 rounded-full flex items-center justify-center
        bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90
        disabled:bg-[var(--color-border)] disabled:text-[var(--color-fg-subtle)]
      "
      aria-label="В корзину"
    >
      <Plus size={16} />
    </button>
  );
}

/* Виртуальное приветствие — всегда первое сообщение в чате, не сохраняется на бэкенде */
function WelcomeBubble({ firstName }: { firstName: string }) {
  const greeting = firstName ? `Здравствуйте, ${firstName}!` : "Здравствуйте!";
  return (
    <div className="flex gap-2 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-warm)] to-[var(--color-brand)] flex items-center justify-center text-white text-[12px] font-semibold">
        S
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
        {greeting} Помогу подобрать блюда под ваше настроение, время и ограничения.
        Расскажите, что хотелось бы сегодня, или нажмите одну из подсказок ниже.
      </div>
    </div>
  );
}
