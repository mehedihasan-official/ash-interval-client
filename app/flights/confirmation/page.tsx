"use client";

// Confirmation page. Loads the booking by its reference (from the ?ref
// query param) so a refresh or share-link still resolves the booking
// out of the database instead of relying on client-side draft state.
import { getFlightBookingByReference } from "@/lib/api/flights";
import type { FlightBooking } from "@/lib/types/flight";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaArrowRight, FaCheckCircle, FaCopy, FaPlane } from "react-icons/fa";

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const formatDate = (iso: string) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const ConfirmationInner = () => {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref") ?? "";

  const [booking, setBooking] = useState<FlightBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!reference) {
        setErrorMessage("Booking reference is missing from the URL.");
        setIsLoading(false);
        return;
      }
      try {
        const result = await getFlightBookingByReference(reference);
        if (cancelled) return;
        if (!result) {
          setErrorMessage("We could not find a booking with that reference.");
        } else {
          setBooking(result);
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load the booking right now.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const handleCopy = async () => {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.bookingReference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked (e.g. non-secure origin) — the
      // reference is still visible next to the button so the member can
      // copy it manually.
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading your booking...
      </div>
    );
  }

  if (errorMessage || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {errorMessage ?? "Booking not found."}
        </p>
        <Link
          href="/flights"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Back to flight search
        </Link>
      </div>
    );
  }

  const snap = booking.flightSnapshot;
  const pricing = booking.pricing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-6 text-center">
          <FaCheckCircle className="text-green-500 w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            A confirmation email is on its way to {booking.contactInfo.email}.
          </p>
        </div>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
            Booking Reference
          </p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {booking.bookingReference}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-sm text-[#0077be] dark:text-[#7fb8e6] hover:underline flex items-center gap-1"
            >
              <FaCopy /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0077be]/10 dark:bg-white/10 flex items-center justify-center">
              <FaPlane className="text-[#0077be] dark:text-[#7fb8e6] w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white">
                {snap.airline}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {snap.flightNumber} &bull; {snap.aircraft}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 pt-4">
            <div>
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {snap.departureTime}
              </p>
              <p className="text-sm font-semibold text-[#0077be] dark:text-[#7fb8e6]">
                {snap.origin}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {snap.originCity}
              </p>
            </div>
            <FaArrowRight className="text-[#0077be]" />
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800 dark:text-white">
                {snap.arrivalTime}
              </p>
              <p className="text-sm font-semibold text-[#0077be] dark:text-[#7fb8e6]">
                {snap.destination}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {snap.destinationCity}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <SummaryItem label="Date" value={formatDate(booking.departureDate)} />
            <SummaryItem label="Duration" value={snap.duration} />
            <SummaryItem label="Cabin" value={snap.cabinClass} />
            <SummaryItem label="Baggage" value={snap.baggage} />
          </div>
        </section>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Passengers
          </h2>
          <div className="space-y-3">
            {booking.passengers.map((passenger, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-white/5 last:border-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {passenger.firstName} {passenger.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {passenger.type} &bull; Meal: {passenger.mealPreference}
                  </p>
                </div>
                {passenger.seat && (
                  <span className="text-xs font-semibold text-[#0077be] dark:text-[#7fb8e6] bg-blue-50 dark:bg-white/5 px-3 py-1 rounded-full">
                    Seat: {passenger.seat}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Payment
          </h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-700 dark:text-gray-200">
              <span>Method</span>
              <span className="font-semibold">
                {booking.paymentMethod === "cash"
                  ? "Credit / Debit Card"
                  : "Points"}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-200">
              <span>Flight</span>
              <span>
                {booking.paymentMethod === "cash"
                  ? formatMoney(pricing.discountedPrice)
                  : `${pricing.totalPoints.toLocaleString()} pts`}
              </span>
            </div>
            {(pricing.addOnsCash > 0 || pricing.addOnsPoints > 0) && (
              <div className="flex justify-between text-gray-700 dark:text-gray-200">
                <span>Add-ons</span>
                <span>
                  {booking.paymentMethod === "cash"
                    ? formatMoney(pricing.addOnsCash)
                    : `${pricing.addOnsPoints.toLocaleString()} pts`}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between font-bold text-gray-800 dark:text-white">
              <span>Total charged</span>
              <span className="text-[#0077be] dark:text-[#7fb8e6]">
                {booking.paymentMethod === "cash"
                  ? formatMoney(pricing.grandTotalCash)
                  : `${pricing.grandTotalPoints.toLocaleString()} pts`}
              </span>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/flights"
            className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Book another flight
          </Link>
          <Link
            href="/dashboard"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-bold py-3 px-6 rounded-lg hover:border-[#0077be]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-sm text-gray-800 dark:text-white mt-1">{value}</p>
  </div>
);

const FlightConfirmationPage = () => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    }
  >
    <ConfirmationInner />
  </Suspense>
);

export default FlightConfirmationPage;
