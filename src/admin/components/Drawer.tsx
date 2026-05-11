import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/*
 * Drawer — правая выезжающая панель, общая для админки.
 * 480px ширины, сверху — заголовок + крест, снизу — слот для actions.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside
        className="bg-[var(--color-bg)] border-l border-[var(--color-border)] flex flex-col"
        style={{ width }}
      >
        <header className="flex-none px-5 h-14 flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-[var(--color-fg)] truncate">{title}</div>
            {subtitle && (
              <div className="text-[12px] text-[var(--color-fg-subtle)] truncate">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="tap p-2 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <footer className="flex-none px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--color-fg-subtle)] mt-1">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[14px] text-[var(--color-fg)] outline-none focus:border-[var(--color-brand)]";
