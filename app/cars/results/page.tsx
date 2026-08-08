"use client";

// Car results page. Reads the search from the URL, asks the server for
// cars pre-priced for this trip's length + mileage estimate, then lets
// the member filter by category/vendor/transmission on the client.
import { searchCars } from "@/lib/api/cars";
import { saveCarDraft } from "@/lib/carDraft";
import type { Car, CarSearchResult } from "@/lib/types/car";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { FaCar, FaCogs, FaGasPump, FaSnowflake, FaStar, FaSuitcase, FaUser } from "react-icons/fa";

interface ParsedSearch {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  rentalDays: number;
  estimatedDailyMiles: number;
}

function parseSearch(params: URLSearchParams): ParsedSearch {
  const days = Number.parseInt(params.get("rentalDays") ?? "", 10);
  const miles = Number.parseInt(params.get("estimatedDailyMiles") ?? "", 10);
  return {
    pickupLocation: params.get("pickup") ?? "",
    dropoffLocation: params.get("dropoff") ?? "",
    pickupDate: params.get("pickupDate") ?? "",
    dropoffDate: params.get("dropoffDate") ?? "",
    rentalDays: Number.isFinite(days) && days > 0 ? days : 1,
    estimatedDailyMiles: Number.isFinite(miles) && miles >= 0 ? miles : 0,
  };
}

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "economy", label: "Economy" },
  { value: "compact", label: "Compact" },
  { value: "midsize", label: "Midsize" },
  { value: "fullsize", label: "Full Size" },
  { value: "suv", label: "SUV" },
  { value: "minivan", label: "Minivan" },
  { value: "luxury", label: "Luxury" },
];

const CarsResultsInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = useMemo(
    () => parseSearch(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [result, setResult] = useState<CarSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedTransmission, setSelectedTransmission] = useState<
    "all" | "Automatic" | "Manual"
  >("all");
  const [sortBy, setSortBy] = useState<"best" | "cheapest" | "biggest" | "rating">(
    "cheapest",
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await searchCars({
          rentalDays: search.rentalDays,
          estimatedDailyMiles: search.estimatedDailyMiles,
        });
        if (!cancelled) setResult(data);
      } catch (error) {
        if (!cancelled)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load cars right now.",
          );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search.rentalDays, search.estimatedDailyMiles]);

  const cars = result?.cars ?? [];

  const vendors = useMemo(() => {
    const set = new Set<string>();
    for (const car of cars) set.add(car.vendor);
    return Array.from(set).sort();
  }, [cars]);

  const filteredCars = useMemo(() => {
    let list = cars.filter((car) => {
      if (selectedCategory !== "all" && car.category !== selectedCategory)
        return false;
      if (selectedVendor !== "all" && car.vendor !== selectedVendor) return false;
      if (selectedTransmission !== "all" && car.transmission !== selectedTransmission)
        return false;
      return true;
    });

    if (sortBy === "cheapest") {
      list = [...list].sort(
        (a, b) => a.pricing.discountedTotal - b.pricing.discountedTotal,
      );
    } else if (sortBy === "biggest") {
      list = [...list].sort((a, b) => b.passengers - a.passengers);
    } else if (sortBy === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [cars, selectedCategory, selectedVendor, selectedTransmission, sortBy]);

  const handleSelectCar = (car: Car) => {
    saveCarDraft({
      car,
      pickupLocation: search.pickupLocation,
      dropoffLocation: search.dropoffLocation,
      pickupDate: search.pickupDate,
      dropoffDate: search.dropoffDate,
      rentalDays: search.rentalDays,
      estimatedDailyMiles: search.estimatedDailyMiles,
    });
    router.push("/cars/detail");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Cars in {search.pickupLocation || "Any"}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {search.pickupDate} → {search.dropoffDate} &bull; {search.rentalDays}{" "}
            day{search.rentalDays !== 1 ? "s" : ""} &bull; ~
            {search.estimatedDailyMiles} mi/day
          </p>
          <p className="text-sm text-[#0077be] dark:text-[#7fb8e6] mt-2 font-medium">
            {isLoading
              ? "Loading cars..."
              : `${filteredCars.length} of ${cars.length} cars match your filters`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside>
            <div className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6 lg:sticky lg:top-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Category
                </p>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Vendor
                </p>
                <select
                  value={selectedVendor}
                  onChange={(event) => setSelectedVendor(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map((vendor) => (
                    <option key={vendor} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Transmission
                </p>
                <select
                  value={selectedTransmission}
                  onChange={(event) =>
                    setSelectedTransmission(
                      event.target.value as typeof selectedTransmission,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                >
                  <option value="all">Any</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="flex flex-wrap gap-2 mb-6">
              {(
                [
                  ["cheapest", "Cheapest"],
                  ["biggest", "Most Passengers"],
                  ["rating", "Highest Rated"],
                  ["best", "Recommended"],
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
                    className="h-44 bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10"
                  />
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-10 text-center text-gray-600 dark:text-gray-300">
                No cars match the current filters.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCars.map((car) => (
                  <CarResultCard
                    key={car._id}
                    car={car}
                    rentalDays={search.rentalDays}
                    onSelect={() => handleSelectCar(car)}
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

interface CarResultCardProps {
  car: Car;
  rentalDays: number;
  onSelect: () => void;
}

const CarResultCard = ({ car, rentalDays, onSelect }: CarResultCardProps) => {
  const perDay = car.pricing.discountedTotal / Math.max(1, rentalDays);
  return (
    <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:shadow-md transition">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-6 items-center">
        <div className="relative h-32 md:h-36 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
          {car.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={car.image}
              alt={car.brand}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <FaCar className="w-12 h-12 text-gray-300" />
          )}
        </div>

        <div>
          <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            {car.type}
          </p>
          <p className="font-bold text-gray-800 dark:text-white text-lg">
            {car.brand}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
            {car.vendor} &bull;{" "}
            <span className="flex items-center gap-1 text-amber-500">
              <FaStar className="w-3 h-3" /> {car.rating.toFixed(1)}{" "}
              <span className="text-gray-500 dark:text-gray-400">
                ({car.reviewCount})
              </span>
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <FaUser /> {car.passengers}
            </span>
            <span className="flex items-center gap-1">
              <FaSuitcase /> {car.bags} bags
            </span>
            <span className="flex items-center gap-1">
              <FaCogs /> {car.transmission}
            </span>
            <span className="flex items-center gap-1">
              <FaGasPump /> {car.fuelType}
            </span>
            {car.airConditioning && (
              <span className="flex items-center gap-1">
                <FaSnowflake /> A/C
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {car.mileagePolicy}
            {car.freeMilesPerDay > 0 && car.pricing.mileageOverageTotal > 0 && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                (+{formatMoney(car.pricing.mileageOverageTotal)} mileage overage)
              </span>
            )}
          </p>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/10 md:pl-6 pt-4 md:pt-0 text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
            {formatMoney(car.pricing.subtotal)}
          </p>
          <p className="text-2xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
            {formatMoney(car.pricing.discountedTotal)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
            Member savings applied
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatMoney(perDay)}/day &bull; {rentalDays} day
            {rentalDays !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            or {car.pricing.totalPoints.toLocaleString()} pts
          </p>
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

const CarsResultsPage = () => (
  <Suspense fallback={<div className="p-8 text-gray-500">Loading cars...</div>}>
    <CarsResultsInner />
  </Suspense>
);

export default CarsResultsPage;
