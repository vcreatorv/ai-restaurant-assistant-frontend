import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Wallet, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { PERIOD_LABEL, type AdminPeriod } from "../data/adminMock";
import { adminGetDashboard } from "@/api/adminAnalytics";
import type { ApiAdminDashboard } from "@/api/types";
import { cn } from "@/lib/cn";

/**
 * Dashboard — операционная сводка по заказам.
 *
 * Метрики: количество заказов / выручка / средний чек (без конверсии — она перенесена
 * в Analytics) + распределение по статусам + топ блюд по продажам.
 * Источник — GET /admin/dashboard?period=...
 */
export default function Dashboard() {
  const [period, setPeriod] = useState<AdminPeriod>("today");
  const [data, setData] = useState<ApiAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminGetDashboard(period)
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
        title="Главная"
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
              icon={<ShoppingBag size={18} />}
              label="Заказов"
              value={String(data.orders)}
              hint={PERIOD_LABEL[period].toLowerCase()}
            />
            <Stat
              icon={<Wallet size={18} />}
              label="Выручка"
              value={formatPrice(data.revenue_minor)}
              hint={PERIOD_LABEL[period].toLowerCase()}
            />
            <Stat
              icon={<TrendingUp size={18} />}
              label="Средний чек"
              value={formatPrice(data.average_check_minor)}
              hint="на заказ"
            />
          </div>

          <CartAdditionsCard
            total={data.cart_additions_total}
            fromChat={data.cart_additions_from_chat}
            fromMenu={data.cart_additions_from_menu}
            period={period}
          />

          <div className="grid grid-cols-3 gap-4">
            <Panel title={`Топ блюд · ${PERIOD_LABEL[period].toLowerCase()}`} className="col-span-2">
              {data.top_dishes.length === 0 ? (
                <Empty hint="Заказов за период пока нет" />
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {data.top_dishes.map((d, i) => (
                    <li key={d.dish_id} className="py-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-[12px] font-semibold text-[var(--color-fg-muted)] flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-[14px] text-[var(--color-fg)]">{d.dish_name}</span>
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-[var(--color-fg-muted)]">
                        {d.value} порций
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Заказы по статусам">
              {data.orders_by_status.length === 0 ? (
                <Empty hint="Заказов нет" />
              ) : (
                <ul className="space-y-2">
                  {data.orders_by_status.map((s) => (
                    <li key={s.status} className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <span className="text-[13px] tabular-nums text-[var(--color-fg-muted)]">
                        {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
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

/**
 * CartAdditionsCard — общая цифра «+» в корзину за период с разбивкой источников.
 *
 * Источники приходят как абсолютные числа из cart_additions, ниже считаем процент
 * от total для подписи и для ширины сегментов прогресс-бара. Прочие источники
 * (cart / other) в UI не показываем — они складываются в total, но не выделяются
 * как отдельная категория.
 */
function CartAdditionsCard({
  total,
  fromChat,
  fromMenu,
  period,
}: {
  total: number;
  fromChat: number;
  fromMenu: number;
  period: AdminPeriod;
}) {
  const chatPct = total > 0 ? Math.round((fromChat / total) * 100) : 0;
  const menuPct = total > 0 ? Math.round((fromMenu / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[var(--color-fg-subtle)]">
          <ShoppingCart size={18} />
          <span className="text-[12px] uppercase tracking-wider font-semibold">
            Добавлений в корзину · {PERIOD_LABEL[period].toLowerCase()}
          </span>
        </div>
        <span className="text-[24px] font-semibold tracking-tight tabular-nums text-[var(--color-fg)]">
          {total}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-[13px] text-[var(--color-fg-subtle)]">Добавлений за период пока нет</p>
      ) : (
        <>
          <div className="flex h-2 rounded-full overflow-hidden bg-[var(--color-bg)] mb-3">
            <div
              className="bg-[var(--color-brand)]"
              style={{ width: `${menuPct}%` }}
              title={`Из меню: ${fromMenu}`}
            />
            <div
              className="bg-[var(--color-warm)]"
              style={{ width: `${chatPct}%` }}
              title={`Из чата: ${fromChat}`}
            />
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="flex items-center gap-2 text-[var(--color-fg-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand)]" />
              Из меню
              <span className="tabular-nums text-[var(--color-fg)] font-semibold">{fromMenu}</span>
              <span className="text-[var(--color-fg-subtle)]">({menuPct}%)</span>
            </span>
            <span className="flex items-center gap-2 text-[var(--color-fg-muted)]">
              <span className="w-2 h-2 rounded-full bg-[var(--color-warm)]" />
              Из чата
              <span className="tabular-nums text-[var(--color-fg)] font-semibold">{fromChat}</span>
              <span className="text-[var(--color-fg-subtle)]">({chatPct}%)</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
