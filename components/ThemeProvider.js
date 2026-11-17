"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

const ThemeContext = createContext({
  theme: "light",
  toggle: () => {},
});

const THEME_KEY = "mh-theme";
const THEME_CHANGE_EVENT = "mh-theme-change";

function getThemeSnapshot() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToTheme(onChange) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  mediaQuery.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    mediaQuery.removeEventListener("change", onChange);
  };
}

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggle: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, nextTheme);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
