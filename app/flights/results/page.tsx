"use client";

// Flight results page. Reads the search from the URL, hits
// GET /api/flights, and renders the results with sort/filter controls.
// Every filter is client-side after the initial fetch so the member
// doesn't wait on the network to toggle a checkbox.
import { searchFlights, type FlightSearchParams } from "@/lib/api/flights";
import { saveFlightDraft } from "@/lib/flightDraft";
import type { Flight, TripType } from "@/lib/types/flight";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface ParsedSearch {
  from: string;
  to: string;
  departureDate: string;
  returnDate: string | null;
  tripType: TripType;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
}

// Turns the ?from=...&to=... query string into a strongly-typed struct
// so the rest of the component doesn't have to keep re-parsing it.
function parseSearch(params: URLSearchParams): ParsedSearch {
  const parseInt10 = (value: string | null, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const tripTypeRaw = params.get("tripType");
  const tripType: TripType =
    tripTypeRaw === "oneway" || tripTypeRaw === "multicity"
      ? tripTypeRaw
      : "roundtrip";
  return {
    from: (params.get("from") ?? "").trim().toUpperCase(),
    to: (params.get("to") ?? "").trim().toUpperCase(),
    departureDate: params.get("departureDate") ?? "",
    returnDate: params.get("returnDate"),
    tripType,
    adults: parseInt10(params.get("adults"), 1),
    children: parseInt10(params.get("children"), 0),
    infants: parseInt10(params.get("infants"), 0),
    cabinClass: params.get("cabinClass") ?? "Economy",
  };
}

const formatDate = (iso: string) => {
  if (!iso) return "Any date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Any date";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const FlightResultsInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = useMemo(
    () => parseSearch(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [flights, setFlights] = useState<Flight[]>([]);
  const [exactMatch, setExactMatch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "fastest" | "earliest">(
    "best",
  );
  const [maxPrice, setMaxPrice] = useState(2500);
  const [selectedStops, setSelectedStops] = useState<
    "all" | "nonstop" | "1stop" | "2plus"
  >("all");
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const params: FlightSearchParams = {
          origin: search.from,
          destination: search.to,
        };
        const result = await searchFlights(params);
        if (cancelled) return;
        setFlights(result.flights);
        setExactMatch(result.exactMatch);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load flights right now.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search.from, search.to]);

  // The list of airlines that have any results at all — feeds the
  // "Airlines" filter so we don't offer checkboxes for carriers that
  // wouldn't match anything anyway.
  const availableAirlines = useMemo(() => {
    const set = new Set<string>();
    for (const flight of flights) set.add(flight.airline);
    return Array.from(set).sort();
  }, [flights]);

  const filteredFlights = useMemo(() => {
    const timeToMinutes = (durationOrTime: string) => {
      const dur = durationOrTime.match(/(\d+)h\s*(\d+)?m?/);
      if (dur) return Number(dur[1]) * 60 + Number(dur[2] ?? 0);
      const time = durationOrTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (time) {
        let hours = Number(time[1]);
        const minutes = Number(time[2]);
        const period = time[3].toUpperCase();
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
      }
      return 0;
    };

    let filtered = flights.filter((flight) => {
      if (flight.retailPrice > maxPrice) return false;
      if (selectedStops === "nonstop" && flight.stops !== 0) return false;
      if (selectedStops === "1stop" && flight.stops !== 1) return false;
      if (selectedStops === "2plus" && flight.stops < 2) return false;
      if (
        selectedAirlines.length > 0 &&
        !selectedAirlines.includes(flight.airline)
      )
        return false;
      if (refundableOnly && !flight.refundable) return false;
      return true;
    });

    if (sortBy === "cheapest") {
      filtered = [...filtered].sort(
        (a, b) => a.pricing.discountedPrice - b.pricing.discountedPrice,
      );
    } else if (sortBy === "fastest") {
      filtered = [...filtered].sort(
        (a, b) => timeToMinutes(a.duration) - timeToMinutes(b.duration),
      );
    } else if (sortBy === "earliest") {
      filtered = [...filtered].sort(
        (a, b) =>
          timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime),
      );
    }

    return filtered;
  }, [flights, maxPrice, selectedStops, selectedAirlines, refundableOnly, sortBy]);

  const handleSelectFlight = (flight: Flight) => {
    saveFlightDraft({
      flight,
      from: search.from,
      to: search.to,
      fromCity: flight.originCity,
      toCity: flight.destinationCity,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      tripType: search.tripType,
      adults: search.adults,
      children: search.children,
      infants: search.infants,
      cabinClass: search.cabinClass,
    });
    router.push("/flights/detail");
  };

  const totalTravelers = search.adults + search.children + search.infants;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            {search.from || "ANY"}{" "}
            <FaArrowRight className="inline mx-2 text-[#0077be]" />{" "}
            {search.to || "ANY"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {formatDate(search.departureDate)} &bull; {totalTravelers} traveler
            {totalTravelers !== 1 ? "s" : ""} &bull; {search.cabinClass}
          </p>
          <p className="text-sm text-[#0077be] dark:text-[#7fb8e6] mt-2 font-medium">
            {isLoading
              ? "Loading flights..."
              : `${filteredFlights.length} of ${flights.length} flights match your filters`}
          </p>
          {!isLoading && !exactMatch && flights.length > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              No flights on this exact route. Showing all available flights so
              you can still explore.
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setShowFiltersMobile((open) => !open)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0077be] text-white font-semibold rounded-lg"
              >
                Filters{" "}
                {showFiltersMobile ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            <div
              className={`${showFiltersMobile ? "block" : "hidden"} lg:block bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6 lg:sticky lg:top-6`}
            >
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Filters
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Max Price: ${maxPrice}
                </label>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[#0077be]"
                />
              </div>

              <div className="mb-6 border-t border-gray-200 dark:border-white/10 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Stops
                </p>
                <div className="space-y-2">
                  {(
                    [
                      ["all", "All Flights"],
                      ["nonstop", "Nonstop"],
                      ["1stop", "1 Stop"],
                      ["2plus", "2+ Stops"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <input
                        type="radio"
                        name="stops"
                        value={value}
                        checked={selectedStops === value}
                        onChange={() => setSelectedStops(value)}
                        className="accent-[#0077be]"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {availableAirlines.length > 0 && (
                <div className="mb-6 border-t border-gray-200 dark:border-white/10 pt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Airlines
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {availableAirlines.map((airline) => (
                      <label
                        key={airline}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAirlines.includes(airline)}
                          onChange={(event) =>
                            setSelectedAirlines((prev) =>
                              event.target.checked
                                ? [...prev, airline]
                                : prev.filter((entry) => entry !== airline),
                            )
                          }
                          className="accent-[#0077be]"
                        />
                        {airline}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={refundableOnly}
                    onChange={(event) => setRefundableOnly(event.target.checked)}
                    className="accent-[#0077be]"
                  />
                  Refundable only
                </label>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-2 mb-6">
              {(
                [
                  ["best", "Best"],
                  ["cheapest", "Cheapest"],
                  ["fastest", "Fastest"],
                  ["earliest", "Earliest"],
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
                    className="h-40 bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10"
                  />
                ))}
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-10 text-center">
                <p className="text-gray-600 dark:text-gray-300">
                  No flights match the current filters. Try widening the price
                  range or clearing the airline selection.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight) => (
                  <FlightResultCard
                    key={flight._id}
                    flight={flight}
                    onSelect={() => handleSelectFlight(flight)}
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

interface FlightResultCardProps {
  flight: Flight;
  onSelect: () => void;
}

const FlightResultCard = ({ flight, onSelect }: FlightResultCardProps) => {
  const lowSeats = flight.seatsAvailable > 0 && flight.seatsAvailable <= 5;

  return (
    <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:shadow-md transition">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0077be]/10 dark:bg-white/10 flex items-center justify-center font-bold text-[#0077be] dark:text-[#7fb8e6]">
              {flight.airline.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {flight.airline}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {flight.flightNumber} &bull; {flight.aircraft}
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {flight.departureTime}
            </p>
            <p className="text-xs font-semibold text-[#0077be] dark:text-[#7fb8e6]">
              {flight.origin}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {flight.originCity}
            </p>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-gradient-to-r from-[#0077be] to-[#7fb8e6] rounded-full" />
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
              {flight.duration} &bull; {flight.stopLabel}
            </p>
            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
              {flight.baggage}
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {flight.arrivalTime}
            </p>
            <p className="text-xs font-semibold text-[#0077be] dark:text-[#7fb8e6]">
              {flight.destination}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {flight.destinationCity}
            </p>
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 md:pl-6 pt-4 md:pt-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
            ${flight.pricing.retailPrice.toFixed(2)}
          </p>
          <p className="text-2xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
            ${flight.pricing.discountedPrice.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
            47% Member Savings
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            or {flight.pricing.totalPoints.toLocaleString()} pts
          </p>
          {lowSeats && (
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2">
              Only {flight.seatsAvailable} seats left!
            </p>
          )}
          <button
            type="button"
            onClick={onSelect}
            className="mt-3 w-full bg-[#0077be] hover:bg-[#005a8e] text-white text-sm font-bold py-2 rounded-lg transition"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

// useSearchParams needs a Suspense boundary when the page is rendered
// under Next.js App Router — otherwise the build errors with a hint
// about statically prerendering with searchParams.
const FlightResultsPage = () => (
  <Suspense fallback={<div className="p-8 text-gray-500">Loading flights...</div>}>
    <FlightResultsInner />
  </Suspense>
);

export default FlightResultsPage;
