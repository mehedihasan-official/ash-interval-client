"use client";

// Admin airport editor. Code, city, name and country are what the
// flight-search autocomplete renders in its dropdown; latitude and
// longitude are optional but are what let flights to this airport be
// timed and priced off its real position rather than a country centroid.
//
// Deliberately its own form (and its own page) rather than a section of
// the flight form: airports are reference data added once and reused by
// every flight afterwards, so mixing the two would mean re-entering the
// airport on every flight that touches it.
import type { CreateAirportInput } from "@/lib/api/admin";
import { useState, type ChangeEvent, type FormEvent } from "react";

export const EMPTY_AIRPORT: CreateAirportInput = {
  code: "",
  city: "",
  name: "",
  country: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30";
const labelClass =
  "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5";

type TextField = "code" | "city" | "name" | "country";

interface AirportFormProps {
  submitLabel: string;
  onSubmit: (data: CreateAirportInput) => Promise<void>;
}

const AirportForm = ({ submitLabel, onSubmit }: AirportFormProps) => {
  const [data, setData] = useState<CreateAirportInput>(EMPTY_AIRPORT);
  // Held as text, not numbers, so "blank" stays distinguishable from 0 —
  // 0/0 is a real coordinate (in the Atlantic) and would otherwise be
  // sent for every airport left without one.
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    // IATA codes are always upper case, so normalize as they type rather
    // than rejecting "myr" on submit.
    setData((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    // Only the text fields — latitude/longitude are optional and get
    // their own range checks below.
    const required: [TextField, string][] = [
      ["code", "Airport code"],
      ["city", "City"],
      ["name", "Airport name"],
      ["country", "Country"],
    ];
    for (const [field, label] of required) {
      if (!data[field].trim()) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }
    if (!/^[A-Z]{3}$/.test(data.code.trim())) {
      setErrorMessage("Airport code must be 3 letters, for example MYR.");
      return;
    }

    const hasLat = latText.trim().length > 0;
    const hasLng = lngText.trim().length > 0;
    if (hasLat !== hasLng) {
      setErrorMessage("Enter both latitude and longitude, or leave both blank.");
      return;
    }
    const latitude = Number(latText);
    const longitude = Number(lngText);
    if (hasLat && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      setErrorMessage("Latitude must be a number between -90 and 90.");
      return;
    }
    if (hasLng && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      setErrorMessage("Longitude must be a number between -180 and 180.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: data.code.trim(),
        city: data.city.trim(),
        name: data.name.trim(),
        country: data.country.trim(),
        ...(hasLat && hasLng ? { latitude, longitude } : {}),
      });
      setData(EMPTY_AIRPORT);
      setLatText("");
      setLngText("");
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="code" className={labelClass}>
            Airport Code <span className="text-red-500">*</span>
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={3}
            value={data.code}
            onChange={handleField}
            placeholder="MYR"
            className={`${inputClass} uppercase tracking-widest font-semibold`}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            The 3-letter IATA code members type to search.
          </p>
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            City <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            value={data.city}
            onChange={handleField}
            placeholder="Myrtle Beach"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>
            Airport Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={data.name}
            onChange={handleField}
            placeholder="Myrtle Beach International Airport"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="country" className={labelClass}>
            Country <span className="text-red-500">*</span>
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            value={data.country}
            onChange={handleField}
            placeholder="United States"
            className={inputClass}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-white/10 pt-6">
        <h2 className="font-bold text-gray-800 dark:text-white mb-1">
          Location{" "}
          <span className="text-xs font-normal text-gray-400">optional</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Fill these in and flight times and fares for this airport are
          measured from its real position. Leave them blank and we fall back
          to the middle of the country, which makes short hops look far
          longer than they are. Search the airport on Google Maps, right-click
          it, and the two numbers are at the top of the menu.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className={labelClass}>
              Latitude
            </label>
            <input
              id="latitude"
              type="text"
              inputMode="decimal"
              value={latText}
              onChange={(event) => setLatText(event.target.value)}
              placeholder="33.6797"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="longitude" className={labelClass}>
              Longitude
            </label>
            <input
              id="longitude"
              type="text"
              inputMode="decimal"
              value={lngText}
              onChange={(event) => setLngText(event.target.value)}
              placeholder="-78.9283"
              className={inputClass}
            />
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

export default AirportForm;
