/*
 * Аудит-лог админских действий — мок.
 * Бэкенд (см. backend/docs/AUDIT.md) пишет такие же записи в admin_actions
 * и отдаёт через GET /admin/actions с фильтрами.
 */

export type AdminActionTarget =
  | "order"
  | "dish"
  | "category"
  | "tag"
  | "prompt";

export type AdminActionVerb =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "publish"
  | "rollback";

export type AdminUserRef = {
  id: string;
  displayName: string;
  /** email админа. Показываем рядом с ФИО, если в системе есть тёзки. */
  email: string;
  /** Бэкенд решает: true — у этого ФИО есть дубль, фронт всегда показывает email. */
  hasNamesake: boolean;
};

export type AdminAction = {
  id: string;
  admin: AdminUserRef;
  target: AdminActionTarget;
  /** «Человеческий» идентификатор — для заказов это shortId (#1024), для блюда — название. */
  targetLabel: string;
  /** Машинный id, чтобы можно было кликнуть и перейти. */
  targetId: string;
  verb: AdminActionVerb;
  /** Дифф/детали. Бэкенд хранит JSONB, фронт показывает list. */
  changes: { field: string; from?: string; to?: string }[];
  createdAt: string; // ISO
};

const ANNA: AdminUserRef = {
  id: "u-anna",
  displayName: "Анна Админова",
  email: "admin@demo.local",
  hasNamesake: true, // см. ANNA_2 ниже — есть тёзка
};

const ANNA_2: AdminUserRef = {
  id: "u-anna-2",
  displayName: "Анна Админова",
  email: "anna.a@demo.local",
  hasNamesake: true,
};

const IGOR: AdminUserRef = {
  id: "u-igor",
  displayName: "Игорь Управляющий",
  email: "igor@demo.local",
  hasNamesake: false,
};

function ago(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

/*
 * Внутренний массив. Не экспортируется напрямую — все чтения через useAuditLog(),
 * все записи через recordAction(). Это обеспечивает реактивность без глобального
 * стора (на бэке заменится на REST: GET /admin/actions, POST туда не нужен —
 * писать будут usecase-ы автоматически).
 */
let actions: AdminAction[] = [
  {
    id: "a-1",
    admin: ANNA,
    target: "order",
    targetLabel: "#1024",
    targetId: "mock-1024",
    verb: "status_change",
    changes: [{ field: "status", from: "accepted", to: "cooking" }],
    createdAt: ago(8),
  },
  {
    id: "a-2",
    admin: ANNA,
    target: "order",
    targetLabel: "#1024",
    targetId: "mock-1024",
    verb: "status_change",
    changes: [{ field: "status", from: "cooking", to: "ready" }],
    createdAt: ago(3),
  },
  {
    id: "a-3",
    admin: ANNA,
    target: "dish",
    targetLabel: "Том Ям",
    targetId: "1",
    verb: "update",
    changes: [
      { field: "Цена", from: "450 ₽", to: "480 ₽" },
      { field: "Описание", from: "…", to: "обновлено" },
    ],
    createdAt: ago(72),
  },
  {
    id: "a-4",
    admin: ANNA_2,
    target: "tag",
    targetLabel: "Острое",
    targetId: "3",
    verb: "update",
    changes: [{ field: "Цвет", from: "#dc2626", to: "#b91c1c" }],
    createdAt: ago(120),
  },
  {
    id: "a-5",
    admin: IGOR,
    target: "order",
    targetLabel: "#1018",
    targetId: "mock-1018",
    verb: "status_change",
    changes: [{ field: "status", from: "cooking", to: "cancelled" }],
    createdAt: ago(180),
  },
  {
    id: "a-6",
    admin: ANNA,
    target: "prompt",
    targetLabel: "Основной системный промпт",
    targetId: "system",
    verb: "publish",
    changes: [{ field: "Версия", from: "v16", to: "v17" }],
    createdAt: ago(360),
  },
  {
    id: "a-7",
    admin: ANNA,
    target: "category",
    targetLabel: "Десерты",
    targetId: "9",
    verb: "create",
    changes: [],
    createdAt: ago(720),
  },
  {
    id: "a-8",
    admin: IGOR,
    target: "dish",
    targetLabel: "Карбонара",
    targetId: "6",
    verb: "delete",
    changes: [],
    createdAt: ago(1440),
  },
  {
    id: "a-9",
    admin: ANNA,
    target: "order",
    targetLabel: "#1018",
    targetId: "mock-1018",
    verb: "status_change",
    changes: [{ field: "status", from: "accepted", to: "cooking" }],
    createdAt: ago(220),
  },
];

export const TARGET_LABEL: Record<AdminActionTarget, string> = {
  order: "Заказ",
  dish: "Блюдо",
  category: "Категория",
  tag: "Тег",
  prompt: "Промпт",
};

export const VERB_LABEL: Record<AdminActionVerb, string> = {
  create: "создал",
  update: "изменил",
  delete: "удалил",
  status_change: "сменил статус",
  publish: "раскатил",
  rollback: "откатил",
};

/**
 * Имя админа с дисамбигуацией. Если у админа есть тёзка в системе —
 * добавляем email через «·», иначе только ФИО.
 */
export function adminLabel(a: AdminUserRef): string {
  return a.hasNamesake ? `${a.displayName} · ${a.email}` : a.displayName;
}

// ─── Реактивный мини-стор ────────────────────────────────────────────────────
// useSyncExternalStore-friendly: компоненты подписываются и автоматически
// перерисовываются при добавлении новых записей.

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeAuditLog(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAuditLog(): AdminAction[] {
  return actions;
}

/**
 * Записать действие в аудит-лог. Замыкается на «текущего админа» — пока что
 * это всегда Анна Админова (admin@demo.local). На бэкенде admin_id берётся
 * из сессии запроса.
 */
export function recordAction(input: {
  target: AdminActionTarget;
  targetId: string;
  targetLabel: string;
  verb: AdminActionVerb;
  changes?: AdminAction["changes"];
}) {
  const action: AdminAction = {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    admin: ANNA,
    changes: input.changes ?? [],
    createdAt: new Date().toISOString(),
    ...input,
  };
  actions = [action, ...actions];
  emit();
}
