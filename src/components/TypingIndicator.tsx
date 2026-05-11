import { useEffect, useState } from "react";

const phrases = [
  "Думаю над запросом",
  "Сверяюсь с вашими ограничениями",
  "Подбираю варианты из меню",
  "Считаю калории и баланс",
  "Почти готово",
];

/*
 * TypingIndicator — три пульсирующие точки + меняющиеся фразы.
 * Используется пока ассистент "печатает" перед началом стриминга текста.
 */
export function TypingIndicator() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-[13px] text-[var(--color-fg-muted)] py-0.5">
      <span className="inline-flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </span>
      <span
        key={idx}
        className="font-medium animate-[typing-fade_1.4s_ease-in-out]"
      >
        {phrases[idx]}…
      </span>
      <style>{`
        @keyframes typing-fade {
          0% { opacity: 0; transform: translateY(2px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0.4; }
        }
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
