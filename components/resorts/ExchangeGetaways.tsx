"use client";

// Lets a visitor choose how they'd pay for a stay — Exchange (points)
// or Getaways (cash) — and shows the matching per-unit pricing tiers,
// mirroring Interval's real points/cash booking options. Once dates and
// guests are set, "Search Available Units" hands off to the available-unit
// page, which is where an actual unit gets picked.
import { useAuth } from "@/lib/providers/AuthProvider";
import type { Resort } from "@/lib/types/resort";
import type { BookingSearch } from "@/lib/types/booking";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

type VacationType = "exchange" | "getaways";

interface ExchangeGetawaysProps {
  resort: Resort;
}

const POINTS_TIERS = [
  { unit: "Studio", price: "2,000" },
  { unit: "1 Bedroom", price: "3,000 – 4,000" },
  { unit: "2 Bedroom", price: "4,000 – 5,000" },
  { unit: "3 Bedroom", price: "5,000 – 7,000" },
  { unit: "4+ Bedroom", price: "8,000 – 12,000" },
];

const CASH_TIERS = [
  { unit: "Studio", price: "$50/night" },
  { unit: "1 Bedroom", price: "$60/night" },
  { unit: "2 Bedroom", price: "$72/night" },
  { unit: "3 Bedroom", price: "$80/night" },
  { unit: "4+ Bedroom", price: "$100/night" },
];

const ExchangeGetaways = ({ resort }: ExchangeGetawaysProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const [vacationType, setVacationType] = useState<VacationType>("exchange");
  const [earliestDate, setEarliestDate] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const isExchange = vacationType === "exchange";

  // Validates the search, then hands off to the available-unit page for
  // this resort. Travel dates + guests are passed as a query string (the
  // available-unit page reads them back out) rather than through app
  // state, since this is a normal, bookmarkable/shareable search — signed
  // out visitors are prompted to sign in first, matching the rest of the
  // site's search -> details -> login -> booking journey.
  const handleSearch = () => {
    if (!earliestDate || !latestDate) {
      Swal.fire({
        icon: "warning",
        title: "Select your travel dates",
        text: "Please choose both an earliest and latest travel date.",
        confirmButtonColor: "#0077be",
      });
      return;
    }

    if (new Date(latestDate) < new Date(earliestDate)) {
      Swal.fire({
        icon: "warning",
        title: "Check your travel dates",
        text: "Your latest travel date should be on or after the earliest one.",
        confirmButtonColor: "#0077be",
      });
      return;
    }

    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Sign in to search availability",
        text: "Create a free account or sign in to see available units.",
        confirmButtonColor: "#0077be",
      });
      router.push("/login");
      return;
    }

    const search: BookingSearch = {
      earliestDate,
      latestDate,
      adults,
      children,
      vacationType,
    };

    const query = new URLSearchParams({
      earliestDate: search.earliestDate,
      latestDate: search.latestDate,
      adults: String(search.adults),
      children: String(search.children),
      vacationType: search.vacationType,
    });

    router.push(`/resort-directory/${resort._id}/available-unit?${query.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg p-4 md:p-6">
      {/* Exchange / Getaways toggle */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => setVacationType("exchange")}
          className={`px-6 py-2.5 font-semibold text-sm rounded-l-md border-2 transition-all ${
            isExchange
              ? "bg-[#18294B] text-white border-[#18294B]"
              : "border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          Exchange <span className="text-xs opacity-75">(Points)</span>
        </button>
        <button
          type="button"
          onClick={() => setVacationType("getaways")}
          className={`px-6 py-2.5 font-semibold text-sm rounded-r-md border-2 border-l-0 transition-all ${
            !isExchange
              ? "bg-[#0077be] text-white border-[#0077be]"
              : "border-gray-300 dark:border-white/20 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          Getaways <span className="text-xs opacity-75">(Cash)</span>
        </button>
      </div>

      {/* Pricing summary for the selected option */}
      <div
        className={`mb-5 p-4 rounded-lg border ${
          isExchange
            ? "bg-[#18294B] border-[#18294B]"
            : "bg-[#0077be] border-[#0077be]"
        }`}
      >
        <h2 className="text-lg font-bold text-white mb-1">
          {isExchange ? "Exchange Vacation (Points)" : "Getaway Vacation (Cash)"}
        </h2>
        <p className="text-sm text-gray-200">
          {isExchange
            ? "Book with points at our competitive rates."
            : "Book with cash at our competitive Last Call rates."}
        </p>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {(isExchange ? POINTS_TIERS : CASH_TIERS).map((tier) => (
            <div
              key={tier.unit}
              className={`bg-white rounded p-2 text-center border ${
                isExchange ? "border-[#18294B]" : "border-[#0077be]"
              }`}
            >
              <p
                className={`font-semibold ${isExchange ? "text-[#18294B]" : "text-[#0077be]"}`}
              >
                {tier.unit}
              </p>
              <p
                className={`font-bold ${isExchange ? "text-[#18294B]" : "text-[#0077be]"}`}
              >
                {tier.price}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-200 mt-2">
          {isExchange
            ? "* Final points will be calculated based on the total number of nights selected."
            : "* Prices shown before tax."}
        </p>
      </div>

      {/* Travel dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1 text-sm">
            Earliest Travel Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#0077be] focus:outline-none"
            value={earliestDate}
            min={today}
            onChange={(event) => setEarliestDate(event.target.value)}
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1 text-sm">
            Latest Travel Date
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#0077be] focus:outline-none"
            value={latestDate}
            min={earliestDate || today}
            onChange={(event) => setLatestDate(event.target.value)}
          />
        </div>
      </div>

      <hr className="my-4 border-gray-200 dark:border-white/10" />

      {/* Guests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1 text-sm">
            Adults
          </label>
          <select
            className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm"
            value={adults}
            onChange={(event) => setAdults(Number(event.target.value))}
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1 text-sm">
            Children
          </label>
          <select
            className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-md px-3 py-2 text-sm"
            value={children}
            onChange={(event) => setChildren(Number(event.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => i).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className={`w-full text-white font-bold py-3 rounded-lg transition-colors ${
          isExchange
            ? "bg-[#18294B] hover:bg-[#0f1d35]"
            : "bg-[#0077be] hover:bg-[#005a8e]"
        }`}
      >
        Search Available Units ({isExchange ? "Points" : "Cash"})
      </button>
    </div>
  );
};

export default ExchangeGetaways;
