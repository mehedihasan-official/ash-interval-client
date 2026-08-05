"use client";

import ResortImage from "@/components/resorts/ResortImage";
import BookingSteps from "@/components/resorts/BookingSteps";
import { clearBookingDraft, loadBookingDraft } from "@/lib/bookingDraft";
import { getCashTotalWithTax, type BookingDraft } from "@/lib/types/booking";
import { getResortName } from "@/lib/types/resort";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCalendarCheck, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";

const ConfirmationContent = () => {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  // Read the draft once via a lazy initializer so the receipt has data on
  // the very first render — no separate effect/re-render needed for that
  // part.
  const [draft] = useState<BookingDraft | null>(() => loadBookingDraft());

  // Clearing sessionStorage is a genuine one-time side effect (not a
  // setState call), so it belongs in an effect: once the receipt has been
  // read into `draft` above, the draft no longer needs to linger in
  // storage after this page has shown it.
  useEffect(() => {
    clearBookingDraft();
  }, []);

  if (!draft) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <FaCheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            Booking Confirmed
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your reservation was completed successfully.
            {bookingId && (
              <>
                {" "}
                Confirmation number: <span className="font-mono font-semibold">{bookingId}</span>
              </>
            )}
          </p>
          <Link
            href="/my-bookings"
            className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { resort, search, unitType, nights, totalPoints, checkInAs } = draft;
  const isPoints = search.vacationType === "exchange";
  const resortName = getResortName(resort);
  const cashTotalWithTax = !isPoints ? getCashTotalWithTax(unitType, nights) : 0;

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <BookingSteps currentStep={3} />

        {/* Success banner */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#18294B] dark:text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            A confirmation has been recorded for your upcoming stay at {resortName}.
          </p>
          {bookingId && (
            <p className="mt-3 inline-block bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-full px-4 py-1.5 text-sm font-mono text-gray-700 dark:text-gray-300">
              Confirmation #{bookingId}
            </p>
          )}
        </div>

        {/* Receipt card */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-44 h-40 shrink-0">
              <ResortImage
                src={resort.img}
                alt={resortName}
                seed={resort._id || resortName}
                sizes="176px"
              />
            </div>
            <div className="p-4 grow">
              <h2 className="text-lg font-bold text-[#18294B] dark:text-white">{resortName}</h2>
              {resort.location && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="shrink-0" />
                  {resort.location}
                </p>
              )}
              <div className="grid grid-cols-2 gap-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Unit:</span> {unitType}
                </p>
                <p>
                  <span className="font-semibold">Checking in as:</span> {checkInAs}
                </p>
                <p>
                  <span className="font-semibold">Check-in:</span>{" "}
                  {new Date(search.earliestDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Check-out:</span>{" "}
                  {new Date(search.latestDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Nights:</span> {nights}
                </p>
                <p>
                  <span className="font-semibold">Guests:</span>{" "}
                  {search.adults + search.children}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-4 border-t border-gray-100 dark:border-white/10 bg-blue-50 dark:bg-white/5">
            <FaCalendarCheck className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {isPoints ? (
                <>
                  <strong>{totalPoints?.toLocaleString()} points</strong> redeemed for this stay.
                </>
              ) : (
                <>
                  <strong>${cashTotalWithTax.toFixed(2)} USD</strong> charged for this stay (tax
                  included).
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/my-bookings"
            className="text-center bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded-lg hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            View My Bookings
          </Link>
          <Link
            href="/resort-directory"
            className="text-center bg-white dark:bg-white/10 text-[#18294B] dark:text-white border border-gray-200 dark:border-white/10 font-bold px-6 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition"
          >
            Browse More Resorts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationContent;
