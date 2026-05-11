import { useState, useEffect, useRef } from "react";
import { Send, Plus, ChevronRight, SquarePen } from "lucide-react";
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
import type { ApiMessage } from "@/api/types";

const suggestions = [
  "Что-то острое и лёгкое",
  "Хочу сытное на двоих",
  "Подойдёт под белое вино",
  "До 500 рублей",
];

function nowTime() {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

/*
 * Бэкенд встраивает в content финальный JSON-блок вида ```json {"recommended_dish_ids":[...]}```.
 * Из стрима он приходит токенами; мы прячем блок из отображаемого текста и достаём ids,
 * считая их источником истины (meta-событие может содержать RAG-кандидатов).
 */
const JSON_BLOCK_RE = /```json\s*(\{[\s\S]*?\})\s*```/;
const JSON_BLOCK_OPEN_RE = /```json/i;

function extractRecommended(content: string): { text: string; ids?: number[] } {
  const m = JSON_BLOCK_RE.exec(content);
  if (!m) return { text: content };
  let ids: number[] | undefined;
  try {
    const parsed = JSON.parse(m[1]) as { recommended_dish_ids?: unknown };
    if (Array.isArray(parsed.recommended_dish_ids)) {
      ids = parsed.recommended_dish_ids.filter((x): x is number => typeof x === "number");
    }
  } catch {
    // оставляем ids = undefined
  }
  const text = (content.slice(0, m.index) + content.slice(m.index + m[0].length)).trim();
  return { text, ids };
}

/** Скрывает «хвост» сообщения, начиная с открывающего ```json — пока блок ещё не дописан. */
function stripPartialJsonBlock(content: string): string {
  const open = JSON_BLOCK_OPEN_RE.exec(content);
  if (!open) return content;
  return content.slice(0, open.index).trimEnd();
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

export default function Chat() {
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
        onDone: () => {
          if (!placeholderId) return;
          const id = placeholderId;
          const { text, ids } = extractRecommended(buffered);
          const finalIds = ids ?? metaIds;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === id ? { ...msg, text, recommendedDishIds: finalIds } : msg,
            ),
          );
        },
        onStreamError: (err) => {
          if (!placeholderId) ensurePlaceholder(`a-${Date.now()}`);
          const id = placeholderId;
          const text = `Не удалось получить ответ: ${err.message}`;
          setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text } : msg)));
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
      if (!placeholderId) {
        const id = `a-err-${Date.now()}`;
        setMessages((m) => [
          ...m,
          {
            id,
            role: "assistant",
            text: `Не удалось отправить сообщение: ${e instanceof Error ? e.message : "ошибка сети"}`,
            time: nowTime(),
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

  function quickAdd(dishId: number) {
    addToCart(dishId);
  }

  return (
    <>
      <Header
        title="Sapore"
        subtitle={`Помощник по меню · ${profile.firstName}`}
        right={
          <button
            onClick={() => void startNewChat()}
            title="Новый диалог"
            aria-label="Новый диалог"
            className="tap p-2 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
          >
            <SquarePen size={18} />
          </button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
        {/* Subtle context bar — без иконок-стикеров */}
        <ContextBar profile={profile} />

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
            key={s}
            onClick={() => send(s)}
            className="
              tap shrink-0 px-3 py-1.5 rounded-full
              text-[12px] text-[var(--color-fg-muted)]
              border border-[var(--color-border)]
              hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]
            "
          >
            {s}
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
              max-h-32
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
function ContextBar({ profile }: { profile: { firstName: string; allergens: string[]; dietary: string[] } }) {
  const items = [...profile.allergens, ...profile.dietary];
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-transparent px-3.5 py-2.5">
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
  onAdd: (dishId: number) => void;
  onSetQty: (dishId: number, qty: number) => void;
  cart: CartItem[];
  layout: "horizontal" | "vertical";
}) {
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

  const isStreaming = isStreamingThis && message.text.length > 0;
  const recIds = message.recommendedDishIds ?? [];

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-start">
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-warm)] to-[var(--color-brand)] flex items-center justify-center text-white text-[12px] font-semibold">
          S
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-[var(--color-bg-elev)] border border-[var(--color-border)] px-4 py-2.5 text-[14.5px] leading-relaxed text-[var(--color-fg)]">
          <p className={cn(isStreaming && "cursor-blink")}>{message.text}</p>
          <div className="text-[10.5px] text-[var(--color-fg-subtle)] mt-1">{message.time}</div>
        </div>
      </div>

      {recIds.length > 0 && layout === "horizontal" && (
        <RecsHorizontal
          ids={recIds}
          onOpen={onOpenDish}
          onAdd={onAdd}
          onSetQty={onSetQty}
          cart={cart}
        />
      )}
      {recIds.length > 0 && layout === "vertical" && (
        <RecsVertical
          ids={recIds}
          onOpen={onOpenDish}
          onAdd={onAdd}
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
        {greeting} Я Sapore — помогу подобрать блюда под ваше настроение, время и ограничения.
        Расскажите, что хотелось бы сегодня, или нажмите одну из подсказок ниже.
      </div>
    </div>
  );
}
