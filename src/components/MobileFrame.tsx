import type { ReactNode } from "react";

/*
 * MobileFrame — обёртка-телефон для desktop-просмотра.
 * На мобильном (< 480px) — full-bleed; на больших экранах — фиксированная ширина 420px,
 * скруглённый «корпус» как у телефона. Содержимое страниц прокручивается внутри.
 */
export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full w-full flex items-stretch sm:items-center justify-center bg-[var(--color-bg)] sm:bg-[oklch(94%_0.01_80)] dark:sm:bg-[oklch(10%_0.012_80)]">
      <div
        className="
          relative w-full sm:w-[420px] sm:h-[860px] sm:max-h-[92vh]
          sm:rounded-[2.75rem] overflow-hidden
          bg-[var(--color-bg)]
          sm:border sm:border-[var(--color-border)]
          sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)]
          flex flex-col
        "
      >
        {children}
      </div>
    </div>
  );
}
