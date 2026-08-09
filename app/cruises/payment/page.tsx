"use client";

// Payment page for cruise bookings. Server recomputes every total from
// the cruise's stored cabin price + party + add-ons on submission, so
// this page only collects the payment inputs and submits intent.
import { createCruiseBooking } from "@/lib/api/cruises";
import { clearCruiseDraft, loadCruiseDraft } from "@/lib/cruiseDraft";
import type { CruiseDraft } from "@/lib/cruiseDraft";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaLock } from "react-icons/fa";

const MOCK_POINTS_BALANCE = 50000;

const ADDON = {
  travelInsurancePerGuest: 89,
  drinkPackagePerGuestPerNight: 75,
  wifiPackagePerGuestPerNight: 20,
  excursionPackagePerGuestPerNight: 40,
} as const;

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const formatCardNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const CruisePaymentPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<CruiseDraft | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraft(loadCruiseDraft());
    setIsReady(true);
  }, []);

  const paymentMethod = draft?.paymentMethod ?? "cash";
  const cruise = draft?.cruise;
  const addOns = draft?.addOns ?? {
    travelInsurance: false,
    drinkPackage: false,
    wifiPackage: false,
    excursionPackage: false,
  };

  const payingGuests = draft ? draft.adults + draft.children : 0;
  const nights = cruise?.duration ?? 0;

  const addOnsEstimate = useMemo(() => {
    let total = 0;
    if (addOns.travelInsurance) total += ADDON.travelInsurancePerGuest * payingGuests;
    if (addOns.drinkPackage)
      total += ADDON.drinkPackagePerGuestPerNight * payingGuests * nights;
    if (addOns.wifiPackage)
      total += ADDON.wifiPackagePerGuestPerNight * payingGuests * nights;
    if (addOns.excursionPackage)
      total += ADDON.excursionPackagePerGuestPerNight * payingGuests * nights;
    return total;
  }, [addOns, payingGuests, nights]);

  const grandCash = cruise ? cruise.pricing.discountedTotal + addOnsEstimate : 0;
  const grandPoints = cruise
    ? cruise.pricing.totalPoints + Math.round((addOnsEstimate / 0.04) * 1.1)
    : 0;
  const insufficientPoints =
    paymentMethod === "points" && grandPoints > MOCK_POINTS_BALANCE;

  if (isReady && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your cruise session has expired.
        </p>
        <Link
          href="/cruises"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a new search
        </Link>
      </div>
    );
  }
  if (!draft || !cruise) return null;

  const validate = (): string | null => {
    if (!agreeTerms) return "Please accept the cruise terms to continue.";
    if (paymentMethod === "cash") {
      if (cardNumber.replace(/\s/g, "").length !== 16)
        return "Please enter a valid 16-digit card number.";
      if (!cardholderName.trim()) return "Please enter the cardholder name.";
      if (!/^\d{2}\/\d{2}$/.test(expiryDate))
        return "Please enter a valid expiry date (MM/YY).";
      if (!/^\d{3}$/.test(cvv)) return "Please enter a 3-digit CVV.";
      if (!billingZip.trim()) return "Please enter your billing ZIP code.";
    } else if (insufficientPoints) {
      return `Insufficient points — you need ${(grandPoints - MOCK_POINTS_BALANCE).toLocaleString()} more.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (!draft.guests || !draft.contactInfo || !draft.departureDate) {
      setErrorMessage("Booking details are incomplete. Please go back a step.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const booking = await createCruiseBooking({
        email: user?.email ?? draft.contactInfo.email,
        cruiseId: cruise._id || cruise.cruiseId,
        cabinType: draft.cabinType,
        departureDate: draft.departureDate,
        guests: draft.guests,
        contactInfo: draft.contactInfo,
        addOns,
        paymentMethod,
      });
      clearCruiseDraft();
      router.push(
        `/cruises/confirmation?ref=${encodeURIComponent(booking.bookingReference)}`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not complete the booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <FaLock className="text-[#0077be] w-5 h-5" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              Secure Payment
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Finalize your cruise booking. Nothing charges until you confirm.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {paymentMethod === "cash" ? (
              <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Card Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>Card Number</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(event) =>
                        setCardNumber(formatCardNumber(event.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Cardholder Name</Label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(event) => setCardholderName(event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label>Expiry (MM/YY)</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(event) =>
                        setExpiryDate(formatExpiry(event.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={3}
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <Label>Billing ZIP</Label>
                    <input
                      type="text"
                      value={billingZip}
                      onChange={(event) => setBillingZip(event.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </section>
            ) : (
              <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Points Payment
                </h2>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Points balance</span>
                    <span className="font-semibold">
                      {MOCK_POINTS_BALANCE.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Estimated total</span>
                    <span>{grandPoints.toLocaleString()} pts</span>
                  </div>
                </div>
                {insufficientPoints ? (
                  <p className="mt-4 text-sm text-red-600 dark:text-red-400 font-semibold">
                    Insufficient points — you need{" "}
                    {(grandPoints - MOCK_POINTS_BALANCE).toLocaleString()} more.
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-green-600 dark:text-green-400 font-semibold">
                    You have enough points for this cruise.
                  </p>
                )}
              </section>
            )}

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-1 accent-[#0077be]"
                />
                <span>
                  I have reviewed the itinerary, cabin, and add-ons and agree
                  to the cruise line&apos;s fare rules and cancellation policy.
                </span>
              </label>
            </section>

            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
                {errorMessage}
              </div>
            )}
          </div>

          <aside>
            <div className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6 lg:sticky lg:top-6">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">
                Booking Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {cruise.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {cruise.cabinTypes[draft.cabinType].name} &bull; {cruise.duration} night
                {cruise.duration !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Departs {draft.departureDate}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-200">
                  <span>Cabin + taxes + gratuities</span>
                  <span>{formatMoney(cruise.pricing.discountedTotal)}</span>
                </div>
                {addOnsEstimate > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Add-ons</span>
                    <span>{formatMoney(addOnsEstimate)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    {paymentMethod === "cash"
                      ? formatMoney(grandCash)
                      : `${grandPoints.toLocaleString()} pts`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !agreeTerms}
                className="mt-6 w-full bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
              >
                {isSubmitting ? "Processing..." : "Complete Booking"}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                <FaLock className="inline w-3 h-3 mr-1" /> Secure booking
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
    {children}
  </label>
);

export default CruisePaymentPage;
