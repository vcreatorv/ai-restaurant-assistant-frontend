import { AdminClientViewToggle } from "@/admin/ClientViewBanner";

type Props = {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
};

/*
 * Header — общий заголовок страниц. Переключатель темы вынесен в Профиль,
 * слот `right` оставлен для page-specific действий (новый чат, фильтры, уведомления).
 */
export function Header({ title, subtitle, right }: Props) {
  return (
    <header
      className="
        flex-none px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3
        bg-[var(--color-bg)]/85 backdrop-blur-xl
        border-b border-[var(--color-border)]
        flex items-end gap-3
      "
    >
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-[var(--color-fg)]">
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {right}
        <AdminClientViewToggle />
      </div>
    </header>
  );
}
