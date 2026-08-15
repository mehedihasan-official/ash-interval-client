"use client";

// Step 2 of the booking funnel: review the selected unit, choose who's
// checking in, and see the cost breakdown before moving on to payment.
// Reads the in-progress booking from sessionStorage (see
// lib/bookingDraft.ts) rather than a route param, since there's nothing
// meaningful to put in the URL here — this is a continuation of whatever
// unit was just picked on the available-unit page.
import BookingSteps from "@/components/resorts/BookingSteps";
import ResortImage from "@/components/resorts/ResortImage";
import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from "@/lib/bookingDraft";
import { formatIsoDate } from "@/lib/dateFormat";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  CASH_TAXES_AND_FEES,
  getCashTotalWithTax,
  type BookingDraft,
} from "@/lib/types/booking";
import { getResortName } from "@/lib/types/resort";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaMapMarkerAlt, FaMedal, FaUser, FaUserFriends, FaUtensils } from "react-icons/fa";
import Swal from "sweetalert2";

const CheckoutPage = () => {
  const router = useRouter();
  const { user, role } = useAuth();
  // Booking drafts only exist in the browser (sessionStorage), so this is
  // read via a lazy initializer — it runs during the client's first render
  // rather than needing a separate effect + extra re-render to populate it.
  const [draft, setDraft] = useState<BookingDraft | null>(() => loadBookingDraft());

  if (!draft) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            No Booking In Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn&apos;t find a unit selection to check out. Please start your search again
            from a resort page.
          </p>
          <Link
            href="/resort-directory"
            className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            Browse Resort Directory
          </Link>
        </div>
      </div>
    );
  }

  const { resort, search, unitType, nights, cashSubtotal, totalPoints, checkInAs } = draft;
  const isPoints = search.vacationType === "exchange";
  const resortName = getResortName(resort);
  const cashTotalWithTax = !isPoints ? getCashTotalWithTax(unitType, nights) : 0;

  const handleCheckInAsChange = (value: "Member" | "Guest") => {
    const updated: BookingDraft = { ...draft, checkInAs: value };
    setDraft(updated);
    saveBookingDraft(updated);
  };

  const handleContinue = () => {
    if (role === "admin") {
      Swal.fire({
        icon: "info",
        title: "Admins can't make bookings",
        text: "Sign in with a member account to complete a booking.",
        confirmButtonColor: "#0077be",
      });
      clearBookingDraft();
      router.push("/dashboard");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    router.push("/payment");
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-[#18294B] dark:text-white">
          Checkout
        </h1>

        <BookingSteps currentStep={1} />

        {/* Payment mode badge */}
        <div
          className={`mb-6 p-4 rounded-xl border ${
            isPoints
              ? "bg-blue-50 dark:bg-white/5 border-blue-200 dark:border-white/10"
              : "bg-blue-50 dark:bg-white/5 border-[#0077be]/20 dark:border-white/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg text-white ${isPoints ? "bg-[#18294B]" : "bg-[#0077be]"}`}
            >
              {isPoints ? <FaMedal /> : <FaUtensils />}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 dark:text-white">
                {isPoints ? "Points Exchange Booking" : "Getaway Vacation Booking"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {isPoints
                  ? "You are redeeming your Interval points for this vacation."
                  : "You are paying with card for this exclusive member rate."}
              </p>
            </div>
          </div>
        </div>

        {/* Resort & booking summary */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-40 h-40 shrink-0">
              <ResortImage
                src={resort.img}
                alt={resortName}
                seed={resort._id || resortName}
                sizes="160px"
              />
            </div>
            <div className="p-4 grow">
              <h3 className="text-lg font-bold text-[#18294B] dark:text-white">{resortName}</h3>
              {resort.location && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="shrink-0" />
                  {resort.location}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                <p>
                  <span className="font-semibold">Unit:</span> {unitType}
                </p>
                <p>
                  <span className="font-semibold">Nights:</span> {nights}
                </p>
                <p>
                  <span className="font-semibold">Check-in:</span>{" "}
                  {formatIsoDate(search.earliestDate)}
                </p>
                <p>
                  <span className="font-semibold">Check-out:</span>{" "}
                  {formatIsoDate(search.latestDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Cost summary */}
          <div
            className={`p-4 border-t border-gray-100 dark:border-white/10 ${
              isPoints ? "bg-blue-50 dark:bg-white/5" : "bg-blue-50/50 dark:bg-white/5"
            }`}
          >
            {isPoints ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Total points required</span>
                  <span className="font-semibold">{totalPoints?.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-white/10 pt-2 mt-2">
                  <span className="text-gray-800 dark:text-white">Total</span>
                  <span className="text-[#18294B] dark:text-[#7fb8e6]">
                    {totalPoints?.toLocaleString()} pts
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Base price (${(cashSubtotal ?? 0) / nights} &times; {nights} nights)</span>
                  <span className="font-semibold">${(cashSubtotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Tax &amp; Fees</span>
                  <span>${CASH_TAXES_AND_FEES.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-200 dark:border-white/10 pt-2 mt-2">
                  <span className="text-gray-800 dark:text-white">Total (tax inclusive)</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    ${cashTotalWithTax.toFixed(2)} USD
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Who's checking in */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Who&apos;s Checking In?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(["Member", "Guest"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleCheckInAsChange(option)}
                className={`py-3 rounded-lg border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  checkInAs === option
                    ? isPoints
                      ? "border-[#18294B] bg-[#18294B] text-white"
                      : "border-[#0077be] bg-[#0077be] text-white"
                    : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                {option === "Member" ? <FaUser /> : <FaUserFriends />}
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {checkInAs === "Member"
              ? "You (the member) will check in for this vacation."
              : "A guest will check in for this vacation."}
          </p>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 bg-white dark:bg-[#16223d] border-t border-gray-200 dark:border-white/10 shadow-lg p-4 -mx-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-t-xl sm:rounded-none">
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total amount</p>
            {isPoints ? (
              <p className="text-xl font-bold text-[#18294B] dark:text-[#7fb8e6]">
                {totalPoints?.toLocaleString()} <span className="text-sm">points</span>
              </p>
            ) : (
              <p className="text-xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
                ${cashTotalWithTax.toFixed(2)}{" "}
                <span className="text-sm text-gray-500 dark:text-gray-400">USD</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-colors ${
              isPoints ? "bg-[#18294B] hover:bg-[#0f1d35]" : "bg-[#0077be] hover:bg-[#005a8e]"
            }`}
          >
            {isPoints ? "Continue to Redeem Points" : "Continue to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
