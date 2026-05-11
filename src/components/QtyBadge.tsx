/*
 * QtyBadge — белый бейдж количества в углу карточки блюда.
 * Текст всегда тёмный (читается на белом и в светлой, и в тёмной темах).
 */
export function QtyBadge({ qty }: { qty: number }) {
  return (
    <span
      className="
        absolute top-2 left-2 inline-flex items-center
        h-6 px-2 rounded-full
        bg-white
        text-[oklch(20%_0.02_80)]
        text-[11px] font-semibold tabular-nums
        shadow-[0_4px_10px_-2px_rgba(0,0,0,0.25)]
      "
    >
      × {qty}
    </span>
  );
}
