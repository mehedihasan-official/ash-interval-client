"use client";

// Guest details + optional add-ons for the cruise. One form per guest
// counted on the search page, plus a shared contact block. Add-ons are
// per-guest per-night surcharges we preview here; the server is the
// authority on the final total.
import { loadCruiseDraft, updateCruiseDraft } from "@/lib/cruiseDraft";
import type { CruiseDraft } from "@/lib/cruiseDraft";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { CruiseAddOns, CruiseGuest } from "@/lib/types/cruise";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const emptyGuest = (type: CruiseGuest["type"]): CruiseGuest => ({
  type,
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  passportNumber: "",
  nationality: "",
  diningPreference: "Standard",
});

// Same per-guest surcharges the server applies. Duplicated as
// display-only estimates; the server re-computes for the booking.
const ADDON = {
  travelInsurancePerGuest: 89,
  drinkPackagePerGuestPerNight: 75,
  wifiPackagePerGuestPerNight: 20,
  excursionPackagePerGuestPerNight: 40,
} as const;

const DINING_OPTIONS = ["Standard", "Vegetarian", "Vegan", "Gluten-Free", "Kosher"] as const;

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

function seedGuests(
  adults: number,
  children: number,
  infants: number,
): CruiseGuest[] {
  const total = adults + children + infants;
  return Array.from({ length: total }, (_, index) => {
    if (index < adults) return emptyGuest("Adult");
    if (index < adults + children) return emptyGuest("Child");
    return emptyGuest("Infant");
  });
}

const CruiseGuestsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [draft, setDraft] = useState<CruiseDraft | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [guests, setGuests] = useState<CruiseGuest[]>([]);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });
  const [addOns, setAddOns] = useState<CruiseAddOns>({
    travelInsurance: false,
    drinkPackage: false,
    wifiPackage: false,
    excursionPackage: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadCruiseDraft();
    if (loaded) {
      setDraft(loaded);
      setGuests(
        loaded.guests && loaded.guests.length > 0
          ? loaded.guests
          : seedGuests(loaded.adults, loaded.children, loaded.infants),
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

  // Add-ons and gratuities count adults + children — infants excluded,
  // matching the server helper.
  const payingGuests = draft ? draft.adults + draft.children : 0;

  const addOnsEstimate = useMemo(() => {
    if (!draft) return 0;
    let total = 0;
    if (addOns.travelInsurance)
      total += ADDON.travelInsurancePerGuest * payingGuests;
    if (addOns.drinkPackage)
      total += ADDON.drinkPackagePerGuestPerNight * payingGuests * draft.cruise.duration;
    if (addOns.wifiPackage)
      total += ADDON.wifiPackagePerGuestPerNight * payingGuests * draft.cruise.duration;
    if (addOns.excursionPackage)
      total += ADDON.excursionPackagePerGuestPerNight * payingGuests * draft.cruise.duration;
    return total;
  }, [addOns, draft, payingGuests]);

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
  if (!draft) return null;

  const cruise = draft.cruise;
  const paymentMethod = draft.paymentMethod ?? "cash";

  const handleGuestField = <K extends keyof CruiseGuest>(
    index: number,
    field: K,
    value: CruiseGuest[K],
  ) => {
    setGuests((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleContinue = () => {
    setErrorMessage(null);
    for (let i = 0; i < guests.length; i += 1) {
      const g = guests[i];
      if (!g.firstName || !g.lastName || !g.dob || !g.gender) {
        setErrorMessage(`Please complete every required field for guest ${i + 1}.`);
        return;
      }
    }
    if (!contactInfo.email || !contactInfo.phone) {
      setErrorMessage("Please provide a contact email and phone number.");
      return;
    }
    updateCruiseDraft({ guests, contactInfo, addOns });
    router.push("/cruises/payment");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Guest Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Names must match passport / travel documents.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {guests.map((guest, index) => (
              <section
                key={index}
                className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6"
              >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Guest {index + 1} &mdash; {guest.type}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="First Name*"
                    value={guest.firstName}
                    onChange={(v) => handleGuestField(index, "firstName", v)}
                  />
                  <TextField
                    label="Last Name*"
                    value={guest.lastName}
                    onChange={(v) => handleGuestField(index, "lastName", v)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Date of Birth*
                    </label>
                    <input
                      type="date"
                      value={guest.dob}
                      onChange={(event) =>
                        handleGuestField(index, "dob", event.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Gender*
                    </label>
                    <select
                      value={guest.gender}
                      onChange={(event) =>
                        handleGuestField(
                          index,
                          "gender",
                          event.target.value as CruiseGuest["gender"],
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <TextField
                    label="Passport Number"
                    value={guest.passportNumber ?? ""}
                    onChange={(v) => handleGuestField(index, "passportNumber", v)}
                  />
                  <TextField
                    label="Nationality"
                    value={guest.nationality ?? ""}
                    onChange={(v) => handleGuestField(index, "nationality", v)}
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Dining Preference
                    </label>
                    <select
                      value={guest.diningPreference ?? "Standard"}
                      onChange={(event) =>
                        handleGuestField(index, "diningPreference", event.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    >
                      {DINING_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
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
                Optional Packages
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Priced per paying guest ({payingGuests}) × {cruise.duration} night
                {cruise.duration !== 1 ? "s" : ""}.
              </p>
              <div className="space-y-3">
                <AddOnRow
                  active={addOns.travelInsurance}
                  onToggle={(v) =>
                    setAddOns((prev) => ({ ...prev, travelInsurance: v }))
                  }
                  title="Travel insurance"
                  price={`${formatMoney(ADDON.travelInsurancePerGuest)} / guest`}
                />
                <AddOnRow
                  active={addOns.drinkPackage}
                  onToggle={(v) => setAddOns((prev) => ({ ...prev, drinkPackage: v }))}
                  title="Premium drinks package"
                  price={`${formatMoney(ADDON.drinkPackagePerGuestPerNight)} / guest / night`}
                />
                <AddOnRow
                  active={addOns.wifiPackage}
                  onToggle={(v) => setAddOns((prev) => ({ ...prev, wifiPackage: v }))}
                  title="Ship-wide wifi"
                  price={`${formatMoney(ADDON.wifiPackagePerGuestPerNight)} / guest / night`}
                />
                <AddOnRow
                  active={addOns.excursionPackage}
                  onToggle={(v) =>
                    setAddOns((prev) => ({ ...prev, excursionPackage: v }))
                  }
                  title="Shore excursion package"
                  price={`${formatMoney(ADDON.excursionPackagePerGuestPerNight)} / guest / night`}
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
              <p className="text-sm text-gray-600 dark:text-gray-300">{cruise.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {cruise.cabinTypes[draft.cabinType].name} cabin &bull;{" "}
                {cruise.duration} night{cruise.duration !== 1 ? "s" : ""}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-200">
                  <span>Cabin + taxes + gratuities</span>
                  <span>{formatMoney(cruise.pricing.discountedTotal)}</span>
                </div>
                {addOnsEstimate > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-200">
                    <span>Add-ons (est.)</span>
                    <span>{formatMoney(addOnsEstimate)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between font-bold text-gray-800 dark:text-white">
                  <span>Total (est.)</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    {paymentMethod === "cash"
                      ? formatMoney(cruise.pricing.discountedTotal + addOnsEstimate)
                      : `~${(cruise.pricing.totalPoints + Math.round(addOnsEstimate * 1.1 / 0.04)).toLocaleString()} pts`}
                  </span>
                </div>
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

export default CruiseGuestsPage;
