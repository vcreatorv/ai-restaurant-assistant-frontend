import { Plus, Minus, ConciergeBell } from "lucide-react";
import { DishImage } from "@/components/DishImage";
import { Sheet } from "@/components/Sheet";
import type { Dish } from "@/data/mock";
import { useApp } from "@/state/store";
import { formatPrice } from "@/lib/format";

/*
 * DishSheet — bottom-sheet с детальной информацией о блюде.
 * Внизу — единый контрол: либо CTA "Добавить в корзину" (если qty=0), либо
 * крупный степпер, привязанный напрямую к cart-store. Без отдельной "Добавить" кнопки
 * рядом со степпером — степпер сам управляет количеством.
 */
export function DishSheet({
  dish,
  onClose,
}: {
  dish: Dish | null;
  onClose: () => void;
}) {
  const { cart, addToCart, setCartQuantity } = useApp();
  const qty = dish ? cart.find((it) => it.dishId === dish.id)?.quantity ?? 0 : 0;

  return (
    <Sheet open={!!dish} onClose={onClose}>
      {dish && (
        <div className="pb-6">
          <div className="px-5">
            <DishImage dish={dish} className="w-full h-[200px]" size="lg" />
          </div>

          <div className="px-5 pt-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--color-fg-subtle)] font-semibold">
                <span>{dish.category}</span>
                <span>·</span>
                <span>{dish.cuisine}</span>
              </div>
              <h1 className="text-[22px] font-semibold leading-tight text-[var(--color-fg)] mt-1">
                {dish.name}
              </h1>
              <p className="text-[14px] text-[var(--color-fg-muted)] mt-2 leading-relaxed">
                {dish.description}
              </p>
            </div>

            {/* КБЖУ — горизонтальный rail */}
            <div className="grid grid-cols-5 gap-1 rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-2">
              <Stat label="ккал" value={dish.caloriesKcal} />
              <Stat label="белки" value={dish.proteinG} unit="г" />
              <Stat label="жиры" value={dish.fatG} unit="г" />
              <Stat label="углев." value={dish.carbsG} unit="г" />
              <Stat label="вес" value={dish.portionWeightG} unit="г" />
            </div>

            {dish.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {dish.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full bg-[var(--color-warm-soft)] text-[var(--color-warm)] text-[12px] font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
                Состав
              </div>
              <p className="text-[14px] text-[var(--color-fg)] leading-relaxed">
                {dish.composition}
              </p>
            </div>
          </div>

          {/* Footer — единый контрол: либо CTA, либо крупный степпер */}
          <div className="sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] mt-5 p-4">
            {qty === 0 ? (
              <button
                onClick={() => addToCart(dish.id, 1)}
                disabled={!dish.isAvailable}
                className="
                  tap w-full h-12 rounded-full
                  bg-[var(--color-brand)] text-[var(--color-brand-fg)]
                  font-semibold text-[15px]
                  flex items-center justify-center gap-2
                  disabled:bg-[var(--color-border)] disabled:text-[var(--color-fg-subtle)]
                "
              >
                <ConciergeBell size={16} /> В корзину · {formatPrice(dish.priceMinor)}
              </button>
            ) : (
              <div
                className="
                  flex items-center justify-between gap-3
                  rounded-full bg-[var(--color-brand)] text-[var(--color-brand-fg)]
                  pl-2 pr-2 h-12
                "
              >
                <button
                  onClick={() => setCartQuantity(dish.id, qty - 1)}
                  aria-label="Меньше"
                  className="tap w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/10 active:bg-black/20"
                >
                  <Minus size={18} strokeWidth={2.4} />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-[15px] font-semibold tabular-nums leading-none">
                    {qty} в корзине
                  </div>
                  <div className="text-[11.5px] opacity-80 leading-none mt-1 tabular-nums">
                    {formatPrice(dish.priceMinor * qty)}
                  </div>
                </div>
                <button
                  onClick={() => setCartQuantity(dish.id, qty + 1)}
                  aria-label="Больше"
                  className="tap w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/10 active:bg-black/20"
                >
                  <Plus size={18} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 rounded-xl">
      <div className="text-[15px] font-semibold text-[var(--color-fg)] tabular-nums leading-none">
        {value}
        {unit && (
          <span className="text-[10px] text-[var(--color-fg-subtle)] font-normal ml-0.5">
            {unit}
          </span>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-subtle)] mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}
