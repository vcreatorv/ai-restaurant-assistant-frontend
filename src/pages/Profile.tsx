import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Phone,
  Mail,
  ShieldAlert,
  Salad,
  ChevronRight,
  LogOut,
  ClipboardList,
  ChefHat,
  PackageCheck,
  Truck,
  CircleCheckBig,
  CircleX,
  Sun,
  Moon,
  Palette,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme, palettes as paletteOptions } from "@/lib/theme";
import { Header } from "@/components/Header";
import { EditFieldSheet } from "@/components/EditFieldSheet";
import { ChipsEditorSheet } from "@/components/ChipsEditorSheet";
import { Sheet } from "@/components/Sheet";
import type { OrderStatus } from "@/data/mock";
import { formatPrice } from "@/lib/format";
import { useApp } from "@/state/store";
import { cn } from "@/lib/cn";

const statusMap: Record<
  OrderStatus,
  { label: string; tone: "brand" | "warm" | "muted" | "danger" | "neutral"; icon: LucideIcon }
> = {
  accepted: { label: "Принят", tone: "neutral", icon: ClipboardList },
  cooking: { label: "Готовится", tone: "warm", icon: ChefHat },
  ready: { label: "Готов", tone: "brand", icon: PackageCheck },
  in_delivery: { label: "В пути", tone: "brand", icon: Truck },
  closed: { label: "Завершён", tone: "muted", icon: CircleCheckBig },
  cancelled: { label: "Отменён", tone: "danger", icon: CircleX },
};

import { ALLERGEN_OPTIONS, DIETARY_OPTIONS, allergenLabel, dietaryLabel } from "@/data/dietaryLabels";

type EditField = null | "firstName" | "lastName" | "phone";

export default function Profile() {
  const nav = useNavigate();
  const {
    profile,
    orders,
    updateProfile,
    addAllergen,
    removeAllergen,
    addDietary,
    removeDietary,
    savePreferences,
    logout,
    getDishById,
  } = useApp();
  const { mode, toggle: toggleMode, paletteKey, setPaletteKey, palette } = useTheme();
  const [edit, setEdit] = useState<EditField>(null);
  const [openAllergens, setOpenAllergens] = useState(false);
  const [openDietary, setOpenDietary] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  type StringField = "firstName" | "lastName" | "phone";
  const editConfig: Record<Exclude<EditField, null>, { title: string; type: "text" | "email" | "tel"; key: StringField }> = {
    firstName: { title: "Имя", type: "text", key: "firstName" },
    lastName: { title: "Фамилия", type: "text", key: "lastName" },
    phone: { title: "Телефон", type: "tel", key: "phone" },
  };

  return (
    <>
      <Header
        title="Профиль"
        subtitle={`${profile.firstName} ${profile.lastName}`}
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-5">
        {/* Avatar */}
        <section className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold shadow-[0_8px_22px_-6px_rgba(0,0,0,0.25)]"
            style={{ background: "linear-gradient(135deg, var(--color-warm), var(--color-brand))" }}
          >
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-semibold leading-tight text-[var(--color-fg)] tracking-tight">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="text-[12.5px] text-[var(--color-fg-muted)] mt-0.5 truncate tabular-nums">
              {profile.phone}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-bg-elev)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          <Row icon={<UserIcon size={16} />} label="Имя" value={profile.firstName} onClick={() => setEdit("firstName")} />
          <Row icon={<UserIcon size={16} />} label="Фамилия" value={profile.lastName} onClick={() => setEdit("lastName")} />
          <Row icon={<Mail size={16} />} label="Email" value={profile.email} />
          <Row icon={<Phone size={16} />} label="Телефон" value={profile.phone} onClick={() => setEdit("phone")} />
        </section>

        {/* Diet */}
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] px-1">
            Пищевые предпочтения
          </h2>
          <div className="rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-bg-elev)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            <button
              onClick={() => setOpenAllergens(true)}
              className="tap w-full p-4 text-left hover:bg-[var(--color-bg)]"
            >
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-fg-muted)] mb-2">
                <ShieldAlert size={14} className="text-[var(--color-danger)]" />
                Аллергены
                <ChevronRight size={12} className="ml-auto text-[var(--color-fg-subtle)]" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.allergens.length === 0 ? (
                  <span className="text-[12.5px] text-[var(--color-fg-subtle)]">Не указано</span>
                ) : (
                  profile.allergens.map((a) => <Chip key={a} tone="danger">{allergenLabel(a)}</Chip>)
                )}
              </div>
            </button>
            <button
              onClick={() => setOpenDietary(true)}
              className="tap w-full p-4 text-left hover:bg-[var(--color-bg)]"
            >
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-fg-muted)] mb-2">
                <Salad size={14} className="text-[var(--color-brand)]" />
                Ограничения
                <ChevronRight size={12} className="ml-auto text-[var(--color-fg-subtle)]" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.dietary.length === 0 ? (
                  <span className="text-[12.5px] text-[var(--color-fg-subtle)]">Не указано</span>
                ) : (
                  profile.dietary.map((d) => <Chip key={d} tone="brand">{dietaryLabel(d)}</Chip>)
                )}
              </div>
            </button>
          </div>
          <p className="text-[11.5px] text-[var(--color-fg-subtle)] px-1 leading-relaxed">
            Укажите ваши пищевые ограничения, и AI-ассистент учтёт их в рекомендациях.
          </p>
        </section>

        {/* Appearance */}
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] px-1">
            Оформление
          </h2>

          {/* Dark mode switch */}
          <div className="rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {mode === "dark" ? (
                  <Moon size={18} className="text-[var(--color-fg-muted)] shrink-0" />
                ) : (
                  <Sun size={18} className="text-[var(--color-warm)] shrink-0" />
                )}
                <div>
                  <div className="text-[14px] font-semibold text-[var(--color-fg)]">
                    Тёмная тема
                  </div>
                  <div className="text-[11.5px] text-[var(--color-fg-muted)]">
                    {mode === "dark" ? "Включена" : "Выключена"}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleMode}
                role="switch"
                aria-checked={mode === "dark"}
                aria-label="Тёмная тема"
                className={cn(
                  "tap relative w-12 h-7 rounded-full p-0.5 transition-colors duration-200",
                  mode === "dark" ? "bg-[var(--color-brand)]" : "bg-[var(--color-border-strong)]",
                )}
              >
                <span
                  className={cn(
                    "block w-6 h-6 rounded-full bg-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.25)]",
                    "transition-transform duration-200 ease-out",
                    mode === "dark" ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          {/* Palette picker */}
          <div className="rounded-[var(--radius-card)] bg-[var(--color-bg-elev)] border border-[var(--color-border)] p-4">
            <div className="flex items-center gap-3 mb-3">
              <Palette size={18} className="text-[var(--color-fg-muted)]" />
              <div className="text-[14px] font-semibold text-[var(--color-fg)]">
                Цветовая тема
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {paletteOptions.map((opt) => {
                const active = paletteKey === opt.key;
                const previewBg = mode === "dark" ? opt.preview.darkBg : opt.preview.lightBg;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setPaletteKey(opt.key)}
                    aria-label={opt.name}
                    className={cn(
                      "tap relative aspect-square rounded-2xl overflow-hidden transition-all",
                      // ring рисуется снаружи и не отъедает внутреннюю область — нет видимого
                      // зазора на скруглениях. border оставляем константным 1px.
                      "border border-[var(--color-border)]",
                      active
                        ? "ring-2 ring-[var(--color-brand)] ring-offset-2 ring-offset-[var(--color-bg-elev)]"
                        : "hover:border-[var(--color-border-strong)] active:scale-95",
                    )}
                  >
                    {/* фон */}
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: previewBg }}
                    />
                    {/* нижняя полоса = brand */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-2/5"
                      style={{ backgroundColor: opt.preview.brand }}
                    />
                    {/* warm-точка */}
                    <div
                      className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full"
                      style={{ backgroundColor: opt.preview.warm }}
                    />
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-brand)] flex items-center justify-center">
                        <Check size={10} strokeWidth={3} className="text-[var(--color-brand-fg)]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-center text-[var(--color-fg-subtle)] mt-3">
              {palette.name}
            </p>
          </div>
        </section>

        {/* Orders */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">
              Мои заказы
            </h2>
            <span className="text-[12px] text-[var(--color-fg-subtle)]">{orders.length}</span>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] p-6 text-center text-[13px] text-[var(--color-fg-subtle)]">
              Ещё не было заказов
            </div>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => {
                const meta = statusMap[o.status];
                const StatusIcon = meta.icon;
                const tone = meta.tone;
                return (
                  <li
                    key={o.id}
                    onClick={() => nav(`/orders/${o.id}`)}
                    role="button"
                    className="
                      tap rounded-[var(--radius-card)] bg-[var(--color-bg-elev)]
                      border border-[var(--color-border)] p-3.5
                      hover:border-[var(--color-brand)]
                      flex items-center gap-3
                    "
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        tone === "brand" && "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
                        tone === "warm" && "bg-[var(--color-warm-soft)] text-[var(--color-warm)]",
                        tone === "danger" &&
                          "bg-[oklch(95%_0.04_25)] dark:bg-[oklch(28%_0.06_25)] text-[var(--color-danger)]",
                        tone === "muted" && "bg-[var(--color-bg)] text-[var(--color-fg-subtle)]",
                        tone === "neutral" && "bg-[var(--color-bg)] text-[var(--color-fg-muted)]",
                      )}
                    >
                      <StatusIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 h-[18px] rounded-full text-[10.5px] font-semibold uppercase tracking-wider leading-none",
                            tone === "brand" && "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
                            tone === "warm" && "bg-[var(--color-warm-soft)] text-[var(--color-warm)]",
                            tone === "danger" && "bg-[oklch(95%_0.04_25)] text-[var(--color-danger)] dark:bg-[oklch(28%_0.06_25)]",
                            tone === "muted" && "bg-[var(--color-bg)] text-[var(--color-fg-subtle)]",
                            tone === "neutral" && "bg-[var(--color-bg)] text-[var(--color-fg-muted)]",
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11.5px] text-[var(--color-fg-subtle)]">{o.createdAt}</span>
                      </div>
                      <div className="text-[13px] text-[var(--color-fg-muted)] mt-1 truncate">
                        {o.itemsPreview.map((i) => getDishById(i.dishId)?.name).filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-semibold text-[var(--color-fg)] tabular-nums">
                        {formatPrice(o.totalMinor)}
                      </div>
                      <ChevronRight size={14} className="ml-auto text-[var(--color-fg-subtle)] mt-1" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <button
          onClick={() => setConfirmLogout(true)}
          className="
            w-full text-center text-[13px] font-medium
            text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]
            py-3 inline-flex items-center justify-center gap-2 tap
          "
        >
          <LogOut size={14} />
          Выйти из аккаунта
        </button>
      </div>

      {/* Edit field sheet */}
      {edit && (
        <EditFieldSheet
          open
          onClose={() => setEdit(null)}
          title={editConfig[edit].title}
          type={editConfig[edit].type}
          initialValue={profile[editConfig[edit].key]}
          onSave={(v) => updateProfile({ [editConfig[edit].key]: v })}
        />
      )}

      <ChipsEditorSheet
        open={openAllergens}
        onClose={() => {
          setOpenAllergens(false);
          savePreferences();
        }}
        title="Аллергены"
        tone="danger"
        values={profile.allergens}
        options={ALLERGEN_OPTIONS}
        onAdd={addAllergen}
        onRemove={removeAllergen}
      />

      <ChipsEditorSheet
        open={openDietary}
        onClose={() => {
          setOpenDietary(false);
          savePreferences();
        }}
        title="Ограничения"
        tone="brand"
        values={profile.dietary}
        options={DIETARY_OPTIONS}
        onAdd={addDietary}
        onRemove={removeDietary}
      />

      <Sheet open={confirmLogout} onClose={() => setConfirmLogout(false)} title="Выйти из аккаунта?">
        <div className="px-5 pt-2 pb-6 space-y-3">
          <p className="text-[14px] text-[var(--color-fg-muted)]">
            Корзина и история останутся в аккаунте. Вы сможете снова войти в любой момент.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirmLogout(false)}
              className="tap py-3 rounded-full bg-[var(--color-bg-elev)] border border-[var(--color-border)] font-semibold text-[14px] text-[var(--color-fg)]"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                setConfirmLogout(false);
                nav("/menu", { replace: true });
                void logout();
              }}
              className="tap py-3 rounded-full bg-[var(--color-danger)] text-white font-semibold text-[14px]"
            >
              Выйти
            </button>
          </div>
        </div>
      </Sheet>

    </>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="tap flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-[var(--color-bg)]"
    >
      <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-fg-muted)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-[var(--color-fg-subtle)] uppercase tracking-wider">{label}</div>
        <div className="text-[14px] text-[var(--color-fg)] truncate">{value}</div>
      </div>
      <ChevronRight size={14} className="text-[var(--color-fg-subtle)]" />
    </button>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone: "brand" | "danger" }) {
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-[12px] font-medium",
        tone === "brand" && "bg-[var(--color-brand-soft)] text-[var(--color-brand)]",
        tone === "danger" && "bg-[oklch(95%_0.04_25)] text-[var(--color-danger)] dark:bg-[oklch(28%_0.06_25)]",
      )}
    >
      {children}
    </span>
  );
}

