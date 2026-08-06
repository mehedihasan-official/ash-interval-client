"use client";

// Admin resort-edit form. Same field set and layout as the "Add Resort"
// form (app/dashboard/admin/resorts/new/page.tsx) so an edited resort
// keeps rendering correctly everywhere else in the app — the two forms
// are intentionally kept in sync rather than sharing a component, since
// they load data differently (this one fetches an existing resort first)
// and that's the only real difference between them.
import Loading from "@/components/resorts/Loading";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import { updateResort, type UpdateResortInput } from "@/lib/api/admin";
import { getResortById } from "@/lib/api/resorts";
import { getResortRegions, type Resort } from "@/lib/types/resort";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Swal from "sweetalert2";

const EMPTY_RESORT: UpdateResortInput = {
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
};

const TEXT_FIELDS: Array<{ name: keyof UpdateResortInput; label: string; required: boolean }> = [
  { name: "resortName", label: "Resort Name", required: true },
  { name: "location", label: "Location", required: true },
  { name: "symbol", label: "Symbol / Code", required: false },
  { name: "region", label: "Region", required: false },
  { name: "country", label: "Country", required: true },
  { name: "continent", label: "Continent", required: false },
  { name: "nearestAirport", label: "Nearest Airport", required: false },
  { name: "contactInfo", label: "Contact Information", required: false },
];

const IMAGE_FIELDS: Array<{ name: keyof UpdateResortInput; label: string }> = [
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
const labelClass = "block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5";

// Converts a loaded Resort (where fields can be missing, or `region` in
// particular can be a string or an array — see getResortRegions) into the
// flat, all-strings shape this form's inputs work with.
const toFormValues = (resort: Resort): UpdateResortInput => ({
  resortName: (resort.resortName as string) || resort.place_name || "",
  location: resort.location || "",
  symbol: resort.symbol || "",
  region: getResortRegions(resort).join(", "),
  country: resort.country || "",
  continent: (resort.continent as string) || "",
  description: resort.description || "",
  onSite: resort.onSite || "",
  nearby: resort.nearby || "",
  contactInfo: resort.contactInfo || "",
  nearestAirport: resort.nearestAirport || "",
  checkInDays: Array.isArray(resort.checkInDays) ? resort.checkInDays : [],
  img: resort.img || "",
  img2: resort.img2 || "",
  img3: resort.img3 || "",
  img4: resort.img4 || "",
});

interface AdminEditResortPageProps {
  params: Promise<{ id: string }>;
}

const AdminEditResortPage = ({ params }: AdminEditResortPageProps) => {
  const { id: resortId } = use(params);
  const router = useRouter();

  const [resortData, setResortData] = useState<UpdateResortInput>(EMPTY_RESORT);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadResort = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const resort = await getResortById(resortId);
        if (isCancelled) return;
        if (!resort) {
          setLoadError("This resort could not be found. It may have been deleted.");
          return;
        }
        setResortData(toFormValues(resort));
      } catch (error) {
        if (isCancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Something went wrong loading this resort.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadResort();
    return () => {
      isCancelled = true;
    };
  }, [resortId, reloadToken]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setResortData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckInDayToggle = (day: string) => {
    setResortData((prev) => ({
      ...prev,
      checkInDays: (prev.checkInDays ?? []).includes(day)
        ? (prev.checkInDays ?? []).filter((d) => d !== day)
        : [...(prev.checkInDays ?? []), day],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !resortData.resortName?.trim() ||
      !resortData.location?.trim() ||
      !resortData.country?.trim()
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
      await updateResort(resortId, resortData);
      await Swal.fire({
        title: "Resort updated!",
        text: `${resortData.resortName} has been updated successfully.`,
        icon: "success",
        confirmButtonColor: "#0077be",
      });
      router.push("/dashboard/admin");
    } catch (error) {
      Swal.fire({
        title: "Couldn't update resort",
        text: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#0077be",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (loadError) {
    return (
      <div className="max-w-3xl">
        <ResortLoadError
          message={loadError}
          onRetry={() => setReloadToken((token) => token + 1)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Edit Resort</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Changes here update the live listing in the resort directory and booking flow
        as soon as they&apos;re saved.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-6 space-y-6 shadow-sm"
      >
        {/* Basic details */}
        <div>
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">Basic Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEXT_FIELDS.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className={labelClass}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  required={field.required}
                  value={(resortData[field.name] as string) ?? ""}
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
            value={resortData.description ?? ""}
            onChange={handleChange}
            placeholder="Describe the resort, its setting, and what makes it stand out"
            className={inputClass}
          />
        </div>

        {/* Amenities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="onSite" className={labelClass}>
              On-Site Activities <span className="text-gray-400">(comma separated)</span>
            </label>
            <input
              id="onSite"
              name="onSite"
              type="text"
              value={resortData.onSite ?? ""}
              onChange={handleChange}
              placeholder="Pool, Spa, Tennis Court"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="nearby" className={labelClass}>
              Nearby Attractions <span className="text-gray-400">(comma separated)</span>
            </label>
            <input
              id="nearby"
              name="nearby"
              type="text"
              value={resortData.nearby ?? ""}
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
              const isSelected = (resortData.checkInDays ?? []).includes(day);
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
          <h2 className="font-bold text-gray-800 dark:text-white mb-4">Images</h2>
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
                  value={(resortData[field.name] as string) ?? ""}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-lg transition"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="sm:w-40 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 font-bold px-5 py-3 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditResortPage;
