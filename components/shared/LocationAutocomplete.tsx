"use client";

// Pill-style location picker used across the app for anything the
// member selects from a curated list — car pickup/dropoff (airports),
// cruise departure port, cruise destination. Matches the search-bar
// pattern the mockups use: a rounded container with an icon on the
// left, the field label above the editable value, and a dropdown of
// suggestions with a "Showing available destinations" header.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

interface LocationAutocompleteProps<T> {
  label: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  /** Optional icon override — defaults to a map pin. */
  icon?: ReactNode;
  /** Optional header shown above the suggestion list. */
  suggestionsHeader?: string;
  /** Debounced fetch — called after the user pauses typing. */
  onSearch: (query: string) => Promise<T[]>;
  /** Full callback when a suggestion is chosen. */
  onSelect: (displayValue: string, item: T) => void;
  /** Raw keystroke callback (parent mirrors the input state). */
  onChange: (value: string) => void;
  /** Primary label for each suggestion row. */
  getPrimaryLabel: (item: T) => string;
  /** Optional secondary line under the primary label. */
  getSecondaryLabel?: (item: T) => string;
  /** What to store in the input when the row is chosen. */
  getSelectedValue: (item: T) => string;
  /** React key helper for suggestions — falls back to the label. */
  getKey?: (item: T) => string;
  /** When true, focusing the input immediately opens the dropdown and
   *  runs `onSearch("")` so the member can pick from the full list
   *  without typing first. Used for the cruise destination field. */
  openOnFocus?: boolean;
}

const DEBOUNCE_MS = 200;

// Function declaration (not `<T,>` arrow) because Next 16's SWC
// occasionally trips on generic arrow components inside .tsx.
function LocationAutocomplete<T>({
  label,
  placeholder = "Start typing...",
  value,
  disabled,
  icon,
  suggestionsHeader = "Showing available destinations",
  onSearch,
  onSelect,
  onChange,
  getPrimaryLabel,
  getSecondaryLabel,
  getSelectedValue,
  getKey,
  openOnFocus = false,
}: LocationAutocompleteProps<T>) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Keep the latest onSearch so focus-triggered refreshes always hit
  // the current data source without adding onSearch to effect deps.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Mirror external value changes (e.g. parent swaps pickup/dropoff).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced server search — waits DEBOUNCE_MS after the last keystroke
  // so we don't hit the API on every character. When `openOnFocus` is
  // set, an empty query still fires `onSearch("")` so the member sees
  // the full list the moment they focus the field.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0 && !openOnFocus) {
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
    // onSearch identity is expected to be stable enough — adding it to
    // deps would fire an extra search per parent render for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, openOnFocus]);

  // Click-outside closes the dropdown so it doesn't linger while the
  // member interacts with other form fields.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
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
    setIsFocused(false);
  };

  const containerBorder = isFocused
    ? "border-[#2563eb] ring-1 ring-[#2563eb]/20"
    : "border-gray-200 dark:border-white/10";

  return (
    <div className="relative" ref={containerRef}>
      {/* The pill: icon on the left, stacked label + editable value on
          the right. Clicking anywhere on the pill focuses the input. */}
      <div
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white dark:bg-[#16223d] transition ${containerBorder} ${
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-text"
        }`}
      >
        <span className="text-gray-500 dark:text-gray-400 shrink-0">
          {icon ?? <FaMapMarkerAlt className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
            {label}
          </div>
          <input
            ref={inputRef}
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
            onFocus={() => {
              setIsFocused(true);
              if (openOnFocus || query.trim().length > 0) setIsOpen(true);
              // On focus, refresh via the latest onSearch so the list
              // reflects data the parent may have loaded after mount.
              if (openOnFocus) {
                setIsLoading(true);
                Promise.resolve(onSearchRef.current(query.trim()))
                  .then((results) => setSuggestions(results))
                  .catch(() => setSuggestions([]))
                  .finally(() => setIsLoading(false));
              }
            }}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            autoComplete="off"
          />
        </div>
      </div>

      {isOpen && !disabled && (suggestions.length > 0 || isLoading || openOnFocus) && (
        <div className="absolute z-30 top-full left-0 right-0 mt-2 bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
            {suggestionsHeader}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {isLoading && suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Searching&hellip;
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No matches yet.
              </div>
            ) : (
              suggestions.map((item, index) => (
                <button
                  key={getKey ? getKey(item) : `${getPrimaryLabel(item)}-${index}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-white/5 flex items-start gap-3 border-b border-gray-50 dark:border-white/5 last:border-0"
                >
                  <FaMapMarkerAlt className="w-4 h-4 mt-0.5 text-[#2563eb] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {getPrimaryLabel(item)}
                    </div>
                    {getSecondaryLabel && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {getSecondaryLabel(item)}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;
