"use client";

// Car detail page. Reads the in-progress rental from sessionStorage,
// lets the member confirm cash vs points, then hands off to the driver
// details step. The pricing block was computed on the server for this
// exact trip length + mileage estimate, so we just display it.
import { loadCarDraft, updateCarDraft } from "@/lib/carDraft";
import type { CarDraft } from "@/lib/carDraft";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaCar, FaCogs, FaGasPump, FaMapMarkerAlt, FaSnowflake, FaStar, FaSuitcase, FaUser } from "react-icons/fa";

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });
const formatPoints = (value: number) => value.toLocaleString();

const CarDetailPage = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<CarDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "points">("cash");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loaded = loadCarDraft();
    if (loaded) {
      setDraft(loaded);
      if (loaded.paymentMethod === "cash" || loaded.paymentMethod === "points") {
        setPaymentMethod(loaded.paymentMethod);
      }
    }
    setIsReady(true);
  }, []);

  if (isReady && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          No car selected yet.
        </p>
        <Link
          href="/cars"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a car search
        </Link>
      </div>
    );
  }
  if (!draft) return null;

  const { car } = draft;
  const pricing = car.pricing;

  const handleContinue = () => {
    updateCarDraft({ paymentMethod });
    router.push("/cars/drivers");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Car Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Review your rental and pick how you want to pay.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-6">
                <div className="h-40 sm:h-full bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                  {car.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={car.image}
                      alt={car.brand}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FaCar className="w-16 h-16 text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                    {car.type}
                  </p>
                  <p className="font-bold text-gray-800 dark:text-white text-2xl">
                    {car.brand}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                    {car.vendor}
                    <span className="flex items-center gap-1 text-amber-500">
                      <FaStar className="w-3 h-3" /> {car.rating.toFixed(1)}
                      <span className="text-gray-500 dark:text-gray-400">
                        ({car.reviewCount})
                      </span>
                    </span>
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <span className="flex items-center gap-2">
                      <FaUser /> {car.passengers} passengers
                    </span>
                    <span className="flex items-center gap-2">
                      <FaSuitcase /> {car.bags} bags
                    </span>
                    <span className="flex items-center gap-2">
                      <FaCogs /> {car.transmission}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaGasPump /> {car.fuelType}
                    </span>
                    {car.airConditioning && (
                      <span className="flex items-center gap-2">
                        <FaSnowflake /> Air conditioning
                      </span>
                    )}
                  </div>

                  {car.features.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {car.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-xs bg-blue-50 dark:bg-white/5 text-[#0077be] dark:text-[#7fb8e6] font-semibold px-2 py-1 rounded"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
                    {draft.pickupLocation}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {draft.pickupDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Dropoff
                  </p>
                  <p className="text-gray-800 dark:text-white flex items-center gap-2 mt-1">
                    <FaMapMarkerAlt className="text-[#0077be]" />{" "}
                    {draft.dropoffLocation}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {draft.dropoffDate}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Price Breakdown
              </h2>
              <div className="space-y-3 text-sm">
                <FareRow
                  label={`Base rate (${formatMoney(car.retailPricePerDay)} × ${draft.rentalDays} day${draft.rentalDays !== 1 ? "s" : ""})`}
                  value={formatMoney(pricing.baseTotal)}
                />
                {car.freeMilesPerDay > 0 && (
                  <FareRow
                    label={`Mileage overage (${draft.estimatedDailyMiles} mi/day vs ${car.freeMilesPerDay} incl.)`}
                    value={
                      pricing.mileageOverageTotal > 0
                        ? formatMoney(pricing.mileageOverageTotal)
                        : "None"
                    }
                  />
                )}
                {car.freeMilesPerDay === 0 && (
                  <FareRow label="Mileage" value="Unlimited (no overage)" />
                )}
                <FareRow
                  label="Subtotal"
                  value={formatMoney(pricing.subtotal)}
                />
                <FareRow
                  label="Interval member discount"
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
                  Add-ons (insurance, GPS, extras) are optional and priced on
                  the next step.
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
                {car.type} &bull; {car.brand}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {draft.pickupLocation} → {draft.dropoffLocation}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {draft.rentalDays} day{draft.rentalDays !== 1 ? "s" : ""} &bull;{" "}
                ~{draft.estimatedDailyMiles} mi/day
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
                className="mt-6 w-full bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Driver Details
              </button>
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
        name="car-payment"
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

export default CarDetailPage;
