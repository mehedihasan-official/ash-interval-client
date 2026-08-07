"use client";

// The airport autocomplete used by the flight search form. Debounces
// keystrokes into a call against GET /api/airports so the huge
// ~800-airport dataset never has to ship to the client; the server
// returns just the handful of best matches for what the member typed.
import { searchAirports } from "@/lib/api/flights";
import type { Airport } from "@/lib/types/flight";
import { useEffect, useRef, useState } from "react";

interface AirportAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (code: string, airport?: Airport) => void;
}

const AirportAutocomplete = ({
  label,
  placeholder = "Airport code or city",
  value,
  onChange,
}: AirportAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keep the visible input in sync when the parent swaps values (for
  // example when the user hits the swap button on the search form).
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced server-backed search — waits 200ms after the user stops
  // typing so we don't hit the API on every single keystroke.
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
        const airports = await searchAirports(trimmed, 8);
        if (!cancelled) setSuggestions(airports);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  // Click-outside handler — closes the dropdown so it doesn't linger
  // when the member scrolls or interacts with other form fields.
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

  const handleSelect = (airport: Airport) => {
    setQuery(airport.code);
    onChange(airport.code, airport);
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
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onChange(next.toUpperCase());
          setIsOpen(true);
        }}
        onFocus={() => query.trim().length > 0 && setIsOpen(true)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be]"
        autoComplete="off"
      />

      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Searching airports&hellip;
            </div>
          ) : (
            suggestions.map((airport) => (
              <button
                type="button"
                key={airport.code}
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0"
              >
                <div className="font-semibold text-gray-800 dark:text-white">
                  {airport.code} &mdash; {airport.city}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {airport.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
