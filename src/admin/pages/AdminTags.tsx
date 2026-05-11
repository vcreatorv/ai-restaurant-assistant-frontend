import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/state/store";
import {
  adminCreateTag,
  adminDeleteTag,
  adminListTags,
  adminUpdateTag,
} from "@/api/adminMenu";
import type { ApiTag } from "@/api/types";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { DataTable, type Column } from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { Drawer, FormField, inputClass } from "../components/Drawer";
import { recordAction } from "../data/auditMock";
import { mockTags, type AdminTag } from "../data/adminMock";

function fromApi(t: ApiTag): AdminTag {
  return { id: t.id, name: t.name, slug: t.slug, color: t.color };
}

const PRESET_COLORS = [
  "#f97316", "#dc2626", "#10b981", "#65a30d", "#0284c7",
  "#7c3aed", "#db2777", "#64748b", "#0d9488", "#ca8a04",
];

/*
 * Транслит и нормализация для slug.
 * Бэк требует ^[a-z0-9_-]+$, поэтому кириллицу транслитерируем в латиницу,
 * а всё остальное режем.
 */
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};
function slugify(input: string): string {
  const lower = input.toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    if (TRANSLIT[ch] !== undefined) out += TRANSLIT[ch];
    else out += ch;
  }
  return out
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_RE = /^[a-z0-9_-]+$/;

export default function AdminTags() {
  const { mockMode } = useApp();
  const confirm = useConfirm();
  const [items, setItems] = useState<AdminTag[]>(mockMode ? mockTags : []);
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; tag: AdminTag | null }>({
    open: false,
    tag: null,
  });
  // slugTouched — флаг «slug правился руками». Пока false, slug автогенерируется
  // из name при каждом изменении name. Как только пользователь сам тронул slug,
  // мы перестаём его перезаписывать.
  const [form, setForm] = useState({ name: "", slug: "", color: PRESET_COLORS[0] });
  const [slugTouched, setSlugTouched] = useState(false);

  async function reload() {
    if (mockMode) return;
    const r = await adminListTags();
    setItems(r.items.map(fromApi));
  }

  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    adminListTags()
      .then((r) => {
        if (!cancelled) setItems(r.items.map(fromApi));
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
    setForm({ name: "", slug: "", color: PRESET_COLORS[0] });
    setSlugTouched(false);
    setEditing({ open: true, tag: null });
  }
  function openEdit(t: AdminTag) {
    setForm({ name: t.name, slug: t.slug, color: t.color });
    setSlugTouched(true); // существующий slug не перезаписываем при правке name
    setEditing({ open: true, tag: t });
  }

  async function save() {
    const name = form.name.trim();
    const slug = form.slug.trim();
    if (!name) return;
    if (!SLUG_RE.test(slug)) {
      alert(
        "Идентификатор должен содержать только латинские буквы, цифры, дефис и подчёркивание (^[a-z0-9_-]+$).",
      );
      return;
    }

    if (mockMode) {
      if (editing.tag) {
        const tag = editing.tag;
        setItems((prev) =>
          prev.map((x) => (x.id === tag.id ? { ...x, name, color: form.color, slug } : x)),
        );
        const changes: { field: string; from?: string; to?: string }[] = [];
        if (name !== tag.name) changes.push({ field: "Название", from: tag.name, to: name });
        if (form.color !== tag.color) changes.push({ field: "Цвет", from: tag.color, to: form.color });
        recordAction({ target: "tag", targetId: String(tag.id), targetLabel: name, verb: "update", changes });
      } else {
        const newId = Math.max(0, ...items.map((p) => p.id)) + 1;
        setItems((prev) => [...prev, { id: newId, name, color: form.color, slug }]);
        recordAction({ target: "tag", targetId: String(newId), targetLabel: name, verb: "create" });
      }
      setEditing({ open: false, tag: null });
      return;
    }

    setBusy(true);
    try {
      if (editing.tag) {
        // Только реально изменённые поля — чтобы бэк-аудит не записывал лишний дифф.
        const tag = editing.tag;
        const patch: Parameters<typeof adminUpdateTag>[1] = {};
        if (name !== tag.name) patch.name = name;
        if (slug !== tag.slug) patch.slug = slug;
        if (form.color !== tag.color) patch.color = form.color;
        if (Object.keys(patch).length === 0) {
          setEditing({ open: false, tag: null });
          return;
        }
        await adminUpdateTag(tag.id, patch);
      } else {
        await adminCreateTag({ name, slug, color: form.color });
      }
      await reload();
      setEditing({ open: false, tag: null });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: AdminTag) {
    const ok = await confirm({
      title: `Удалить тег «${t.name}»?`,
      message: "Тег пропадёт у всех блюд, где он установлен.",
      confirmText: "Удалить",
      tone: "danger",
    });
    if (!ok) return;

    if (mockMode) {
      setItems((prev) => prev.filter((x) => x.id !== t.id));
      recordAction({ target: "tag", targetId: String(t.id), targetLabel: t.name, verb: "delete" });
      return;
    }

    setBusy(true);
    try {
      await adminDeleteTag(t.id);
      await reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Теги" subtitle="Загружаем…" />
        <div className="h-[40vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }


  const columns: Column<AdminTag>[] = [
    {
      key: "preview",
      header: "Превью",
      cell: (t) => (
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold text-white whitespace-nowrap"
          style={{ backgroundColor: t.color }}
        >
          {t.name}
        </span>
      ),
    },
    { key: "name", header: "Название", cell: (t) => <span className="font-semibold">{t.name}</span> },
    {
      key: "slug",
      header: "Идентификатор",
      cell: (t) => <code className="text-[12px] text-[var(--color-fg-muted)]">{t.slug}</code>,
    },
    {
      key: "color",
      header: "Цвет",
      width: "120px",
      cell: (t) => (
        <span className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded border border-[var(--color-border)]"
            style={{ backgroundColor: t.color }}
          />
          <code className="text-[12px] text-[var(--color-fg-muted)]">{t.color}</code>
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "100px",
      align: "right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEdit(t)}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => void remove(t)}
            disabled={busy}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-danger)] disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Теги"
        subtitle={`Всего: ${items.length}`}
        actions={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
          >
            <Plus size={14} /> Добавить тег
          </button>
        }
      />
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[13px]">
          {loadError}
        </div>
      )}
      <DataTable
        rows={items}
        columns={columns}
        rowKey={(t) => String(t.id)}
        onRowClick={openEdit}
      />

      <Drawer
        open={editing.open}
        onClose={() => setEditing({ open: false, tag: null })}
        title={editing.tag ? `Тег · ${editing.tag.name}` : "Новый тег"}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing({ open: false, tag: null })}
              className="px-4 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
            >
              Отмена
            </button>
            <button
              onClick={() => void save()}
              disabled={!form.name.trim() || !SLUG_RE.test(form.slug) || busy}
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
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  // Пока пользователь не редактировал slug руками, синхронизируем его с name.
                  slug: slugTouched ? f.slug : slugify(name),
                }));
              }}
              className={inputClass}
              placeholder="Например, Хит"
            />
          </FormField>
          <FormField
            label="Идентификатор (slug)"
            hint={
              SLUG_RE.test(form.slug) || form.slug === ""
                ? "Только латиница, цифры, дефис и подчёркивание. Используется в URL и как машинный код тега."
                : "❌ допустимы только латиница a–z, цифры 0–9, дефис «-» и подчёркивание «_»."
            }
          >
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              className={inputClass}
              placeholder="hit"
              spellCheck={false}
            />
          </FormField>
          <FormField label="Цвет">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  type="button"
                  aria-label={c}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    form.color === c
                      ? "ring-2 ring-offset-2 ring-offset-[var(--color-bg)] ring-[var(--color-fg)]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border border-[var(--color-border)]"
                title="Свой цвет"
              />
            </div>
          </FormField>
          <FormField label="Превью">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold text-white whitespace-nowrap"
              style={{ backgroundColor: form.color }}
            >
              {form.name || "Тег"}
            </span>
          </FormField>
        </div>
      </Drawer>
    </>
  );
}
