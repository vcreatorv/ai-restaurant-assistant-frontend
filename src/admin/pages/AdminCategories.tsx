import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/state/store";
import { listCategories } from "@/api/menu";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminUpdateCategory,
} from "@/api/adminMenu";
import type { ApiCategory } from "@/api/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { DataTable, type Column } from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { Drawer, FormField, inputClass } from "../components/Drawer";
import { recordAction } from "../data/auditMock";
import { mockCategories, type AdminCategory } from "../data/adminMock";

/*
 * Источник данных:
 *   - mockMode: локальный mockCategories + recordAction для аудита
 *   - real:     GET /categories на mount, CRUD через /admin/categories,
 *               аудит пишется бэком автоматически
 */
function fromApi(c: ApiCategory): AdminCategory {
  return {
    id: c.id,
    name: c.name,
    sortOrder: c.sort_order,
    isAvailable: c.is_available,
  };
}

export default function AdminCategories() {
  const { dishes, mockMode } = useApp();
  const confirm = useConfirm();
  const [items, setItems] = useState<AdminCategory[]>(mockMode ? mockCategories : []);
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; cat: AdminCategory | null }>({
    open: false,
    cat: null,
  });
  const [form, setForm] = useState({ name: "", sortOrder: 1, isAvailable: true });

  async function reload() {
    if (mockMode) return;
    const r = await listCategories();
    setItems(r.items.map(fromApi).sort((a, b) => a.sortOrder - b.sortOrder));
  }

  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listCategories()
      .then((r) => {
        if (cancelled) return;
        setItems(r.items.map(fromApi).sort((a, b) => a.sortOrder - b.sortOrder));
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
  }, [mockMode]);

  function openNew() {
    setForm({ name: "", sortOrder: items.length + 1, isAvailable: true });
    setEditing({ open: true, cat: null });
  }
  function openEdit(c: AdminCategory) {
    setForm({ name: c.name, sortOrder: c.sortOrder, isAvailable: c.isAvailable });
    setEditing({ open: true, cat: c });
  }

  async function save() {
    if (!form.name.trim()) return;
    if (mockMode) {
      if (editing.cat) {
        const cat = editing.cat;
        setItems((prev) => prev.map((x) => (x.id === cat.id ? { ...x, ...form } : x)));
        const changes: { field: string; from?: string; to?: string }[] = [];
        if (form.name !== cat.name) changes.push({ field: "Название", from: cat.name, to: form.name });
        if (form.sortOrder !== cat.sortOrder)
          changes.push({ field: "Порядок", from: String(cat.sortOrder), to: String(form.sortOrder) });
        if (form.isAvailable !== cat.isAvailable)
          changes.push({ field: "Доступна", from: cat.isAvailable ? "да" : "нет", to: form.isAvailable ? "да" : "нет" });
        recordAction({ target: "category", targetId: String(cat.id), targetLabel: form.name, verb: "update", changes });
      } else {
        const newId = Math.max(0, ...items.map((p) => p.id)) + 1;
        setItems((prev) => [...prev, { id: newId, ...form }]);
        recordAction({ target: "category", targetId: String(newId), targetLabel: form.name, verb: "create" });
      }
      setEditing({ open: false, cat: null });
      return;
    }

    setBusy(true);
    try {
      if (editing.cat) {
        // Шлём только реально изменённые поля — иначе бэк-аудит запишет лишний дифф.
        const cat = editing.cat;
        const patch: Parameters<typeof adminUpdateCategory>[1] = {};
        if (form.name !== cat.name) patch.name = form.name;
        if (form.sortOrder !== cat.sortOrder) patch.sort_order = form.sortOrder;
        if (form.isAvailable !== cat.isAvailable) patch.is_available = form.isAvailable;
        if (Object.keys(patch).length === 0) {
          setEditing({ open: false, cat: null });
          return;
        }
        await adminUpdateCategory(cat.id, patch);
      } else {
        await adminCreateCategory({
          name: form.name,
          sort_order: form.sortOrder,
          is_available: form.isAvailable,
        });
      }
      await reload();
      setEditing({ open: false, cat: null });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  const dishCountByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dishes) m.set(d.category, (m.get(d.category) ?? 0) + 1);
    return m;
  }, [dishes]);

  async function toggleAvailable(c: AdminCategory) {
    const next = !c.isAvailable;
    const ok = await confirm({
      title: next ? `Открыть «${c.name}»?` : `Скрыть «${c.name}»?`,
      message: next
        ? "Категория и все её блюда снова появятся в меню."
        : `Все блюда (${dishCountByName.get(c.name) ?? 0}) этой категории перестанут показываться клиентам.`,
      confirmText: next ? "Открыть" : "Скрыть",
      tone: next ? "primary" : "danger",
    });
    if (!ok) return;

    if (mockMode) {
      setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, isAvailable: next } : x)));
      recordAction({
        target: "category",
        targetId: String(c.id),
        targetLabel: c.name,
        verb: "update",
        changes: [{ field: "Доступна", from: c.isAvailable ? "да" : "нет", to: next ? "да" : "нет" }],
      });
      return;
    }

    setBusy(true);
    try {
      await adminUpdateCategory(c.id, { is_available: next });
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: AdminCategory) {
    const ok = await confirm({
      title: `Удалить «${c.name}»?`,
      message: `В категории ${dishCountByName.get(c.name) ?? 0} блюд. Действие необратимо.`,
      confirmText: "Удалить",
      tone: "danger",
    });
    if (!ok) return;

    if (mockMode) {
      setItems((prev) => prev.filter((x) => x.id !== c.id));
      recordAction({ target: "category", targetId: String(c.id), targetLabel: c.name, verb: "delete" });
      return;
    }

    setBusy(true);
    try {
      await adminDeleteCategory(c.id);
      await reload();
    } catch (e) {
      // На бэке: 409 category_has_dishes — категория с блюдами не удаляется.
      alert(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<AdminCategory>[] = [
    { key: "order", header: "#", cell: (c) => c.sortOrder, width: "60px" },
    { key: "name", header: "Название", cell: (c) => <span className="font-semibold">{c.name}</span> },
    {
      key: "count",
      header: "Блюд",
      width: "100px",
      align: "right",
      cell: (c) => (
        <span className="tabular-nums text-[var(--color-fg-muted)]">
          {dishCountByName.get(c.name) ?? 0}
        </span>
      ),
    },
    {
      key: "available",
      header: "Доступна",
      width: "120px",
      align: "center",
      cell: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void toggleAvailable(c);
          }}
          disabled={busy}
          className={`relative inline-flex h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
            c.isAvailable ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              c.isAvailable ? "translate-x-4" : "translate-x-0.5"
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
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
            }}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void remove(c);
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
        <AdminPageHeader title="Категории" subtitle="Загружаем…" />
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Категории"
        subtitle={`Всего: ${items.length}`}
        actions={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
          >
            <Plus size={14} /> Добавить категорию
          </button>
        }
      />
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[13px]">
          {loadError}
        </div>
      )}
      <DataTable rows={items} columns={columns} rowKey={(c) => String(c.id)} onRowClick={openEdit} />

      <Drawer
        open={editing.open}
        onClose={() => setEditing({ open: false, cat: null })}
        title={editing.cat ? `Категория · ${editing.cat.name}` : "Новая категория"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing({ open: false, cat: null })}
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
            >
              Отмена
            </button>
            <button
              onClick={() => void save()}
              disabled={!form.name.trim() || busy}
              className="px-4 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90 disabled:opacity-40"
            >
              Сохранить
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Название">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="Например, Десерты"
            />
          </FormField>
          <FormField label="Порядок отображения" hint="Меньше — выше в списке меню">
            <input
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className={inputClass}
            />
          </FormField>
          <label className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)]">
            <span className="text-[14px] font-semibold">Доступна клиентам</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                form.isAvailable ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  form.isAvailable ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </label>
        </div>
      </Drawer>
    </>
  );
}
