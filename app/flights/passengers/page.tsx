"use client";

// Passenger details + add-ons. One form section per traveler counted
// on the search page, plus a shared contact block. The add-ons priced
// here (seat selection, extra baggage) get applied to the grand total
// on the payment page — this page's sidebar only previews them.
import { loadFlightDraft, updateFlightDraft } from "@/lib/flightDraft";
import type { FlightDraft } from "@/lib/flightDraft";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  FLIGHT_ADDON_PRICING,
  type FlightPassenger,
} from "@/lib/types/flight";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const emptyPassenger = (type: FlightPassenger["type"]): FlightPassenger => ({
  type,
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  passportNumber: "",
  knownTravelerNumber: "",
  mealPreference: "Standard",
  seat: null,
});

// Builds one passenger slot per counted traveler, labelling the first
// N as Adults, the next as Children, then Infants — matching the
// counts the search form collected.
function seedPassengers(adults: number, children: number, infants: number): FlightPassenger[] {
  const total = adults + children + infants;
  return Array.from({ length: total }, (_, index) => {
    if (index < adults) return emptyPassenger("Adult");
    if (index < adults + children) return emptyPassenger("Child");
    return emptyPassenger("Infant");
  });
}

const SEAT_OPTIONS = ["Window", "Middle", "Aisle"] as const;

const MEAL_OPTIONS = ["Standard", "Vegetarian", "Vegan", "Halal", "Kosher"] as const;

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const FlightPassengersPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [draft, setDraft] = useState<FlightDraft | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [passengers, setPassengers] = useState<FlightPassenger[]>([]);
  const [contactInfo, setContactInfo] = useState({ email: "", phone: "" });
  const [extraBaggage, setExtraBaggage] = useState(false);
  const [seatSelections, setSeatSelections] = useState<(string | null)[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadFlightDraft();
    if (loaded) {
      setDraft(loaded);
      const seeded =
        loaded.passengers && loaded.passengers.length > 0
          ? loaded.passengers
          : seedPassengers(loaded.adults, loaded.children, loaded.infants);
      setPassengers(seeded);
      setSeatSelections(
        loaded.addOns?.seatSelections?.length
          ? loaded.addOns.seatSelections
          : new Array(seeded.length).fill(null),
      );
      setExtraBaggage(!!loaded.addOns?.extraBaggage);
      setContactInfo({
        email: loaded.contactInfo?.email || user?.email || "",
        phone: loaded.contactInfo?.phone || "",
      });
    }
    setIsReady(true);
    // We intentionally read the auth email only on first hydrate; if it
    // changes mid-session the member can edit the field directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentMethod = draft?.paymentMethod ?? "cash";
  const pricing = draft?.flight.pricing;

  const selectedSeatCount = useMemo(
    () => seatSelections.filter(Boolean).length,
    [seatSelections],
  );

  const addOnsCost = useMemo(() => {
    if (paymentMethod === "points") {
      return (
        selectedSeatCount * FLIGHT_ADDON_PRICING.seatPoints +
        (extraBaggage ? FLIGHT_ADDON_PRICING.baggagePoints : 0)
      );
    }
    return (
      selectedSeatCount * FLIGHT_ADDON_PRICING.seatCash +
      (extraBaggage ? FLIGHT_ADDON_PRICING.baggageCash : 0)
    );
  }, [paymentMethod, selectedSeatCount, extraBaggage]);

  if (isReady && !draft) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your flight session has expired.
        </p>
        <Link
          href="/flights"
          className="bg-[#0077be] hover:bg-[#005a8e] text-white font-bold py-2 px-6 rounded-lg"
        >
          Start a new search
        </Link>
      </div>
    );
  }
  if (!draft || !pricing) return null;

  const handleUpdatePassenger = <K extends keyof FlightPassenger>(
    index: number,
    field: K,
    value: FlightPassenger[K],
  ) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSeatSelect = (index: number, seat: string) => {
    setSeatSelections((prev) => {
      const next = [...prev];
      next[index] = next[index] === seat ? null : seat;
      return next;
    });
  };

  const handleContinue = () => {
    setErrorMessage(null);
    for (let i = 0; i < passengers.length; i += 1) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.dob || !passenger.gender) {
        setErrorMessage(`Please complete every required field for passenger ${i + 1}.`);
        return;
      }
    }
    if (!contactInfo.email || !contactInfo.phone) {
      setErrorMessage("Please provide a contact email and phone number.");
      return;
    }

    updateFlightDraft({
      passengers: passengers.map((passenger, index) => ({
        ...passenger,
        seat: seatSelections[index] ?? null,
      })),
      contactInfo,
      addOns: { extraBaggage, seatSelections },
    });
    router.push("/flights/payment");
  };

  const flightCost =
    paymentMethod === "points" ? pricing.totalPoints : pricing.discountedPrice;
  const totalCost = flightCost + addOnsCost;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="bg-white dark:bg-[#16223d] border-b border-gray-200 dark:border-white/10 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
            Passenger Details
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            One section per traveler. Add-ons are optional.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {passengers.map((passenger, index) => (
              <section
                key={index}
                className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6"
              >
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                  Passenger {index + 1} &mdash; {passenger.type}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="First Name*"
                    value={passenger.firstName}
                    onChange={(value) => handleUpdatePassenger(index, "firstName", value)}
                  />
                  <TextField
                    label="Last Name*"
                    value={passenger.lastName}
                    onChange={(value) => handleUpdatePassenger(index, "lastName", value)}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Date of Birth*
                    </label>
                    <input
                      type="date"
                      value={passenger.dob}
                      onChange={(event) =>
                        handleUpdatePassenger(index, "dob", event.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Gender*
                    </label>
                    <select
                      value={passenger.gender}
                      onChange={(event) =>
                        handleUpdatePassenger(
                          index,
                          "gender",
                          event.target.value as FlightPassenger["gender"],
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
                    label="Passport / ID Number"
                    value={passenger.passportNumber ?? ""}
                    onChange={(value) =>
                      handleUpdatePassenger(index, "passportNumber", value)
                    }
                  />
                  <TextField
                    label="Known Traveler Number"
                    value={passenger.knownTravelerNumber ?? ""}
                    onChange={(value) =>
                      handleUpdatePassenger(index, "knownTravelerNumber", value)
                    }
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Meal Preference
                    </label>
                    <select
                      value={passenger.mealPreference ?? "Standard"}
                      onChange={(event) =>
                        handleUpdatePassenger(index, "mealPreference", event.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white"
                    >
                      {MEAL_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Seat preference (optional)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SEAT_OPTIONS.map((seat) => (
                      <button
                        key={seat}
                        type="button"
                        onClick={() => handleSeatSelect(index, seat)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                          seatSelections[index] === seat
                            ? "bg-[#0077be] text-white border-[#0077be]"
                            : "bg-white dark:bg-[#0f172a] border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:border-[#0077be]"
                        }`}
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {formatMoney(FLIGHT_ADDON_PRICING.seatCash)} per seat (or{" "}
                    {FLIGHT_ADDON_PRICING.seatPoints.toLocaleString()} pts)
                  </p>
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
                  value={contactInfo.email}
                  onChange={(value) =>
                    setContactInfo((prev) => ({ ...prev, email: value }))
                  }
                  type="email"
                />
                <TextField
                  label="Phone*"
                  value={contactInfo.phone}
                  onChange={(value) =>
                    setContactInfo((prev) => ({ ...prev, phone: value }))
                  }
                  type="tel"
                />
              </div>
            </section>

            <section className="bg-white dark:bg-[#16223d] rounded-xl border border-gray-200 dark:border-white/10 p-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
                Add-ons
              </h2>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extraBaggage}
                  onChange={(event) => setExtraBaggage(event.target.checked)}
                  className="mt-1 accent-[#0077be]"
                />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    Extra checked bag
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatMoney(FLIGHT_ADDON_PRICING.baggageCash)} (or{" "}
                    {FLIGHT_ADDON_PRICING.baggagePoints.toLocaleString()} pts)
                  </p>
                </div>
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
                {draft.flight.airline} &bull; {draft.flight.flightNumber}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {draft.flight.origin} &rarr; {draft.flight.destination}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Flight ({paymentMethod === "cash" ? "cash" : "points"})
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {paymentMethod === "cash"
                      ? formatMoney(pricing.discountedPrice)
                      : `${pricing.totalPoints.toLocaleString()} pts`}
                  </span>
                </div>
                {addOnsCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Add-ons
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      {paymentMethod === "cash"
                        ? formatMoney(addOnsCost)
                        : `${addOnsCost.toLocaleString()} pts`}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span className="text-[#0077be] dark:text-[#7fb8e6]">
                    {paymentMethod === "cash"
                      ? formatMoney(totalCost)
                      : `${totalCost.toLocaleString()} pts`}
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

export default FlightPassengersPage;
