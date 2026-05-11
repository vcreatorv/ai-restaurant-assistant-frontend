import {
  ChefHat,
  ClipboardList,
  FolderTree,
  PencilLine,
  Tags,
  type LucideIcon,
} from "lucide-react";
import {
  ORDER_STATUS_LABEL,
  type AdminOrderStatus,
} from "../data/adminMock";
import {
  TARGET_LABEL,
  VERB_LABEL,
  adminLabel,
  type AdminAction,
  type AdminActionTarget,
} from "../data/auditMock";

const TARGET_ICON: Record<AdminActionTarget, LucideIcon> = {
  order: ClipboardList,
  dish: ChefHat,
  category: FolderTree,
  tag: Tags,
  prompt: PencilLine,
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Сегодня, ${time}`;
  const y = new Date(now.getTime() - 86400000);
  if (d.toDateString() === y.toDateString()) return `Вчера, ${time}`;
  return `${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}, ${time}`;
}

/** Статус заказа в чейнджах — переводим коды в человеческие подписи. */
function humaniseChange(action: AdminAction, c: AdminAction["changes"][number]): string {
  if (action.target === "order" && c.field === "status") {
    const from = ORDER_STATUS_LABEL[c.from as AdminOrderStatus] ?? c.from;
    const to = ORDER_STATUS_LABEL[c.to as AdminOrderStatus] ?? c.to;
    return `${from} → ${to}`;
  }
  if (c.from !== undefined && c.to !== undefined) return `${c.field}: ${c.from} → ${c.to}`;
  if (c.to !== undefined) return `${c.field}: ${c.to}`;
  return c.field;
}

/**
 * ActionLog — список записей аудита. Используется и в профиле админа («Мои действия»),
 * и в дровере заказа (история конкретного заказа).
 */
export function ActionLog({
  actions,
  /** Если true — скрываем «Заказ #1024 ·» (для дровера, где это и так контекст) */
  hideTarget,
  empty = "Действий пока нет",
}: {
  actions: AdminAction[];
  hideTarget?: boolean;
  empty?: string;
}) {
  if (actions.length === 0) {
    return (
      <div className="text-center text-[13px] text-[var(--color-fg-subtle)] py-6">{empty}</div>
    );
  }

  return (
    <ul className="space-y-2">
      {actions.map((a) => {
        const Icon = TARGET_ICON[a.target];
        return (
          <li
            key={a.id}
            className="flex gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <span className="shrink-0 w-8 h-8 rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-fg-muted)]">
              <Icon size={14} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] text-[var(--color-fg)]">
                <span className="font-semibold">{adminLabel(a.admin)}</span>{" "}
                <span className="text-[var(--color-fg-muted)]">{VERB_LABEL[a.verb]}</span>
                {!hideTarget && (
                  <>
                    {" "}
                    <span className="text-[var(--color-fg-muted)]">
                      · {TARGET_LABEL[a.target].toLowerCase()}
                    </span>{" "}
                    <span className="font-medium">{a.targetLabel}</span>
                  </>
                )}
              </div>
              {a.changes.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {a.changes.map((c, i) => (
                    <li key={i} className="text-[12.5px] text-[var(--color-fg-muted)]">
                      {humaniseChange(a, c)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="shrink-0 text-[11.5px] text-[var(--color-fg-subtle)] tabular-nums whitespace-nowrap">
              {fmtDate(a.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
