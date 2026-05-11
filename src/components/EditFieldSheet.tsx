import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";

export function EditFieldSheet({
  open,
  onClose,
  title,
  initialValue,
  type = "text",
  placeholder,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValue: string;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="px-5 pt-2 pb-6 space-y-4">
        <input
          autoFocus
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="
            w-full px-4 py-3 rounded-2xl
            bg-[var(--color-bg-elev)] border border-[var(--color-border)]
            focus:border-[var(--color-brand)] outline-none
            text-[15px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]
          "
        />
        <button
          onClick={() => {
            onSave(value);
            onClose();
          }}
          className="
            tap w-full py-3 rounded-full
            bg-[var(--color-brand)] text-[var(--color-brand-fg)]
            font-semibold text-[14.5px]
          "
        >
          Сохранить
        </button>
      </div>
    </Sheet>
  );
}
