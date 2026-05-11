import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import { useApp } from "@/state/store";
import { formatPrice } from "@/lib/format";
import { DishImage } from "@/components/DishImage";
import { listCategories, listDishes } from "@/api/menu";
import type { ApiCategory, ApiDish } from "@/api/types";
import {
  adminCreateDish,
  adminDeleteDish,
  adminUpdateDish,
} from "@/api/adminMenu";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { DataTable, type Column } from "../components/DataTable";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmDialog";
import { DishDrawer, type DishFormData } from "../components/DishDrawer";
import { recordAction } from "../data/auditMock";
import { mockCategories, type AdminCategory } from "../data/adminMock";
import type { Dish } from "@/data/mock";

/*
 * Управление меню. Источник данных — общий стор (мок-блюда).
 * Toggle стоп-листа — локально, без сохранения; CRUD — заглушки с alert.
 */
export default function AdminMenu() {
  const { dishes: storeDishes, mockMode, refreshMenu } = useApp();
  const confirm = useConfirm();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [available, setAvailable] = useState<"yes" | "no" | "">("");
  const [busy, setBusy] = useState(false);
  // Локальные мутации только в mockMode (в реальном режиме всё уходит на бэк → refreshMenu).
  const [localStop, setLocalStop] = useState<Record<number, boolean>>({});
  const [patches, setPatches] = useState<Record<number, Partial<Dish>>>({});
  const [additions, setAdditions] = useState<Dish[]>([]);
  const [deletes, setDeletes] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<{ open: boolean; dish: Dish | null }>({
    open: false,
    dish: null,
  });
  // Категории грузим с бэка для фильтра + DishDrawer (там используется тот же mockCategories,
  // но для корректного category_id в API нужны реальные id из БД).
  const [categories, setCategories] = useState<AdminCategory[]>(mockCategories);

  // Полный список блюд для админки (доступные + стоп-лист).
  // Backend семантика: available=true — только активные, available=false — только в стопе,
  // не передан — дефолт active. Получить «всё» одним запросом нельзя, поэтому делаем
  // два параллельных запроса и склеиваем (это OK, заказов мало, до 200+200 строк).
  const [apiDishes, setApiDishes] = useState<Dish[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Адаптер ApiDish → Dish (мок-структура с category по имени, fallback emoji/bg).
  function adaptDish(d: ApiDish, catMap: Map<number, string>): Dish {
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      composition: d.composition,
      priceMinor: d.price_minor,
      category: catMap.get(d.category_id) ?? "Прочее",
      cuisine: d.cuisine,
      caloriesKcal: d.calories_kcal ?? 0,
      portionWeightG: d.portion_weight_g ?? 0,
      proteinG: d.protein_g ?? 0,
      fatG: d.fat_g ?? 0,
      carbsG: d.carbs_g ?? 0,
      isAvailable: d.is_available,
      tags: d.tags.map((t) => t.name),
      emoji: storeDishes[0]?.emoji ?? "🍽️",
      bgFrom: storeDishes[0]?.bgFrom ?? "#fde68a",
      bgTo: storeDishes[0]?.bgTo ?? "#f97316",
      image_url: d.image_url || undefined,
    };
  }

  async function loadAll() {
    if (mockMode) return;
    setLoadError(null);
    const [catR, activeR, stopR] = await Promise.all([
      listCategories(),
      listDishes({ available: true, limit: 200 }),
      listDishes({ available: false, limit: 200 }),
    ]);
    const catMap = new Map<number, string>(catR.items.map((c: ApiCategory) => [c.id, c.name]));
    setCategories(
      catR.items.map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sort_order,
        isAvailable: c.is_available,
      })),
    );
    const merged = [...activeR.items, ...stopR.items]
      .map((d) => adaptDish(d, catMap))
      .sort((a, b) => a.id - b.id);
    setApiDishes(merged);
  }

  useEffect(() => {
    if (mockMode) return;
    loadAll().catch((e) =>
      setLoadError(e instanceof Error ? e.message : "Не удалось загрузить меню"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  // Источник списка:
  //   real-режим — apiDishes (включает стоп-лист)
  //   mockMode  — storeDishes + локальные мутации
  const dishes = useMemo(() => {
    if (!mockMode) return apiDishes ?? [];
    const all = [...storeDishes, ...additions];
    return all
      .filter((d) => !deletes.has(d.id))
      .map((d) => (patches[d.id] ? { ...d, ...patches[d.id] } : d));
  }, [mockMode, apiDishes, storeDishes, additions, deletes, patches]);

  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (categoryId !== "") {
        const cat = categories.find((c) => c.id === categoryId);
        if (cat && d.category !== cat.name) return false;
      }
      const isAv = localStop[d.id] !== undefined ? localStop[d.id] : d.isAvailable;
      if (available === "yes" && !isAv) return false;
      if (available === "no" && isAv) return false;
      return true;
    });
  }, [dishes, q, categoryId, available, localStop, categories]);

  async function toggleStop(d: Dish) {
    const cur = localStop[d.id] !== undefined ? localStop[d.id] : d.isAvailable;
    const ok = await confirm({
      title: cur ? `Снять «${d.name}» с продажи?` : `Вернуть «${d.name}» в меню?`,
      message: cur
        ? "Блюдо перестанет показываться клиентам в меню."
        : "Блюдо снова появится в клиентском меню.",
      confirmText: cur ? "В стоп" : "Вернуть",
      tone: cur ? "danger" : "primary",
    });
    if (!ok) return;

    if (mockMode) {
      setLocalStop((m) => ({ ...m, [d.id]: !cur }));
      recordAction({
        target: "dish",
        targetId: String(d.id),
        targetLabel: d.name,
        verb: "update",
        changes: [{ field: "Доступно", from: cur ? "да" : "нет", to: !cur ? "да" : "нет" }],
      });
      return;
    }

    setBusy(true);
    try {
      await adminUpdateDish(d.id, { is_available: !cur });
      await loadAll();
      void refreshMenu().catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось обновить");
    } finally {
      setBusy(false);
    }
  }

  async function removeDish(d: Dish) {
    const ok = await confirm({
      title: `Удалить «${d.name}»?`,
      message: "Действие необратимо.",
      confirmText: "Удалить",
      tone: "danger",
    });
    if (!ok) return;

    if (mockMode) {
      setDeletes((prev) => new Set(prev).add(d.id));
      recordAction({ target: "dish", targetId: String(d.id), targetLabel: d.name, verb: "delete" });
      return;
    }

    setBusy(true);
    try {
      await adminDeleteDish(d.id);
      await loadAll();
      void refreshMenu().catch(() => {});
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить");
    } finally {
      setBusy(false);
    }
  }

  function categoryIdByName(name: string): number | null {
    const c = categories.find((x) => x.name === name);
    return c ? c.id : null;
  }

  async function applyForm(d: Dish | null, form: DishFormData) {
    const payload: Partial<Dish> = {
      name: form.name.trim(),
      category: form.category,
      description: form.description,
      composition: form.composition,
      priceMinor: form.priceRub * 100,
      caloriesKcal: form.caloriesKcal,
      proteinG: form.proteinG,
      fatG: form.fatG,
      carbsG: form.carbsG,
      portionWeightG: form.portionWeightG,
      tags: form.tags,
      image_url: form.imageUrl || undefined,
      isAvailable: form.isAvailable,
    };

    if (!mockMode) {
      // Реальный режим: API.
      const catID = categoryIdByName(form.category);
      if (!catID) {
        alert("Не нашёл category_id — обновите категории на странице «Категории»");
        return;
      }
      setBusy(true);
      try {
        if (d) {
          // PATCH — отправляем ТОЛЬКО реально изменённые поля.
          // Иначе бэк-аудит запишет change для каждого поля, которое было в payload,
          // даже если значение не поменялось.
          const patch: Parameters<typeof adminUpdateDish>[1] = {};
          const trimmedName = form.name.trim();
          if (trimmedName !== d.name) patch.name = trimmedName;
          if (catID !== categoryIdByName(d.category)) patch.category_id = catID;
          if (form.description !== d.description) patch.description = form.description;
          if (form.composition !== d.composition) patch.composition = form.composition;
          if (form.priceRub * 100 !== d.priceMinor) patch.price_minor = form.priceRub * 100;
          if (form.caloriesKcal !== d.caloriesKcal) patch.calories_kcal = form.caloriesKcal;
          if (form.proteinG !== d.proteinG) patch.protein_g = form.proteinG;
          if (form.fatG !== d.fatG) patch.fat_g = form.fatG;
          if (form.carbsG !== d.carbsG) patch.carbs_g = form.carbsG;
          if (form.portionWeightG !== d.portionWeightG)
            patch.portion_weight_g = form.portionWeightG;
          const newImg = form.imageUrl || undefined;
          if (newImg !== d.image_url) patch.image_url = newImg;
          if (form.isAvailable !== d.isAvailable) patch.is_available = form.isAvailable;

          if (Object.keys(patch).length === 0) {
            // Ничего не поменялось — закрываем без вызова API (и без записи в аудит).
            setEditing({ open: false, dish: null });
            return;
          }
          await adminUpdateDish(d.id, patch);
        } else {
          await adminCreateDish({
            name: form.name.trim(),
            category_id: catID,
            cuisine: storeDishes[0]?.cuisine || "european",
            price_minor: form.priceRub * 100,
            description: form.description,
            composition: form.composition,
            calories_kcal: form.caloriesKcal,
            protein_g: form.proteinG,
            fat_g: form.fatG,
            carbs_g: form.carbsG,
            portion_weight_g: form.portionWeightG,
            image_url: form.imageUrl || undefined,
            is_available: form.isAvailable,
          });
        }
        await loadAll();
      void refreshMenu().catch(() => {});
      } catch (e) {
        alert(e instanceof Error ? e.message : "Не удалось сохранить");
      } finally {
        setBusy(false);
      }
      return;
    }

    // mockMode: in-memory мутации + recordAction.
    if (d) {
      setPatches((prev) => ({ ...prev, [d.id]: { ...prev[d.id], ...payload } }));
      const changes: { field: string; from?: string; to?: string }[] = [];
      if (form.name !== d.name) changes.push({ field: "Название", from: d.name, to: form.name });
      if (form.priceRub * 100 !== d.priceMinor)
        changes.push({ field: "Цена", from: `${d.priceMinor / 100} ₽`, to: `${form.priceRub} ₽` });
      if (form.category !== d.category)
        changes.push({ field: "Категория", from: d.category, to: form.category });
      if (form.isAvailable !== d.isAvailable)
        changes.push({ field: "Доступно", from: d.isAvailable ? "да" : "нет", to: form.isAvailable ? "да" : "нет" });
      recordAction({ target: "dish", targetId: String(d.id), targetLabel: form.name, verb: "update", changes });
    } else {
      const allIds = [...storeDishes, ...additions].map((x) => x.id);
      const newId = (Math.max(0, ...allIds) || 0) + 1;
      const fallback = storeDishes[0];
      setAdditions((prev) => [
        ...prev,
        {
          id: newId,
          ...payload,
          name: payload.name ?? "",
          category: payload.category ?? "",
          description: payload.description ?? "",
          composition: payload.composition ?? "",
          priceMinor: payload.priceMinor ?? 0,
          cuisine: fallback?.cuisine ?? "",
          caloriesKcal: payload.caloriesKcal ?? 0,
          portionWeightG: payload.portionWeightG ?? 0,
          proteinG: payload.proteinG ?? 0,
          fatG: payload.fatG ?? 0,
          carbsG: payload.carbsG ?? 0,
          isAvailable: payload.isAvailable ?? true,
          tags: payload.tags ?? [],
          emoji: fallback?.emoji ?? "🍽️",
          bgFrom: fallback?.bgFrom ?? "#fde68a",
          bgTo: fallback?.bgTo ?? "#f97316",
        } as Dish,
      ]);
      recordAction({
        target: "dish",
        targetId: String(newId),
        targetLabel: form.name,
        verb: "create",
      });
    }
  }

  const columns: Column<Dish>[] = [
    {
      key: "image",
      header: "",
      width: "64px",
      cell: (d) => (
        <DishImage dish={d} className="w-12 h-12 rounded-lg" size="sm" hideUnavailableOverlay />
      ),
    },
    {
      key: "name",
      header: "Блюдо",
      cell: (d) => (
        <div>
          <div className="font-semibold text-[var(--color-fg)]">{d.name}</div>
          <div className="text-[12px] text-[var(--color-fg-subtle)] line-clamp-1">
            {d.description}
          </div>
        </div>
      ),
    },
    { key: "category", header: "Категория", cell: (d) => d.category, width: "140px" },
    {
      key: "price",
      header: "Цена",
      cell: (d) => <span className="tabular-nums">{formatPrice(d.priceMinor)}</span>,
      width: "100px",
      align: "right",
    },
    {
      key: "kcal",
      header: "Ккал",
      cell: (d) => <span className="tabular-nums">{d.caloriesKcal}</span>,
      width: "80px",
      align: "right",
    },
    {
      key: "available",
      header: "Доступно",
      width: "100px",
      align: "center",
      cell: (d) => {
        const cur = localStop[d.id] !== undefined ? localStop[d.id] : d.isAvailable;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStop(d);
            }}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
              cur ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]"
            }`}
            aria-label={cur ? "В меню" : "В стопе"}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                cur ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      align: "right",
      cell: (d) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ open: true, dish: d });
            }}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
            aria-label="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              void removeDish(d);
            }}
            className="tap p-1.5 rounded-md text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg)] hover:text-[var(--color-danger)]"
            aria-label="Удалить"
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
        title="Меню"
        subtitle={`${filtered.length} из ${dishes.length} блюд`}
        actions={
          <button
            onClick={() => setEditing({ open: true, dish: null })}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90"
          >
            <Plus size={14} /> Добавить блюдо
          </button>
        }
      />

      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-elev)] border border-[var(--color-border)] focus-within:border-[var(--color-brand)] flex-1 max-w-md">
          <Search size={14} className="text-[var(--color-fg-subtle)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию"
            className="flex-1 bg-transparent outline-none text-[13.5px]"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Очистить поиск"
              className="tap shrink-0 w-5 h-5 rounded-full bg-[var(--color-fg-subtle)] flex items-center justify-center hover:bg-[var(--color-fg-muted)]"
            >
              <X size={11} strokeWidth={2.5} className="text-[var(--color-bg)]" />
            </button>
          )}
        </label>
        <Select
          className="w-48"
          value={categoryId}
          onChange={(v) => setCategoryId(v === "" ? "" : Number(v))}
          placeholder="Все категории"
          clearable
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
        <Select
          className="w-40"
          value={available}
          onChange={(v) => setAvailable((v === "" ? "" : v) as "yes" | "no" | "")}
          placeholder="Все"
          clearable
          options={[
            { value: "yes", label: "В меню" },
            { value: "no", label: "В стопе" },
          ]}
        />
      </div>

      <DataTable
        rows={filtered}
        columns={columns}
        rowKey={(d) => String(d.id)}
        onRowClick={(d) => setEditing({ open: true, dish: d })}
      />

      <DishDrawer
        open={editing.open}
        dish={editing.dish}
        onClose={() => setEditing({ open: false, dish: null })}
        onSave={(form) => void applyForm(editing.dish, form)}
        categories={categories}
      />
    </>
  );
}
