"use client";

// Flight detail page. Reads the in-progress booking from sessionStorage
// (populated by the results page's Select button), lets the member pick
// cash vs points, then hands off to /flights/passengers. No pricing is
// computed here — those numbers come straight from `flight.pricing` on
// the server response so the client can't accidentally drift.
import { loadFlightDraft, updateFlightDraft } from "@/lib/flightDraft";
import type { FlightDraft } from "@/lib/flightDraft";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowRight, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const formatPoints = (value: number) => value.toLocaleString();

const formatDate = (iso: string) => {
  if (!iso) return "Any date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Any date";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const FlightDetailPage = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<FlightDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "points">("cash");
  const [isReady, setIsReady] = useState(false);

  // The draft lives in sessionStorage so it only exists client-side;
  // read it once on mount and reflect it into state.
  useEffect(() => {
    const loaded = loadFlightDraft();
    if (loaded) {
      setDraft(loaded);
      if (loaded.paymentMethod === "points" || loaded.paymentMethod === "cash") {
        setPaymentMethod(loaded.paymentMethod);
      }
    }
    setIsReady(true);
  }, []);

  if (isReady && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          No flight selected yet.
        </p>
        <Link
          href="/flights"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a flight search
        </Link>
      </div>
    );
  }
  if (!draft) return null;

  const { flight } = draft;
  const totalTravelers = draft.adults + draft.children + draft.infants;
  const pricing = flight.pricing;

  const handleContinue = () => {
    updateFlightDraft({ paymentMethod });
    router.push("/flights/passengers");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Flight Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Review your flight and pick how you want to pay.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Flight Summary
              </h2>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 dark:border-white/10">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">From</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {flight.origin}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {flight.originCity}
                  </p>
                </div>
                <FaArrowRight className="text-[#0077be] w-5 h-5" />
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">To</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {flight.destination}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {flight.destinationCity}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(draft.departureDate)}
              </p>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                <TimeCol label="Departure" value={flight.departureTime} />
                <TimeCol label="Duration" value={flight.duration} />
                <TimeCol label="Arrival" value={flight.arrivalTime} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Airline
                  </p>
                  <p className="text-gray-800 dark:text-white">
                    {flight.airline} &bull; {flight.flightNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {flight.aircraft}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Cabin & Baggage
                  </p>
                  <p className="text-gray-800 dark:text-white">
                    {flight.cabinClass}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {flight.baggage}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center gap-2">
                {flight.refundable ? (
                  <>
                    <FaCheckCircle className="text-green-500" />
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      Refundable
                    </span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Non-refundable
                    </span>
                  </>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Fare Breakdown
              </h2>
              <div className="space-y-3 text-sm">
                <FareRow label="Base fare" value={formatMoney(pricing.retailPrice)} />
                <FareRow
                  label="Interval Member discount (47%)"
                  value={`-${formatMoney(pricing.retailPrice - pricing.discountedPrice)}`}
                  highlight
                />
                <FareRow label="Taxes & fees" value="Included" />
                <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between text-base font-bold text-gray-800 dark:text-white">
                  <span>Total per traveler</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    {formatMoney(pricing.discountedPrice)}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Payment Method
              </h2>
              <div className="space-y-4">
                <PaymentOption
                  active={paymentMethod === "cash"}
                  onSelect={() => setPaymentMethod("cash")}
                  title="Pay with Cash"
                  subtitle="Credit or debit card"
                  amount={`${formatMoney(pricing.discountedPrice)} + tax`}
                />
                <PaymentOption
                  active={paymentMethod === "points"}
                  onSelect={() => setPaymentMethod("points")}
                  title="Pay with Points"
                  subtitle="Interval Rewards"
                  amount={`${formatPoints(pricing.totalPoints)} points total`}
                  detail={
                    <>
                      <p>
                        Base: {formatPoints(pricing.pointsRequired)} pts &bull; 10%
                        fee: +{formatPoints(pricing.processingFee)} pts
                      </p>
                    </>
                  }
                />
              </div>
            </section>
          </div>

          <aside>
            <div className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6 lg:sticky lg:top-6">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">
                Booking Summary
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {flight.airline} &bull; {flight.flightNumber}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {flight.origin} &rarr; {flight.destination}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {formatDate(draft.departureDate)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                Travelers: {totalTravelers}
              </p>

              <div className="border-t border-gray-200 dark:border-white/10 mt-4 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Total</span>
                  <span className="font-bold text-[#0077be] dark:text-[#7fb8e6]">
                    {paymentMethod === "cash"
                      ? formatMoney(pricing.discountedPrice)
                      : `${formatPoints(pricing.totalPoints)} pts`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="mt-6 w-full bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Passenger Details
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const TimeCol = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className="text-lg font-bold text-gray-800 dark:text-white mt-1">
      {value}
    </p>
  </div>
);

interface FareRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const FareRow = ({ label, value, highlight }: FareRowProps) => (
  <div className="flex justify-between">
    <span className="text-gray-600 dark:text-gray-300">{label}</span>
    <span
      className={
        highlight
          ? "font-semibold text-green-600 dark:text-green-400"
          : "font-semibold text-gray-800 dark:text-white"
      }
    >
      {value}
    </span>
  </div>
);

interface PaymentOptionProps {
  active: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  amount: string;
  detail?: React.ReactNode;
}

const PaymentOption = ({
  active,
  onSelect,
  title,
  subtitle,
  amount,
  detail,
}: PaymentOptionProps) => (
  <label
    className={`block rounded-lg border-2 p-4 cursor-pointer transition ${
      active
        ? "border-[#0077be] bg-blue-50 dark:bg-[#0077be]/10"
        : "border-gray-200 dark:border-white/10 hover:border-[#0077be]/50"
    }`}
  >
    <div className="flex items-start gap-3">
      <input
        type="radio"
        name="payment-method"
        checked={active}
        onChange={onSelect}
        className="mt-1 accent-[#0077be]"
      />
      <div className="flex-1">
        <p className="font-bold text-gray-800 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        <p className="text-lg font-bold text-[#0077be] dark:text-[#7fb8e6] mt-2">
          {amount}
        </p>
        {detail && (
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {detail}
          </div>
        )}
      </div>
    </div>
  </label>
);

export default FlightDetailPage;
