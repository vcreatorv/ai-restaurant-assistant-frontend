import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-[var(--color-fg)]">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-[var(--color-fg-muted)] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
