// Same rationale as flightDraft / carDraft — Next.js App Router has no
// per-navigation state channel, so the multi-step cruise booking flow
// carries state through sessionStorage.
import type { CabinKey, Cruise, CruiseAddOns, CruiseGuest } from "@/lib/types/cruise";

const STORAGE_KEY = "interval-cruise-draft";

export interface CruiseDraft {
  cruise: Cruise;
  cabinType: CabinKey;
  departureDate: string;
  adults: number;
  children: number;
  infants: number;
  paymentMethod?: "cash" | "points";
  guests?: CruiseGuest[];
  contactInfo?: { email: string; phone: string };
  addOns?: CruiseAddOns;
}

export const saveCruiseDraft = (draft: CruiseDraft): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const loadCruiseDraft = (): CruiseDraft | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CruiseDraft;
  } catch {
    return null;
  }
};

export const updateCruiseDraft = (
  patch: Partial<CruiseDraft>,
): CruiseDraft | null => {
  const current = loadCruiseDraft();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveCruiseDraft(next);
  return next;
};

export const clearCruiseDraft = (): void => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
