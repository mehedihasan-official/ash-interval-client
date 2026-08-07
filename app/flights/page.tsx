"use client";

// The Flights entry point. A member lands here from the dashboard's
// "Travel Services" card, picks a route and dates, and gets navigated
// to /flights/results with the search encoded as query params (so the
// results page can be shared, refreshed, or deep-linked to).
import AirportAutocomplete from "@/components/flights/AirportAutocomplete";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaExchangeAlt, FaPlane } from "react-icons/fa";

type TripType = "oneway" | "roundtrip" | "multicity";

const CABIN_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
] as const;

// Yields today's date in the format the native date input expects
// (yyyy-mm-dd) so the min= attribute blocks past dates on all browsers.
const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const FlightsSearchPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [cabinClass, setCabinClass] =
    useState<(typeof CABIN_CLASSES)[number]>("Economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [travelersOpen, setTravelersOpen] = useState(false);

  const totalTravelers = adults + children + infants;

  // Non-members shouldn't be booking flights against member savings,
  // so bounce anonymous visitors to the sign-in page just like the
  // rest of /dashboard.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const swapAirports = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = () => {
    setErrorMessage(null);
    if (!from || !to) {
      setErrorMessage("Please pick both an origin and a destination airport.");
      return;
    }
    if (from.trim().toUpperCase() === to.trim().toUpperCase()) {
      setErrorMessage("Origin and destination must be different airports.");
      return;
    }
    if (!departureDate) {
      setErrorMessage("Please pick a departure date.");
      return;
    }
    if (tripType === "roundtrip" && !returnDate) {
      setErrorMessage("Please pick a return date for round-trip searches.");
      return;
    }

    const params = new URLSearchParams({
      from: from.trim().toUpperCase(),
      to: to.trim().toUpperCase(),
      departureDate,
      cabinClass,
      tripType,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
    });
    if (tripType === "roundtrip" && returnDate) {
      params.set("returnDate", returnDate);
    }

    router.push(`/flights/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-[#18294B] dark:bg-[#101b30] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FaPlane className="text-white/80 w-6 h-6" />
            <h1 className="text-3xl font-bold">Find Your Flight</h1>
          </div>
          <p className="text-white/70">
            Search and book flights with Interval member savings.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#16223d] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 sm:p-8">
          {/* Trip type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Trip Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "oneway", label: "One Way" },
                  { key: "roundtrip", label: "Round Trip" },
                  { key: "multicity", label: "Multi-City" },
                ] as { key: TripType; label: string }[]
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTripType(option.key)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                    tripType === option.key
                      ? "bg-[#0077be] text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Airports */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-6">
            <AirportAutocomplete
              label="From"
              value={from}
              onChange={(code) => setFrom(code)}
            />
            <div className="flex md:justify-center">
              <button
                type="button"
                onClick={swapAirports}
                title="Swap airports"
                className="p-3 border border-gray-300 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition"
              >
                <FaExchangeAlt className="w-4 h-4" />
              </button>
            </div>
            <AirportAutocomplete
              label="To"
              value={to}
              onChange={(code) => setTo(code)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Departure
              </label>
              <input
                type="date"
                value={departureDate}
                min={todayIsoDate()}
                onChange={(event) => setDepartureDate(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be]"
              />
            </div>
            {tripType === "roundtrip" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Return
                </label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || todayIsoDate()}
                  onChange={(event) => setReturnDate(event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be]"
                />
              </div>
            )}
          </div>

          {/* Travelers and cabin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Travelers
              </label>
              <button
                type="button"
                onClick={() => setTravelersOpen((open) => !open)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-left text-gray-800 dark:text-white hover:border-[#0077be]"
              >
                {totalTravelers} Traveler{totalTravelers !== 1 ? "s" : ""}
              </button>
              {travelersOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 p-4 bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg space-y-4">
                  <TravelerRow
                    label="Adults (18+)"
                    value={adults}
                    min={1}
                    max={9}
                    onChange={setAdults}
                  />
                  <TravelerRow
                    label="Children (2-17)"
                    value={children}
                    min={0}
                    max={9}
                    onChange={setChildren}
                  />
                  <TravelerRow
                    label="Infants (under 2)"
                    value={infants}
                    min={0}
                    max={4}
                    onChange={setInfants}
                  />
                  <button
                    type="button"
                    onClick={() => setTravelersOpen(false)}
                    className="w-full mt-2 py-2 bg-[#0077be] text-white text-sm font-bold rounded-lg hover:bg-[#005a8e] transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Cabin Class
              </label>
              <select
                value={cabinClass}
                onChange={(event) =>
                  setCabinClass(
                    event.target.value as (typeof CABIN_CLASSES)[number],
                  )
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be]"
              >
                {CABIN_CLASSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleSearch}
            className="w-full bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-4 rounded-lg text-lg transition"
          >
            Search Flights
          </button>
        </div>
      </div>
    </div>
  );
};

interface TravelerRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const TravelerRow = ({ label, value, min, max, onChange }: TravelerRowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 border border-gray-300 dark:border-white/10 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
      >
        -
      </button>
      <span className="w-8 text-center text-gray-800 dark:text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 border border-gray-300 dark:border-white/10 rounded text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
      >
        +
      </button>
    </div>
  </div>
);

export default FlightsSearchPage;
