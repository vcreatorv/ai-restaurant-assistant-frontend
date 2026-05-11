import { ChevronLeft, ChevronRight } from "lucide-react";

/*
 * Pagination — нумерованная пагинация по центру.
 * Показывает: «‹ 1 … 4 [5] 6 … 12 ›».
 * Текущая страница — заполненный кружок brand-цветом.
 */
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;

  const pages = buildPages(page, total);

  return (
    <nav className="flex items-center justify-center gap-1.5">
      <Arrow disabled={page <= 1} onClick={() => onChange(page - 1)} dir="prev" />
      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="w-8 h-8 inline-flex items-center justify-center text-[13px] text-[var(--color-fg-subtle)] select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-[13px] tabular-nums transition-colors ${
              p === page
                ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-semibold"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]"
            }`}
          >
            {p}
          </button>
        ),
      )}
      <Arrow disabled={page >= total} onClick={() => onChange(page + 1)} dir="next" />
    </nav>
  );
}

function Arrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Назад" : "Вперёд"}
      className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--color-fg-muted)] transition-colors"
    >
      {dir === "prev" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}

/**
 * Возвращает массив страниц для отображения с многоточиями.
 * Логика: всегда показываем 1 и last; вокруг текущей — соседи; «…» для разрывов.
 */
function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");

  pages.push(total);
  return pages;
}
