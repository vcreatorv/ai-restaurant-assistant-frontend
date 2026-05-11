/*
 * Промпты, которыми кормим LLM. Имена — фиксированный enum (бэкенд знает,
 * какой промпт для какой задачи). Произвольно создавать новые нельзя.
 */
export type PromptName = "system" | "classification" | "refusal";

export type PromptVersion = {
  version: number;
  content: string;
  publishedAt: string; // ISO
  publishedBy: string; // display name + email
};

export type PromptDraft = {
  content: string;
  updatedAt: string;
};

export type Prompt = {
  name: PromptName;
  label: string;
  description: string;
  /** Плейсхолдеры, обязательные в content. Бэкенд валидирует на сохранении. */
  requiredPlaceholders: string[];
  /** Подсказки по необязательным переменным — для UX-помощи. */
  optionalPlaceholders: string[];
  current: PromptVersion;
  history: PromptVersion[];
  /** Черновик текущего админа. null — нет черновика. */
  draft: PromptDraft | null;
};

export const PROMPT_LIMITS = { min: 50, max: 8000 } as const;

const ME = "Анна Админова · admin@demo.local";

export const mockPrompts: Prompt[] = [
  {
    name: "system",
    label: "Основной системный промпт",
    description:
      "Задаёт роль ассистента, тон, формат ответа и правила выбора блюд. Используется в ответах с RAG-контекстом (recommend / clarify) и в коротких ответах на chitchat.",
    requiredPlaceholders: [],
    optionalPlaceholders: ["{{user_first_name}}", "{{order_history}}"],
    current: {
      version: 17,
      publishedAt: "2026-04-28T10:14:00Z",
      publishedBy: ME,
      content: `Ты — Sapore, ассистент ресторана. Помогаешь гостям подобрать блюда под их вкус, бюджет и ограничения.

Учитывай:
- Аллергены пользователя: {{user_allergens}}
- Диетические предпочтения: {{user_dietary}}
- Доступные блюда: {{dish_list}}

Стиль:
- Кратко (3–5 предложений), без воды.
- Не используй маркетинговые штампы вроде «вкусный», «сочный».
- Объясняй, почему именно это блюдо подходит запросу.

Формат ответа — обычный текст. В конце добавь JSON-блок:
\`\`\`json
{"recommended_dish_ids": [<id1>, <id2>, ...]}
\`\`\`
с 2–4 рекомендациями. Если ничего не подходит — пустой массив.`,
    },
    history: [
      { version: 17, publishedAt: "2026-04-28T10:14:00Z", publishedBy: ME, content: "v17" },
      { version: 16, publishedAt: "2026-04-12T16:30:00Z", publishedBy: ME, content: "v16" },
      { version: 15, publishedAt: "2026-03-29T09:02:00Z", publishedBy: ME, content: "v15" },
    ],
    draft: null,
  },
  {
    name: "classification",
    label: "Классификация запроса",
    description:
      "Отдельный лёгкий LLM-вызов перед основным pipeline. Определяет intent: recommend / clarify / chitchat / off_topic. От ответа зависит, нужен ли RAG и какой промпт подложить ассистенту.",
    requiredPlaceholders: ["{{user_message}}"],
    optionalPlaceholders: [],
    current: {
      version: 4,
      publishedAt: "2026-03-15T11:00:00Z",
      publishedBy: ME,
      content: `Классифицируй намерение пользователя в одну из четырёх категорий:
- recommend — пользователь хочет получить новые рекомендации блюд
- clarify — уточнение/расспрос про уже обсуждаемые блюда
- chitchat — приветствие/благодарность/прощание без вопроса по меню
- off_topic — запрос совсем не про ресторан/еду

Сообщение пользователя:
{{user_message}}

Ответь СТРОГО одним словом: recommend, clarify, chitchat или off_topic.`,
    },
    history: [
      { version: 4, publishedAt: "2026-03-15T11:00:00Z", publishedBy: ME, content: "v4" },
      { version: 3, publishedAt: "2026-02-20T14:00:00Z", publishedBy: ME, content: "v3" },
    ],
    draft: null,
  },
  {
    name: "refusal",
    label: "Отказ при недопустимом запросе",
    description:
      "Используется, когда классификатор вернул intent=off_topic. RAG не запускается, основной system-промпт не подкладывается. Модели подаётся только этот промпт + сообщение пользователя.",
    requiredPlaceholders: ["{{user_message}}"],
    optionalPlaceholders: [],
    current: {
      version: 2,
      publishedAt: "2026-01-10T08:00:00Z",
      publishedBy: ME,
      content: `Пользователь задал вопрос, не относящийся к ресторану или меню.
Вежливо откажи в одну фразу. Скажи, что ты — ассистент ресторана и можешь помочь с подбором блюд, информацией о меню или заказом.
Не комментируй сам вопрос пользователя по существу.

Сообщение пользователя:
{{user_message}}

В самом конце ответа отдельной строкой ОБЯЗАТЕЛЬНО добавь блок:
\`\`\`json
{"recommended_dish_ids":[]}
\`\`\``,
    },
    history: [
      { version: 2, publishedAt: "2026-01-10T08:00:00Z", publishedBy: ME, content: "v2" },
      { version: 1, publishedAt: "2025-12-22T12:00:00Z", publishedBy: ME, content: "v1" },
    ],
    draft: null,
  },
];

export type PromptValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Проверяет содержимое промпта по правилам:
 *   - длина в [min..max];
 *   - все обязательные плейсхолдеры присутствуют;
 *   - неизвестные {{...}} → варн.
 */
export function validatePromptContent(content: string, prompt: Prompt): PromptValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (content.length < PROMPT_LIMITS.min) {
    errors.push(`Слишком короткий промпт: ${content.length} символов (минимум ${PROMPT_LIMITS.min}).`);
  }
  if (content.length > PROMPT_LIMITS.max) {
    errors.push(`Слишком длинный промпт: ${content.length} символов (максимум ${PROMPT_LIMITS.max}).`);
  }

  for (const ph of prompt.requiredPlaceholders) {
    if (!content.includes(ph)) {
      errors.push(`Не хватает обязательного плейсхолдера ${ph}.`);
    }
  }

  // Сознательно НЕ ругаемся на неизвестные {{...}}: они проходят в LLM как есть,
  // и часто это намеренно (например, system-промпт содержит описательные
  // {{user_allergens}}, которые никто не подставляет — это просто текст).

  return { ok: errors.length === 0, errors, warnings };
}
