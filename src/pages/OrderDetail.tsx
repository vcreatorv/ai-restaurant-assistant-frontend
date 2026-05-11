import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MapPin, CreditCard, Truck, Store, Utensils, X, Hash } from "lucide-react";
import { Header } from "@/components/Header";
import { DishImage } from "@/components/DishImage";
import { Sheet } from "@/components/Sheet";
import { useApp } from "@/state/store";
import type { OrderStatus } from "@/data/mock";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

const statusOrder: OrderStatus[] = ["accepted", "cooking", "ready", "in_delivery", "closed"];
const statusLabel: Record<OrderStatus, string> = {
  accepted: "Принят",
  cooking: "Готовится",
  ready: "Готов",
  in_delivery: "В пути",
  closed: "Завершён",
  cancelled: "Отменён",
};

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { orders, cancelOrder, getDishById } = useApp();
  const order = orders.find((o) => o.id === id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!order) {
    return (
      <>
        <Header title="Заказ" right={<button onClick={() => nav(-1)} className="tap text-[13px]">Назад</button>} />
        <div className="flex-1 flex items-center justify-center text-[var(--color-fg-subtle)]">
          Заказ не найден
        </div>
      </>
    );
  }

  const items = order.itemsPreview.map((it) => ({ ...it, dish: getDishById(it.dishId)! })).filter((it) => it.dish);
  const isFinal = order.status === "closed" || order.status === "cancelled";
  const canCancel = order.status === "accepted" || order.status === "cooking";

  const fulfillmentLabel = {
    delivery: { icon: Truck, text: "Доставка" },
    pickup: { icon: Store, text: "Самовывоз" },
    dine_in: { icon: Utensils, text: "В зале" },
  }[order.fulfillmentType];
  const FulfillmentIcon = fulfillmentLabel.icon;

  return (
    <>
      <header
        className="
          flex-none flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),1rem)] pb-3
          border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-xl
        "
      >
        <button
          onClick={() => nav(-1)}
          className="tap p-2 -ml-1 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[18px] font-semibold tracking-tight">Заказ {order.id}</div>
          <div className="text-[12px] text-[var(--color-fg-muted)]">{order.createdAt}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {/* Status timeline */}
        {order.status !== "cancelled" ? (
          <section className="rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-3">
              Статус
            </div>
            <ol className="space-y-2.5">
              {statusOrder.map((s, idx) => {
                const currentIdx = statusOrder.indexOf(order.status);
                const reached = idx <= currentIdx && currentIdx >= 0;
                const isCurrent = idx === currentIdx;
                if (s === "in_delivery" && order.fulfillmentType !== "delivery") return null;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-colors",
                        reached ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]",
                        isCurrent && "ring-4 ring-[var(--color-brand-soft)]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[14px] transition-colors",
                        reached ? "text-[var(--color-fg)] font-medium" : "text-[var(--color-fg-subtle)]",
                      )}
                    >
                      {statusLabel[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-[oklch(95%_0.04_25)] dark:bg-[oklch(28%_0.06_25)] border border-[var(--color-border)] p-4 text-center">
            <X size={20} className="mx-auto text-[var(--color-danger)] mb-1" />
            <div className="text-[14px] font-semibold text-[var(--color-danger)]">Заказ отменён</div>
          </div>
        )}

        {/* Meta */}
        <section className="rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-bg-elev)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          <Meta icon={<FulfillmentIcon size={14} />} label="Способ" value={fulfillmentLabel.text} />
          {order.address && <Meta icon={<MapPin size={14} />} label="Адрес" value={order.address} />}
          {order.tableNumber && (
            <Meta icon={<Hash size={14} />} label="Стол" value={`№ ${order.tableNumber}`} />
          )}
          <Meta
            icon={<CreditCard size={14} />}
            label="Оплата"
            value={order.paymentMethod === "on_delivery" ? "При получении" : "Онлайн"}
          />
        </section>

        {/* Items */}
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] px-1">
            Состав
          </h2>
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.dishId}
                className="flex gap-3 p-3 rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)]"
              >
                <DishImage dish={it.dish} className="w-16 h-16 shrink-0" size="sm" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <h3 className="text-[14px] font-semibold leading-tight">{it.dish.name}</h3>
                  <div className="text-[12px] text-[var(--color-fg-muted)] mt-1">
                    {it.quantity} × {formatPrice(it.dish.priceMinor)}
                  </div>
                  <div className="text-[14px] font-semibold tabular-nums mt-auto">
                    {formatPrice(it.dish.priceMinor * it.quantity)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Total */}
        <section className="rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-[var(--color-fg-muted)]">Итого</span>
            <span className="text-[22px] font-semibold tabular-nums">{formatPrice(order.totalMinor)}</span>
          </div>
        </section>

        {canCancel && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="tap w-full text-[13px] font-medium py-3 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
          >
            Отменить заказ
          </button>
        )}
        {isFinal && (
          <button
            onClick={() => nav("/menu")}
            className="tap w-full py-3 rounded-full bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-semibold text-[14.5px]"
          >
            Заказать ещё раз
          </button>
        )}
      </div>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Отменить заказ?">
        <div className="px-5 pt-2 pb-6 space-y-3">
          <p className="text-[14px] text-[var(--color-fg-muted)]">
            Заказ перестанет готовиться, средства не списаны.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirmCancel(false)}
              className="tap py-3 rounded-full bg-[var(--color-bg-elev)] border border-[var(--color-border)] font-semibold text-[14px] text-[var(--color-fg)]"
            >
              Не отменять
            </button>
            <button
              onClick={() => {
                cancelOrder(order.id);
                setConfirmCancel(false);
              }}
              className="tap py-3 rounded-full bg-[var(--color-danger)] text-white font-semibold text-[14px]"
            >
              Отменить
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-fg-muted)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[var(--color-fg-subtle)] uppercase tracking-wider">{label}</div>
        <div className="text-[14px] text-[var(--color-fg)] truncate">{value}</div>
      </div>
    </div>
  );
}
