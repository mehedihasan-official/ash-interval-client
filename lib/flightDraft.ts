// The flight-booking flow spans several routes (search -> results ->
// detail -> passengers -> payment -> confirmation) but the Next.js App
// Router has no built-in per-navigation state like React Router's
// `navigate(path, { state })`. Rather than encode a growing payload
// into URL params (which leaks passenger info into the address bar),
// we stash the in-progress booking in sessionStorage — scoped to the
// tab, cleared once the confirmation page is reached, exactly matching
// the lifetime this data needs.
import type {
  Flight,
  FlightBookingAddOns,
  FlightPassenger,
  TripType,
} from "@/lib/types/flight";

const STORAGE_KEY = "interval-flight-draft";

export interface FlightDraft {
  flight: Flight;
  from: string;
  to: string;
  fromCity?: string;
  toCity?: string;
  departureDate: string;
  returnDate?: string | null;
  tripType: TripType;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  paymentMethod?: "cash" | "points";
  passengers?: FlightPassenger[];
  contactInfo?: { email: string; phone: string };
  addOns?: FlightBookingAddOns;
}

export const saveFlightDraft = (draft: FlightDraft): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const loadFlightDraft = (): FlightDraft | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FlightDraft;
  } catch {
    return null;
  }
};

export const updateFlightDraft = (
  patch: Partial<FlightDraft>,
): FlightDraft | null => {
  const current = loadFlightDraft();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveFlightDraft(next);
  return next;
};

export const clearFlightDraft = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
