import { useSyncExternalStore } from "react";
import { getAuditLog, subscribeAuditLog } from "./auditMock";

/** Подписка на аудит-лог. Возвращает актуальный массив, ререндерит при изменениях. */
export function useAuditLog() {
  return useSyncExternalStore(subscribeAuditLog, getAuditLog, getAuditLog);
}
