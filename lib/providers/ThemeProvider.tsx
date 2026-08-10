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

// Resolves the theme the user actually wants: their stored choice if
// present, else their OS preference, else light as a safe default.
// Called from a layout effect after mount so it only ever runs on the
// client — server always renders `light` for consistency, and the
// class flips to `dark` before the browser paints when needed.
const resolveClientTheme = (): Theme => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage can throw (Safari private mode, disabled cookies).
    // Falling through to the OS preference is the right default.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Always start in "light" so the server and client agree on the
  // initial render — no hydration mismatch. The layout effect below
  // immediately corrects it before the browser paints anything the
  // user can see.
  const [theme, setThemeState] = useState<Theme>("light");

  useIsomorphicLayoutEffect(() => {
    const resolved = resolveClientTheme();
    setThemeState(resolved);
    applyThemeClass(resolved);
    // Runs once on mount — later theme changes flow through setTheme.
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
