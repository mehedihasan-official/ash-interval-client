"use client";

// Driver details + optional add-ons. The primary driver is always
// required; an additional driver is one of the paid add-ons (matching
// how most rental companies price it), so ticking that add-on reveals
// a second driver form.
import { loadCarDraft, updateCarDraft } from "@/lib/carDraft";
import type { CarDraft } from "@/lib/carDraft";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { CarAddOns, CarDriver } from "@/lib/types/car";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const emptyDriver = (isPrimary: boolean): CarDriver => ({
  firstName: "",
  lastName: "",
  dob: "",
  licenseNumber: "",
  licenseCountry: "",
  isPrimary,
});

// Same daily surcharges the server applies. Duplicated (not imported
// from the server) because these are display-only estimates; the
// server is the authority on the actual booked totals.
const ADDON_DAILY = {
  insurance: 18,
  gps: 5,
  childSeat: 10,
  additionalDriver: 12,
} as const;

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const CarDriversPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<CarDraft | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [drivers, setDrivers] = useState<CarDriver[]>([emptyDriver(true)]);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });
  const [addOns, setAddOns] = useState<CarAddOns>({
    insurance: false,
    gps: false,
    childSeat: false,
    additionalDriver: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadCarDraft();
    if (loaded) {
      setDraft(loaded);
      setDrivers(
        loaded.drivers && loaded.drivers.length > 0
          ? loaded.drivers
          : [emptyDriver(true)],
      );
      setContactInfo({
        email: loaded.contactInfo?.email || user?.email || "",
        phone: loaded.contactInfo?.phone || "",
      });
      if (loaded.addOns) setAddOns(loaded.addOns);
    }
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the drivers list in sync with the "additional driver" toggle:
  // adding the add-on grows the form; removing it drops the second slot
  // (unless the user already typed something meaningful there).
  useEffect(() => {
    setDrivers((prev) => {
      if (addOns.additionalDriver && prev.length < 2) {
        return [...prev, emptyDriver(false)];
      }
      if (!addOns.additionalDriver && prev.length > 1) {
        const secondaryLooksEmpty =
          !prev[1].firstName && !prev[1].lastName && !prev[1].licenseNumber;
        return secondaryLooksEmpty ? [prev[0]] : prev;
      }
      return prev;
    });
  }, [addOns.additionalDriver]);

  const addOnsCash = useMemo(() => {
    if (!draft) return 0;
    const days = draft.rentalDays;
    let total = 0;
    if (addOns.insurance) total += ADDON_DAILY.insurance * days;
    if (addOns.gps) total += ADDON_DAILY.gps * days;
    if (addOns.childSeat) total += ADDON_DAILY.childSeat * days;
    if (addOns.additionalDriver) total += ADDON_DAILY.additionalDriver * days;
    return total;
  }, [addOns, draft]);

  if (isReady && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your car session has expired.
        </p>
        <Link
          href="/cars"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a new search
        </Link>
      </div>
    );
  }
  if (!draft) return null;

  const paymentMethod = draft.paymentMethod ?? "cash";
  const carPricing = draft.car.pricing;

  const handleDriverField = <K extends keyof CarDriver>(
    index: number,
    field: K,
    value: CarDriver[K],
  ) => {
    setDrivers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleContinue = () => {
    setErrorMessage(null);
    for (let i = 0; i < drivers.length; i += 1) {
      const driver = drivers[i];
      if (
        !driver.firstName ||
        !driver.lastName ||
        !driver.dob ||
        !driver.licenseNumber ||
        !driver.licenseCountry
      ) {
        setErrorMessage(`Please complete every field for driver ${i + 1}.`);
        return;
      }
    }
    if (!contactInfo.email || !contactInfo.phone) {
      setErrorMessage("Please provide a contact email and phone number.");
      return;
    }

    updateCarDraft({ drivers, contactInfo, addOns });
    router.push("/cars/payment");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Driver Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            We need the primary driver&apos;s license info. Add-ons are optional.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {drivers.map((driver, index) => (
              <section
                key={index}
                className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6"
              >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  {driver.isPrimary ? "Primary Driver" : `Driver ${index + 1}`}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="First Name*"
                    value={driver.firstName}
                    onChange={(v) => handleDriverField(index, "firstName", v)}
                  />
                  <TextField
                    label="Last Name*"
                    value={driver.lastName}
                    onChange={(v) => handleDriverField(index, "lastName", v)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Date of Birth*
                    </label>
                    <input
                      type="date"
                      value={driver.dob}
                      onChange={(event) =>
                        handleDriverField(index, "dob", event.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <TextField
                    label="License Number*"
                    value={driver.licenseNumber}
                    onChange={(v) => handleDriverField(index, "licenseNumber", v)}
                  />
                  <TextField
                    label="License Country*"
                    value={driver.licenseCountry}
                    onChange={(v) => handleDriverField(index, "licenseCountry", v)}
                  />
                </div>
              </section>
            ))}

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Email*"
                  type="email"
                  value={contactInfo.email}
                  onChange={(v) =>
                    setContactInfo((prev) => ({ ...prev, email: v }))
                  }
                />
                <TextField
                  label="Phone*"
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(v) =>
                    setContactInfo((prev) => ({ ...prev, phone: v }))
                  }
                />
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Add-ons
              </h2>
              <div className="space-y-3">
                <AddOnRow
                  active={addOns.insurance}
                  onToggle={(value) =>
                    setAddOns((prev) => ({ ...prev, insurance: value }))
                  }
                  title="Damage & theft insurance"
                  price={`${formatMoney(ADDON_DAILY.insurance)}/day`}
                />
                <AddOnRow
                  active={addOns.gps}
                  onToggle={(value) =>
                    setAddOns((prev) => ({ ...prev, gps: value }))
                  }
                  title="GPS navigation"
                  price={`${formatMoney(ADDON_DAILY.gps)}/day`}
                />
                <AddOnRow
                  active={addOns.childSeat}
                  onToggle={(value) =>
                    setAddOns((prev) => ({ ...prev, childSeat: value }))
                  }
                  title="Child safety seat"
                  price={`${formatMoney(ADDON_DAILY.childSeat)}/day`}
                />
                <AddOnRow
                  active={addOns.additionalDriver}
                  onToggle={(value) =>
                    setAddOns((prev) => ({ ...prev, additionalDriver: value }))
                  }
                  title="Additional driver"
                  price={`${formatMoney(ADDON_DAILY.additionalDriver)}/day`}
                />
              </div>
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
                {draft.car.brand}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {draft.rentalDays} day{draft.rentalDays !== 1 ? "s" : ""}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-200">
                  <span>Car ({paymentMethod === "cash" ? "cash" : "points"})</span>
                  <span>
                    {paymentMethod === "cash"
                      ? formatMoney(carPricing.discountedTotal)
                      : `${carPricing.totalPoints.toLocaleString()} pts`}
                  </span>
                </div>
                {addOnsCash > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Add-ons estimate</span>
                    <span>{formatMoney(addOnsCash)}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  Final total is confirmed on the next step.
                </p>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="mt-6 w-full bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-3 rounded-lg transition"
              >
                Continue to Payment
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

const TextField = ({ label, value, onChange, type = "text" }: TextFieldProps) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white focus:outline-none focus:border-[#0077be]"
    />
  </div>
);

const AddOnRow = ({
  active,
  onToggle,
  title,
  price,
}: {
  active: boolean;
  onToggle: (value: boolean) => void;
  title: string;
  price: string;
}) => (
  <label className="flex items-center justify-between gap-3 p-3 border border-gray-200 dark:border-white/10 rounded-lg cursor-pointer hover:border-[#0077be]/50">
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={active}
        onChange={(event) => onToggle(event.target.checked)}
        className="accent-[#0077be]"
      />
      <span className="text-sm text-gray-800 dark:text-white">{title}</span>
    </div>
    <span className="text-xs text-gray-500 dark:text-gray-400">{price}</span>
  </label>
);

export default CarDriversPage;
