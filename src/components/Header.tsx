import { AdminClientViewToggle } from "@/admin/ClientViewBanner";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  /**
   * compact — узкая шапка с меньшим padding'ом и шрифтом.
   * Используется на страницах с собственной плотной навигацией (например, чат).
   */
  compact?: boolean;
};

/*
 * Header — общий заголовок страниц. Переключатель темы вынесен в Профиль,
 * слот `right` оставлен для page-specific действий (новый чат, фильтры, уведомления).
 */
export function Header({ title, subtitle, right, compact = false }: Props) {
  return (
    <header
      className={cn(
        "flex-none bg-[var(--color-bg)]/85 backdrop-blur-xl border-b border-[var(--color-border)] flex items-center gap-3",
        compact
          ? "px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2"
          : "px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3 items-end",
      )}
    >
      <div className="flex-1 min-w-0">
        {title ? (
          <h1
            className={cn(
              "font-semibold leading-tight tracking-tight text-[var(--color-fg)]",
              compact ? "text-[15px]" : "text-[24px]",
            )}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className={cn(
              "text-[var(--color-fg-muted)]",
              compact ? "text-[11px] mt-0" : "text-[13px] mt-0.5",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <AdminClientViewToggle />
      </div>
    </header>
  );
}
