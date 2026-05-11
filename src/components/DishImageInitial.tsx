import type { Dish } from "@/data/mock";
import { cn } from "@/lib/cn";

/*
 * Альтернативная версия плейсхолдера: градиент + крупный инициал блюда
 * + полупрозрачная "тарелка". Сохранено как опция (см. DishImage.tsx — текущая дефолтная).
 */
export function DishImageInitial({
  dish,
  className,
  size = "md",
}: {
  dish: Dish;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = (dish.name.match(/\p{L}/u)?.[0] ?? "•").toUpperCase();
  const dotSize = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const initialSize = size === "sm" ? 22 : size === "lg" ? 76 : 44;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        size === "sm" ? "rounded-xl" : "rounded-2xl",
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${dish.bgFrom}, ${dish.bgTo})` }}
    >
      <div
        className={cn("absolute rounded-full", dotSize)}
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 70%)",
          boxShadow: "0 12px 30px -8px rgba(0,0,0,0.25)",
        }}
      />
      <span
        className="relative font-semibold tracking-tight select-none"
        style={{
          fontSize: initialSize,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 4px 14px rgba(0,0,0,0.18)",
          letterSpacing: "-0.04em",
        }}
        aria-hidden
      >
        {initial}
      </span>
    </div>
  );
}
