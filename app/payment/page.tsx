"use client";

// Step 3 of the booking funnel: collects card details (cash bookings only)
// and billing information, then submits the booking to the backend and
// moves on to the confirmation page. Reads/updates the same sessionStorage
// draft the checkout page uses.
import BookingSteps from "@/components/resorts/BookingSteps";
import { createBooking } from "@/lib/api/bookings";
import { loadBookingDraft, saveBookingDraft } from "@/lib/bookingDraft";
import { formatIsoDate } from "@/lib/dateFormat";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getCashTotalWithTax, type BillingInfo, type BookingDraft } from "@/lib/types/booking";
import { getResortName } from "@/lib/types/resort";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FaClipboardList, FaCreditCard, FaMedal } from "react-icons/fa";
import Swal from "sweetalert2";

const EMPTY_BILLING: BillingInfo = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  country: "",
  city: "",
  state: "",
  postalCode: "",
  phoneNumber: "",
};

const BILLING_FIELDS: Array<{ name: keyof BillingInfo; placeholder: string; required: boolean }> = [
  { name: "firstName", placeholder: "First Name", required: true },
  { name: "lastName", placeholder: "Last Name", required: true },
  { name: "address1", placeholder: "Address Line 1", required: true },
  { name: "address2", placeholder: "Address Line 2 (Optional)", required: false },
  { name: "country", placeholder: "Country", required: true },
  { name: "city", placeholder: "City", required: true },
  { name: "state", placeholder: "State / Province", required: true },
  { name: "postalCode", placeholder: "Postal Code", required: true },
  { name: "phoneNumber", placeholder: "Phone Number", required: true },
];

const PaymentPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  // Read once from sessionStorage via a lazy initializer, same reasoning
  // as the checkout page — avoids a redundant effect + re-render.
  const [draft] = useState<BookingDraft | null>(() => loadBookingDraft());

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(
    () => draft?.billingInfo ?? EMPTY_BILLING,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!draft) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            No Booking In Progress
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn&apos;t find a booking to pay for. Please start your search again from a
            resort page.
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

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in to complete this booking.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const { resort, search, unitType, nights, totalPoints } = draft;
  const isPoints = search.vacationType === "exchange";
  const resortName = getResortName(resort);
  const cashTotalWithTax = !isPoints ? getCashTotalWithTax(unitType, nights) : 0;

  const handleBillingChange = (field: keyof BillingInfo, value: string) => {
    const updated = { ...billingInfo, [field]: value };
    setBillingInfo(updated);
    saveBookingDraft({ ...draft, billingInfo: updated });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const booking = await createBooking({
        resort,
        email: user.email ?? "",
        paymentMethod: isPoints ? "points" : "cash",
        price: isPoints ? 0 : cashTotalWithTax,
        points: isPoints ? (totalPoints ?? 0) : 0,
        unitType,
        startDate: search.earliestDate,
        endDate: search.latestDate,
        nights,
        billingInfo,
        paymentDetails: isPoints ? null : { cardNumber, expiryDate, cvv },
      });

      // Note: the draft is intentionally left in sessionStorage here — the
      // confirmation page reads it to show a receipt, then clears it once
      // it's done with it.
      router.push(`/confirmation?bookingId=${encodeURIComponent(booking._id)}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      Swal.fire({ icon: "error", title: "Booking failed", text: message, confirmButtonColor: "#0077be" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-[#18294B] dark:text-white">
          {isPoints ? "Confirm Points Redemption" : "Confirm Payment"}
        </h1>

        <BookingSteps currentStep={2} />

        {/* Booking summary */}
        <div
          className={`mb-6 p-4 rounded-xl border ${
            isPoints
              ? "bg-blue-50 dark:bg-white/5 border-blue-200 dark:border-white/10"
              : "bg-blue-50 dark:bg-white/5 border-[#0077be]/20 dark:border-white/10"
          }`}
        >
          <h2 className="font-bold text-gray-800 dark:text-white mb-2">Booking Summary</h2>
          <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <p>
              <span className="font-semibold">Resort:</span> {resortName}
            </p>
            <p>
              <span className="font-semibold">Unit:</span> {unitType}
            </p>
            <p>
              <span className="font-semibold">Dates:</span>{" "}
              {formatIsoDate(search.earliestDate)} &rarr;{" "}
              {formatIsoDate(search.latestDate)} ({nights} nights)
            </p>
            {isPoints ? (
              <p>
                <span className="font-semibold">Total:</span>{" "}
                <span className="text-[#18294B] dark:text-[#7fb8e6] font-bold">
                  {totalPoints?.toLocaleString()} points
                </span>
              </p>
            ) : (
              <p>
                <span className="font-semibold">Total:</span>{" "}
                <span className="text-[#0077be] dark:text-[#7fb8e6] font-bold">
                  ${cashTotalWithTax.toFixed(2)} USD (tax incl.)
                </span>
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card details — cash only */}
          {!isPoints && (
            <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="p-1.5 bg-[#0077be] rounded text-white text-xs">
                  <FaCreditCard />
                </span>
                Card Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(event.target.value)}
                    className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#0077be]/30 focus:outline-none text-sm transition-all"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(event.target.value)}
                      className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#0077be]/30 focus:outline-none text-sm transition-all"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value)}
                      className="w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#0077be]/30 focus:outline-none text-sm transition-all"
                      placeholder="123"
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Points confirmation */}
          {isPoints && (
            <div className="bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-[#18294B] dark:text-[#7fb8e6] mb-2 flex items-center gap-2">
                <FaMedal /> Points Redemption
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You are about to redeem{" "}
                <strong>{totalPoints?.toLocaleString()} Interval points</strong> for this
                vacation. No card payment is required.
              </p>
            </div>
          )}

          {/* Billing information */}
          <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-gray-100 dark:bg-white/10 rounded text-xs">
                <FaClipboardList />
              </span>
              Billing Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BILLING_FIELDS.map((field) => (
                <input
                  key={field.name}
                  type="text"
                  placeholder={field.placeholder}
                  value={billingInfo[field.name] ?? ""}
                  onChange={(event) => handleBillingChange(field.name, event.target.value)}
                  className={`w-full border border-gray-300 dark:border-white/20 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:outline-none transition-all ${
                    isPoints ? "focus:ring-[#18294B]/30" : "focus:ring-[#0077be]/30"
                  }`}
                  required={field.required}
                />
              ))}
            </div>
          </div>

          {/* Submit bar */}
          <div className="sticky bottom-0 bg-white dark:bg-[#16223d] border-t border-gray-200 dark:border-white/10 shadow-lg p-4 -mx-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-t-xl sm:rounded-none">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">You will be charged</p>
              {isPoints ? (
                <p className="text-xl font-bold text-[#18294B] dark:text-[#7fb8e6]">
                  {totalPoints?.toLocaleString()} points
                </p>
              ) : (
                <p className="text-xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
                  ${cashTotalWithTax.toFixed(2)} USD
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-10 py-3 rounded-xl font-bold text-white transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed ${
                isPoints
                  ? "bg-[#18294B] hover:bg-[#0f1d35] disabled:bg-gray-300 dark:disabled:bg-white/10"
                  : "bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10"
              }`}
            >
              {isSubmitting ? "Processing..." : isPoints ? "Confirm Redemption" : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
