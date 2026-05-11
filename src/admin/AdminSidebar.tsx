import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  Tags,
  ClipboardList,
  BarChart3,
  PencilLine,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/state/store";

const links = [
  { to: "/admin", label: "Дашборд", icon: LayoutDashboard, end: true },
  { to: "/admin/menu", label: "Меню", icon: UtensilsCrossed },
  { to: "/admin/categories", label: "Категории", icon: FolderTree },
  { to: "/admin/tags", label: "Теги", icon: Tags },
  { to: "/admin/orders", label: "Заказы", icon: ClipboardList },
  { to: "/admin/prompts", label: "Промпты", icon: PencilLine },
  { to: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
];

function initials(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "•";
}

export function AdminSidebar() {
  const { profile } = useApp();
  const nav = useNavigate();

  function openClientView() {
    sessionStorage.setItem("admin-view", "1");
    window.dispatchEvent(new Event("admin-view-change"));
    nav("/menu");
  }

  return (
    <aside className="flex-none w-[240px] h-screen sticky top-0 border-r border-[var(--color-border)] bg-[var(--color-bg-elev)] flex flex-col">
      <div className="px-6 h-14 flex items-center gap-2 border-b border-[var(--color-border)]">
        <span className="text-[18px] font-semibold tracking-tight text-[var(--color-fg)] leading-none">
          Sapore
        </span>
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-fg-subtle)] leading-none">
          admin
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]",
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={openClientView}
        className="flex-none mx-3 mb-2 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[13px] font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-fg)]"
      >
        <Eye size={14} />
        Открыть как клиент
      </button>
      <NavLink
        to="/admin/profile"
        className={({ isActive }) =>
          cn(
            "flex-none flex items-center gap-3 px-3 py-3 mx-3 mb-3 rounded-lg transition-colors border",
            isActive
              ? "bg-[var(--color-brand-soft)] border-transparent"
              : "border-[var(--color-border)] hover:bg-[var(--color-bg)]",
          )
        }
      >
        <span className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-warm)] to-[var(--color-brand)] text-white flex items-center justify-center text-[13px] font-semibold">
          {initials(profile.firstName, profile.lastName)}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-[var(--color-fg)] truncate">
            {profile.firstName} {profile.lastName}
          </span>
          <span className="block text-[11px] uppercase tracking-wider text-[var(--color-fg-subtle)]">
            администратор
          </span>
        </span>
      </NavLink>
    </aside>
  );
}
