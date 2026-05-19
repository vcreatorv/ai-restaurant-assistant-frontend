import { Sheet } from "@/components/Sheet";
import { cn } from "@/lib/cn";
import { X } from "lucide-react";

/**
 * ChipOption — пара канонического кода и пользовательского лейбла для одного чипа.
 *
 * Бэк хранит только `code` (английский whitelist, совпадает с dishes.allergens
 * и Qdrant payload). `label` нужен только для UI — никогда не уходит в API.
 */
export type ChipOption = {
  code: string;
  label: string;
};

/**
 * ChipsEditorSheet — выбор из фиксированного списка пар { code, label }.
 *
 * Свободный ввод намеренно убран: фронт обязан отправлять только коды из
 * whitelist'а — иначе Qdrant must_not-фильтр не сматчит блюдо (рассогласование
 * языков ломает безопасность аллергенной фильтрации).
 */
export function ChipsEditorSheet({
  open,
  onClose,
  title,
  values,
  options,
  onAdd,
  onRemove,
  tone = "brand",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Уже выбранные коды. */
  values: string[];
  /** Полный словарь доступных опций. */
  options: ChipOption[];
  /** onAdd получает code, не label. */
  onAdd: (code: string) => void;
  /** onRemove получает code, не label. */
  onRemove: (code: string) => void;
  tone?: "brand" | "danger";
}) {
  const labelByCode = new Map(options.map((o) => [o.code, o.label]));
  const available = options.filter((o) => !values.includes(o.code));

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="px-5 pt-2 pb-6 space-y-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
            Сейчас выбрано
          </div>
          {values.length === 0 ? (
            <p className="text-[13px] text-[var(--color-fg-subtle)]">Пока пусто</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {values.map((code) => (
                <span
                  key={code}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-medium",
                    tone === "brand" &&
                      "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
                    tone === "danger" &&
                      "bg-[oklch(95%_0.04_25)] text-[var(--color-danger)] dark:bg-[oklch(28%_0.06_25)]",
                  )}
                >
                  {labelByCode.get(code) ?? code}
                  <button
                    onClick={() => onRemove(code)}
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

        {available.length > 0 && (
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
              Доступные варианты
            </div>
            <div className="flex flex-wrap gap-1.5">
              {available.map((o) => (
                <button
                  key={o.code}
                  onClick={() => onAdd(o.code)}
                  className="
                    tap px-3 py-1.5 rounded-full
                    border border-dashed border-[var(--color-border-strong)]
                    text-[13px] text-[var(--color-fg-muted)]
                    hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]
                  "
                >
                  + {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
