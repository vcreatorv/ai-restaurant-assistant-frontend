import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowUpFromLine, FlaskConical, History, MessageCircle, RotateCcw, Save, Trash2 } from "lucide-react";
import { AdminPageHeader } from "../components/AdminPageHeader";
import { useConfirm } from "../components/ConfirmDialog";
import {
  mockPrompts,
  PROMPT_LIMITS,
  validatePromptContent,
  type Prompt,
  type PromptName,
  type PromptVersion,
} from "../data/promptsMock";
import { setPromptDraftTest, usePromptDraftTest } from "../promptDraftMode";
import { recordAction } from "../data/auditMock";
import { useApp } from "@/state/store";
import {
  deletePromptDraft,
  getPrompt,
  listPrompts,
  publishPrompt,
  rollbackPrompt,
  upsertPromptDraft,
} from "@/api/prompts";
import type { ApiPromptDetails, ApiPromptName, ApiPromptVersion } from "@/api/types";
import { cn } from "@/lib/cn";

/*
 * Адаптер ApiPromptDetails → Prompt (фронтовый тип). Метаданные (label/description/
 * placeholder-списки) — статика на фронте, бэк хранит только content + версии.
 */
const META_BY_NAME = new Map(mockPrompts.map((p) => [p.name, p] as const));

function mapApiVersion(v: ApiPromptVersion): PromptVersion {
  return {
    version: v.version,
    content: v.content,
    publishedAt: v.published_at,
    publishedBy: `${v.published_by.display_name} · ${v.published_by.email}`,
  };
}

function mapApiDetails(d: ApiPromptDetails): Prompt {
  const meta = META_BY_NAME.get(d.name as PromptName);
  return {
    name: d.name as PromptName,
    label: meta?.label ?? d.name,
    description: meta?.description ?? "",
    requiredPlaceholders: meta?.requiredPlaceholders ?? [],
    optionalPlaceholders: meta?.optionalPlaceholders ?? [],
    current: mapApiVersion(d.current),
    history: d.history.map(mapApiVersion),
    draft: d.draft ? { content: d.draft.content, updatedAt: d.draft.updated_at } : null,
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPrompts() {
  const { mockMode } = useApp();
  const confirm = useConfirm();
  const nav = useNavigate();
  const draftTest = usePromptDraftTest();

  // Источник данных:
  //  - mockMode: локальные mockPrompts с in-memory мутациями
  //  - real:     загружаем все промпты из бэка одним fan-out на mount, потом
  //              перезагружаем затронутый промпт после save/publish/rollback.
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts);
  const [activeName, setActiveName] = useState<PromptName>("system");
  const [editor, setEditor] = useState<string>(mockPrompts[0].current.content);
  const [loading, setLoading] = useState(!mockMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Перезагрузить один промпт из бэка и обновить локальный кэш + editor
  async function refresh(name: PromptName) {
    const details = await getPrompt(name as ApiPromptName);
    const mapped = mapApiDetails(details);
    setPrompts((prev) => prev.map((p) => (p.name === name ? mapped : p)));
    if (name === activeName) {
      setEditor(mapped.draft?.content ?? mapped.current.content);
    }
    return mapped;
  }

  // На mount загрузить все промпты, если бэкенд доступен
  useEffect(() => {
    if (mockMode) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const list = await listPrompts();
        // У List нет history — догружаем подробности по каждому имени.
        const detailed = await Promise.all(
          list.items.map((p) => getPrompt(p.name).then(mapApiDetails)),
        );
        if (cancelled) return;
        if (detailed.length > 0) {
          setPrompts(detailed);
          // Если текущий activeName отсутствует в выдаче — переключаемся на первый.
          const has = detailed.some((p) => p.name === activeName);
          const first = has ? detailed.find((p) => p.name === activeName)! : detailed[0];
          if (!has) setActiveName(first.name);
          setEditor(first.draft?.content ?? first.current.content);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Не удалось загрузить промпты");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // activeName сознательно не в deps — при ручной смене не дёргаем общий list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockMode]);

  const active = prompts.find((p) => p.name === activeName) ?? prompts[0];

  // При смене активного промпта или появлении/удалении draft — синхронизируем editor
  function selectPrompt(name: PromptName) {
    const p = prompts.find((x) => x.name === name);
    if (!p) return;
    setActiveName(name);
    setEditor(p.draft?.content ?? p.current.content);
  }

  const validation = useMemo(() => validatePromptContent(editor, active), [editor, active]);
  const dirty = editor !== (active.draft?.content ?? active.current.content);
  const hasDraft = !!active.draft;

  function patchPrompt(name: PromptName, mut: (p: Prompt) => Prompt) {
    setPrompts((prev) => prev.map((p) => (p.name === name ? mut(p) : p)));
  }

  async function saveDraft() {
    if (!validation.ok) return;
    if (mockMode) {
      patchPrompt(active.name, (p) => ({
        ...p,
        draft: { content: editor, updatedAt: new Date().toISOString() },
      }));
      return;
    }
    setBusy(true);
    try {
      await upsertPromptDraft(active.name as ApiPromptName, editor);
      await refresh(active.name);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось сохранить черновик");
    } finally {
      setBusy(false);
    }
  }

  async function discardDraft() {
    const ok = await confirm({
      title: "Удалить черновик?",
      message: "Несохранённые изменения будут потеряны. Опубликованная версия не пострадает.",
      confirmText: "Удалить",
      tone: "danger",
    });
    if (!ok) return;
    if (mockMode) {
      patchPrompt(active.name, (p) => ({ ...p, draft: null }));
      setEditor(active.current.content);
      if (draftTest === active.name) setPromptDraftTest(null);
      return;
    }
    setBusy(true);
    try {
      await deletePromptDraft(active.name as ApiPromptName);
      await refresh(active.name);
      if (draftTest === active.name) setPromptDraftTest(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось удалить черновик");
    } finally {
      setBusy(false);
    }
  }

  async function testInChat() {
    if (dirty) await saveDraft();
    setPromptDraftTest(active.name);
    sessionStorage.setItem("admin-view", "1");
    window.dispatchEvent(new Event("admin-view-change"));
    nav("/chat");
  }

  async function publish() {
    if (!validation.ok) return;
    const ok = await confirm({
      title: `Раскатить «${active.label}» на всех?`,
      message:
        "Все клиенты сразу начнут получать ответы по этому промпту. Откатить можно через историю версий.",
      confirmText: "Раскатить",
      tone: "danger",
    });
    if (!ok) return;

    if (mockMode) {
      const newVersion: PromptVersion = {
        version: active.current.version + 1,
        content: editor,
        publishedAt: new Date().toISOString(),
        publishedBy: "Анна Админова · admin@demo.local",
      };
      patchPrompt(active.name, (p) => ({
        ...p,
        current: newVersion,
        history: [newVersion, ...p.history],
        draft: null,
      }));
      if (draftTest === active.name) setPromptDraftTest(null);
      recordAction({
        target: "prompt",
        targetId: active.name,
        targetLabel: active.label,
        verb: "publish",
        changes: [
          { field: "Версия", from: `v${active.current.version}`, to: `v${newVersion.version}` },
        ],
      });
      return;
    }

    setBusy(true);
    try {
      // Если редактор расходится с draft в БД — сначала сохраним.
      if (editor !== (active.draft?.content ?? "")) {
        await upsertPromptDraft(active.name as ApiPromptName, editor);
      }
      await publishPrompt(active.name as ApiPromptName);
      await refresh(active.name);
      if (draftTest === active.name) setPromptDraftTest(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось раскатить");
    } finally {
      setBusy(false);
    }
  }

  async function rollback(v: PromptVersion) {
    const ok = await confirm({
      title: `Откатить к версии v${v.version}?`,
      message: `Текущая v${active.current.version} перейдёт в историю. Активной станет v${v.version} от ${fmtDate(v.publishedAt)}.`,
      confirmText: "Откатить",
      tone: "danger",
    });
    if (!ok) return;

    if (mockMode) {
      const restored: PromptVersion = {
        ...v,
        version: active.current.version + 1,
        publishedAt: new Date().toISOString(),
        publishedBy: "Анна Админова · admin@demo.local",
      };
      patchPrompt(active.name, (p) => ({
        ...p,
        current: restored,
        history: [restored, ...p.history],
      }));
      setEditor(restored.content);
      recordAction({
        target: "prompt",
        targetId: active.name,
        targetLabel: active.label,
        verb: "rollback",
        changes: [
          { field: "Версия", from: `v${active.current.version}`, to: `v${restored.version}` },
        ],
      });
      return;
    }

    setBusy(true);
    try {
      await rollbackPrompt(active.name as ApiPromptName, v.version);
      await refresh(active.name);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Не удалось откатить");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <>
        <AdminPageHeader title="Промпты" subtitle="Загружаем…" />
        <div className="h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand)] border-t-transparent animate-spin" />
        </div>
      </>
    );
  }
  if (loadError) {
    return (
      <>
        <AdminPageHeader title="Промпты" subtitle="Не удалось загрузить" />
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-[14px] text-[var(--color-fg)]">
          <div className="font-semibold mb-1">Ошибка загрузки</div>
          <div className="text-[13px] text-[var(--color-fg-muted)]">{loadError}</div>
        </div>
      </>
    );
  }
  if (!active) {
    return (
      <>
        <AdminPageHeader title="Промпты" subtitle="Промпты не настроены" />
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 text-[13px] text-[var(--color-fg-muted)]">
          В БД нет ни одного промпта. Применили ли вы миграцию <code>000008_prompts_decomposition</code>?
        </div>
      </>
    );
  }
  return (
    <>
      <AdminPageHeader
        title="Промпты"
        subtitle="Что отдаём LLM. Меняйте на себе через «Тестировать в чате», публикуйте, когда уверены."
      />

      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Левая колонка — список промптов */}
        <aside className="space-y-1">
          {prompts.map((p) => (
            <button
              key={p.name}
              onClick={() => selectPrompt(p.name)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                p.name === activeName
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-elev)] hover:bg-[var(--color-bg)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-[var(--color-fg)]">
                  {p.label}
                </span>
                <span className="text-[11px] tabular-nums text-[var(--color-fg-subtle)]">
                  v{p.current.version}
                </span>
              </div>
              <div className="text-[11.5px] text-[var(--color-fg-subtle)] mt-0.5">
                {p.name}
              </div>
              {p.draft && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-[var(--color-warm-soft)] text-[var(--color-warm)]">
                  Есть черновик
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Правая — редактор */}
        <main className="space-y-3">
          {/* Правила */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <h3 className="text-[13px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-2">
              Правила изменения промпта
            </h3>
            <ul className="text-[13px] text-[var(--color-fg-muted)] space-y-1.5 list-disc pl-5">
              <li>
                Длина: от {PROMPT_LIMITS.min} до {PROMPT_LIMITS.max} символов.
              </li>
              <li>
                Все обязательные плейсхолдеры должны присутствовать (выделены красным, если нет).
              </li>
              <li>
                Сначала «Сохранить черновик» → «Тестировать в чате» (на себе) → «Раскатить на всех».
              </li>
              <li>
                Раскатка создаёт новую версию. Старые сохраняются — можно откатиться.
              </li>
              <li>
                Не удаляйте JSON-блок с <code>recommended_dish_ids</code> — фронтенд парсит его для карточек.
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--color-fg)]">{active.label}</h2>
                <p className="text-[12.5px] text-[var(--color-fg-muted)] mt-1 max-w-2xl">
                  {active.description}
                </p>
              </div>
              <div className="text-right text-[11.5px] text-[var(--color-fg-subtle)] shrink-0">
                <div>
                  Активная: <span className="text-[var(--color-fg)] font-semibold">v{active.current.version}</span>
                </div>
                <div>{fmtDate(active.current.publishedAt)}</div>
                <div className="mt-0.5">{active.current.publishedBy}</div>
              </div>
            </div>

            {draftTest === active.name && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--color-warm-soft)] text-[var(--color-warm)] text-[12.5px] font-semibold flex items-center gap-2">
                <FlaskConical size={14} />
                Сейчас ваш чат использует этот черновик. На клиентах — опубликованная v{active.current.version}.
              </div>
            )}

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden focus-within:border-[var(--color-brand)]">
              <textarea
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full px-4 py-3 bg-transparent outline-none resize-y font-mono text-[13px] leading-relaxed text-[var(--color-fg)]"
              />
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--color-border)] text-[11.5px] text-[var(--color-fg-subtle)]">
                <span>
                  Плейсхолдеры:{" "}
                  {active.requiredPlaceholders.length === 0 ? (
                    <span>не требуются</span>
                  ) : (
                    active.requiredPlaceholders.map((ph) => (
                      <code
                        key={ph}
                        className={`mx-0.5 px-1 py-0.5 rounded ${
                          editor.includes(ph)
                            ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        }`}
                      >
                        {ph}
                      </code>
                    ))
                  )}
                </span>
                <span className="tabular-nums">
                  {editor.length} / {PROMPT_LIMITS.max} символов
                </span>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <div className="mt-3 space-y-1">
                {validation.errors.map((e) => (
                  <div
                    key={e}
                    className="flex items-start gap-2 text-[12.5px] text-rose-700 dark:text-rose-300"
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {e}
                  </div>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {validation.warnings.map((w) => (
                  <div
                    key={w}
                    className="flex items-start gap-2 text-[12.5px] text-amber-700 dark:text-amber-300"
                  >
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
              {hasDraft && (
                <button
                  onClick={() => void discardDraft()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)]"
                >
                  <Trash2 size={14} />
                  Удалить черновик
                </button>
              )}
              <button
                onClick={() => void saveDraft()}
                disabled={!dirty || !validation.ok || busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-bg)] disabled:opacity-40"
              >
                <Save size={14} />
                Сохранить черновик
              </button>
              <button
                onClick={() => void testInChat()}
                disabled={!validation.ok || busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold border-2 border-[var(--color-warm)] text-[var(--color-warm)] hover:bg-[var(--color-warm-soft)] disabled:opacity-40"
              >
                <MessageCircle size={14} />
                Тестировать в чате
              </button>
              <button
                onClick={() => void publish()}
                disabled={!validation.ok || (!dirty && !hasDraft) || busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-brand)] text-[var(--color-brand-fg)] hover:opacity-90 disabled:opacity-40"
              >
                <ArrowUpFromLine size={14} />
                Раскатить на всех
              </button>
            </div>
          </div>

          {/* История версий */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <h3 className="text-[13px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)] mb-2 flex items-center gap-2">
              <History size={14} />
              История версий
            </h3>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider font-semibold text-[var(--color-fg-subtle)]">
                  <th className="py-2">Версия</th>
                  <th>Опубликована</th>
                  <th>Кем</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {active.history.map((v) => (
                  <tr key={v.version}>
                    <td className="py-2.5 font-semibold tabular-nums">
                      v{v.version}
                      {v.version === active.current.version && (
                        <span className="ml-2 text-[10.5px] uppercase tracking-wider text-[var(--color-brand)] font-semibold">
                          активная
                        </span>
                      )}
                    </td>
                    <td className="text-[var(--color-fg-muted)]">{fmtDate(v.publishedAt)}</td>
                    <td className="text-[var(--color-fg-muted)] text-[12px]">{v.publishedBy}</td>
                    <td className="text-right">
                      {v.version !== active.current.version && (
                        <button
                          onClick={() => void rollback(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
                        >
                          <RotateCcw size={12} />
                          Откатить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
