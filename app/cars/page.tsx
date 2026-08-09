"use client";

// Cars entry point. A member picks pickup/dropoff locations and dates
// plus an estimated daily mileage — the mileage estimate matters
// because non-unlimited plans charge for miles over the daily
// allowance, so pre-computing the true total needs both pieces.
//
// Pickup/dropoff locations are surfaced via a suggestion input backed
// by the airports collection (real-world rental depots are almost
// always at airports), matching the flight search UX.
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { searchAirports } from "@/lib/api/flights";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { Airport } from "@/lib/types/flight";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCar } from "react-icons/fa";

// Formats an airport row into the pickup-location label we store —
// "MCO — Orlando" is compact enough for the results header but still
// tells the member exactly which city they picked.
const formatAirportLabel = (airport: Airport) =>
  `${airport.code} — ${airport.city}`;

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

// Difference in whole days between two YYYY-MM-DD strings. Minimum 1
// because a rental has to cover at least one calendar day even when
// pickup and dropoff are the same date.
function daysBetween(pickup: string, dropoff: string): number {
  if (!pickup || !dropoff) return 1;
  const start = new Date(pickup).getTime();
  const end = new Date(dropoff).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 1;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
}

const CarsSearchPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [sameLocation, setSameLocation] = useState(true);
  const [estimatedDailyMiles, setEstimatedDailyMiles] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep dropoff mirrored to pickup while "return to same location" is on.
  useEffect(() => {
    if (sameLocation) setDropoffLocation(pickupLocation);
  }, [sameLocation, pickupLocation]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const rentalDays = daysBetween(pickupDate, dropoffDate);

  const handleSearch = () => {
    setErrorMessage(null);
    if (!pickupLocation.trim()) {
      setErrorMessage("Please enter a pickup location.");
      return;
    }
    if (!dropoffLocation.trim()) {
      setErrorMessage("Please enter a dropoff location.");
      return;
    }
    if (!pickupDate || !dropoffDate) {
      setErrorMessage("Please pick both pickup and dropoff dates.");
      return;
    }
    if (new Date(dropoffDate) <= new Date(pickupDate)) {
      setErrorMessage("Dropoff must be after pickup.");
      return;
    }

    const params = new URLSearchParams({
      pickup: pickupLocation.trim(),
      dropoff: dropoffLocation.trim(),
      pickupDate,
      dropoffDate,
      rentalDays: String(rentalDays),
      estimatedDailyMiles: String(estimatedDailyMiles),
    });
    router.push(`/cars/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-[#18294B] dark:bg-[#101b30] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FaCar className="text-white/80 w-6 h-6" />
            <h1 className="text-3xl font-bold">Rent a Car</h1>
          </div>
          <p className="text-white/70">
            Compare rentals across every major vendor with Interval member
            savings baked in.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-[#16223d] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <LocationAutocomplete
              label="Pickup Location"
              placeholder="Airport code or city"
              value={pickupLocation}
              onChange={setPickupLocation}
              onSearch={(query) => searchAirports(query, 8)}
              onSelect={(value) => setPickupLocation(value)}
              getPrimaryLabel={formatAirportLabel}
              getSecondaryLabel={(airport) => airport.name}
              getSelectedValue={formatAirportLabel}
              getKey={(airport) => airport.code}
            />
            <LocationAutocomplete
              label="Dropoff Location"
              placeholder="Airport code or city"
              value={dropoffLocation}
              disabled={sameLocation}
              onChange={setDropoffLocation}
              onSearch={(query) => searchAirports(query, 8)}
              onSelect={(value) => setDropoffLocation(value)}
              getPrimaryLabel={formatAirportLabel}
              getSecondaryLabel={(airport) => airport.name}
              getSelectedValue={formatAirportLabel}
              getKey={(airport) => airport.code}
            />
          </div>

          <label className="flex items-center gap-2 mb-6 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={sameLocation}
              onChange={(event) => setSameLocation(event.target.checked)}
              className="accent-[#0077be]"
            />
            Return to same location
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Pickup Date
              </label>
              <input
                type="date"
                min={todayIsoDate()}
                value={pickupDate}
                onChange={(event) => setPickupDate(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Dropoff Date
              </label>
              <input
                type="date"
                min={pickupDate || todayIsoDate()}
                value={dropoffDate}
                onChange={(event) => setDropoffDate(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Estimated daily mileage:{" "}
              <span className="text-[#0077be] dark:text-[#7fb8e6]">
                {estimatedDailyMiles} mi/day
              </span>
            </label>
            <input
              type="range"
              min={25}
              max={500}
              step={25}
              value={estimatedDailyMiles}
              onChange={(event) =>
                setEstimatedDailyMiles(Number(event.target.value))
              }
              className="w-full accent-[#0077be]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We use this to price limited-mileage plans accurately.
              Unlimited-mileage rentals ignore it.
            </p>
          </div>

          {pickupDate && dropoffDate && (
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
              Trip length:{" "}
              <span className="font-bold">{rentalDays} day{rentalDays !== 1 ? "s" : ""}</span>
            </p>
          )}

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
            Search Cars
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarsSearchPage;
