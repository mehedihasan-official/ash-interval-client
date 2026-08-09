"use client";

// Cars entry point. Layout matches the Platinum Club Rental Cars
// mockup — pill-style pickup/dropoff pickers with airport autocomplete,
// separate date and time fields, and the "return to same location"
// toggle members expect from any car booking widget.
//
// Pickup/dropoff surface real airports (the vast majority of rental
// depots are at airports); the airport dataset is the same one the
// flight search uses, so the two flows feel consistent.
import LocationAutocomplete from "@/components/shared/LocationAutocomplete";
import { searchAirports } from "@/lib/api/flights";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { Airport } from "@/lib/types/flight";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCar, FaMapMarkerAlt, FaRegClock } from "react-icons/fa";

// "MCO — Orlando" is what we store back in the input. Compact enough
// for the results header but still tells the member exactly which city
// they picked.
const formatAirportLabel = (airport: Airport) =>
  `${airport.city}, ${airport.country} (${airport.code})`;

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

// Rentals are billed per calendar day, so day count = ceil((end-start)/day).
// Same date pickup+dropoff still counts as at least one day.
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
  const [pickupTime, setPickupTime] = useState("10:00");
  const [dropoffTime, setDropoffTime] = useState("10:00");
  const [sameLocation, setSameLocation] = useState(true);
  const [estimatedDailyMiles, setEstimatedDailyMiles] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep dropoff mirrored to pickup while the "return to same location"
  // toggle is on. Turning it off leaves whatever's already there so the
  // member can edit freely.
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
      setErrorMessage("Please pick a pickup location from the list.");
      return;
    }
    if (!dropoffLocation.trim()) {
      setErrorMessage("Please pick a dropoff location.");
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
      pickupTime,
      dropoffTime,
      rentalDays: String(rentalDays),
      estimatedDailyMiles: String(estimatedDailyMiles),
    });
    router.push(`/cars/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-[#18294B] dark:bg-[#101b30] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <FaCar className="w-6 h-6" /> Your Next Vacation Starts Here
          </h1>
          <p className="text-sm sm:text-base text-white/70">
            Book rental cars with flexible pickup and drop-off options and
            Interval member savings.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Sub-tabs. "Airport Transportation" is a placeholder for a
            future tab — kept in the DOM so the visual matches the mock
            without pretending the button does something yet. */}
        <div className="flex gap-6 border-b border-gray-200 dark:border-white/10 mb-6 px-2">
          <button
            type="button"
            className="text-sm font-semibold text-[#2563eb] border-b-2 border-[#2563eb] pb-2"
          >
            Rental Cars
          </button>
          <button
            type="button"
            title="Coming soon"
            className="text-sm font-semibold text-gray-500 dark:text-gray-400 pb-2 cursor-not-allowed"
          >
            Airport Transportation
          </button>
        </div>

        <div className="bg-white dark:bg-[#16223d] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-100 dark:border-white/5">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Rental car search
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Book rental cars with flexible pickup and drop-off options.
            </p>
          </div>

          <LocationAutocomplete
            label="Pick-up Location"
            placeholder="Enter pick-up location"
            value={pickupLocation}
            onChange={setPickupLocation}
            onSearch={(query) => searchAirports(query, 8)}
            onSelect={(value) => setPickupLocation(value)}
            getPrimaryLabel={formatAirportLabel}
            getSecondaryLabel={(airport) => airport.name}
            getSelectedValue={formatAirportLabel}
            getKey={(airport) => airport.code}
            suggestionsHeader="Showing available destinations"
          />

          <LocationAutocomplete
            label="Drop-off Location"
            placeholder="Enter drop-off location"
            value={dropoffLocation}
            disabled={sameLocation}
            onChange={setDropoffLocation}
            onSearch={(query) => searchAirports(query, 8)}
            onSelect={(value) => setDropoffLocation(value)}
            getPrimaryLabel={formatAirportLabel}
            getSecondaryLabel={(airport) => airport.name}
            getSelectedValue={formatAirportLabel}
            getKey={(airport) => airport.code}
            suggestionsHeader="Showing available destinations"
          />

          <DateField
            label="Pick-up date"
            value={pickupDate}
            min={todayIsoDate()}
            onChange={setPickupDate}
          />
          <DateField
            label="Drop-off date"
            value={dropoffDate}
            min={pickupDate || todayIsoDate()}
            onChange={setDropoffDate}
          />
          <TimeField
            label="Pick-up time"
            value={pickupTime}
            onChange={setPickupTime}
          />
          <TimeField
            label="Drop-off time"
            value={dropoffTime}
            onChange={setDropoffTime}
          />

          {/* Toggle button, styled as the mockup shows. Clicking flips
              the "same location" state — pill outline when off, blue
              when on. */}
          <button
            type="button"
            onClick={() => setSameLocation((prev) => !prev)}
            className={`w-full py-3 rounded-full border text-sm font-semibold transition ${
              sameLocation
                ? "border-[#2563eb] text-[#2563eb] bg-blue-50 dark:bg-white/5"
                : "border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 bg-white dark:bg-[#0f172a]"
            }`}
          >
            {sameLocation ? "Returning to same location ✓" : "Return to same location"}
          </button>

          {/* Estimated miles surfaces on the same page — kept
              because it drives real overage math on limited plans. */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4 border border-gray-100 dark:border-white/5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Estimated daily mileage:{" "}
              <span className="text-[#2563eb] dark:text-[#7fb8e6]">
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
              className="w-full accent-[#2563eb]"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Used to price limited-mileage plans accurately.
              Unlimited-mileage rentals ignore it.
            </p>
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
            Search Cars
          </button>
        </div>
      </div>
    </div>
  );
};

interface DateFieldProps {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
}

const DateField = ({ label, value, min, onChange }: DateFieldProps) => (
  <div className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </div>
    <input
      type="date"
      value={value}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-transparent text-sm text-gray-800 dark:text-white focus:outline-none"
    />
  </div>
);

interface TimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const TimeField = ({ label, value, onChange }: TimeFieldProps) => (
  <div className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </div>
    <div className="flex items-center gap-2">
      <FaRegClock className="w-3 h-3 text-gray-400" />
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-transparent text-sm text-gray-800 dark:text-white focus:outline-none"
      />
    </div>
  </div>
);

export default CarsSearchPage;
