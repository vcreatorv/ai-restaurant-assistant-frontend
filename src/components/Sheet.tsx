import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/*
 * Sheet — bottom-sheet модалка с backdrop'ом. Закрывается по esc, по клику в backdrop
 * и по кнопке-крестику. Заблокирован scroll body, пока открыто.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  fullHeight,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  fullHeight?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`absolute inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sheet — shadow только когда открыт, иначе тень закрытых шторок
          накапливается над BottomNav. */}
      <div
        className={`
          absolute left-0 right-0 bottom-0 ${fullHeight ? "top-8" : "max-h-[88%]"}
          bg-[var(--color-bg)] border-t border-[var(--color-border)]
          rounded-t-[1.75rem]
          flex flex-col overflow-hidden
          transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open
            ? "translate-y-0 shadow-[0_-20px_50px_-10px_rgba(0,0,0,0.3)]"
            : "translate-y-full shadow-none"}
        `}
      >
        {/* Drag handle */}
        <div className="flex-none flex justify-center pt-2.5 pb-1">
          <span className="block w-10 h-1.5 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        {title !== undefined && (
          <div className="flex-none px-5 pt-1 pb-3 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold text-[var(--color-fg)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="tap p-1.5 -mr-1.5 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}
