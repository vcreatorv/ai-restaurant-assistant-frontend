import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useApp } from "@/state/store";
import { useTheme, palettes, type PaletteKey } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { ActionLog } from "../components/ActionLog";
import { Select } from "../components/Select";
import { TARGET_LABEL, type AdminAction, type AdminActionTarget } from "../data/auditMock";
import { useAuditLog } from "../data/useAuditLog";
import { adaptApiAction } from "../data/auditAdapter";
import { listActions } from "@/api/audit";

export default function AdminProfile() {
  const { profile, updateProfile, mockMode } = useApp();
  const { mode, setMode, paletteKey, setPaletteKey, palette } = useTheme();
  const [first, setFirst] = useState(profile.firstName);
  const [last, setLast] = useState(profile.lastName);
  const [phone, setPhone] = useState(profile.phone);
  const [filterTarget, setFilterTarget] = useState<AdminActionTarget | "">("");
  const localActions = useAuditLog();
  // В реальном режиме — лента приходит с бэка через /admin/actions?admin_id=me.
  // В mockMode — берём local in-memory store, фильтр по email.
  const [apiActions, setApiActions] = useState<AdminAction[] | null>(null);
  const [actionsError, setActionsError] = useState<string | null>(null);

  useEffect(() => {
    if (mockMode) {
      setApiActions(null);
      return;
    }
    let cancelled = false;
    setActionsError(null);
    listActions({
      admin_id: "me",
      target: filterTarget || undefined,
      limit: 100,
    })
      .then((r) => {
        if (!cancelled) setApiActions(r.items.map(adaptApiAction));
      })
      .catch((e) => {
        if (!cancelled) setActionsError(e instanceof Error ? e.message : "Не удалось загрузить");
      });
    return () => {
      cancelled = true;
    };
  }, [mockMode, filterTarget]);

  const myActions = useMemo(() => {
    if (!mockMode && apiActions) {
      // Бэкенд уже отфильтровал admin_id=me и target — сортировка идёт DESC из БД.
      return apiActions;
    }
    return localActions
      .filter((a) => a.admin.email === "admin@demo.local")
      .filter((a) => (filterTarget ? a.target === filterTarget : true))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [mockMode, apiActions, localActions, filterTarget]);
  const dirty =
    first !== profile.firstName || last !== profile.lastName || phone !== profile.phone;

  function save() {
    updateProfile({ firstName: first, lastName: last, phone });
  }

  return (
    <>
      <AdminPageHeader title="Профиль" subtitle="Личные данные администратора и оформление" />

      <div className="grid grid-cols-3 gap-4">
        <Panel title="Личные данные" className="col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Имя" value={first} onChange={setFirst} />
            <Field label="Фамилия" value={last} onChange={setLast} />
            <Field label="Email" value={profile.email} readOnly />
            <Field label="Телефон" value={phone} onChange={setPhone} />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={save}
              disabled={!dirty}
              className="px-4 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90 disabled:opacity-40"
            >
              Сохранить
            </button>
          </div>
        </Panel>

        <Panel title="Оформление">
          <div className="space-y-4">
            <div>
              <div className="text-[12px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-2">
                Тема
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["light", "dark"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                      mode === m
                        ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                        : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
                    }`}
                  >
                    {m === "light" ? "Светлая" : "Тёмная"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-2">
                Палитра
              </div>
              <div className="grid grid-cols-5 gap-2">
                {palettes.map((opt) => {
                  const active = paletteKey === opt.key;
                  const previewBg = mode === "dark" ? opt.preview.darkBg : opt.preview.lightBg;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setPaletteKey(opt.key as PaletteKey)}
                      aria-label={opt.name}
                      title={opt.name}
                      className={cn(
                        "tap relative aspect-square rounded-2xl overflow-hidden transition-all border border-[var(--color-border)]",
                        active
                          ? "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[var(--color-bg-elev)]"
                          : "hover:border-[var(--color-border-strong)] active:scale-95",
                      )}
                    >
                      <div className="absolute inset-0" style={{ backgroundColor: previewBg }} />
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2/5"
                        style={{ backgroundColor: opt.preview.brand }}
                      />
                      <div
                        className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full"
                        style={{ backgroundColor: opt.preview.warm }}
                      />
                      {active && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
                          <Check size={10} strokeWidth={3} className="text-[var(--color-brand-fg)]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-center text-[var(--color-fg-subtle)] mt-2">
                {palette.name}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-[13px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)]">
              Мои действия
            </h2>
            <Select
              className="w-44"
              value={filterTarget}
              onChange={(v) => setFilterTarget(v as AdminActionTarget | "")}
              placeholder="Все объекты"
              clearable
              options={(Object.keys(TARGET_LABEL) as AdminActionTarget[]).map((t) => ({
                value: t,
                label: TARGET_LABEL[t],
              }))}
            />
          </div>
          {actionsError ? (
            <div className="text-[13px] text-[var(--color-danger)] py-2">
              Не удалось загрузить лог: {actionsError}
            </div>
          ) : (
            <ActionLog actions={myActions} empty="Действий пока нет" />
          )}
        </div>
      </div>
    </>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 ${className}`}>
      <h2 className="text-[13px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-1.5">
        {label}
      </span>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-[14px] outline-none ${
          readOnly
            ? "bg-[var(--color-bg)] text-[var(--color-fg-muted)] cursor-default"
            : "bg-[var(--color-bg)] text-[var(--color-fg)] focus:border-[var(--color-brand)]"
        }`}
      />
    </label>
  );
}
