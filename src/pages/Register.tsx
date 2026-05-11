import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { AuthShell, Field, PrimaryButton } from "@/components/AuthShell";
import { useApp } from "@/state/store";
import { ApiError } from "@/api/client";

export default function Register() {
  const nav = useNavigate();
  const { register } = useApp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    letter: /[a-zA-Zа-яА-ЯёЁ]/.test(password),
  };
  const allChecksOk = Object.values(checks).every(Boolean);
  const canSubmit =
    firstName.trim() && lastName.trim() && email.trim() && phone.trim() && allChecksOk;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, firstName, lastName, phone);
      nav("/chat");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Аккаунт с таким email уже существует");
      } else {
        setError("Что-то пошло не так. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Регистрация"
      subtitle="Создайте аккаунт, чтобы сохранять заказы и предпочтения"
      footer={
        <p className="text-center text-[13px] text-[var(--color-fg-muted)]">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-[var(--color-brand)] font-semibold hover:underline">
            Войти
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label="Имя"
            placeholder="Алексей"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Field
            label="Фамилия"
            placeholder="Морозов"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Телефон"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="+7 999 123-45-67"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div>
          <label className="block">
            <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
              Пароль
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full pl-4 pr-11 py-3 rounded-2xl
                  bg-[var(--color-bg-elev)] border border-[var(--color-border)]
                  focus:border-[var(--color-brand)] outline-none
                  text-[15px] text-[var(--color-fg)]
                  placeholder:text-[var(--color-fg-subtle)]
                  transition-colors
                "
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                className="tap absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          {password.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 px-1">
              <Hint ok={checks.length}>от 8 символов</Hint>
              <Hint ok={checks.letter}>буква</Hint>
              <Hint ok={checks.digit}>цифра</Hint>
            </div>
          )}
        </div>

        <p className="text-[11.5px] text-[var(--color-fg-subtle)] leading-relaxed pt-1">
          Создавая аккаунт, вы соглашаетесь с условиями использования и политикой
          конфиденциальности.
        </p>

        {error && (
          <p className="text-[13px] text-[var(--color-danger)] text-center px-1">{error}</p>
        )}

        <PrimaryButton type="submit" disabled={!canSubmit || loading}>
          {loading ? "Создаём аккаунт…" : "Создать аккаунт"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}

function Hint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-[11.5px] " +
        (ok ? "text-[var(--color-success)]" : "text-[var(--color-fg-subtle)]")
      }
    >
      {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
