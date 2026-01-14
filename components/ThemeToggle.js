"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg shadow-slate-200/60 backdrop-blur hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          theme === "dark" ? "bg-emerald-400" : "bg-amber-400"
        }`}
      />
      {theme === "dark" ? "Dark" : "Light"} mode
    </button>
  );
}
