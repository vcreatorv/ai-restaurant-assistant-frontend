import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, ArrowUp, X } from "lucide-react";
import { Header } from "@/components/Header";
import { DishImage } from "@/components/DishImage";
import { DishSheet } from "@/components/DishSheet";
import { QtyStepper } from "@/components/QtyStepper";
import type { Dish } from "@/data/mock";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useApp } from "@/state/store";

/*
 * Меню — single-scroll с sticky-rail категорий.
 * Детект активной категории — scroll-based: на каждом скролле находим секцию,
 * чей top ближе всего к нижней границе rail (но не ниже неё).
 *
 * Ключевые решения для плавности:
 * — isProgrammaticScroll блокирует onScroll во время прокрутки по клику на чип,
 *   иначе обработчик мерцающе перезаписывает activeCat во время анимации.
 * — startTransition помечает обновления как некритичные, браузер не прерывает
 *   momentum-scroll ради рендера.
 * — RAF-throttle: не больше одного обновления в кадр.
 * — scrollIntoView без smooth: не конфликтует с пользовательским скроллом рельсы.
 */
export default function Menu() {
  const { addToCart, setCartQuantity, cart, dishes } = useApp();
  const [q, setQ] = useState("");
  const [openDish, setOpenDish] = useState<Dish | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isProgrammaticScroll = useRef(false);
  const rafPending = useRef(false);

  const grouped = useMemo(() => {
    const filtered = q
      ? dishes.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
      : dishes;
    const map = new Map<string, Dish[]>();
    for (const d of filtered) {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category)!.push(d);
    }
    return Array.from(map.entries());
  }, [q, dishes]);

  const [activeCat, setActiveCat] = useState(grouped[0]?.[0] ?? "");

  useEffect(() => {
    const root = scrollRef.current;
    const rail = railRef.current;
    if (!root || !rail) return;

    function computeActive() {
      if (!root || !rail) return;
      if (isProgrammaticScroll.current) return;

      const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 4;
      const nextScrollTop = root.scrollTop > 320;

      if (atBottom) {
        const last = grouped[grouped.length - 1]?.[0];
        startTransition(() => {
          if (last) setActiveCat((prev) => (prev === last ? prev : last));
          setShowScrollTop(nextScrollTop);
        });
        return;
      }

      const threshold = rail.getBoundingClientRect().bottom + 32;
      let bestCat = grouped[0]?.[0] ?? "";
      let bestTop = -Infinity;
      for (const [cat] of grouped) {
        const el = sectionRefs.current[cat];
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= threshold && top > bestTop) {
          bestTop = top;
          bestCat = cat;
        }
      }
      startTransition(() => {
        setActiveCat((prev) => (prev === bestCat ? prev : bestCat));
        setShowScrollTop(nextScrollTop);
      });
    }

    function onScroll() {
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        computeActive();
      });
    }

    computeActive();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [grouped]);

  // Рельса чипов: показываем активный чип без smooth, чтобы не конфликтовать со скроллом
  useEffect(() => {
    const chip = chipRefs.current[activeCat];
    chip?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
  }, [activeCat]);

  function jumpTo(cat: string) {
    const el = sectionRefs.current[cat];
    const root = scrollRef.current;
    const rail = railRef.current;
    if (!el || !root || !rail) return;
    isProgrammaticScroll.current = true;
    setActiveCat(cat);
    const offset = el.offsetTop - rail.offsetHeight - 8;
    root.scrollTo({ top: offset, behavior: "smooth" });
    // Снимаем флаг после окончания CSS-анимации прокрутки (~450ms у большинства браузеров)
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
  }

  function quickAdd(d: Dish) {
    if (!d.isAvailable) return;
    addToCart(d.id);
  }

  function cartQty(dishId: number) {
    return cart.find((it) => it.dishId === dishId)?.quantity ?? 0;
  }

  return (
    <>
      <Header
        title="Меню"
        subtitle={dishes.length > 0 ? `${dishes.length} блюд в меню` : "Загрузка..."}
      />

      <div className="flex-none px-4 pt-3">
        <label
          className="
            flex items-center gap-2 px-3 py-2.5 rounded-full
            bg-[var(--color-bg-elev)] border border-[var(--color-border)]
            focus-within:border-[var(--color-brand)] transition-colors
          "
        >
          <Search size={16} className="shrink-0 text-[var(--color-fg-subtle)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию"
            className="flex-1 bg-transparent outline-none text-[14px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="tap shrink-0 w-5 h-5 rounded-full bg-[var(--color-fg-subtle)] flex items-center justify-center hover:bg-[var(--color-fg-muted)]"
              aria-label="Очистить поиск"
            >
              <X size={11} strokeWidth={2.5} className="text-[var(--color-bg)]" />
            </button>
          )}
        </label>
      </div>

      {/* Sticky category rail.
          GPU-слой через transform-gpu — backdrop-blur не вызывает перерисовку при скролле.
          Активная категория подсвечивается через scale (layout не меняется). */}
      <div
        ref={railRef}
        className="
          flex-none z-10 px-4 pt-3 pb-3
          bg-[var(--color-bg)]/90 backdrop-blur-md transform-gpu
          border-b border-[var(--color-border)]
          overflow-x-auto scrollbar-none
        "
      >
        <ul className="flex items-end gap-5 min-w-max">
          {grouped.map(([cat]) => {
            const active = activeCat === cat;
            return (
              <li key={cat} className="leading-none">
                <button
                  ref={(el) => {
                    chipRefs.current[cat] = el;
                  }}
                  onClick={() => jumpTo(cat)}
                  className={cn(
                    "tap shrink-0 inline-flex items-center pb-1",
                    "text-[15px] font-semibold tracking-tight whitespace-nowrap",
                    "transition-[color,opacity,transform] duration-200 ease-out",
                    "origin-bottom",
                    active
                      ? "text-[var(--color-fg)] scale-[1.22] opacity-100"
                      : "text-[var(--color-fg-subtle)] opacity-60 hover:opacity-90",
                  )}
                >
                  {cat}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain scrollbar-thin px-4 pt-2 pb-6"
      >
        {grouped.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-fg-subtle)] text-[14px]">
            Ничего не нашли
          </div>
        ) : (
          grouped.map(([cat, items]) => (
            <section
              key={cat}
              data-cat={cat}
              ref={(el) => {
                sectionRefs.current[cat] = el;
              }}
              className="pt-5 first:pt-3"
            >
              <h2 className="text-[18px] font-semibold tracking-tight text-[var(--color-fg)] mb-3 px-1">
                {cat}
              </h2>
              <ul className="grid grid-cols-2 gap-3">
                {items.map((d) => {
                  const qty = cartQty(d.id);
                  return (
                    <li
                      key={d.id}
                      onClick={() => setOpenDish(d)}
                      role="button"
                      className={cn(
                        "tap rounded-[var(--radius-card)] overflow-hidden",
                        "bg-[var(--color-bg-elev)] border border-[var(--color-border)]",
                        "hover:border-[var(--color-brand)] hover:shadow-md",
                        "flex flex-col relative",
                        !d.isAvailable && "opacity-65",
                      )}
                    >
                      <DishImage dish={d} className="h-[130px] w-full rounded-none" />
                      <div className="p-3 flex flex-col flex-1 gap-1.5">
                        <h3 className="text-[14px] font-semibold leading-tight text-[var(--color-fg)] line-clamp-2">
                          {d.name}
                        </h3>
                        <div className="text-[11.5px] text-[var(--color-fg-muted)] line-clamp-2 flex-1">
                          {d.description}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[15px] font-semibold text-[var(--color-fg)] tabular-nums">
                            {formatPrice(d.priceMinor)}
                          </span>
                          {qty > 0 ? (
                            <QtyStepper
                              qty={qty}
                              onIncrement={(e) => {
                                e.stopPropagation();
                                setCartQuantity(d.id, qty + 1);
                              }}
                              onDecrement={(e) => {
                                e.stopPropagation();
                                setCartQuantity(d.id, qty - 1);
                              }}
                            />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                quickAdd(d);
                              }}
                              disabled={!d.isAvailable}
                              className="
                                tap w-8 h-8 rounded-full flex items-center justify-center
                                bg-[var(--color-brand)] text-[var(--color-brand-fg)]
                                hover:opacity-90
                                disabled:bg-[var(--color-border)] disabled:text-[var(--color-fg-subtle)]
                              "
                              aria-label="В корзину"
                            >
                              <Plus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <button
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Наверх"
        className={cn(
          "tap absolute bottom-[78px] right-4 z-20",
          "w-11 h-11 rounded-full",
          "bg-[var(--color-bg-elev)] border border-[var(--color-border-strong)]",
          "text-[var(--color-fg)]",
          "shadow-[0_8px_24px_-8px_rgba(0,0,0,0.25)]",
          "flex items-center justify-center",
          "transition-all duration-200",
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        <ArrowUp size={18} />
      </button>

      <DishSheet dish={openDish} onClose={() => setOpenDish(null)} />
    </>
  );
}
