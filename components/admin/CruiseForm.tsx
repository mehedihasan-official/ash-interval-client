"use client";

// Shared cruise editor used by both Add Cruise and Edit Cruise. The
// backend schema (interval-ash-server/src/models/cruise.model.ts) has
// four nested cabin objects, three text-array fields, and one date-
// array field — this form handles those by:
//   - rendering four labeled cabin blocks (name + retailPrice each)
//   - collecting the arrays as comma-separated text and splitting on
//     commas / newlines on submit (matches how the resort form takes
//     onSite/nearby)
// Mobile-first: single-column at phone sizes, two-column at sm+ for
// short paired inputs.
import type {
  CreateCruiseInput,
  CruiseCabinInput,
} from "@/lib/api/admin";
import type { CabinKey } from "@/lib/types/cruise";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

export const EMPTY_CRUISE: CreateCruiseInput = {
  cruiseId: "",
  name: "",
  cruiseLine: "",
  cruiseLineLogo: "",
  route: "",
  departurePort: "",
  duration: 7,
  category: "",
  image: "",
  rating: 4.5,
  reviews: 0,
  itinerary: [],
  shipFeatures: [],
  cabinTypes: {
    inside: { name: "Inside", retailPrice: 0 },
    outside: { name: "Ocean View", retailPrice: 0 },
    balcony: { name: "Balcony", retailPrice: 0 },
    suite: { name: "Suite", retailPrice: 0 },
  },
  departureDates: [],
  includes: [],
};

const CABINS: { key: CabinKey; label: string }[] = [
  { key: "inside", label: "Inside" },
  { key: "outside", label: "Ocean View" },
  { key: "balcony", label: "Balcony" },
  { key: "suite", label: "Suite" },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30";
const labelClass =
  "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5";

const splitList = (text: string): string[] =>
  text
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const joinList = (list: string[] | undefined): string =>
  Array.isArray(list) ? list.join(", ") : "";

interface CruiseFormProps {
  initial?: CreateCruiseInput;
  submitLabel: string;
  onSubmit: (data: CreateCruiseInput) => Promise<void>;
  /** Whether cruiseId is editable — false on the edit form (id is stable). */
  lockCruiseId?: boolean;
  headerSlot?: ReactNode;
}

const CruiseForm = ({
  initial = EMPTY_CRUISE,
  submitLabel,
  onSubmit,
  lockCruiseId = false,
  headerSlot,
}: CruiseFormProps) => {
  const [data, setData] = useState<CreateCruiseInput>(initial);
  const [itineraryText, setItineraryText] = useState(joinList(initial.itinerary));
  const [featuresText, setFeaturesText] = useState(
    joinList(initial.shipFeatures),
  );
  const [datesText, setDatesText] = useState(joinList(initial.departureDates));
  const [includesText, setIncludesText] = useState(joinList(initial.includes));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberField = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value === "" ? 0 : Number(value) }));
  };

  const handleCabinField = (
    key: CabinKey,
    field: keyof CruiseCabinInput,
    value: string,
  ) => {
    setData((prev) => ({
      ...prev,
      cabinTypes: {
        ...prev.cabinTypes,
        [key]: {
          ...prev.cabinTypes[key],
          [field]: field === "retailPrice" ? (value === "" ? 0 : Number(value)) : value,
        },
      },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const required: [keyof CreateCruiseInput, string][] = [
      ["cruiseId", "Cruise ID"],
      ["name", "Cruise name"],
      ["cruiseLine", "Cruise line"],
      ["route", "Route"],
      ["departurePort", "Departure port"],
      ["category", "Category"],
    ];
    for (const [field, label] of required) {
      const value = data[field];
      if (typeof value === "string" && !value.trim()) {
        setErrorMessage(`${label} is required.`);
        return;
      }
    }
    if (!Number.isFinite(data.duration) || data.duration <= 0) {
      setErrorMessage("Duration (nights) must be greater than zero.");
      return;
    }

    const payload: CreateCruiseInput = {
      ...data,
      duration: Number(data.duration),
      rating: Number(data.rating) || 0,
      reviews: Number(data.reviews) || 0,
      itinerary: splitList(itineraryText),
      shipFeatures: splitList(featuresText),
      departureDates: splitList(datesText),
      includes: splitList(includesText),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
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
      {headerSlot}

      {/* Identity */}
      <div>
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">Identity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cruiseId" className={labelClass}>
              Cruise ID <span className="text-red-500">*</span>
            </label>
            <input
              id="cruiseId"
              name="cruiseId"
              type="text"
              required
              readOnly={lockCruiseId}
              value={data.cruiseId}
              onChange={handleField}
              placeholder="CR-CAR-001"
              className={`${inputClass} ${lockCruiseId ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>
              Cruise Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={data.name}
              onChange={handleField}
              placeholder="Harmony of the Seas"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cruiseLine" className={labelClass}>
              Cruise Line <span className="text-red-500">*</span>
            </label>
            <input
              id="cruiseLine"
              name="cruiseLine"
              type="text"
              required
              value={data.cruiseLine}
              onChange={handleField}
              placeholder="Royal Caribbean"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="cruiseLineLogo" className={labelClass}>
              Cruise Line Logo URL
            </label>
            <input
              id="cruiseLineLogo"
              name="cruiseLineLogo"
              type="url"
              value={data.cruiseLineLogo ?? ""}
              onChange={handleField}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="image" className={labelClass}>
              Cover Image URL
            </label>
            <input
              id="image"
              name="image"
              type="url"
              value={data.image ?? ""}
              onChange={handleField}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Route & schedule */}
      <div>
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">Route & Schedule</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="route" className={labelClass}>
              Route <span className="text-red-500">*</span>
            </label>
            <input
              id="route"
              name="route"
              type="text"
              required
              value={data.route}
              onChange={handleField}
              placeholder="Miami → Nassau → CocoCay"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="departurePort" className={labelClass}>
              Departure Port <span className="text-red-500">*</span>
            </label>
            <input
              id="departurePort"
              name="departurePort"
              type="text"
              required
              value={data.departurePort}
              onChange={handleField}
              placeholder="Miami, FL"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Category <span className="text-red-500">*</span>
            </label>
            <input
              id="category"
              name="category"
              type="text"
              required
              value={data.category}
              onChange={handleField}
              placeholder="Caribbean"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="duration" className={labelClass}>
              Duration (nights) <span className="text-red-500">*</span>
            </label>
            <input
              id="duration"
              name="duration"
              type="number"
              min={1}
              required
              value={data.duration}
              onChange={handleNumberField}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rating" className={labelClass}>
                Rating
              </label>
              <input
                id="rating"
                name="rating"
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={data.rating}
                onChange={handleNumberField}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="reviews" className={labelClass}>
                Reviews
              </label>
              <input
                id="reviews"
                name="reviews"
                type="number"
                min={0}
                value={data.reviews}
                onChange={handleNumberField}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cabins */}
      <div>
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">Cabin Types</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CABINS.map(({ key, label }) => {
            const cabin = data.cabinTypes[key];
            return (
              <div
                key={key}
                className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5 bg-gray-50/50 dark:bg-white/5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  {label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                  <input
                    type="text"
                    value={cabin.name}
                    onChange={(e) => handleCabinField(key, "name", e.target.value)}
                    placeholder="Display name"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min={0}
                    value={cabin.retailPrice}
                    onChange={(e) =>
                      handleCabinField(key, "retailPrice", e.target.value)
                    }
                    placeholder="Price"
                    className={inputClass}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lists */}
      <div>
        <h2 className="font-bold text-gray-800 dark:text-white mb-4">
          Itinerary & Details
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="itinerary" className={labelClass}>
              Itinerary Stops{" "}
              <span className="text-gray-400 font-normal">(comma or newline separated)</span>
            </label>
            <textarea
              id="itinerary"
              rows={2}
              value={itineraryText}
              onChange={(e) => setItineraryText(e.target.value)}
              placeholder="Miami, CocoCay, Nassau"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="shipFeatures" className={labelClass}>
              Ship Features{" "}
              <span className="text-gray-400 font-normal">(comma or newline separated)</span>
            </label>
            <textarea
              id="shipFeatures"
              rows={2}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="18 Decks, 5,400 Guests, Water Park"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="includes" className={labelClass}>
              Includes{" "}
              <span className="text-gray-400 font-normal">(comma or newline separated)</span>
            </label>
            <textarea
              id="includes"
              rows={2}
              value={includesText}
              onChange={(e) => setIncludesText(e.target.value)}
              placeholder="All meals, Entertainment, Kids club"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="departureDates" className={labelClass}>
              Departure Dates{" "}
              <span className="text-gray-400 font-normal">
                (yyyy-mm-dd, comma or newline separated)
              </span>
            </label>
            <textarea
              id="departureDates"
              rows={2}
              value={datesText}
              onChange={(e) => setDatesText(e.target.value)}
              placeholder="2026-09-14, 2026-10-05, 2026-11-02"
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

export default CruiseForm;
