"use client";

// Cruises entry point. Layout matches the Platinum Club cruise search
// mockup: a "Going to" destination autocomplete (drawn from the
// distinct set of destinations we've seeded), an optional "Departing
// from" port autocomplete, a departure date window, and a duration
// dropdown. Guest count + cabin type get set on the results page so
// this widget stays minimal.
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { fetchCruiseMeta, searchCruisePorts } from "@/lib/api/cruises";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { CruiseMeta } from "@/lib/types/cruise";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaRegCalendarAlt, FaShip } from "react-icons/fa";

// Duration buckets a member typically thinks in — matches how the
// major cruise-line search widgets segment inventory. Each option maps
// to a min/max night range the results page can filter on.
const DURATION_OPTIONS = [
  { value: "any", label: "Any duration", min: 0, max: 999 },
  { value: "short", label: "2–5 nights", min: 2, max: 5 },
  { value: "week", label: "6–8 nights", min: 6, max: 8 },
  { value: "long", label: "9–14 nights", min: 9, max: 14 },
  { value: "extended", label: "15+ nights", min: 15, max: 999 },
] as const;

type DurationValue = (typeof DURATION_OPTIONS)[number]["value"];

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const CruisesSearchPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [meta, setMeta] = useState<CruiseMeta>({
    categories: [],
    departurePorts: [],
    cruiseLines: [],
  });
  const [destination, setDestination] = useState("");
  const [departurePort, setDeparturePort] = useState("");
  const [departureStart, setDepartureStart] = useState("");
  const [departureEnd, setDepartureEnd] = useState("");
  const [duration, setDuration] = useState<DurationValue>("week");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Categories = destinations. Loaded once, filtered client-side by
  // whatever the traveler types — the list is small (~10 items) so a
  // dedicated server search isn't worth the round trip.
  useEffect(() => {
    let cancelled = false;
    fetchCruiseMeta()
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => {
        /* meta is optional — dropdown just stays empty if this fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Wraps the meta categories in a promise so it can plug into
  // LocationAutocomplete's async search contract without needing a
  // second, category-specific server endpoint.
  const searchDestinations = useMemo(() => {
    return async (query: string) => {
      const trimmed = query.trim().toLowerCase();
      const source = meta.categories;
      const matches = trimmed
        ? source.filter((entry) => entry.toLowerCase().includes(trimmed))
        : source;
      return matches.slice(0, 15).map((entry) => ({ destination: entry }));
    };
  }, [meta.categories]);

  const handleSearch = () => {
    setErrorMessage(null);
    if (!destination.trim()) {
      setErrorMessage("Please pick a destination from the list.");
      return;
    }
    if (departureStart && departureEnd && new Date(departureEnd) < new Date(departureStart)) {
      setErrorMessage("Departure window end must be after the start date.");
      return;
    }

    const params = new URLSearchParams({
      category: destination.trim(),
      duration,
    });
    if (departurePort.trim()) params.set("departurePort", departurePort.trim());
    if (departureStart) params.set("departureStart", departureStart);
    if (departureEnd) params.set("departureEnd", departureEnd);

    router.push(`/cruises/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-[#18294B] dark:bg-[#101b30] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <FaShip className="w-6 h-6" /> Book Your Cruise
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Book hotels, flights, cruises, and experiences while maximizing
            the value of your vacation ownership.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-[#16223d] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            For expert cruise advice.
          </p>

          <LocationAutocomplete
            label="Going to"
            placeholder="Choose destination"
            value={destination}
            onChange={setDestination}
            onSearch={searchDestinations}
            onSelect={(value) => setDestination(value)}
            getPrimaryLabel={(item) => item.destination}
            getSelectedValue={(item) => item.destination}
            getKey={(item) => item.destination}
            suggestionsHeader="Showing available destinations"
          />

          <LocationAutocomplete
            label="Departing from (optional)"
            placeholder="Any port city"
            value={departurePort}
            onChange={setDeparturePort}
            onSearch={(query) => searchCruisePorts(query, 10)}
            onSelect={(value) => setDeparturePort(value)}
            getPrimaryLabel={(item) => item.port}
            getSelectedValue={(item) => item.port}
            getKey={(item) => item.port}
            suggestionsHeader="Showing available ports"
          />

          {/* "Departing between" — an inline start/end date window. Kept
              collapsed as a labeled pill so the layout stays compact on
              mobile, expanding to two date inputs side by side. */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <FaRegCalendarAlt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="text-sm font-bold text-gray-800 dark:text-white">
                Departing between
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={departureStart}
                min={todayIsoDate()}
                onChange={(event) => setDepartureStart(event.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none border-b border-gray-200 dark:border-white/10 pb-1"
                aria-label="Departure window start"
              />
              <input
                type="date"
                value={departureEnd}
                min={departureStart || todayIsoDate()}
                onChange={(event) => setDepartureEnd(event.target.value)}
                className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none border-b border-gray-200 dark:border-white/10 pb-1"
                aria-label="Departure window end"
              />
            </div>
            {!departureStart && !departureEnd && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select date window
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <FaShip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <div className="text-sm font-bold text-gray-800 dark:text-white">
                Duration
              </div>
            </div>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value as DurationValue)}
              className="w-full bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSearch}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 rounded-full text-base transition"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default CruisesSearchPage;
