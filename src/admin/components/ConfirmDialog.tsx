import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** "danger" — красная кнопка, "primary" — брендовая */
  tone?: "danger" | "primary";
};

type Resolver = (ok: boolean) => void;

type Ctx = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<Ctx | null>(null);

/*
 * ConfirmProvider — глобальный модал подтверждения. Используется как
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Удалить?" })) doDelete();
 * Один модал на всё приложение, не нужно дублировать стейт по страницам.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<Resolver | null>(null);

  const confirm = useCallback<Ctx>((o) => {
    return new Promise<boolean>((resolve) => {
      setOpts(o);
      setResolver(() => resolve);
    });
  }, []);

  function close(ok: boolean) {
    resolver?.(ok);
    setOpts(null);
    setResolver(null);
  }

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-2xl p-5">
            <div className="flex items-start gap-3">
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  opts.tone === "danger"
                    ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                }`}
              >
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--color-fg)]">{opts.title}</h2>
                {opts.message && (
                  <p className="text-[13px] text-[var(--color-fg-muted)] mt-1 leading-relaxed">
                    {opts.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
              >
                {opts.cancelText ?? "Отмена"}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold ${
                  opts.tone === "danger"
                    ? "bg-[var(--color-danger)] text-white hover:opacity-90"
                    : "bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
                }`}
              >
                {opts.confirmText ?? "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
