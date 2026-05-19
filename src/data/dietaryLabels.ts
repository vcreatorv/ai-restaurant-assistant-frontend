/**
 * Словари для аллергенов и диетических предпочтений.
 *
 * Коды (`code`) — это **единственное**, что отправляется на бэк и хранится в
 * users.allergens / users.dietary. Они синхронизированы с dishes.allergens
 * (CHECK constraint в БД, см. миграцию 000010_users_allergens_dietary_canonical).
 *
 * Лейблы (`label`) — только для UI: чипы профиля, ContextBar в чате,
 * список вариантов в ChipsEditorSheet.
 *
 * При добавлении нового кода нужно одновременно обновить:
 *   1. user.AllowedAllergens / AllowedDietary в бэке;
 *   2. CHECK constraint в БД (новая миграция);
 *   3. этот файл.
 */

import type { ChipOption } from "@/components/ChipsEditorSheet";

export const ALLERGEN_OPTIONS: ChipOption[] = [
  { code: "nuts", label: "Орехи" },
  { code: "peanuts", label: "Арахис" },
  { code: "dairy", label: "Молоко" },
  { code: "gluten", label: "Глютен" },
  { code: "eggs", label: "Яйца" },
  { code: "fish", label: "Рыба" },
  { code: "shellfish", label: "Морепродукты" },
  { code: "soy", label: "Соя" },
  { code: "sesame", label: "Кунжут" },
  { code: "mustard", label: "Горчица" },
  { code: "celery", label: "Сельдерей" },
];

export const DIETARY_OPTIONS: ChipOption[] = [
  { code: "vegetarian", label: "Вегетарианство" },
  { code: "vegan", label: "Веган" },
  { code: "halal", label: "Халяль" },
  { code: "kosher", label: "Кошер" },
  { code: "gluten_free", label: "Без глютена" },
  { code: "lactose_free", label: "Без лактозы" },
];

const ALLERGEN_LABEL_BY_CODE = new Map(ALLERGEN_OPTIONS.map((o) => [o.code, o.label]));
const DIETARY_LABEL_BY_CODE = new Map(DIETARY_OPTIONS.map((o) => [o.code, o.label]));

/** Отдаёт русский label для кода аллергена; на неизвестном коде возвращает сам код (graceful). */
export function allergenLabel(code: string): string {
  return ALLERGEN_LABEL_BY_CODE.get(code) ?? code;
}

/** Отдаёт русский label для кода диеты; на неизвестном коде возвращает сам код. */
export function dietaryLabel(code: string): string {
  return DIETARY_LABEL_BY_CODE.get(code) ?? code;
}
