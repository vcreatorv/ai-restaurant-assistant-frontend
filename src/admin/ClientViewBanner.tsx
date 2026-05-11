import { useEffect, useState } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/state/store";
import { usePromptDraftTest } from "./promptDraftMode";

/*
 * Хелпер: показываем ли индикатор «admin client view» в мобильной обёртке.
 * Выставляется из AdminLayout при клике «Открыть как клиент».
 */
export function isClientViewActive(): boolean {
  return sessionStorage.getItem("admin-view") === "1";
}

export function useClientViewActive(): boolean {
  const [active, setActive] = useState(isClientViewActive);
  useEffect(() => {
    function onChange() {
      setActive(isClientViewActive());
    }
    window.addEventListener("storage", onChange);
    window.addEventListener("admin-view-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("admin-view-change", onChange);
    };
  }, []);
  return active;
}

/*
 * ClientViewBanner — кликабельная плашка сверху мобилки в режиме «вид клиента».
 * Чёткая надпись «Вернуться к админке» со стрелкой назад, чтобы было понятно,
 * что это кнопка, а не просто индикатор.
 */
export function ClientViewBanner() {
  const { isAdmin } = useApp();
  const active = useClientViewActive();
  const draftPrompt = usePromptDraftTest();
  const nav = useNavigate();
  if (!isAdmin || !active) return null;
  return (
    <div className="flex-none">
      {draftPrompt && (
        <div className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-warm)] text-white text-[11.5px] font-semibold tracking-wide">
          <FlaskConical size={12} />
          Чат использует ваш черновик промпта «{draftPrompt}»
        </div>
      )}
      <button
        onClick={() => {
          sessionStorage.removeItem("admin-view");
          window.dispatchEvent(new Event("admin-view-change"));
          // prompt-draft осознанно не сбрасываем: его уберёт «удалить черновик»
          // или «раскатить на всех» в /admin/prompts.
          nav("/admin");
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[var(--color-brand)] text-[var(--color-brand-fg)] text-[12.5px] font-semibold tracking-wide hover:opacity-90 transition-opacity"
      >
        <ArrowLeft size={14} />
        Вернуться к админке
      </button>
    </div>
  );
}

/*
 * Заглушка для обратной совместимости (Header.tsx импортирует).
 * Кнопка-шестерёнка убрана: возврат теперь сделан плашкой сверху.
 */
export function AdminClientViewToggle() {
  return null;
}
