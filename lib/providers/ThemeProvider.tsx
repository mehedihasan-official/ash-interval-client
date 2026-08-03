"use client";

// Provides light/dark theme state to the whole app. The chosen theme is
// persisted to localStorage and applied as a `dark` class on <html> so
// Tailwind's `dark:` variant (configured as class-based in globals.css)
// picks it up everywhere. A tiny inline script in layout.tsx sets the
// class before React hydrates, so there's no flash of the wrong theme;
// this provider's initial state is read lazily from that same class so
// it starts in sync without an extra render.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    applyThemeClass(initialTheme);
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
