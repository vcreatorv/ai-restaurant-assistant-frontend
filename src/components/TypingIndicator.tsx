/*
 * TypingIndicator — три пульсирующие точки + статичная фраза «Думаю над запросом».
 * Используется пока ассистент «печатает» перед началом стриминга текста.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[var(--color-fg-muted)] py-0.5">
      <span className="inline-flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </span>
      <span className="font-medium">Думаю над запросом…</span>
      <style>{`
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="block w-1.5 h-1.5 rounded-full bg-[var(--color-brand)]"
      style={{ animation: `dot-bounce 1.1s ${delay}ms infinite` }}
    />
  );
}
