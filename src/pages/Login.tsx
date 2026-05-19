import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell, Field, PrimaryButton } from "@/components/AuthShell";
import { useApp } from "@/state/store";
import { ApiError } from "@/api/client";

export default function Login() {
  const nav = useNavigate();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Если это админ — отправляем сразу в админку
      const isAdminEmail = email.trim().toLowerCase().includes("admin");
      nav(isAdminEmail ? "/admin" : "/chat");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Неверный email или пароль");
      } else {
        setError("Что-то пошло не так. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы продолжить подбор блюд"
      footer={
        <>
          <p className="text-center text-[13px] text-[var(--color-fg-muted)] mt-6">
            Нет аккаунта?{" "}
            <Link
              to="/register"
              className="text-[var(--color-brand)] font-semibold hover:underline"
            >
              Зарегистрироваться
            </Link>
          </p>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <label className="block">
            <span className="block text-[11.5px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)] mb-1.5">
              Пароль
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
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
        </div>

        {error && (
          <p className="text-[13px] text-[var(--color-danger)] text-center px-1">{error}</p>
        )}

        <PrimaryButton type="submit" disabled={!email.trim() || !password || loading}>
          {loading ? "Входим…" : "Войти"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}

