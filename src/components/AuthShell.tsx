import type { ReactNode } from "react";

/*
 * AuthShell — общий layout для login/register: large brand-mark вверху,
 * заголовок + слот для формы. Используется без BottomNav.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scrollbar-none">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-4">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[26px] font-semibold shadow-[0_10px_24px_-10px_rgba(0,0,0,0.3)]"
            style={{
              background: "linear-gradient(135deg, var(--color-warm), var(--color-brand))",
              letterSpacing: "-0.04em",
            }}
          >
            S
          </div>
          <div className="text-[20px] font-semibold tracking-tight text-[var(--color-fg)]">
            Sapore
          </div>
        </div>

        <div className="text-center mb-7">
          <h1 className="text-[24px] font-semibold tracking-tight text-[var(--color-fg)]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13.5px] text-[var(--color-fg-muted)] mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex-1">{children}</div>

        <div className="mt-6">{footer}</div>
      </div>
    </div>
  );
}

/* Поле ввода с лейблом */
export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="
          w-full px-4 py-3 rounded-2xl
          bg-[var(--color-bg-elev)] border border-[var(--color-border)]
          focus:border-[var(--color-brand)] outline-none
          text-[15px] text-[var(--color-fg)]
          placeholder:text-[var(--color-fg-subtle)]
          transition-colors
        "
      />
    </label>
  );
}

/* Главная CTA */
export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="
        tap w-full h-12 rounded-full
        bg-[var(--color-brand)] text-[var(--color-brand-fg)]
        font-semibold text-[15px]
        flex items-center justify-center gap-2
        disabled:bg-[var(--color-border)] disabled:text-[var(--color-fg-subtle)]
      "
    >
      {children}
    </button>
  );
}
