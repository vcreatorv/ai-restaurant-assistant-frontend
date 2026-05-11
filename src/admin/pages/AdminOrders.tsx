import { useEffect, useMemo, useState } from "react";
import { Phone, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { DataTable, type Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmDialog";
import { Pagination } from "../components/Pagination";
import { ActionLog } from "../components/ActionLog";
import { recordAction } from "../data/auditMock";
import { useAuditLog } from "../data/useAuditLog";
import { adaptApiAction } from "../data/auditAdapter";
import { listOrderActions } from "@/api/audit";
import { useApp } from "@/state/store";
import { adminGetOrder, adminListOrders, adminUpdateOrderStatus } from "@/api/adminOrders";
import type { ApiOrder } from "@/api/types";
import type { AdminAction } from "../data/auditMock";
import { cn } from "@/lib/cn";

function adaptApiOrder(o: ApiOrder): AdminOrder {
  return {
    id: o.id,
    shortId: `#${o.id.slice(0, 8)}`,
    customer: `${o.customer_first_name} ${o.customer_last_name}`.trim() || "—",
    phone: o.customer_phone,
    status: o.status,
    fulfillmentType: o.fulfillment_type,
    paymentMethod: o.payment_method,
    totalMinor: o.total_minor,
    createdAt: o.created_at,
    address: o.delivery_address ?? undefined,
    tableNumber: o.notes?.match(/Стол №(\S+)/)?.[1],
    itemsCount: o.items.length,
    items: o.items.map((it) => ({
      dishName: it.dish_name,
      quantity: it.quantity,
      priceMinor: it.dish_price_minor,
    })),
  };
}
import {
  mockOrders,
  ORDER_STATUS_LABEL,
  FULFILLMENT_LABEL,
  PAYMENT_LABEL,
  type AdminOrder,
  type AdminOrderStatus,
} from "../data/adminMock";

const NEXT_STATUS: Partial<Record<AdminOrderStatus, AdminOrderStatus[]>> = {
  accepted: ["cooking", "cancelled"],
  cooking: ["ready", "cancelled"],
  ready: ["in_delivery", "closed"],
  in_delivery: ["closed"],
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminOrders() {
  const { mockMode } = useApp();
  const confirm = useConfirm();
  const [orders, setOrders] = useState<AdminOrder[]>(mockMode ? mockOrders : []);
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<"delivery" | "pickup" | "dine_in" | "">("");
  const [active, setActive] = useState<AdminOrder | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<10 | 20 | 50>(10);
  const [busy, setBusy] = useState(false);
  // Когда меняем статус — бампаем счётчик, чтобы дровер перезагрузил историю.
  const [historyVersion, setHistoryVersion] = useState(0);

  // Открытие дровера: в реальном режиме подтягиваем полный заказ с items.
  // Также обновляем строку списка — итоговое кол-во позиций будет корректным.
  async function openOrder(o: AdminOrder) {
    setActive(o);
    if (mockMode) return;
    try {
      const full = await adminGetOrder(o.id);
      const adapted = adaptApiOrder(full);
      setActive(adapted);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? adapted : x)));
    } catch {
      // не критично, остаёмся с тем, что было в списке
    }
  }

  // Загрузка списка с бэка. Фильтр по status делаем через API; type-фильтр —
  // на фронте, потому что бэкенд GET /admin/orders по fulfillment_type не фильтрует.
  async function reload() {
    if (mockMode) return;
    const r = await adminListOrders({
      status: statusFilter || undefined,
      limit: 200,
    });
    setOrders(r.items.map(adaptApiOrder));
  }

  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    adminListOrders({ status: statusFilter || undefined, limit: 200 })
      .then((r) => {
        if (!cancelled) setOrders(r.items.map(adaptApiOrder));
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Не удалось загрузить");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mockMode, statusFilter]);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter && o.status !== statusFilter) return false;
        if (typeFilter && o.fulfillmentType !== typeFilter) return false;
        return true;
      }),
    [orders, statusFilter, typeFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  async function changeStatus(o: AdminOrder, next: AdminOrderStatus) {
    const ok = await confirm({
      title: `Изменить статус заказа ${o.shortId}?`,
      message: `Будет переведён из «${ORDER_STATUS_LABEL[o.status]}» в «${ORDER_STATUS_LABEL[next]}».`,
      confirmText: next === "cancelled" ? "Отменить" : "Изменить",
      tone: next === "cancelled" ? "danger" : "primary",
    });
    if (!ok) return;

    if (mockMode) {
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
      if (active?.id === o.id) setActive({ ...o, status: next });
      recordAction({
        target: "order",
        targetId: o.id,
        targetLabel: o.shortId,
        verb: "status_change",
        changes: [{ field: "status", from: o.status, to: next }],
      });
      return;
    }

    setBusy(true);
    try {
      const updated = await adminUpdateOrderStatus(o.id, { status: next });
      const adapted = adaptApiOrder(updated);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? adapted : x)));
      if (active?.id === o.id) setActive(adapted);
      // Триггерим перезагрузку истории в дровере (чтобы запись о смене статуса появилась без F5).
      setHistoryVersion((v) => v + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось изменить статус");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<AdminOrder>[] = [
    { key: "id", header: "№", cell: (o) => <span className="font-semibold">{o.shortId}</span>, width: "80px" },
    { key: "date", header: "Когда", cell: (o) => fmtDate(o.createdAt), width: "130px" },
    { key: "customer", header: "Клиент", cell: (o) => o.customer },
    {
      key: "type",
      header: "Тип",
      width: "120px",
      cell: (o) => (
        <span className="text-[12px] text-[var(--color-fg-muted)]">
          {FULFILLMENT_LABEL[o.fulfillmentType]}
        </span>
      ),
    },
    {
      key: "items",
      header: "Позиций",
      width: "90px",
      align: "right",
      cell: (o) => <span className="tabular-nums">{o.itemsCount}</span>,
    },
    {
      key: "total",
      header: "Сумма",
      width: "110px",
      align: "right",
      cell: (o) => <span className="tabular-nums font-semibold">{formatPrice(o.totalMinor)}</span>,
    },
    { key: "status", header: "Статус", width: "130px", cell: (o) => <StatusBadge status={o.status} /> },
  ];

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Заказы" subtitle="Загружаем…" />
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }
  return (
    <>
      <AdminPageHeader title="Заказы" subtitle={`Показано ${filtered.length} из ${orders.length}`} />
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[13px]">
          {loadError}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Select
          className="w-44"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v as AdminOrderStatus | "");
            setPage(1);
          }}
          placeholder="Любой статус"
          clearable
          options={(Object.keys(ORDER_STATUS_LABEL) as AdminOrderStatus[]).map((s) => ({
            value: s,
            label: ORDER_STATUS_LABEL[s],
          }))}
        />
        <Select
          className="w-40"
          value={typeFilter}
          onChange={(v) => {
            setTypeFilter(v as typeof typeFilter);
            setPage(1);
          }}
          placeholder="Любой тип"
          clearable
          options={[
            { value: "delivery", label: "Доставка" },
            { value: "pickup", label: "Самовывоз" },
            { value: "dine_in", label: "В зале" },
          ]}
        />
      </div>

      <DataTable
        rows={pageRows}
        columns={columns}
        rowKey={(o) => o.id}
        onRowClick={(o) => void openOrder(o)}
      />

      <div className="mt-4 grid grid-cols-3 items-center gap-2 text-[13px] text-[var(--color-fg-muted)]">
        <div className="flex items-center gap-2">
          <span>Показывать по</span>
          <Select
            className="w-20"
            value={perPage}
            onChange={(v) => {
              setPerPage(v as 10 | 20 | 50);
              setPage(1);
            }}
            options={[
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 50, label: "50" },
            ]}
          />
        </div>
        <div className="flex justify-center">
          <Pagination page={safePage} total={totalPages} onChange={setPage} />
        </div>
        <div className="text-right tabular-nums">
          {filtered.length === 0
            ? "Ничего не найдено"
            : `${(safePage - 1) * perPage + 1}–${Math.min(safePage * perPage, filtered.length)} из ${filtered.length}`}
        </div>
      </div>

      {active && (
        <OrderDrawer
          order={active}
          onClose={() => setActive(null)}
          onChangeStatus={changeStatus}
          historyVersion={historyVersion}
        />
      )}
    </>
  );
}

function OrderDrawer({
  order,
  onClose,
  onChangeStatus,
  historyVersion,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChangeStatus: (o: AdminOrder, next: AdminOrderStatus) => void;
  /** Бампом этого числа из родителя триггерим re-fetch истории (после смены статуса). */
  historyVersion: number;
}) {
  const { mockMode } = useApp();
  const next = NEXT_STATUS[order.status] ?? [];
  const [tab, setTab] = useState<"info" | "history">("info");
  const allActions = useAuditLog();
  // mockMode: лента из локального in-memory store. Real: GET /admin/orders/{id}/actions.
  // Real-режим вызываем только если order.id похож на UUID (наши mock-orders с
  // префиксом mock- не пройдут backend-валидацию пути).
  const isUUIDLike = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(order.id);
  const useApi = !mockMode && isUUIDLike;
  const [apiHistory, setApiHistory] = useState<AdminAction[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!useApi) {
      setApiHistory(null);
      return;
    }
    let cancelled = false;
    setHistoryError(null);
    listOrderActions(order.id, { limit: 100 })
      .then((r) => {
        if (!cancelled) setApiHistory(r.items.map(adaptApiAction));
      })
      .catch((e) => {
        if (!cancelled) setHistoryError(e instanceof Error ? e.message : "Не удалось загрузить");
      });
    return () => {
      cancelled = true;
    };
  }, [order.id, useApi, historyVersion]);

  const orderHistory = useMemo(() => {
    if (useApi && apiHistory) return apiHistory;
    return allActions
      .filter((a) => a.target === "order" && a.targetId === order.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [useApi, apiHistory, allActions, order.id]);
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="w-[520px] bg-[var(--color-bg)] border-l border-[var(--color-border)] flex flex-col">
        <header className="flex-none px-5 pt-3 pb-0 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[15px] font-semibold">Заказ {order.shortId}</div>
              <div className="text-[12px] text-[var(--color-fg-subtle)]">{fmtDate(order.createdAt)}</div>
            </div>
            <button
              onClick={onClose}
              className="tap p-2 rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-elev)]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-4 -mb-px">
            <TabBtn active={tab === "info"} onClick={() => setTab("info")}>
              Информация
            </TabBtn>
            <TabBtn active={tab === "history"} onClick={() => setTab("history")}>
              История
            </TabBtn>
          </div>
        </header>
        {tab === "history" ? (
          <div className="flex-1 overflow-y-auto p-5">
            {historyError ? (
              <div className="text-[13px] text-[var(--color-danger)] py-2">
                Не удалось загрузить историю: {historyError}
              </div>
            ) : (
              <ActionLog
                actions={orderHistory}
                hideTarget
                empty="Изменений по этому заказу пока не было"
              />
            )}
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Field label="Статус">
            <StatusBadge status={order.status} />
          </Field>
          <Field label="Клиент">
            <div className="flex items-center justify-between gap-2">
              <div>
                {order.customer}
                <div className="text-[12px] text-[var(--color-fg-muted)]">{order.phone}</div>
              </div>
              <a
                href={`tel:${order.phone.replace(/[^+\d]/g, "")}`}
                className="tap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-bg-elev)]"
              >
                <Phone size={12} />
                Позвонить
              </a>
            </div>
          </Field>
          <Field label="Способ получения">
            {FULFILLMENT_LABEL[order.fulfillmentType]}
            {order.address && (
              <div className="text-[12px] text-[var(--color-fg-muted)]">{order.address}</div>
            )}
            {order.tableNumber && (
              <div className="text-[12px] text-[var(--color-fg-muted)]">Стол №{order.tableNumber}</div>
            )}
          </Field>
          <Field label="Оплата">{PAYMENT_LABEL[order.paymentMethod]}</Field>
          <Field label="Состав">
            <ul className="rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              {order.items.map((it, i) => (
                <li key={i} className="px-3 py-2 flex items-center justify-between text-[13px]">
                  <span>
                    {it.dishName} <span className="text-[var(--color-fg-muted)]">× {it.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(it.priceMinor * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between text-[14px] font-semibold">
              <span>Итого</span>
              <span className="tabular-nums">{formatPrice(order.totalMinor)}</span>
            </div>
          </Field>
        </div>
        )}
        {tab === "info" && next.length > 0 && (
          <footer className="flex-none p-4 border-t border-[var(--color-border)] flex flex-wrap gap-2">
            {next.map((s) => (
              <button
                key={s}
                onClick={() => onChangeStatus(order, s)}
                className={`px-3.5 py-2 rounded-full text-[13px] font-semibold ${
                  s === "cancelled"
                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
                }`}
              >
                {s === "cancelled" ? "Отменить" : `→ ${ORDER_STATUS_LABEL[s]}`}
              </button>
            ))}
          </footer>
        )}
      </aside>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-2 text-[13px] font-semibold border-b-2 transition-colors",
        active
          ? "border-[var(--color-brand)] text-[var(--color-fg)]"
          : "border-transparent text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-1.5">
        {label}
      </div>
      <div className="text-[14px] text-[var(--color-fg)]">{children}</div>
    </div>
  );
}
