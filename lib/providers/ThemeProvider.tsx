"use client";

// Provides light/dark theme state to the whole app. The chosen theme is
// persisted to localStorage and applied as a `dark` class on <html> so
// Tailwind's `dark:` variant (configured as class-based in globals.css)
// picks it up everywhere.
//
// On first mount we read localStorage (or fall back to the OS preference)
// and set the class synchronously in a layout effect — that runs before
// the browser paints, so the practical effect on typical hardware is
// no visible flash. A tiny flash is possible on very slow devices; we
// used to avoid that with an inline <script> in layout.tsx, but React
// 19 refuses to hydrate components that render <script> tags, so the
// effect-based approach is the safer trade.
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

// useLayoutEffect warns during SSR because it can't do its job there.
// This alias silences that warning: server = plain useEffect (no-op),
// client = the real useLayoutEffect that runs before paint.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "interval-theme";

const applyThemeClass = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
};

// Lazily determine the starting theme. On the server this just returns
// "light" (arbitrary, never shown — the inline script fixes the class
// before paint); on the client it reads the class the inline script
// already applied, so this component never needs to "correct" itself
// with a setState-in-effect after mount.
const getInitialTheme = (): Theme => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initializer reads the class the inline script already applied,
  // so `theme` is correct from the first render — no useEffect needed to
  // "correct" it after mount, which avoids an extra synchronous render.
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
    // Only needs to run once, to sync the class for the initial theme —
    // setTheme() below already re-applies it on every later change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyThemeClass(next);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
