"use client";

// Cruise results page. Reads the search from the URL, asks the server
// for cruises pre-priced for this party + cabin, then lets the member
// filter and sort client-side.
import { searchCruises } from "@/lib/api/cruises";
import { saveCruiseDraft } from "@/lib/cruiseDraft";
import type { CabinKey, Cruise, CruiseSearchResult } from "@/lib/types/cruise";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaMapMarkerAlt, FaShip, FaStar } from "react-icons/fa";

// Maps the new search page's duration buckets to the min/max night
// range this page filters cruises by. Kept in sync with the DURATION
// dropdown in app/cruises/page.tsx.
const DURATION_RANGES: Record<string, { min: number; max: number }> = {
  any: { min: 0, max: 999 },
  short: { min: 2, max: 5 },
  week: { min: 6, max: 8 },
  long: { min: 9, max: 14 },
  extended: { min: 15, max: 999 },
};

interface ParsedSearch {
  category: string;
  departurePort: string;
  cabinType: CabinKey;
  adults: number;
  children: number;
  infants: number;
  duration: string;
  departureStart: string;
  departureEnd: string;
}

function parseSearch(params: URLSearchParams): ParsedSearch {
  const cabinRaw = (params.get("cabinType") || "inside").toLowerCase();
  const cabinType: CabinKey = (
    ["inside", "outside", "balcony", "suite"] as const
  ).includes(cabinRaw as CabinKey)
    ? (cabinRaw as CabinKey)
    : "inside";
  const parseInt10 = (value: string | null, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };
  const durationRaw = params.get("duration") ?? "any";
  return {
    category: params.get("category") ?? "",
    departurePort: params.get("departurePort") ?? "",
    cabinType,
    adults: Math.max(1, parseInt10(params.get("adults"), 2)),
    children: parseInt10(params.get("children"), 0),
    infants: parseInt10(params.get("infants"), 0),
    duration: DURATION_RANGES[durationRaw] ? durationRaw : "any",
    departureStart: params.get("departureStart") ?? "",
    departureEnd: params.get("departureEnd") ?? "",
  };
}

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const CruiseResultsInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = useMemo(
    () => parseSearch(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [result, setResult] = useState<CruiseSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [durationFilter, setDurationFilter] = useState<"all" | "short" | "medium" | "long">(
    "all",
  );
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"cheapest" | "shortest" | "longest" | "rating">(
    "cheapest",
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await searchCruises({
          category: search.category || undefined,
          departurePort: search.departurePort || undefined,
          cabinType: search.cabinType,
          adults: search.adults,
          children: search.children,
          infants: search.infants,
        });
        if (!cancelled) setResult(data);
      } catch (error) {
        if (!cancelled)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load cruises right now.",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    search.category,
    search.departurePort,
    search.cabinType,
    search.adults,
    search.children,
    search.infants,
  ]);

  const cruises = result?.cruises ?? [];
  const cruiseLines = useMemo(() => {
    const set = new Set<string>();
    for (const cruise of cruises) set.add(cruise.cruiseLine);
    return Array.from(set).sort();
  }, [cruises]);

  const filteredCruises = useMemo(() => {
    const durationRange = DURATION_RANGES[search.duration] ?? DURATION_RANGES.any;
    const startMs = search.departureStart ? new Date(search.departureStart).getTime() : null;
    const endMs = search.departureEnd ? new Date(search.departureEnd).getTime() : null;

    let list = cruises.filter((cruise) => {
      // URL-level duration bucket first, then any per-page fine-tune.
      if (cruise.duration < durationRange.min || cruise.duration > durationRange.max)
        return false;
      if (durationFilter === "short" && cruise.duration > 5) return false;
      if (durationFilter === "medium" && (cruise.duration < 6 || cruise.duration > 9))
        return false;
      if (durationFilter === "long" && cruise.duration < 10) return false;
      if (selectedLine !== "all" && cruise.cruiseLine !== selectedLine) return false;

      // Departure window: cruise must have at least one seeded departure
      // date inside [start, end]. Missing bounds are treated as open.
      if (startMs !== null || endMs !== null) {
        const hasMatchingDate = cruise.departureDates?.some((iso) => {
          const ms = new Date(iso).getTime();
          if (Number.isNaN(ms)) return false;
          if (startMs !== null && ms < startMs) return false;
          if (endMs !== null && ms > endMs) return false;
          return true;
        });
        if (!hasMatchingDate) return false;
      }
      return true;
    });
    if (sortBy === "cheapest") {
      list = [...list].sort(
        (a, b) => a.pricing.discountedTotal - b.pricing.discountedTotal,
      );
    } else if (sortBy === "shortest") {
      list = [...list].sort((a, b) => a.duration - b.duration);
    } else if (sortBy === "longest") {
      list = [...list].sort((a, b) => b.duration - a.duration);
    } else if (sortBy === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [
    cruises,
    durationFilter,
    selectedLine,
    sortBy,
    search.duration,
    search.departureStart,
    search.departureEnd,
  ]);

  const handleSelect = (cruise: Cruise) => {
    // Default to the first future departure date the cruise offers. If
    // for some reason the seed data has no dates, we fall back to blank
    // and let the detail page prompt the user to pick.
    const defaultDeparture = cruise.departureDates[0] ?? "";
    saveCruiseDraft({
      cruise,
      cabinType: search.cabinType,
      departureDate: defaultDeparture,
      adults: search.adults,
      children: search.children,
      infants: search.infants,
    });
    router.push("/cruises/detail");
  };

  const totalGuests = search.adults + search.children + search.infants;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Cruises {search.category ? `in ${search.category}` : "worldwide"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {totalGuests} guest{totalGuests !== 1 ? "s" : ""} &bull;{" "}
            {search.cabinType.charAt(0).toUpperCase() + search.cabinType.slice(1)} cabin
            {search.departurePort && ` • from ${search.departurePort}`}
          </p>
          <p className="text-sm text-[#0077be] dark:text-[#7fb8e6] mt-2 font-medium">
            {isLoading
              ? "Loading cruises..."
              : `${filteredCruises.length} of ${cruises.length} cruises match your filters`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside>
            <div className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6 lg:sticky lg:top-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Duration
                </p>
                <select
                  value={durationFilter}
                  onChange={(event) =>
                    setDurationFilter(event.target.value as typeof durationFilter)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                >
                  <option value="all">Any</option>
                  <option value="short">Short (up to 5 nights)</option>
                  <option value="medium">Medium (6-9 nights)</option>
                  <option value="long">Long (10+ nights)</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Cruise Line
                </p>
                <select
                  value={selectedLine}
                  onChange={(event) => setSelectedLine(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                >
                  <option value="all">All Lines</option>
                  {cruiseLines.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-2 mb-6">
              {(
                [
                  ["cheapest", "Cheapest"],
                  ["shortest", "Shortest"],
                  ["longest", "Longest"],
                  ["rating", "Highest Rated"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSortBy(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    sortBy === value
                      ? "bg-[#0077be] text-white"
                      : "bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#0077be]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {errorMessage ? (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-6 text-sm">
                {errorMessage}
              </div>
            ) : isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-56 bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10"
                  />
                ))}
              </div>
            ) : filteredCruises.length === 0 ? (
              <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-10 text-center text-gray-600 dark:text-gray-300">
                No cruises match the current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCruises.map((cruise) => (
                  <CruiseCard
                    key={cruise._id}
                    cruise={cruise}
                    onSelect={() => handleSelect(cruise)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CruiseCardProps {
  cruise: Cruise;
  onSelect: () => void;
}

const CruiseCard = ({ cruise, onSelect }: CruiseCardProps) => (
  <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-md transition">
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
      <div className="relative h-48 md:h-full bg-gray-100 dark:bg-white/5">
        {cruise.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cruise.image}
            alt={cruise.name}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaShip className="w-16 h-16 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <div>
          <p className="text-xs uppercase font-semibold text-[#0077be] dark:text-[#7fb8e6]">
            {cruise.category} &bull; {cruise.duration} night
            {cruise.duration !== 1 ? "s" : ""}
          </p>
          <p className="font-bold text-gray-800 dark:text-white text-lg mt-1">
            {cruise.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {cruise.cruiseLine}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
            <FaMapMarkerAlt /> {cruise.route}
          </p>
          <p className="text-xs text-amber-500 flex items-center gap-1 mt-2">
            <FaStar />{" "}
            <span className="text-gray-800 dark:text-white font-semibold">
              {cruise.rating.toFixed(1)}
            </span>{" "}
            <span className="text-gray-500 dark:text-gray-400">
              ({cruise.reviews.toLocaleString()} reviews)
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {cruise.shipFeatures.slice(0, 3).join(" • ")}
          </p>
        </div>

        <div className="sm:border-l sm:pl-6 border-gray-200 dark:border-white/10 text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
            {formatMoney(cruise.pricing.subtotal)}
          </p>
          <p className="text-2xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
            {formatMoney(cruise.pricing.discountedTotal)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
            30% member savings on cabin
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Includes taxes & gratuities
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            or {cruise.pricing.totalPoints.toLocaleString()} pts
          </p>
          <button
            type="button"
            onClick={onSelect}
            className="mt-3 w-full sm:w-auto bg-[#0077be] hover:bg-[#005a8e] text-white text-sm font-bold py-2 px-6 rounded-lg transition"
          >
            View Cabins
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CruiseResultsPage = () => (
  <Suspense fallback={<div className="p-8 text-gray-500">Loading cruises...</div>}>
    <CruiseResultsInner />
  </Suspense>
);

export default CruiseResultsPage;
