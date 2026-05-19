import type { Dish } from "@/data/mock";
import { cn } from "@/lib/cn";

/**
 * DishImage — фото блюда либо стилизованный текстовый фолбэк.
 *
 * Если `dish.image_url` задан — показываем `<img>`. Если пусто — рисуем фолбэк:
 * нейтральный серо-бежевый студийный фон + первые слова названия блюда
 * (типографика вместо случайного emoji). Это работает и для блюд, у которых
 * картинки ещё нет, и для напитков/прочих категорий без фотосессии.
 *
 * Чтобы фолбэк сработал и для блюд, где админ сейчас подсовывает лого ресторана
 * как картинку — в БД нужно очистить `image_url` у этих позиций.
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
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden select-none",
        size === "sm" ? "rounded-xl" : "rounded-2xl",
        className,
      )}
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
        <DishImageFallback name={dish.name} size={size} />
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

/**
 * DishImageFallback — фотофон «светло-серая матовая штукатурка» из MinIO + название блюда.
 *
 * URL фона лежит в MinIO под путём `defaults/dish-bg.png`, S3-публичный read.
 * Текст — графитово-чёрный, первые 1–2 значащих слова названия (без предлогов),
 * по центру. Чисто-белый/чёрный на этом фоне проседает — используем `#1f1d1a`
 * (тёплый угольный) для контраста, но без жёсткости.
 */
const DEFAULT_BG_URL = `${import.meta.env.VITE_DEFAULT_DISH_BG_URL ?? "http://localhost:9000/restaurant/defaults/dish-bg.png"}`;

function DishImageFallback({ name, size }: { name: string; size: "sm" | "md" | "lg" }) {
  const textClass =
    size === "sm"
      ? "text-[10.5px] leading-snug"
      : size === "lg"
      ? "text-[17px] leading-snug"
      : "text-[13px] leading-snug";
  return (
    <div
      className="absolute inset-0 bg-center bg-cover"
      style={{ backgroundImage: `url("${DEFAULT_BG_URL}")` }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
        <span
          className={cn(
            "font-semibold tracking-tight text-[#1f1d1a] break-words [text-wrap:balance]",
            textClass,
          )}
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.4)" }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}
