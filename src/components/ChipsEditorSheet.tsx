import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { cn } from "@/lib/cn";

export function ChipsEditorSheet({
  open,
  onClose,
  title,
  values,
  suggestions = [],
  onAdd,
  onRemove,
  tone = "brand",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  values: string[];
  suggestions?: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  tone?: "brand" | "danger";
}) {
  const [input, setInput] = useState("");
  useEffect(() => {
    if (open) setInput("");
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="px-5 pt-2 pb-6 space-y-4">
        {/* Текущие */}
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
            Сейчас выбрано
          </div>
          {values.length === 0 ? (
            <p className="text-[13px] text-[var(--color-fg-subtle)]">Пока пусто</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {values.map((v) => (
                <span
                  key={v}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium",
                    tone === "brand" &&
                      "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
                    tone === "danger" &&
                      "bg-[oklch(95%_0.04_25)] text-[var(--color-danger)] dark:bg-[oklch(28%_0.06_25)]",
                  )}
                >
                  {v}
                  <button
                    onClick={() => onRemove(v)}
                    className="tap rounded-full p-0.5 hover:bg-black/10"
                    aria-label="Удалить"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add custom */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            onAdd(input);
            setInput("");
          }}
          className="
            flex items-center gap-2 px-3 py-2 rounded-full
            bg-[var(--color-bg-elev)] border border-[var(--color-border)]
            focus-within:border-[var(--color-brand)]
          "
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Добавить свой вариант…"
            className="flex-1 bg-transparent outline-none text-[14px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="tap w-8 h-8 rounded-full bg-[var(--color-brand)] text-[var(--color-brand-fg)] flex items-center justify-center disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </form>

        {/* Suggestions */}
        {suggestions.filter((s) => !values.includes(s)).length > 0 && (
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
              Часто выбирают
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions
                .filter((s) => !values.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => onAdd(s)}
                    className="
                      tap px-3 py-1.5 rounded-full
                      border border-dashed border-[var(--color-border-strong)]
                      text-[13px] text-[var(--color-fg-muted)]
                      hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]
                    "
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
