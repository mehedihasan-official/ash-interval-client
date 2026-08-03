"use client";

// Dark/light mode toggle button. Rendered in two places by Header.tsx:
//   - Desktop: inline in the header's top row.
//   - Mobile: inside the slide-out menu, alongside the nav links.
// The `variant` prop controls sizing/labeling for each context.
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/lib/providers/ThemeProvider";

interface ThemeToggleProps {
  variant?: "desktop" | "mobile";
}

const ThemeToggle = ({ variant = "desktop" }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "mobile") {
    return (
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-between px-5 py-3.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/10 text-sm transition"
        aria-label="Toggle dark mode"
      >
        <span className="flex items-center gap-2.5">
          {isDark ? (
            <FiMoon className="text-[#1a6fa8] dark:text-[#7fb8e6]" />
          ) : (
            <FiSun className="text-[#1a6fa8] dark:text-[#7fb8e6]" />
          )}
          Dark Mode
        </span>
        {/* Simple switch indicator */}
        <span
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isDark ? "bg-[#1a6fa8]" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              isDark ? "translate-x-[18px]" : "translate-x-1"
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full border transition shrink-0 ${
        isDark
          ? "border-white/15 bg-slate-800/70 text-slate-100 hover:bg-slate-700/80"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
      }`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
