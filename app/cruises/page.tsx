"use client";

// Cruises entry point. A member picks a destination (Caribbean, Alaska,
// etc.), an optional departure port, party size, and preferred cabin.
// The picks become query params on /cruises/results, which asks the
// server for cruises pre-priced for that exact party.
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { fetchCruiseMeta, searchCruisePorts } from "@/lib/api/cruises";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { CabinKey, CruiseMeta } from "@/lib/types/cruise";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaShip } from "react-icons/fa";

const CABIN_OPTIONS: { value: CabinKey; label: string }[] = [
  { value: "inside", label: "Inside" },
  { value: "outside", label: "Ocean View" },
  { value: "balcony", label: "Balcony" },
  { value: "suite", label: "Suite" },
];

const CruisesSearchPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [meta, setMeta] = useState<CruiseMeta>({
    categories: [],
    departurePorts: [],
    cruiseLines: [],
  });
  const [category, setCategory] = useState("");
  const [departurePort, setDeparturePort] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinType, setCabinType] = useState<CabinKey>("inside");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    fetchCruiseMeta()
      .then((data) => {
        if (!cancelled) setMeta(data);
      })
      .catch(() => {
        /* meta is optional — dropdowns just stay empty if this fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => {
    setErrorMessage(null);
    if (adults < 1) {
      setErrorMessage("At least one adult guest is required.");
      return;
    }
    const params = new URLSearchParams({
      cabinType,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
    });
    if (category) params.set("category", category);
    if (departurePort) params.set("departurePort", departurePort);
    router.push(`/cruises/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-[#18294B] dark:bg-[#101b30] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FaShip className="text-white/80 w-6 h-6" />
            <h1 className="text-3xl font-bold">Set Sail with Interval</h1>
          </div>
          <p className="text-white/70">
            Compare cabin fares across every major cruise line — member
            savings baked in.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#16223d] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Destination
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
              >
                <option value="">All destinations</option>
                {meta.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <LocationAutocomplete
              label="Departure Port"
              placeholder="Type a city or port (e.g. Miami)"
              value={departurePort}
              onChange={setDeparturePort}
              onSearch={(query) => searchCruisePorts(query, 10)}
              onSelect={(value) => setDeparturePort(value)}
              getPrimaryLabel={(item) => item.port}
              getSelectedValue={(item) => item.port}
              getKey={(item) => item.port}
            />
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Preferred Cabin
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CABIN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCabinType(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    cabinType === option.value
                      ? "bg-[#0077be] text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <GuestCounter label="Adults (18+)" value={adults} min={1} max={8} onChange={setAdults} />
            <GuestCounter label="Children (2-17)" value={children} min={0} max={8} onChange={setChildren} />
            <GuestCounter label="Infants (under 2)" value={infants} min={0} max={4} onChange={setInfants} />
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
            Search Cruises
          </button>
        </div>
      </div>
    </div>
  );
};

interface GuestCounterProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const GuestCounter = ({ label, value, min, max, onChange }: GuestCounterProps) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
      {label}
    </label>
    <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a]">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200"
      >
        -
      </button>
      <span className="text-gray-800 dark:text-white font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200"
      >
        +
      </button>
    </div>
  </div>
);

export default CruisesSearchPage;
