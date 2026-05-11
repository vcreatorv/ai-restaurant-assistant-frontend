import { NavLink } from "react-router-dom";
import { MessageCircle, UtensilsCrossed, ConciergeBell, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useApp } from "@/state/store";

export function BottomNav() {
  const { cartCount } = useApp();
  const tabs = [
    { to: "/chat", label: "Чат", icon: MessageCircle, badge: 0 },
    { to: "/menu", label: "Меню", icon: UtensilsCrossed, badge: 0 },
    { to: "/cart", label: "Корзина", icon: ConciergeBell, badge: cartCount },
    { to: "/profile", label: "Профиль", icon: User, badge: 0 },
  ];

  return (
    <nav
      className="
        flex-none border-t border-[var(--color-border)]
        bg-[var(--color-bg-elev)]
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "tap flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  isActive
                    ? "text-[var(--color-brand)]"
                    : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} className="transition-all" />
                    {badge ? (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--color-warm)] text-white text-[10px] leading-[16px] font-semibold text-center">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
