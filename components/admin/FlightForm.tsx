"use client";

// Admin flight editor. Origin and destination reuse the same
// AirportAutocomplete the member-facing search uses, so an admin picks a
// real airport out of the list instead of typing a code by hand — the
// backend rejects codes that aren't in the airport list anyway, and
// picking one fills the city in for free.
//
// Duration, arrival time and retail price are left blank by default:
// the backend works them out from the distance between the two
// airports, which is how every seeded flight on the site is timed and
// priced. An admin who knows better can still override any of them.
import AirportAutocomplete from "@/components/flights/AirportAutocomplete";
import type { CreateFlightInput } from "@/lib/api/admin";
import type { Airport, CabinClass } from "@/lib/types/flight";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

export const EMPTY_FLIGHT: CreateFlightInput = {
  flightId: "",
  airline: "",
  airlineLogo: "",
  flightNumber: "",
  origin: "",
  originCity: "",
  destination: "",
  destinationCity: "",
  departureTime: "",
  arrivalTime: "",
  duration: "",
  stops: 0,
  stopLabel: "",
  cabinClass: "Economy",
  retailPrice: undefined,
  seatsAvailable: 10,
  aircraft: "",
  refundable: false,
  baggage: "",
};

const CABIN_CLASSES: CabinClass[] = [
  "Economy",
  "Premium Economy",
  "Business",
  "First",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30";
const labelClass =
  "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5";
const hintClass = "text-xs text-gray-400 mt-1.5";

// The schema stores wall-clock strings like "06:00 AM", but a native
// time input speaks 24-hour "06:00" — convert at the boundary so the
// admin gets a real time picker instead of having to type the format.
const to12Hour = (value: string): string => {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  let hour = Number(match[1]);
  const meridiem = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, "0")}:${match[2]} ${meridiem}`;
};

interface FlightFormProps {
  submitLabel: string;
  onSubmit: (data: CreateFlightInput) => Promise<void>;
}

const FlightForm = ({ submitLabel, onSubmit }: FlightFormProps) => {
  const [data, setData] = useState<CreateFlightInput>(EMPTY_FLIGHT);
  const [departureTime, setDepartureTime] = useState("");
  const [priceText, setPriceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value === "" ? 0 : Number(value) }));
  };

  // Picking from the dropdown gives us the whole airport record, so the
  // city comes along for free; typing a raw code just sets the code and
  // lets the backend resolve the city.
  const handleAirport = (
    field: "origin" | "destination",
    code: string,
    airport?: Airport,
  ) => {
    const cityField = field === "origin" ? "originCity" : "destinationCity";
    setData((prev) => ({
      ...prev,
      [field]: code.toUpperCase(),
      [cityField]: airport?.city ?? "",
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const required: [keyof CreateFlightInput, string][] = [
      ["flightId", "Flight ID"],
      ["airline", "Airline"],
      ["flightNumber", "Flight number"],
      ["origin", "Origin"],
      ["destination", "Destination"],
      ["aircraft", "Aircraft"],
    ];
    for (const [field, label] of required) {
      const value = data[field];
      if (typeof value === "string" && !value.trim()) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }
    if (!departureTime) {
      setErrorMessage("Departure time is required.");
      return;
    }
    if (data.origin.trim().toUpperCase() === data.destination.trim().toUpperCase()) {
      setErrorMessage("Origin and destination must be different airports.");
      return;
    }

    const price = Number(priceText);
    if (priceText.trim() && (!Number.isFinite(price) || price <= 0)) {
      setErrorMessage("Retail price must be a number greater than zero.");
      return;
    }

    const payload: CreateFlightInput = {
      ...data,
      flightId: data.flightId.trim().toUpperCase(),
      airline: data.airline.trim(),
      flightNumber: data.flightNumber.trim(),
      origin: data.origin.trim().toUpperCase(),
      destination: data.destination.trim().toUpperCase(),
      departureTime: to12Hour(departureTime),
      stops: Number(data.stops) || 0,
      seatsAvailable: Number(data.seatsAvailable) || 0,
      // Omitted entirely when blank so the backend fills them in from
      // the route rather than storing an empty string.
      retailPrice: priceText.trim() ? price : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      setData(EMPTY_FLIGHT);
      setDepartureTime("");
      setPriceText("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 space-y-6 shadow-sm"
    >
      {/* Identity */}
      <div>
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">Airline</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="flightId" className={labelClass}>
              Flight ID <span className="text-red-500">*</span>
            </label>
            <input
              id="flightId"
              name="flightId"
              type="text"
              required
              value={data.flightId}
              onChange={handleField}
              placeholder="FL039"
              className={inputClass}
            />
            <p className={hintClass}>Your own reference. Must be unique.</p>
          </div>
          <div>
            <label htmlFor="flightNumber" className={labelClass}>
              Flight Number <span className="text-red-500">*</span>
            </label>
            <input
              id="flightNumber"
              name="flightNumber"
              type="text"
              required
              value={data.flightNumber}
              onChange={handleField}
              placeholder="AA 5312"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="airline" className={labelClass}>
              Airline <span className="text-red-500">*</span>
            </label>
            <input
              id="airline"
              name="airline"
              type="text"
              required
              value={data.airline}
              onChange={handleField}
              placeholder="American Airlines"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="airlineLogo" className={labelClass}>
              Airline Logo URL
            </label>
            <input
              id="airlineLogo"
              name="airlineLogo"
              type="url"
              value={data.airlineLogo ?? ""}
              onChange={handleField}
              placeholder="https://logo.clearbit.com/aa.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Route */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">Route</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AirportAutocomplete
            label="Origin"
            required
            value={data.origin}
            onChange={(code, airport) => handleAirport("origin", code, airport)}
            labelClassName={labelClass}
            inputClassName={inputClass}
          />
          <AirportAutocomplete
            label="Destination"
            required
            value={data.destination}
            onChange={(code, airport) =>
              handleAirport("destination", code, airport)
            }
            labelClassName={labelClass}
            inputClassName={inputClass}
          />
          <div className="sm:col-span-2">
            <p className={hintClass}>
              Pick both airports from the dropdown. Not listed?{" "}
              <Link
                href="/dashboard/admin/airports/new"
                className="text-[#0077be] dark:text-[#7fb8e6] font-medium underline"
              >
                Add the airport
              </Link>{" "}
              first.
            </p>
          </div>
          <div>
            <label htmlFor="stops" className={labelClass}>
              Stops
            </label>
            <input
              id="stops"
              name="stops"
              type="number"
              min={0}
              value={data.stops}
              onChange={handleNumberField}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="aircraft" className={labelClass}>
              Aircraft <span className="text-red-500">*</span>
            </label>
            <input
              id="aircraft"
              name="aircraft"
              type="text"
              required
              value={data.aircraft}
              onChange={handleField}
              placeholder="Embraer E175"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-1">Schedule</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Leave duration and arrival blank and we&apos;ll work them out from
          the distance between the two airports.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="departureTime" className={labelClass}>
              Departure Time <span className="text-red-500">*</span>
            </label>
            <input
              id="departureTime"
              type="time"
              required
              value={departureTime}
              onChange={(event) => setDepartureTime(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="duration" className={labelClass}>
              Duration
            </label>
            <input
              id="duration"
              name="duration"
              type="text"
              value={data.duration ?? ""}
              onChange={handleField}
              placeholder="Auto (1h 10m)"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="arrivalTime" className={labelClass}>
              Arrival Time
            </label>
            <input
              id="arrivalTime"
              name="arrivalTime"
              type="text"
              value={data.arrivalTime ?? ""}
              onChange={handleField}
              placeholder="Auto (08:30 AM)"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Cabin + fare */}
      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">
          Cabin &amp; Fare
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cabinClass" className={labelClass}>
              Cabin Class
            </label>
            <select
              id="cabinClass"
              name="cabinClass"
              value={data.cabinClass}
              onChange={handleField}
              className={inputClass}
            >
              {CABIN_CLASSES.map((cabin) => (
                <option key={cabin} value={cabin}>
                  {cabin}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="retailPrice" className={labelClass}>
              Retail Price (USD)
            </label>
            <input
              id="retailPrice"
              type="number"
              min={1}
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
              placeholder="Auto from route distance"
              className={inputClass}
            />
            <p className={hintClass}>
              One-way, one seat. Members see 47% off this.
            </p>
          </div>
          <div>
            <label htmlFor="seatsAvailable" className={labelClass}>
              Seats Available
            </label>
            <input
              id="seatsAvailable"
              name="seatsAvailable"
              type="number"
              min={0}
              value={data.seatsAvailable}
              onChange={handleNumberField}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="baggage" className={labelClass}>
              Baggage
            </label>
            <input
              id="baggage"
              name="baggage"
              type="text"
              value={data.baggage ?? ""}
              onChange={handleField}
              placeholder="1 carry-on included"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={data.refundable}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    refundable: event.target.checked,
                  }))
                }
                className="accent-[#0077be] w-4 h-4"
              />
              Refundable fare
            </label>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-lg transition"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
};

export default FlightForm;
