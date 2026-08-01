"use client";

import { saveBookingDraft } from "@/lib/bookingDraft";
import {
  CASH_PRICE_PER_NIGHT,
  getCashTotal,
  getNights,
  getPointsTotal,
  POINTS_PER_NIGHT,
  UNIT_SLEEPS,
  UNIT_TYPES,
  type BookingSearch,
  type UnitType,
  type VacationType,
} from "@/lib/types/booking";
import { getResortName, type Resort } from "@/lib/types/resort";
import ResortImage from "@/components/resorts/ResortImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaBed, FaCheckCircle, FaMapMarkerAlt, FaMedal, FaUtensils } from "react-icons/fa";

interface AvailableUnitContentProps {
  resort: Resort;
}

// Reads the searched dates/guests back out of the URL that ExchangeGetaways
// built. Falls back to sane defaults if a visitor lands here directly with
// an incomplete query string (e.g. an old bookmark).
const parseSearch = (searchParams: URLSearchParams): BookingSearch => {
  const today = new Date().toISOString().split("T")[0];
  const vacationTypeParam = searchParams.get("vacationType");
  const vacationType: VacationType = vacationTypeParam === "getaways" ? "getaways" : "exchange";

  return {
    earliestDate: searchParams.get("earliestDate") || today,
    latestDate: searchParams.get("latestDate") || today,
    adults: Number(searchParams.get("adults")) || 1,
    children: Number(searchParams.get("children")) || 0,
    vacationType,
  };
};

const AvailableUnitContent = ({ resort }: AvailableUnitContentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = parseSearch(searchParams);
  const isExchange = search.vacationType === "exchange";
  const nights = getNights(search.earliestDate, search.latestDate);
  const resortName = getResortName(resort);

  const handleSelectUnit = (unitType: UnitType) => {
    saveBookingDraft({
      resort,
      search,
      unitType,
      nights,
      checkInAs: "Member",
      cashSubtotal: !isExchange ? getCashTotal(unitType, nights) : undefined,
      totalPoints: isExchange ? getPointsTotal(unitType, nights) : undefined,
    });
    router.push("/checkout");
  };

  const formattedCheckIn = new Date(search.earliestDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedCheckOut = new Date(search.latestDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-8 bg-gray-50 dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/resort-directory/${resort._id}`}
          className="inline-block text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-6"
        >
          &larr; Back to {resortName}
        </Link>

        {/* Header banner */}
        <div
          className={`mb-6 p-6 rounded-2xl shadow-sm text-white ${
            isExchange ? "bg-[#18294B]" : "bg-[#0077be]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              {isExchange ? <FaMedal className="w-7 h-7" /> : <FaUtensils className="w-7 h-7" />}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isExchange ? "Points Exchange" : "Getaway Vacation"}
              </h1>
              <p className="text-sm opacity-90 font-medium">
                {isExchange
                  ? "Redeem your Interval points for this exclusive stay"
                  : "Book with our competitive member rates"}
              </p>
            </div>
          </div>
        </div>

        {/* Reservation details */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 dark:text-white text-lg">
              Reservation Details
            </h2>
            <span className="px-3 py-1 bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] text-xs font-bold rounded-full uppercase">
              Confirmed Availability
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                Check-in
              </p>
              <p className="font-bold text-gray-800 dark:text-white mt-1">{formattedCheckIn}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                Check-out
              </p>
              <p className="font-bold text-gray-800 dark:text-white mt-1">{formattedCheckOut}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                Duration
              </p>
              <p className="font-bold text-gray-800 dark:text-white mt-1">{nights} Nights</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                Occupancy
              </p>
              <p className="font-bold text-gray-800 dark:text-white mt-1">
                {search.adults + search.children} Guests
              </p>
            </div>
          </div>
        </div>

        {/* Resort summary */}
        <div className="border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden mb-8 shadow-sm bg-white dark:bg-[#16223d]">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0">
              <ResortImage src={resort.img} alt={resortName} sizes="224px" />
            </div>
            <div className="p-6 grow flex flex-col justify-center">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                    {resortName}
                  </h3>
                  {resort.location && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                      <FaMapMarkerAlt className="shrink-0" />
                      {resort.location}
                    </p>
                  )}
                </div>
                {resort.symbol && (
                  <span className="bg-gray-800 dark:bg-white/10 text-white px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase shrink-0">
                    {resort.symbol}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unit cards */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#0077be] rounded-full" />
          Select Available Unit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {UNIT_TYPES.map((unitType) => (
            <div
              key={unitType}
              className="group border-2 border-white dark:border-white/10 bg-white dark:bg-[#16223d] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-gray-200 dark:hover:border-white/20 transition-all duration-300"
            >
              <div
                className={`py-4 px-4 text-white text-center font-bold tracking-wide uppercase text-sm ${
                  isExchange ? "bg-[#18294B]" : "bg-[#0077be]"
                }`}
              >
                {unitType}
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  {isExchange ? (
                    <>
                      <p className="text-3xl font-black text-[#18294B] dark:text-[#7fb8e6]">
                        {getPointsTotal(unitType, nights).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mt-1">
                        total points
                      </p>
                      <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-100 dark:border-white/10">
                        <span className="font-bold text-[#18294B] dark:text-[#7fb8e6]">
                          {POINTS_PER_NIGHT[unitType].toLocaleString()}
                        </span>{" "}
                        pts/night &times; {nights} nights
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-black text-[#0077be] dark:text-[#7fb8e6]">
                        ${getCashTotal(unitType, nights).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mt-1">
                        total price
                      </p>
                      <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-100 dark:border-white/10">
                        <span className="font-bold text-[#0077be] dark:text-[#7fb8e6]">
                          ${CASH_PRICE_PER_NIGHT[unitType]}
                        </span>
                        /night &times; {nights} nights
                      </div>
                    </>
                  )}
                </div>

                <div className="text-[11px] text-gray-600 dark:text-gray-400 mb-6 space-y-2 border-t border-gray-50 dark:border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500 shrink-0" />
                    <span>
                      Status:{" "}
                      <span className="font-bold text-green-600 dark:text-green-400">
                        Immediate Confirmation
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUtensils className="text-blue-400 shrink-0" />
                    <span>Unit: Full Kitchen Facilities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBed className="text-gray-400 shrink-0" />
                    <span>Sleeps up to {UNIT_SLEEPS[unitType]} guests</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectUnit(unitType)}
                  className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-sm hover:shadow-md text-white ${
                    isExchange
                      ? "bg-[#18294B] hover:bg-[#0f1d35]"
                      : "bg-[#0077be] hover:bg-[#005a8e]"
                  }`}
                >
                  Select Unit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailableUnitContent;
