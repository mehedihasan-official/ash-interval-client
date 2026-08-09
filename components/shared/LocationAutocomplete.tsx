"use client";

// Generic suggestion input used across the app whenever a member picks
// a place from a curated list — car pickup/dropoff (airports) and
// cruise departure port both use it. Kept generic (any T, custom
// fetch/label functions) so future travel services can reuse it
// without needing to duplicate the popup UI or debouncing logic.
import { useEffect, useRef, useState } from "react";

interface LocationAutocompleteProps<T> {
  label: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  /** Called on every debounced keystroke; returns matching items. */
  onSearch: (query: string) => Promise<T[]>;
  /** Called when the user picks a suggestion; parent stores the final string. */
  onSelect: (displayValue: string, item: T) => void;
  /** Called on every keystroke (before select) so the parent can mirror the raw input. */
  onChange: (value: string) => void;
  /** Turns an item into the visible primary label ("MCO — Orlando"). */
  getPrimaryLabel: (item: T) => string;
  /** Optional secondary line ("John F. Kennedy International Airport"). */
  getSecondaryLabel?: (item: T) => string;
  /** Turns an item into the string stored back in the input. */
  getSelectedValue: (item: T) => string;
  /** Optional key function for React lists — falls back to primary label. */
  getKey?: (item: T) => string;
}

const DEBOUNCE_MS = 200;

const LocationAutocomplete = <T,>({
  label,
  placeholder = "Start typing...",
  value,
  disabled,
  onSearch,
  onSelect,
  onChange,
  getPrimaryLabel,
  getSecondaryLabel,
  getSelectedValue,
  getKey,
}: LocationAutocompleteProps<T>) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mirror external value changes (e.g. parent swaps pickup/dropoff).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced server search — waits DEBOUNCE_MS after the last keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const results = await onSearch(trimmed);
        if (!cancelled) setSuggestions(results);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // onSearch identity is expected to be stable enough — the parent
    // usually inlines it. Adding it to deps would fire an extra search
    // per parent render for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Click-outside closes the dropdown.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (item: T) => {
    const stored = getSelectedValue(item);
    setQuery(stored);
    onChange(stored);
    onSelect(stored, item);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onChange(next);
          setIsOpen(true);
        }}
        onFocus={() => query.trim().length > 0 && setIsOpen(true)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be] disabled:opacity-60"
        autoComplete="off"
      />

      {isOpen && !disabled && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching&hellip;
            </div>
          ) : (
            suggestions.map((item, index) => (
              <button
                key={getKey ? getKey(item) : `${getPrimaryLabel(item)}-${index}`}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="font-semibold text-gray-800 dark:text-white">
                  {getPrimaryLabel(item)}
                </div>
                {getSecondaryLabel && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {getSecondaryLabel(item)}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
