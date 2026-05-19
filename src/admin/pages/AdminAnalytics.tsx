import { useEffect, useState } from "react";
import { Sparkles, ShoppingCart, Receipt } from "lucide-react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { PERIOD_LABEL, type AdminPeriod } from "../data/adminMock";
import { adminGetAnalytics } from "@/api/adminAnalytics";
import type { ApiAdminAnalytics } from "@/api/types";
import { cn } from "@/lib/cn";

/**
 * AdminAnalytics — поведенческие метрики ассистента.
 *
 * Метрики: количество ответов с рекомендациями + среднее заказано/в корзину из
 * рекомендованных + топ самых рекомендуемых блюд.
 * Источник — GET /admin/analytics?period=...
 */
export default function AdminAnalytics() {
  const [period, setPeriod] = useState<AdminPeriod>("today");
  const [data, setData] = useState<ApiAdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminGetAnalytics(period)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <>
      <AdminPageHeader
        title="Аналитика ассистента"
        subtitle="Поведение рекомендаций, конверсия в корзину и заказ"
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

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[13px]">
          {error}
        </div>
      )}

      {loading || !data ? (
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Stat
              icon={<Sparkles size={18} />}
              label="Ответов с рекомендациями"
              value={String(data.assistant_messages)}
              hint={PERIOD_LABEL[period].toLowerCase()}
            />
            <Stat
              icon={<Receipt size={18} />}
              label="Среднее заказано"
              value={data.avg_ordered_per_message.toFixed(2)}
              hint="блюд из рекомендованных в окне 60 минут"
            />
            <Stat
              icon={<ShoppingCart size={18} />}
              label="Среднее в корзину"
              value={data.avg_added_to_cart_per_message.toFixed(2)}
              hint="блюд из рекомендованных, добавлены из чата"
            />
          </div>

          <Panel title="Самые рекомендуемые блюда">
            {data.top_recommended_dishes.length === 0 ? (
              <Empty hint="Пока нет данных за период" />
            ) : (
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-fg-subtle)] border-b border-[var(--color-border)]">
                    <th className="py-2 pr-2 w-12">#</th>
                    <th className="py-2 pr-2">Блюдо</th>
                    <th className="py-2 pl-2 text-right tabular-nums">Раз рекомендовано</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {data.top_recommended_dishes.map((d, i) => (
                    <tr key={d.dish_id}>
                      <td className="py-2 pr-2 text-[var(--color-fg-subtle)] tabular-nums">{i + 1}</td>
                      <td className="py-2 pr-2 text-[var(--color-fg)]">{d.dish_name}</td>
                      <td className="py-2 pl-2 text-right tabular-nums font-semibold text-[var(--color-fg-muted)]">
                        {d.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}
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

function Empty({ hint }: { hint: string }) {
  return <p className="text-[13px] text-[var(--color-fg-subtle)] py-4">{hint}</p>;
}
