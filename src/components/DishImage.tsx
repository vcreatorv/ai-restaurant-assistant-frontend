import type { Dish } from "@/data/mock";
import { cn } from "@/lib/cn";

/*
 * DishImage — фото блюда или цветной градиент + emoji-плейсхолдер.
 * Если dish.image_url задан, показывает <img>; иначе — градиент + emoji.
 */
export function DishImage({
  dish,
  className,
  size = "md",
  hideUnavailableOverlay = false,
}: {
  dish: Dish;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** В админке overlay «Закончилось» не нужен — статус показывается в колонке. */
  hideUnavailableOverlay?: boolean;
}) {
  const fontSize = size === "sm" ? 32 : size === "lg" ? 92 : 56;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden select-none",
        size === "sm" ? "rounded-xl" : "rounded-2xl",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${dish.bgFrom}, ${dish.bgTo})` }}
    >
      {dish.image_url ? (
        <img
          src={dish.image_url}
          alt={dish.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          loading="lazy"
        />
      ) : (
        <span
          style={{ fontSize, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.18))" }}
          aria-hidden
        >
          {dish.emoji}
        </span>
      )}
      {!dish.isAvailable && !hideUnavailableOverlay && (
        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center backdrop-blur-[2px] gap-1">
          <span className="text-white text-[13px] font-semibold tracking-tight">
            Закончилось
          </span>
          <span className="text-white/70 text-[10.5px] uppercase tracking-wider">
            нет в наличии
          </span>
        </div>
      )}
    </div>
  );
}
