import type { ApiAdminAction } from "@/api/types";
import type { AdminAction } from "./auditMock";

/*
 * Адаптер ApiAdminAction → AdminAction (фронтовый тип). Используется в обёртках
 * AdminProfile и OrderDrawer, где данные берутся из реального бэка через /admin/actions.
 *
 * Если автор удалён, бэкенд возвращает admin.id=null, email=null, display_name="Удалённый админ".
 * Фронт делает безопасный fallback (id="—", email="—") — UI всё равно покажет display_name.
 */
export function adaptApiAction(a: ApiAdminAction): AdminAction {
  return {
    id: a.id,
    admin: {
      id: a.admin.id ?? "—",
      displayName: a.admin.display_name,
      email: a.admin.email ?? "",
      hasNamesake: a.admin.has_namesake,
    },
    target: a.target,
    targetId: a.target_id,
    targetLabel: a.target_label,
    verb: a.verb,
    changes: a.changes.map((c) => ({
      field: c.field,
      from: c.from ?? undefined,
      to: c.to ?? undefined,
    })),
    createdAt: a.created_at,
  };
}
