import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption<V extends string | number> = {
  value: V;
  label: string;
};

/*
 * Кастомный селект — закрывает «дропдаун-уродов» на стандартном <select>.
 * Полностью управляемый: value/onChange. Сетит ширину под триггер.
 *
 * clearable: при выбранном значении показывает крестик для сброса до placeholder.
 * Удобно для фильтров, где «Любой статус» — это пустая строка.
 */
export function Select<V extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Выбрать…",
  className,
  clearable = false,
}: {
  value: V | "";
  onChange: (v: V | "") => void;
  options: SelectOption<V>[];
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
          "bg-[var(--color-bg-elev)] border border-[var(--color-border)] text-[13.5px]",
          "hover:border-[var(--color-border-strong)] outline-none",
          open && "border-[var(--color-brand)]",
        )}
      >
        <span
          className={cn(
            "truncate text-left",
            current ? "text-[var(--color-fg)]" : "text-[var(--color-fg-subtle)]",
          )}
        >
          {current?.label ?? placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && current && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Сбросить"
              onClick={(e) => {
                e.stopPropagation();
                onChange("" as V | "");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("" as V | "");
                }
              }}
              className="w-4 h-4 inline-flex items-center justify-center rounded-full text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg)] cursor-pointer"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={cn(
              "text-[var(--color-fg-subtle)] transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 min-w-max rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] shadow-lg overflow-hidden">
          <ul className="py-1 max-h-72 overflow-y-auto">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <li key={String(o.value)}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[13.5px] flex items-center justify-between gap-2",
                      active
                        ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)] font-semibold"
                        : "text-[var(--color-fg)] hover:bg-[var(--color-bg)]",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
