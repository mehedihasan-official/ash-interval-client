"use client";

// Cruise detail page. Lets the member switch cabin type and departure
// date, see the price recompute live, then pick cash vs points and
// continue to guest details.
import { getCruiseById } from "@/lib/api/cruises";
import { loadCruiseDraft, updateCruiseDraft } from "@/lib/cruiseDraft";
import type { CruiseDraft } from "@/lib/cruiseDraft";
import type { CabinKey, Cruise } from "@/lib/types/cruise";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FaMapMarkerAlt, FaShip, FaStar } from "react-icons/fa";

const CABIN_ORDER: CabinKey[] = ["inside", "outside", "balcony", "suite"];

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });
const formatPoints = (value: number) => value.toLocaleString();

const formatDateLabel = (iso: string) => {
  if (!iso) return "Select a date";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CruiseDetailPage = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<CruiseDraft | null>(null);
  const [cruise, setCruise] = useState<Cruise | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "points">("cash");
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loaded = loadCruiseDraft();
    if (loaded) {
      setDraft(loaded);
      setCruise(loaded.cruise);
      if (loaded.paymentMethod === "cash" || loaded.paymentMethod === "points") {
        setPaymentMethod(loaded.paymentMethod);
      }
    }
    setIsReady(true);
  }, []);

  // Whenever the member switches cabin type, re-price against the
  // server so gratuity rates (higher for suites) update correctly.
  const refreshPricing = useCallback(
    async (nextCabin: CabinKey, current: CruiseDraft) => {
      setIsRefreshing(true);
      try {
        const refreshed = await getCruiseById(
          current.cruise._id || current.cruise.cruiseId,
          {
            cabinType: nextCabin,
            adults: current.adults,
            children: current.children,
            infants: current.infants,
          },
        );
        if (refreshed) {
          setCruise(refreshed);
          const updated = updateCruiseDraft({
            cruise: refreshed,
            cabinType: nextCabin,
          });
          if (updated) setDraft(updated);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [],
  );

  if (isReady && (!draft || !cruise)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          No cruise selected yet.
        </p>
        <Link
          href="/cruises"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a cruise search
        </Link>
      </div>
    );
  }
  if (!draft || !cruise) return null;

  const pricing = cruise.pricing;
  const totalGuests = draft.adults + draft.children + draft.infants;

  const handleDepartureChange = (nextDate: string) => {
    const updated = updateCruiseDraft({ departureDate: nextDate });
    if (updated) setDraft(updated);
  };

  const handleContinue = () => {
    if (!draft.departureDate) return;
    updateCruiseDraft({ paymentMethod });
    router.push("/cruises/guests");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            {cruise.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {cruise.cruiseLine} &bull; {cruise.duration} night
            {cruise.duration !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              {/* Ship photo shown at its natural aspect ratio so the
                  full frame is visible on mobile and desktop instead of
                  being centre-cropped inside a fixed-height box. */}
              <div className="bg-gray-100 dark:bg-white/5">
                {cruise.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cruise.image}
                    alt={cruise.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="w-full h-auto block"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <FaShip className="w-16 h-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-[#0077be]" /> {cruise.route}
                </p>
                <p className="text-xs text-amber-500 flex items-center gap-1 mt-2">
                  <FaStar />
                  <span className="text-gray-800 dark:text-white font-semibold">
                    {cruise.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    ({cruise.reviews.toLocaleString()} reviews)
                  </span>
                </p>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Ship features
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {cruise.shipFeatures.map((feature) => (
                      <li
                        key={feature}
                        className="text-xs bg-blue-50 dark:bg-white/5 text-[#0077be] dark:text-[#7fb8e6] font-semibold px-2 py-1 rounded"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Itinerary
                  </p>
                  <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    {cruise.itinerary.map((stop, index) => (
                      <li key={`${stop}-${index}`}>
                        Day {index + 1} — {stop}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Included
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {cruise.includes.map((item) => (
                      <li
                        key={item}
                        className="text-xs bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 font-semibold px-2 py-1 rounded"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Select Cabin
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CABIN_ORDER.map((key) => {
                  const cabin = cruise.cabinTypes[key];
                  const active = draft.cabinType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isRefreshing}
                      onClick={() => refreshPricing(key, draft)}
                      className={`text-left rounded-lg border-2 p-4 transition ${
                        active
                          ? "border-[#0077be] bg-blue-50 dark:bg-[#0077be]/10"
                          : "border-gray-200 dark:border-white/10 hover:border-[#0077be]/50"
                      } ${isRefreshing ? "opacity-70" : ""}`}
                    >
                      <p className="font-bold text-gray-800 dark:text-white">
                        {cabin.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        From {formatMoney(cabin.retailPrice)} / adult
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Departure Date
              </h2>
              {cruise.departureDates.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No sailings currently scheduled. Please check back soon.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cruise.departureDates.map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleDepartureChange(date)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                        draft.departureDate === date
                          ? "border-[#0077be] bg-[#0077be] text-white"
                          : "border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#0077be]"
                      }`}
                    >
                      {formatDateLabel(date)}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Price Breakdown ({totalGuests} guest{totalGuests !== 1 ? "s" : ""})
              </h2>
              <div className="space-y-3 text-sm">
                <FareRow
                  label="Cabin base fare"
                  value={formatMoney(pricing.cabinBaseTotal)}
                />
                <FareRow
                  label="Taxes & port fees"
                  value={formatMoney(pricing.taxesAndPortFees)}
                />
                <FareRow
                  label="Gratuities"
                  value={formatMoney(pricing.gratuities)}
                />
                <FareRow
                  label="Subtotal"
                  value={formatMoney(pricing.subtotal)}
                />
                <FareRow
                  label="Interval member discount (30% on cabin)"
                  value={`-${formatMoney(pricing.memberDiscount)}`}
                  highlight
                />
                <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between text-base font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    {formatMoney(pricing.discountedTotal)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Optional add-ons (drinks, wifi, insurance, excursions) are
                  priced on the next step.
                </p>
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
                  amount={formatMoney(pricing.discountedTotal)}
                />
                <PaymentOption
                  active={paymentMethod === "points"}
                  onSelect={() => setPaymentMethod("points")}
                  title="Pay with Interval Points"
                  subtitle="Includes 10% processing fee"
                  amount={`${formatPoints(pricing.totalPoints)} pts`}
                  detail={`Base: ${formatPoints(pricing.pointsRequired)} pts + fee ${formatPoints(pricing.processingFee)} pts`}
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
                {cruise.name} &bull; {cruise.duration} night
                {cruise.duration !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {cruise.cabinTypes[draft.cabinType].name} cabin
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Departs {formatDateLabel(draft.departureDate)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total</span>
                <span className="font-bold text-[#0077be] dark:text-[#7fb8e6]">
                  {paymentMethod === "cash"
                    ? formatMoney(pricing.discountedTotal)
                    : `${formatPoints(pricing.totalPoints)} pts`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={!draft.departureDate}
                className="mt-6 w-full bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Guest Details
              </button>
              {!draft.departureDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  Please pick a departure date to continue.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

const FareRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
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

const PaymentOption = ({
  active,
  onSelect,
  title,
  subtitle,
  amount,
  detail,
}: {
  active: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  amount: string;
  detail?: string;
}) => (
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
        name="cruise-payment"
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {detail}
          </p>
        )}
      </div>
    </div>
  </label>
);

export default CruiseDetailPage;
