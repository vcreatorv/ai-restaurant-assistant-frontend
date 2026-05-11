import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useApp } from "@/state/store";
import { useConfirm } from "./components/ConfirmDialog";
import { AdminSidebar } from "./AdminSidebar";

/*
 * AdminLayout — desktop-обёртка админки.
 * Без MobileFrame: занимает весь viewport, sidebar 240px слева,
 * контент с собственным скроллом.
 */
export function AdminLayout() {
  const nav = useNavigate();
  const { logout } = useApp();
  const confirm = useConfirm();

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-bg)]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex-none h-14 px-6 flex items-center justify-end gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elev)]">
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Выйти из аккаунта?",
                message: "Вы вернётесь на страницу входа.",
                confirmText: "Выйти",
                tone: "danger",
              });
              if (!ok) return;
              await logout();
              nav("/login");
            }}
            className="tap inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg)]"
            aria-label="Выйти"
          >
            <LogOut size={14} />
            Выйти
          </button>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
