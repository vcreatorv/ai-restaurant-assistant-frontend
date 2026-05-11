import { useState } from "react";
import { TrendingUp, ShoppingBag, Wallet, Target } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { mockOverviewByPeriod, PERIOD_LABEL, type AdminPeriod } from "../data/adminMock";
import { cn } from "@/lib/cn";

export default function Dashboard() {
  const [period, setPeriod] = useState<AdminPeriod>("today");
  const o = mockOverviewByPeriod[period];

  return (
    <>
      <AdminPageHeader
        title="Дашборд"
        subtitle="Сводка по ресторану"
        actions={
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-1">
            {(Object.keys(PERIOD_LABEL) as AdminPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
                  period === p
                    ? "bg-[var(--color-brand)] text-[var(--color-brand-fg)]"
                    : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Stat icon={<ShoppingBag size={18} />} label="Заказов" value={String(o.orders)} hint={PERIOD_LABEL[period].toLowerCase()} />
        <Stat icon={<Wallet size={18} />} label="Выручка" value={formatPrice(o.revenueMinor)} hint={PERIOD_LABEL[period].toLowerCase()} />
        <Stat icon={<TrendingUp size={18} />} label="Средний чек" value={formatPrice(o.averageCheckMinor)} hint="на заказ" />
        <Stat icon={<Target size={18} />} label="Конверсия рекомендаций" value={`${o.conversionPercent.toFixed(1)}%`} hint="рекомендация → заказ" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title={`Топ блюд · ${PERIOD_LABEL[period].toLowerCase()}`} className="col-span-2">
          <ul className="divide-y divide-[var(--color-border)]">
            {o.topDishes.map((d, i) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[12px] font-semibold text-[var(--color-fg-muted)] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-[var(--color-fg)]">{d.name}</span>
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-[var(--color-fg-muted)]">
                  {d.orders} заказов
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Заказы по статусам">
          <ul className="space-y-2">
            {o.ordersByStatus.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <StatusBadge status={s.status} />
                <span className="text-[13px] tabular-nums text-[var(--color-fg-muted)]">{s.count}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Популярные запросы к ассистенту" className="col-span-3">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {o.topQueries.map((q) => (
              <li key={q.text} className="flex items-center justify-between border-b border-[var(--color-border)] py-1.5 last:border-0">
                <span className="text-[14px] text-[var(--color-fg)]">«{q.text}»</span>
                <span className="text-[13px] tabular-nums text-[var(--color-fg-muted)]">{q.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-fg-subtle)]">
        {icon}
        <span className="text-[12px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-tight tabular-nums text-[var(--color-fg)]">
        {value}
      </div>
      {hint && <div className="text-[12px] text-[var(--color-fg-subtle)] mt-0.5">{hint}</div>}
    </div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 ${className}`}>
      <h2 className="text-[13px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
