"use client";

// Admin resort-input form. Field set matches lib/types/resort.ts exactly
// (resortName, location, symbol, region, country, continent, description,
// onSite, nearby, contactInfo, nearestAirport, checkInDays, img/img2-4) so
// a resort created here renders correctly everywhere else in the app —
// resort directory, search, and the booking flow — without any mapping.
import { createResort, type CreateResortInput } from "@/lib/api/admin";
import { DEFAULT_UNIT_PRICING } from "@/lib/types/resort";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";

const EMPTY_RESORT: CreateResortInput = {
  resortName: "",
  location: "",
  symbol: "",
  region: "",
  country: "",
  continent: "",
  description: "",
  onSite: "",
  nearby: "",
  contactInfo: "",
  nearestAirport: "",
  checkInDays: [],
  img: "",
  img2: "",
  img3: "",
  img4: "",
  unitPricing: DEFAULT_UNIT_PRICING,
};

const TEXT_FIELDS: Array<{
  name: keyof CreateResortInput;
  label: string;
  required: boolean;
}> = [
  { name: "resortName", label: "Resort Name", required: true },
  { name: "location", label: "Location", required: true },
  { name: "symbol", label: "Symbol / Code", required: false },
  { name: "region", label: "Region", required: false },
  { name: "country", label: "Country", required: true },
  { name: "continent", label: "Continent", required: false },
  { name: "nearestAirport", label: "Nearest Airport", required: false },
  { name: "contactInfo", label: "Contact Information", required: false },
];

const IMAGE_FIELDS: Array<{ name: keyof CreateResortInput; label: string }> = [
  { name: "img", label: "Primary Image URL" },
  { name: "img2", label: "Image URL 2" },
  { name: "img3", label: "Image URL 3" },
  { name: "img4", label: "Image URL 4" },
];

const CHECK_IN_DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30";
const labelClass =
  "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5";

const AdminAddResortPage = () => {
  const [resortData, setResortData] = useState<CreateResortInput>(EMPTY_RESORT);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setResortData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckInDayToggle = (day: string) => {
    setResortData((prev) => ({
      ...prev,
      checkInDays: prev.checkInDays.includes(day)
        ? prev.checkInDays.filter((d) => d !== day)
        : [...prev.checkInDays, day],
    }));
  };

  const handleUnitPricingChange = (
    index: number,
    field: "availableUnits" | "beds" | "pointsPerNight" | "cashPerNight",
    value: string,
  ) => {
    const numericValue = Math.max(0, Number(value) || 0);
    setResortData((prev) => ({
      ...prev,
      unitPricing: prev.unitPricing.map((unit, unitIndex) =>
        unitIndex === index ? { ...unit, [field]: numericValue } : unit,
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !resortData.resortName.trim() ||
      !resortData.location.trim() ||
      !resortData.country.trim()
    ) {
      Swal.fire({
        title: "Missing required fields",
        text: "Resort name, location, and country are required.",
        icon: "warning",
        confirmButtonColor: "#0077be",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createResort(resortData);
      await Swal.fire({
        title: "Resort added!",
        text: `${resortData.resortName} has been added to the directory.`,
        icon: "success",
        confirmButtonColor: "#0077be",
      });
      setResortData(EMPTY_RESORT);
    } catch (error) {
      Swal.fire({
        title: "Couldn't add resort",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#0077be",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Add New Resort</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        This resort will appear in the resort directory and booking flow as soon
        as it&apos;s saved.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-6 shadow-sm"
      >
        {/* Basic details */}
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">
            Basic Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEXT_FIELDS.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={labelClass}>
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  required={field.required}
                  value={resortData[field.name] as string}
                  onChange={handleChange}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={resortData.description}
            onChange={handleChange}
            placeholder="Describe the resort, its setting, and what makes it stand out"
            className={inputClass}
          />
        </div>

        {/* Amenities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="onSite" className={labelClass}>
              On-Site Activities{" "}
              <span className="text-gray-400">(comma separated)</span>
            </label>
            <input
              id="onSite"
              name="onSite"
              type="text"
              value={resortData.onSite}
              onChange={handleChange}
              placeholder="Pool, Spa, Tennis Court"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="nearby" className={labelClass}>
              Nearby Attractions{" "}
              <span className="text-gray-400">(comma separated)</span>
            </label>
            <input
              id="nearby"
              name="nearby"
              type="text"
              value={resortData.nearby}
              onChange={handleChange}
              placeholder="Beach, Golf Course, Shopping"
              className={inputClass}
            />
          </div>
        </div>

        {/* Check-in days */}
        <div>
          <span className={labelClass}>Check-in Days</span>
          <div className="flex flex-wrap gap-2">
            {CHECK_IN_DAYS.map((day) => {
              const isSelected = resortData.checkInDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleCheckInDayToggle(day)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                    isSelected
                      ? "bg-[#0077be] border-[#0077be] text-white"
                      : "bg-white dark:bg-transparent border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:border-[#0077be]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white mb-1">
            Unit Inventory and Pricing
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Set the available quantity, bed count, points, and cash price for
            each unit type.
          </p>
          <div className="space-y-4">
            {resortData.unitPricing.map((unit, index) => (
              <div
                key={unit.unitType}
                className="grid grid-cols-1 sm:grid-cols-5 gap-3 rounded-lg border border-gray-200 dark:border-white/10 p-4"
              >
                <div className="sm:col-span-1 flex items-center font-semibold text-gray-800 dark:text-white text-sm">
                  {unit.unitType}
                </div>
                {(
                  [
                    ["availableUnits", "Available Units"],
                    ["beds", "Beds"],
                    ["pointsPerNight", "Points / Night"],
                    ["cashPerNight", "Cash / Night ($)"],
                  ] as const
                ).map(([field, label]) => (
                  <label
                    key={field}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {label}
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={unit[field]}
                      onChange={(event) =>
                        handleUnitPricingChange(
                          index,
                          field,
                          event.target.value,
                        )
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">
            Images
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {IMAGE_FIELDS.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={labelClass}>
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="url"
                  value={resortData[field.name] as string}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-lg transition"
        >
          {isSubmitting ? "Saving..." : "Save Resort"}
        </button>
      </form>
    </div>
  );
};

export default AdminAddResortPage;
