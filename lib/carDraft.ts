// Same rationale as lib/flightDraft.ts — the multi-step car rental
// flow (search → results → detail → drivers → payment → confirmation)
// needs to carry state across route changes and Next.js's App Router
// has no per-navigation state channel like react-router did.
import type {
  Car,
  CarAddOns,
  CarDriver,
} from "@/lib/types/car";

const STORAGE_KEY = "interval-car-draft";

export interface CarDraft {
  car: Car;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  rentalDays: number;
  estimatedDailyMiles: number;
  paymentMethod?: "cash" | "points";
  drivers?: CarDriver[];
  contactInfo?: { email: string; phone: string };
  addOns?: CarAddOns;
}

export const saveCarDraft = (draft: CarDraft): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const loadCarDraft = (): CarDraft | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CarDraft;
  } catch {
    return null;
  }
};

export const updateCarDraft = (patch: Partial<CarDraft>): CarDraft | null => {
  const current = loadCarDraft();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveCarDraft(next);
  return next;
};

export const clearCarDraft = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
