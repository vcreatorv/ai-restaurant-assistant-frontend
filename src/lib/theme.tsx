import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";
export type PaletteKey = "basil" | "mocha" | "slate" | "terracotta" | "tobacco";

/*
 * Палитры. Каждая определяет полный набор CSS-переменных для светлой и тёмной темы.
 * Значения подаются на document.documentElement.style.setProperty — это перекрывает
 * дефолтные @theme-токены из index.css. Цвета сдержанные, без пестроты.
 */
type PaletteVars = {
  bg: string;
  bgElev: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  border: string;
  borderStrong: string;
  brand: string;
  brandFg: string;
  brandSoft: string;
  warm: string;
  warmSoft: string;
  danger: string;
  success: string;
};

type PaletteDef = {
  key: PaletteKey;
  name: string;
  // preview-цвета для чипа
  preview: { lightBg: string; darkBg: string; brand: string; warm: string };
  light: PaletteVars;
  dark: PaletteVars;
};

export const palettes: PaletteDef[] = [
  {
    key: "basil",
    name: "Базилик",
    preview: {
      lightBg: "oklch(98.5% 0.012 75)",
      darkBg: "oklch(15% 0.012 80)",
      brand: "oklch(36% 0.06 155)",
      warm: "oklch(62% 0.13 50)",
    },
    light: {
      bg: "oklch(98.5% 0.012 75)",
      bgElev: "oklch(99.5% 0.005 80)",
      fg: "oklch(20% 0.02 80)",
      fgMuted: "oklch(48% 0.02 80)",
      fgSubtle: "oklch(65% 0.015 80)",
      border: "oklch(91% 0.01 80)",
      borderStrong: "oklch(82% 0.015 80)",
      brand: "oklch(36% 0.06 155)",
      brandFg: "oklch(98% 0.005 80)",
      brandSoft: "oklch(94% 0.02 155)",
      warm: "oklch(62% 0.13 50)",
      warmSoft: "oklch(95% 0.04 60)",
      danger: "oklch(58% 0.19 25)",
      success: "oklch(55% 0.13 155)",
    },
    dark: {
      bg: "oklch(15% 0.012 80)",
      bgElev: "oklch(20% 0.014 80)",
      fg: "oklch(96% 0.005 80)",
      fgMuted: "oklch(70% 0.012 80)",
      fgSubtle: "oklch(55% 0.012 80)",
      border: "oklch(28% 0.012 80)",
      borderStrong: "oklch(38% 0.014 80)",
      brand: "oklch(72% 0.12 155)",
      brandFg: "oklch(15% 0.012 80)",
      brandSoft: "oklch(28% 0.04 155)",
      warm: "oklch(72% 0.13 55)",
      warmSoft: "oklch(28% 0.05 55)",
      danger: "oklch(68% 0.19 25)",
      success: "oklch(70% 0.13 155)",
    },
  },
  {
    key: "mocha",
    name: "Мокка",
    preview: {
      lightBg: "oklch(97% 0.012 65)",
      darkBg: "oklch(16% 0.014 60)",
      brand: "oklch(48% 0.04 145)",
      warm: "oklch(60% 0.09 60)",
    },
    light: {
      bg: "oklch(97% 0.012 65)",
      bgElev: "oklch(99% 0.006 65)",
      fg: "oklch(22% 0.02 65)",
      fgMuted: "oklch(48% 0.018 65)",
      fgSubtle: "oklch(66% 0.014 65)",
      border: "oklch(90% 0.012 65)",
      borderStrong: "oklch(80% 0.014 65)",
      brand: "oklch(48% 0.04 145)",
      brandFg: "oklch(98% 0.005 65)",
      brandSoft: "oklch(93% 0.02 145)",
      warm: "oklch(60% 0.09 60)",
      warmSoft: "oklch(94% 0.03 60)",
      danger: "oklch(58% 0.19 25)",
      success: "oklch(55% 0.13 155)",
    },
    dark: {
      bg: "oklch(16% 0.014 60)",
      bgElev: "oklch(21% 0.016 60)",
      fg: "oklch(96% 0.006 65)",
      fgMuted: "oklch(70% 0.014 65)",
      fgSubtle: "oklch(55% 0.014 65)",
      border: "oklch(28% 0.014 60)",
      borderStrong: "oklch(38% 0.016 60)",
      brand: "oklch(74% 0.08 145)",
      brandFg: "oklch(16% 0.014 60)",
      brandSoft: "oklch(28% 0.04 145)",
      warm: "oklch(72% 0.10 60)",
      warmSoft: "oklch(28% 0.05 60)",
      danger: "oklch(68% 0.19 25)",
      success: "oklch(70% 0.13 155)",
    },
  },
  {
    key: "slate",
    name: "Графит",
    preview: {
      lightBg: "oklch(96% 0.005 240)",
      darkBg: "oklch(15% 0.008 240)",
      brand: "oklch(42% 0.04 240)",
      warm: "oklch(65% 0.12 65)",
    },
    light: {
      bg: "oklch(96% 0.005 240)",
      bgElev: "oklch(99% 0.003 240)",
      fg: "oklch(20% 0.012 240)",
      fgMuted: "oklch(46% 0.012 240)",
      fgSubtle: "oklch(64% 0.008 240)",
      border: "oklch(89% 0.006 240)",
      borderStrong: "oklch(80% 0.008 240)",
      brand: "oklch(42% 0.04 240)",
      brandFg: "oklch(98% 0.003 240)",
      brandSoft: "oklch(93% 0.018 240)",
      warm: "oklch(65% 0.12 65)",
      warmSoft: "oklch(94% 0.03 65)",
      danger: "oklch(58% 0.19 25)",
      success: "oklch(55% 0.13 155)",
    },
    dark: {
      bg: "oklch(15% 0.008 240)",
      bgElev: "oklch(20% 0.01 240)",
      fg: "oklch(96% 0.005 240)",
      fgMuted: "oklch(70% 0.012 240)",
      fgSubtle: "oklch(55% 0.012 240)",
      border: "oklch(28% 0.012 240)",
      borderStrong: "oklch(38% 0.014 240)",
      brand: "oklch(76% 0.08 240)",
      brandFg: "oklch(15% 0.008 240)",
      brandSoft: "oklch(28% 0.04 240)",
      warm: "oklch(74% 0.12 65)",
      warmSoft: "oklch(28% 0.06 65)",
      danger: "oklch(68% 0.19 25)",
      success: "oklch(70% 0.13 155)",
    },
  },
  {
    key: "tobacco",
    name: "Табак",
    preview: {
      lightBg: "oklch(97% 0.012 80)",
      darkBg: "oklch(15% 0.012 80)",
      brand: "oklch(38% 0.04 70)",
      warm: "oklch(60% 0.10 65)",
    },
    light: {
      bg: "oklch(97% 0.012 80)",
      bgElev: "oklch(99% 0.006 80)",
      fg: "oklch(22% 0.018 70)",
      fgMuted: "oklch(48% 0.016 70)",
      fgSubtle: "oklch(65% 0.012 70)",
      border: "oklch(90% 0.012 75)",
      borderStrong: "oklch(80% 0.014 70)",
      brand: "oklch(38% 0.04 70)",
      brandFg: "oklch(98% 0.006 80)",
      brandSoft: "oklch(92% 0.022 70)",
      warm: "oklch(60% 0.10 65)",
      warmSoft: "oklch(94% 0.04 70)",
      danger: "oklch(58% 0.19 25)",
      success: "oklch(55% 0.13 155)",
    },
    dark: {
      bg: "oklch(15% 0.012 80)",
      bgElev: "oklch(20% 0.014 75)",
      fg: "oklch(96% 0.008 75)",
      fgMuted: "oklch(70% 0.014 70)",
      fgSubtle: "oklch(55% 0.014 70)",
      border: "oklch(28% 0.014 75)",
      borderStrong: "oklch(38% 0.016 70)",
      brand: "oklch(78% 0.05 75)",
      brandFg: "oklch(15% 0.012 80)",
      brandSoft: "oklch(28% 0.04 70)",
      warm: "oklch(72% 0.10 65)",
      warmSoft: "oklch(28% 0.05 70)",
      danger: "oklch(68% 0.19 25)",
      success: "oklch(70% 0.13 155)",
    },
  },
  {
    key: "terracotta",
    name: "Терракот",
    preview: {
      lightBg: "oklch(96% 0.014 70)",
      darkBg: "oklch(16% 0.014 40)",
      brand: "oklch(50% 0.13 35)",
      warm: "oklch(72% 0.09 75)",
    },
    light: {
      bg: "oklch(96% 0.014 70)",
      bgElev: "oklch(99% 0.006 70)",
      fg: "oklch(22% 0.02 50)",
      fgMuted: "oklch(48% 0.02 50)",
      fgSubtle: "oklch(65% 0.016 50)",
      border: "oklch(89% 0.013 60)",
      borderStrong: "oklch(80% 0.016 60)",
      brand: "oklch(50% 0.13 35)",
      brandFg: "oklch(98% 0.006 70)",
      brandSoft: "oklch(93% 0.04 35)",
      warm: "oklch(72% 0.09 75)",
      warmSoft: "oklch(94% 0.04 75)",
      danger: "oklch(58% 0.19 25)",
      success: "oklch(55% 0.13 155)",
    },
    dark: {
      bg: "oklch(16% 0.014 40)",
      bgElev: "oklch(21% 0.016 40)",
      fg: "oklch(96% 0.008 70)",
      fgMuted: "oklch(72% 0.016 60)",
      fgSubtle: "oklch(56% 0.014 60)",
      border: "oklch(29% 0.016 40)",
      borderStrong: "oklch(40% 0.018 40)",
      brand: "oklch(70% 0.12 35)",
      brandFg: "oklch(16% 0.014 40)",
      brandSoft: "oklch(30% 0.06 35)",
      warm: "oklch(78% 0.10 75)",
      warmSoft: "oklch(30% 0.05 75)",
      danger: "oklch(68% 0.19 25)",
      success: "oklch(70% 0.13 155)",
    },
  },
];

type ThemeContext = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  paletteKey: PaletteKey;
  setPaletteKey: (p: PaletteKey) => void;
  palette: PaletteDef;
};

const Ctx = createContext<ThemeContext | null>(null);

const STORAGE_MODE = "theme-mode";
const STORAGE_PALETTE = "theme-palette";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_MODE) as ThemeMode | null;
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [paletteKey, setPaletteKey] = useState<PaletteKey>(() => {
    const saved = localStorage.getItem(STORAGE_PALETTE) as PaletteKey | null;
    if (saved && palettes.find((p) => p.key === saved)) return saved;
    return "basil";
  });

  const palette = palettes.find((p) => p.key === paletteKey) ?? palettes[0];

  // Применяем CSS-переменные на <html>. Перекрывает дефолтные @theme-токены.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    const vars = mode === "dark" ? palette.dark : palette.light;
    const map: Record<string, string> = {
      "--color-bg": vars.bg,
      "--color-bg-elev": vars.bgElev,
      "--color-fg": vars.fg,
      "--color-fg-muted": vars.fgMuted,
      "--color-fg-subtle": vars.fgSubtle,
      "--color-border": vars.border,
      "--color-border-strong": vars.borderStrong,
      "--color-brand": vars.brand,
      "--color-brand-fg": vars.brandFg,
      "--color-brand-soft": vars.brandSoft,
      "--color-warm": vars.warm,
      "--color-warm-soft": vars.warmSoft,
      "--color-danger": vars.danger,
      "--color-success": vars.success,
    };
    for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v);
    localStorage.setItem(STORAGE_MODE, mode);
    localStorage.setItem(STORAGE_PALETTE, paletteKey);
  }, [mode, paletteKey, palette]);

  return (
    <Ctx.Provider
      value={{
        mode,
        setMode,
        toggle: () => setMode((m) => (m === "light" ? "dark" : "light")),
        paletteKey,
        setPaletteKey,
        palette,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
