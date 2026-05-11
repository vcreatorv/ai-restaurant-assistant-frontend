import { ORDER_STATUS_LABEL, type AdminOrderStatus } from "../data/adminMock";

/*
 * Статус заказа — простой текст без бейджа, цвета и иконки.
 * Финальные статусы (закрыт/отменён) — приглушённым цветом для лёгкого контраста с активными.
 */
export function StatusBadge({ status }: { status: AdminOrderStatus }) {
  const muted = status === "closed" || status === "cancelled";
  return (
    <span
      className={`text-[13px] ${
        muted ? "text-[var(--color-fg-subtle)]" : "text-[var(--color-fg)] font-medium"
      }`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
