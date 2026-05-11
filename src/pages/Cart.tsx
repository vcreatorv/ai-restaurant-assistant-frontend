import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Truck, Store, Utensils, ConciergeBell } from "lucide-react";
import { Header } from "@/components/Header";
import { DishImage } from "@/components/DishImage";
import { QtyStepper } from "@/components/QtyStepper";
import { Sheet } from "@/components/Sheet";
import type { Order } from "@/data/mock";
import { formatPrice } from "@/lib/format";
import { useApp } from "@/state/store";
import { cn } from "@/lib/cn";

export default function Cart() {
  const nav = useNavigate();
  const { cart, setCartQuantity, removeFromCart, cartTotalMinor, profile, createOrderFromCart, getDishById } =
    useApp();
  const [openCheckout, setOpenCheckout] = useState(false);
  const items = cart.map((it) => ({ ...it, dish: getDishById(it.dishId)! })).filter((it) => it.dish);

  return (
    <>
      <Header title="Корзина" subtitle={items.length === 0 ? "Пусто" : `${items.length} позиции`} />

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-subtle)]">
            <ConciergeBell size={26} />
          </div>
          <div>
            <div className="text-[16px] font-semibold text-[var(--color-fg)]">Пока пусто</div>
            <p className="text-[13px] text-[var(--color-fg-muted)] mt-1">
              Спросите ассистента или загляните в меню
            </p>
          </div>
          <button
            onClick={() => nav("/chat")}
            className="tap mt-2 px-5 py-2.5 rounded-full bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-[14px] font-semibold"
          >
            Спросить ассистента
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
            {items.map((it) => (
              <article
                key={it.dishId}
                className="flex gap-3 p-3 rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)]"
              >
                <DishImage dish={it.dish} className="w-20 h-20 shrink-0" size="sm" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold leading-tight text-[var(--color-fg)]">
                      {it.dish.name}
                    </h3>
                    <button
                      onClick={() => removeFromCart(it.dishId)}
                      className="tap p-1 -m-1 text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {it.note ? (
                    <p className="text-[11.5px] text-[var(--color-fg-muted)] mt-0.5 italic">
                      «{it.note}»
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <QtyStepper
                      qty={it.quantity}
                      onIncrement={() => setCartQuantity(it.dishId, it.quantity + 1)}
                      onDecrement={() => setCartQuantity(it.dishId, it.quantity - 1)}
                      size="md"
                    />
                    <span className="text-[14px] font-semibold text-[var(--color-fg)] tabular-nums">
                      {formatPrice(it.dish.priceMinor * it.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="flex-none px-4 pt-3 pb-4 border-t border-[var(--color-border)] bg-[var(--color-bg)] space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-[var(--color-fg-muted)]">К оплате</span>
              <span className="text-[24px] font-semibold tracking-tight text-[var(--color-fg)] tabular-nums">
                {formatPrice(cartTotalMinor)}
              </span>
            </div>
            <button
              onClick={() => setOpenCheckout(true)}
              className="tap w-full py-3.5 rounded-full bg-[var(--color-brand)] text-[var(--color-brand-fg)] font-semibold text-[15px]"
            >
              Оформить заказ
            </button>
          </div>
        </>
      )}

      <CheckoutSheet
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        defaultAddress=""
        profileName={`${profile.firstName} ${profile.lastName}`}
        profilePhone={profile.phone}
        totalMinor={cartTotalMinor}
        onSubmit={async (data) => {
          const o = await createOrderFromCart(data);
          setOpenCheckout(false);
          nav(`/orders/${o.id}`);
        }}
      />
    </>
  );
}

function CheckoutSheet({
  open,
  onClose,
  profileName,
  profilePhone,
  totalMinor,
  onSubmit,
  defaultAddress,
}: {
  open: boolean;
  onClose: () => void;
  profileName: string;
  profilePhone: string;
  totalMinor: number;
  defaultAddress: string;
  onSubmit: (args: {
    fulfillmentType: Order["fulfillmentType"];
    paymentMethod: Order["paymentMethod"];
    address?: string;
    tableNumber?: string;
  }) => Promise<void>;
}) {
  const [fulfillment, setFulfillment] = useState<Order["fulfillmentType"]>("delivery");
  const [payment, setPayment] = useState<Order["paymentMethod"]>("on_delivery");
  const [address, setAddress] = useState(defaultAddress);
  const [tableNumber, setTableNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fulfillmentOptions = [
    { id: "delivery", label: "Доставка", icon: Truck },
    { id: "pickup", label: "Самовывоз", icon: Store },
    { id: "dine_in", label: "В зале", icon: Utensils },
  ] as const;

  return (
    <Sheet open={open} onClose={onClose} title="Оформление заказа">
      <div className="px-5 pt-2 pb-6 space-y-5">
        <div>
          <Label>Способ получения</Label>
          <div className="grid grid-cols-3 gap-2">
            {fulfillmentOptions.map((o) => {
              const Icon = o.icon;
              const active = fulfillment === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setFulfillment(o.id)}
                  className={cn(
                    "tap flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2",
                    active
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-elev)] text-[var(--color-fg-muted)]",
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[12.5px] font-semibold">{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {fulfillment === "delivery" && (
          <div>
            <Label>Адрес</Label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Москва, Никольская 10"
              className="
                w-full px-4 py-3 rounded-2xl
                bg-[var(--color-bg-elev)] border border-[var(--color-border)]
                focus:border-[var(--color-brand)] outline-none
                text-[14px] text-[var(--color-fg)]
              "
            />
          </div>
        )}

        {fulfillment === "dine_in" && (
          <div>
            <Label>Номер стола</Label>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Например, 12"
              inputMode="numeric"
              className="
                w-full px-4 py-3 rounded-2xl
                bg-[var(--color-bg-elev)] border border-[var(--color-border)]
                focus:border-[var(--color-brand)] outline-none
                text-[14px] text-[var(--color-fg)]
              "
            />
            <p className="text-[11.5px] text-[var(--color-fg-subtle)] mt-1.5 leading-relaxed">
              Номер указан на табличке стола.
            </p>
          </div>
        )}

        <div>
          <Label>Контакты</Label>
          <div className="rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-3 space-y-1">
            <div className="text-[14px] font-semibold">{profileName}</div>
            <div className="text-[13px] text-[var(--color-fg-muted)]">{profilePhone}</div>
          </div>
        </div>

        <div>
          <Label>Оплата</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayment("on_delivery")}
              className={cn(
                "tap p-3 rounded-2xl border-2 text-left",
                payment === "on_delivery"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elev)]",
              )}
            >
              <div className="text-[13.5px] font-semibold">При получении</div>
              <div className="text-[11.5px] text-[var(--color-fg-muted)] mt-0.5">Карта или наличные</div>
            </button>
            <button
              onClick={() => setPayment("online_stub")}
              className={cn(
                "tap p-3 rounded-2xl border-2 text-left",
                payment === "online_stub"
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elev)]",
              )}
            >
              <div className="text-[13.5px] font-semibold">Онлайн</div>
              <div className="text-[11.5px] text-[var(--color-fg-muted)] mt-0.5">Скоро</div>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-4 flex items-baseline justify-between">
          <span className="text-[13px] text-[var(--color-fg-muted)]">К оплате</span>
          <span className="text-[20px] font-semibold tabular-nums">{formatPrice(totalMinor)}</span>
        </div>

        <button
          disabled={
            submitting ||
            (fulfillment === "delivery" && !address.trim()) ||
            (fulfillment === "dine_in" && !tableNumber.trim())
          }
          onClick={async () => {
            setSubmitting(true);
            try {
              await onSubmit({
                fulfillmentType: fulfillment,
                paymentMethod: payment,
                address: fulfillment === "delivery" ? address : undefined,
                tableNumber: fulfillment === "dine_in" ? tableNumber : undefined,
              });
            } finally {
              setSubmitting(false);
            }
          }}
          className="
            tap w-full py-3.5 rounded-full
            bg-[var(--color-brand)] text-[var(--color-brand-fg)]
            font-semibold text-[15px]
            disabled:bg-[var(--color-border)] disabled:text-[var(--color-fg-subtle)]
          "
        >
          {submitting ? "Оформляем..." : "Подтвердить заказ"}
        </button>
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-2">
      {children}
    </div>
  );
}
