"use client";

// Car booking confirmation. Loads by reference so a page refresh or a
// shared link still resolves the booking out of the database rather
// than depending on client-side draft state.
import { getCarBookingByReference } from "@/lib/api/cars";
import type { CarBooking } from "@/lib/types/car";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaCar, FaCheckCircle, FaCopy, FaMapMarkerAlt } from "react-icons/fa";

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const ConfirmationInner = () => {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref") ?? "";

  const [booking, setBooking] = useState<CarBooking | null>(null);
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
        const result = await getCarBookingByReference(reference);
        if (cancelled) return;
        if (!result) setErrorMessage("We could not find that booking.");
        else setBooking(result);
      } catch (error) {
        if (!cancelled)
          setErrorMessage(
            error instanceof Error ? error.message : "Could not load booking.",
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
      // Clipboard access may be blocked; the reference stays visible.
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
          href="/cars"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Back to car search
        </Link>
      </div>
    );
  }

  const snap = booking.carSnapshot;
  const pricing = booking.pricing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-6 text-center">
          <FaCheckCircle className="text-green-500 w-10 h-10 mx-auto mb-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-green-800 dark:text-green-200">
            Rental Confirmed!
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
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#0077be]/10 dark:bg-white/10 flex items-center justify-center">
              <FaCar className="text-[#0077be] dark:text-[#7fb8e6] w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-800 dark:text-white text-lg">
                {snap.type} &bull; {snap.brand}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {snap.vendor} &bull; {snap.transmission} &bull; {snap.passengers} passengers
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {snap.mileagePolicy}
            {snap.freeMilesPerDay > 0 && (
              <>
                {" "}(overage at{" "}
                {formatMoney(snap.overageRatePerMile)}/mi over{" "}
                {snap.freeMilesPerDay} mi/day)
              </>
            )}
          </p>
        </section>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Pickup & Return
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Pickup
              </p>
              <p className="text-gray-800 dark:text-white flex items-center gap-2 mt-1">
                <FaMapMarkerAlt className="text-[#0077be]" />{" "}
                {booking.pickupLocation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {booking.pickupDate}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Dropoff
              </p>
              <p className="text-gray-800 dark:text-white flex items-center gap-2 mt-1">
                <FaMapMarkerAlt className="text-[#0077be]" />{" "}
                {booking.dropoffLocation}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {booking.dropoffDate} &bull; {booking.rentalDays} day
                {booking.rentalDays !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
            Drivers
          </h2>
          <div className="space-y-2">
            {booking.drivers.map((driver, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    License {driver.licenseNumber} ({driver.licenseCountry})
                  </p>
                </div>
                {driver.isPrimary && (
                  <span className="text-xs font-semibold text-[#0077be] dark:text-[#7fb8e6] bg-blue-50 dark:bg-white/5 px-2 py-1 rounded">
                    Primary
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
                  : "Interval Points"}
              </span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-200">
              <span>Base rate ({booking.rentalDays} day{booking.rentalDays !== 1 ? "s" : ""})</span>
              <span>{formatMoney(pricing.baseTotal)}</span>
            </div>
            {pricing.mileageOverageTotal > 0 && (
              <div className="flex justify-between text-gray-700 dark:text-gray-200">
                <span>Mileage overage</span>
                <span>{formatMoney(pricing.mileageOverageTotal)}</span>
              </div>
            )}
            {pricing.addOnsCash > 0 && (
              <div className="flex justify-between text-gray-700 dark:text-gray-200">
                <span>Add-ons</span>
                <span>{formatMoney(pricing.addOnsCash)}</span>
              </div>
            )}
            <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
              <span>Member discount</span>
              <span>-{formatMoney(pricing.memberDiscount)}</span>
            </div>
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
            href="/cars"
            className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Book another car
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

const CarConfirmationPage = () => (
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

export default CarConfirmationPage;
