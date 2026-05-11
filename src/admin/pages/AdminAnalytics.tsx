import { MessageSquare, Users, Sparkles, ShoppingCart, Receipt, Target } from "lucide-react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { mockAnalyticsAggregate } from "../data/adminMock";

/*
 * Аналитика — агрегированная статистика по работе ассистента.
 * Без персональных данных клиентов: фокус на общих показателях,
 * популярных запросах и рекомендуемых блюдах + конверсия в заказ.
 */
export default function AdminAnalytics() {
  const a = mockAnalyticsAggregate;
  const maxHour = Math.max(...a.hourlyDistribution);

  return (
    <>
      <AdminPageHeader
        title="Аналитика ассистента"
        subtitle="Что спрашивают, что рекомендуем, какая конверсия в заказ"
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat icon={<MessageSquare size={18} />} label="Запросов всего" value={String(a.totalQueries)} />
        <Stat icon={<Users size={18} />} label="Уникальных клиентов" value={String(a.uniqueUsers)} />
        <Stat
          icon={<Target size={18} />}
          label="Конверсия в заказ"
          value={`${a.conversionToOrderPercent.toFixed(1)}%`}
          hint={`${a.queriesLeadingToOrder} запросов привели к заказу`}
        />
        <Stat
          icon={<Sparkles size={18} />}
          label="Среднее рекомендаций"
          value={a.avgRecommendedPerQuery.toFixed(1)}
          hint="блюд на запрос"
        />
        <Stat
          icon={<ShoppingCart size={18} />}
          label="Среднее в корзину"
          value={a.avgAddedToCartPerQuery.toFixed(1)}
          hint="блюд из рекомендованных"
        />
        <Stat
          icon={<Receipt size={18} />}
          label="Среднее заказано"
          value={a.avgOrderedPerQuery.toFixed(1)}
          hint="блюд из рекомендованных"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Panel title="Топ запросов с конверсией" className="col-span-2">
          <ul className="divide-y divide-[var(--color-border)]">
            {a.topQueries.map((q, i) => (
              <li key={q.text} className="py-2.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[12px] font-semibold text-[var(--color-fg-muted)] flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-[var(--color-fg)] truncate">«{q.text}»</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="text-[13px] tabular-nums text-[var(--color-fg-muted)]">
                    {q.count} раз
                  </span>
                  <span
                    className={`text-[12px] tabular-nums font-semibold px-2 py-0.5 rounded-full ${
                      q.conversionPercent >= 20
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : q.conversionPercent >= 10
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                    }`}
                  >
                    {q.conversionPercent.toFixed(1)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Запросы к ассистенту по часам">
          <p className="text-[12px] text-[var(--color-fg-muted)] -mt-1 mb-3">
            Когда клиенты чаще всего пишут ассистенту в течение дня. Высота столбика — кол-во запросов в этот час.
          </p>
          <div className="flex items-end gap-[3px] h-44 px-1">
            {a.hourlyDistribution.map((v, h) => {
              const pct = maxHour > 0 ? v / maxHour : 0;
              const isPeak = v === maxHour && v > 0;
              return (
                <div
                  key={h}
                  className="flex-1 flex flex-col items-center justify-end gap-1 group relative h-full"
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[11px] font-semibold tabular-nums text-[var(--color-fg)] bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-md px-1.5 py-0.5 whitespace-nowrap shadow z-10">
                    {h}:00 — {v}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-colors ${
                      isPeak ? "bg-[var(--color-warm)]" : "bg-[var(--color-brand)]"
                    } group-hover:opacity-80`}
                    style={{ height: `${Math.max(pct * 100, v > 0 ? 4 : 0)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10.5px] text-[var(--color-fg-subtle)] tabular-nums px-1">
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((h) => (
              <span key={h}>{h}:00</span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11.5px] text-[var(--color-fg-muted)]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--color-warm)]" />
              пиковый час ({maxHour} запр.)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[var(--color-brand)]" />
              остальные
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="Самые рекомендуемые блюда">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-[12px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)]">
              <th className="py-2">#</th>
              <th>Блюдо</th>
              <th className="text-right">Рекомендаций</th>
              <th className="text-right">Заказов</th>
              <th className="text-right">Конверсия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {a.topRecommendedDishes.map((d, i) => {
              const conv = d.recommendations > 0 ? (d.orders / d.recommendations) * 100 : 0;
              return (
                <tr key={d.id}>
                  <td className="py-2.5 text-[var(--color-fg-muted)]">{i + 1}</td>
                  <td className="font-semibold">{d.name}</td>
                  <td className="text-right tabular-nums">{d.recommendations}</td>
                  <td className="text-right tabular-nums">{d.orders}</td>
                  <td className="text-right tabular-nums font-semibold text-[var(--color-brand)]">
                    {conv.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
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
