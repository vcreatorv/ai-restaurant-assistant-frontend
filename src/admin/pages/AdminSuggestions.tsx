import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  adminCreateChatSuggestion,
  adminDeleteChatSuggestion,
  adminListChatSuggestions,
  adminUpdateChatSuggestion,
} from "@/api/suggestions";
import type { ApiAdminChatSuggestion } from "@/api/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { DataTable, type Column } from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { Drawer, FormField, inputClass } from "../components/Drawer";

/**
 * AdminSuggestions — CRUD для подсказок чата (чипы под полем ввода).
 *
 * Дополнительно отображает clicks_count — сколько раз гости кликали по подсказке.
 * Это даёт админу понимание, какие подсказки реально полезны, а какие можно убрать.
 */
type SuggestionForm = {
  text: string;
  sortOrder: number;
  isActive: boolean;
};

const TEXT_MAX = 80;

export default function AdminSuggestions() {
  const confirm = useConfirm();
  const [items, setItems] = useState<ApiAdminChatSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; item: ApiAdminChatSuggestion | null }>({
    open: false,
    item: null,
  });
  const [form, setForm] = useState<SuggestionForm>({ text: "", sortOrder: 1, isActive: true });

  async function reload() {
    const r = await adminListChatSuggestions();
    setItems([...r.items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    adminListChatSuggestions()
      .then((r) => {
        if (cancelled) return;
        setItems([...r.items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
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
  }, []);

  function openNew() {
    setForm({ text: "", sortOrder: items.length + 1, isActive: true });
    setEditing({ open: true, item: null });
  }

  function openEdit(s: ApiAdminChatSuggestion) {
    setForm({ text: s.text, sortOrder: s.sort_order, isActive: s.is_active });
    setEditing({ open: true, item: s });
  }

  async function save() {
    const text = form.text.trim();
    if (!text || text.length > TEXT_MAX) return;
    setBusy(true);
    try {
      if (editing.item) {
        // Шлём только реально изменённые поля.
        const it = editing.item;
        const patch: Parameters<typeof adminUpdateChatSuggestion>[1] = {};
        if (text !== it.text) patch.text = text;
        if (form.sortOrder !== it.sort_order) patch.sort_order = form.sortOrder;
        if (form.isActive !== it.is_active) patch.is_active = form.isActive;
        if (Object.keys(patch).length === 0) {
          setEditing({ open: false, item: null });
          return;
        }
        await adminUpdateChatSuggestion(it.id, patch);
      } else {
        await adminCreateChatSuggestion({
          text,
          sort_order: form.sortOrder,
          is_active: form.isActive,
        });
      }
      await reload();
      setEditing({ open: false, item: null });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: ApiAdminChatSuggestion) {
    const next = !s.is_active;
    setBusy(true);
    try {
      await adminUpdateChatSuggestion(s.id, { is_active: next });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить");
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: ApiAdminChatSuggestion) {
    const ok = await confirm({
      title: `Удалить «${s.text}»?`,
      message: "Гости перестанут видеть эту подсказку в чате. Действие необратимо.",
      confirmText: "Удалить",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await adminDeleteChatSuggestion(s.id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<ApiAdminChatSuggestion>[] = [
    { key: "order", header: "#", cell: (s) => s.sort_order, width: "60px" },
    {
      key: "text",
      header: "Текст",
      cell: (s) => <span className="font-semibold">{s.text}</span>,
    },
    {
      key: "clicks",
      header: "Кликов",
      width: "100px",
      align: "right",
      cell: (s) => (
        <span className="tabular-nums text-[var(--color-fg-muted)]">{s.clicks_count}</span>
      ),
    },
    {
      key: "active",
      header: "Активна",
      width: "120px",
      align: "center",
      cell: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleActive(s);
          }}
          disabled={busy}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
            s.is_active ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              s.is_active ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(s);
            }}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void remove(s);
            }}
            disabled={busy}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-danger)] disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Подсказки чата" subtitle="Загружаем…" />
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Подсказки чата"
        subtitle={`Всего: ${items.length} · активных: ${items.filter((s) => s.is_active).length}`}
        actions={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
          >
            <Plus size={14} /> Добавить подсказку
          </button>
        }
      />
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[13px]">
          {loadError}
        </div>
      )}
      <DataTable rows={items} columns={columns} rowKey={(s) => String(s.id)} onRowClick={openEdit} />

      <Drawer
        open={editing.open}
        onClose={() => setEditing({ open: false, item: null })}
        title={editing.item ? `Подсказка · ${editing.item.text}` : "Новая подсказка"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing({ open: false, item: null })}
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
            >
              Отмена
            </button>
            <button
              onClick={() => void save()}
              disabled={!form.text.trim() || busy}
              className="px-4 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90 disabled:opacity-40"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label="Текст подсказки"
            hint={`До ${TEXT_MAX} символов. Видно гостю как чип под полем ввода чата.`}
          >
            <input
              autoFocus
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value.slice(0, TEXT_MAX) }))}
              className={inputClass}
              placeholder="Например, До 500 рублей"
            />
            <div className="text-[11px] text-[var(--color-fg-subtle)] mt-1 text-right tabular-nums">
              {form.text.length} / {TEXT_MAX}
            </div>
          </FormField>
          <FormField label="Порядок отображения" hint="Меньше — левее в ленте чипов">
            <input
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className={inputClass}
            />
          </FormField>
          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <span className="text-[14px] font-semibold">Показывать гостям</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                form.isActive ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  form.isActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </Drawer>
    </>
  );
}
