import { useEffect, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { adminUploadDishImage } from "@/api/adminMenu";
import { Drawer, FormField, inputClass } from "./Drawer";
import { Select } from "./Select";
import { mockCategories, mockTags } from "../data/adminMock";
import type { Dish } from "@/data/mock";

const IMAGE_MAX_MB = 5;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const IMAGE_EXT_LABEL = "JPG, PNG или WEBP";

export type DishFormData = {
  name: string;
  category: string;
  description: string;
  composition: string;
  priceRub: number;
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  portionWeightG: number;
  tags: string[];
  imageUrl: string;
  isAvailable: boolean;
};

function emptyForm(category?: string): DishFormData {
  return {
    name: "",
    category: category ?? mockCategories[0]?.name ?? "",
    description: "",
    composition: "",
    priceRub: 0,
    caloriesKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    portionWeightG: 0,
    tags: [],
    imageUrl: "",
    isAvailable: true,
  };
}

function fromDish(d: Dish): DishFormData {
  return {
    name: d.name,
    category: d.category,
    description: d.description,
    composition: d.composition,
    priceRub: Math.round(d.priceMinor / 100),
    caloriesKcal: d.caloriesKcal,
    proteinG: d.proteinG,
    fatG: d.fatG,
    carbsG: d.carbsG,
    portionWeightG: d.portionWeightG,
    tags: d.tags,
    imageUrl: d.image_url ?? "",
    isAvailable: d.isAvailable,
  };
}

export function DishDrawer({
  open,
  onClose,
  dish,
  onSave,
  categories: categoriesProp,
}: {
  open: boolean;
  onClose: () => void;
  /** null — создание; объект — редактирование */
  dish: Dish | null;
  onSave: (data: DishFormData) => void;
  /** Список категорий из стора (real-режим). Если не задан — используются mockCategories. */
  categories?: { id: number; name: string }[];
}) {
  const categories = categoriesProp ?? mockCategories;
  const defaultCategory = categories[0]?.name;
  const [form, setForm] = useState<DishFormData>(() =>
    dish ? fromDish(dish) : emptyForm(defaultCategory),
  );

  // При смене dish (открыли другой) — сбросить форму
  useEffect(() => {
    if (open) setForm(dish ? fromDish(dish) : emptyForm(defaultCategory));
    // defaultCategory не в deps, чтобы не дергать форму при переключении категорий
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish]);

  function patch<K extends keyof DishFormData>(key: K, value: DishFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTag(name: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(name) ? f.tags.filter((t) => t !== name) : [...f.tags, name],
    }));
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={dish ? `Редактирование · ${dish.name}` : "Новое блюдо"}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            disabled={!form.name.trim() || !form.category}
            className="px-4 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90 disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Название">
          <input
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            className={inputClass}
            placeholder="Например, Том Ям"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Категория">
            <Select
              value={form.category}
              onChange={(v) => patch("category", String(v))}
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
            />
          </FormField>
          <FormField label="Цена, ₽">
            <input
              type="number"
              min={0}
              value={form.priceRub}
              onChange={(e) => patch("priceRub", Number(e.target.value))}
              className={inputClass}
            />
          </FormField>
        </div>

        <FormField label="Описание">
          <textarea
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        <FormField label="Состав">
          <textarea
            value={form.composition}
            onChange={(e) => patch("composition", e.target.value)}
            rows={2}
            className={`${inputClass} resize-none`}
            placeholder="Креветки, паста том-ям, лайм…"
          />
        </FormField>

        <div className="grid grid-cols-5 gap-2">
          <FormField label="ккал">
            <input type="number" min={0} value={form.caloriesKcal} onChange={(e) => patch("caloriesKcal", Number(e.target.value))} className={inputClass} />
          </FormField>
          <FormField label="белки, г">
            <input type="number" min={0} value={form.proteinG} onChange={(e) => patch("proteinG", Number(e.target.value))} className={inputClass} />
          </FormField>
          <FormField label="жиры, г">
            <input type="number" min={0} value={form.fatG} onChange={(e) => patch("fatG", Number(e.target.value))} className={inputClass} />
          </FormField>
          <FormField label="углев., г">
            <input type="number" min={0} value={form.carbsG} onChange={(e) => patch("carbsG", Number(e.target.value))} className={inputClass} />
          </FormField>
          <FormField label="вес, г">
            <input type="number" min={0} value={form.portionWeightG} onChange={(e) => patch("portionWeightG", Number(e.target.value))} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Теги">
          <div className="flex flex-wrap gap-1.5">
            {mockTags.map((t) => {
              const active = form.tags.includes(t.name);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.name)}
                  className="px-2.5 py-1 rounded-full text-[12px] font-semibold transition-opacity"
                  style={{
                    backgroundColor: active ? t.color : "transparent",
                    color: active ? "white" : t.color,
                    border: `1px solid ${t.color}`,
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Картинка блюда">
          <ImageUploader
            currentUrl={form.imageUrl || undefined}
            dishId={dish?.id}
            onUploaded={(url) => patch("imageUrl", url)}
            onClear={() => patch("imageUrl", "")}
          />
        </FormField>

        <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] cursor-pointer">
          <span>
            <span className="block text-[14px] font-semibold text-[var(--color-fg)]">
              Доступно для заказа
            </span>
            <span className="block text-[12px] text-[var(--color-fg-muted)] mt-0.5">
              Если выключено — блюдо в стопе и не показывается клиентам
            </span>
          </span>
          <button
            type="button"
            onClick={() => patch("isAvailable", !form.isAvailable)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${
              form.isAvailable ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                form.isAvailable ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>
    </Drawer>
  );
}

/*
 * ImageUploader — drag&drop / клик-выбор файла + превью.
 * Аплоад работает только для существующего блюда (нужен dishId).
 * Для нового блюда показываем подсказку «сохраните блюдо сначала».
 */
function ImageUploader({
  currentUrl,
  dishId,
  onUploaded,
  onClear,
}: {
  currentUrl?: string;
  dishId?: number;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function clientValidate(file: File): string | null {
    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      return `Неподдерживаемый формат. Нужен ${IMAGE_EXT_LABEL}.`;
    }
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      return `Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум ${IMAGE_MAX_MB} МБ.`;
    }
    return null;
  }

  async function upload(file: File) {
    setError(null);
    const ve = clientValidate(file);
    if (ve) {
      setError(ve);
      return;
    }
    if (!dishId) {
      setError("Сохраните блюдо, чтобы загрузить картинку.");
      return;
    }
    setBusy(true);
    try {
      const dish = await adminUploadDishImage(dishId, file);
      if (dish.image_url) onUploaded(dish.image_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-colors min-h-[160px] p-3
          ${dragOver
            ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-bg-elev)]"}
          ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt="Превью"
              className="max-h-[140px] max-w-full object-contain rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-[11.5px] text-[var(--color-fg-muted)]">
              Перетащите новый файл или нажмите, чтобы заменить
            </span>
          </>
        ) : (
          <>
            <span className="w-12 h-12 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-fg-muted)]">
              <ImageIcon size={20} />
            </span>
            <span className="text-[13px] font-semibold text-[var(--color-fg)] flex items-center gap-1.5">
              <Upload size={13} />
              Перетащите файл или нажмите
            </span>
            <span className="text-[11.5px] text-[var(--color-fg-subtle)]">
              {IMAGE_EXT_LABEL}, не больше {IMAGE_MAX_MB} МБ
            </span>
          </>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-elev)]/80 rounded-xl">
            <span className="w-6 h-6 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = ""; // позволяет загрузить тот же файл повторно
          }}
          className="hidden"
        />
      </div>

      {!dishId && (
        <p className="text-[11.5px] text-[var(--color-fg-subtle)]">
          Сначала сохраните блюдо, потом откройте его снова — кнопка загрузки заработает.
        </p>
      )}
      {error && (
        <p className="text-[11.5px] text-[var(--color-danger)] flex items-center gap-1">
          <X size={11} /> {error}
        </p>
      )}
      {currentUrl && (
        <button
          type="button"
          onClick={onClear}
          className="text-[11.5px] text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] underline underline-offset-2"
        >
          Убрать ссылку на картинку
        </button>
      )}
    </div>
  );
}
