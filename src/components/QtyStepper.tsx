import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * QtyStepper — компактный inline-степпер для карточек блюд (меню/чат).
 * Заменяет одиночную "+" кнопку, как только блюдо попадает в корзину.
 * При decrement до 0 — onDecrement удалит позицию (логика на стороне useApp).
 */
export function QtyStepper({
  qty,
  onIncrement,
  onDecrement,
  size = "sm",
  className,
}: {
  qty: number;
  onIncrement: (e: React.MouseEvent) => void;
  onDecrement: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const cell = size === "md" ? "w-8 h-8" : "w-7 h-7";
  const text = size === "md" ? "text-[14px] w-6" : "text-[12.5px] w-5";

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center rounded-full",
        "bg-[var(--color-brand)] text-[var(--color-brand-fg)]",
        "select-none",
        className,
      )}
    >
      <button
        onClick={onDecrement}
        aria-label="Меньше"
        className={cn(
          "tap rounded-full flex items-center justify-center",
          "hover:bg-black/10 active:bg-black/20",
          cell,
        )}
      >
        <Minus size={size === "md" ? 15 : 13} strokeWidth={2.5} />
      </button>
      <span className={cn("text-center font-semibold tabular-nums", text)}>{qty}</span>
      <button
        onClick={onIncrement}
        aria-label="Больше"
        className={cn(
          "tap rounded-full flex items-center justify-center",
          "hover:bg-black/10 active:bg-black/20",
          cell,
        )}
      >
        <Plus size={size === "md" ? 15 : 13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
