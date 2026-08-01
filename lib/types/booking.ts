// Shared types + pricing helpers for the booking flow (available units ->
// checkout -> payment -> confirmation). Pricing here mirrors the tiers shown
// on the resort page's Exchange/Getaways panel so the numbers a visitor sees
// while browsing stay consistent all the way through checkout.
import type { Resort } from "@/lib/types/resort";

export type VacationType = "exchange" | "getaways";

export type UnitType = "Studio" | "1 Bedroom" | "2 Bedroom" | "3 Bedroom" | "4+ Bedroom";

export const UNIT_TYPES: UnitType[] = [
  "Studio",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "4+ Bedroom",
];

// Roughly how many guests each unit type comfortably sleeps — shown on the
// unit cards so a member can judge fit before picking a size.
export const UNIT_SLEEPS: Record<UnitType, number> = {
  Studio: 2,
  "1 Bedroom": 4,
  "2 Bedroom": 6,
  "3 Bedroom": 8,
  "4+ Bedroom": 10,
};

// Points required per night, by unit type. Uses the midpoint of the ranges
// shown on the resort page (e.g. "1 Bedroom" shows 3,000-4,000 there).
export const POINTS_PER_NIGHT: Record<UnitType, number> = {
  Studio: 2000,
  "1 Bedroom": 3500,
  "2 Bedroom": 4500,
  "3 Bedroom": 6000,
  "4+ Bedroom": 10000,
};

// Cash price per night (USD, before tax), by unit type.
export const CASH_PRICE_PER_NIGHT: Record<UnitType, number> = {
  Studio: 50,
  "1 Bedroom": 60,
  "2 Bedroom": 72,
  "3 Bedroom": 80,
  "4+ Bedroom": 100,
};

// Flat tax + fees applied to a cash (Getaways) booking at checkout.
export const CASH_TAXES_AND_FEES = 20;

export interface BookingSearch {
  earliestDate: string; // yyyy-mm-dd
  latestDate: string; // yyyy-mm-dd
  adults: number;
  children: number;
  vacationType: VacationType;
}

export interface BillingInfo {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  phoneNumber: string;
}

// The in-progress booking a visitor is building up across the funnel.
// Persisted to sessionStorage between steps — see lib/bookingDraft.ts.
export interface BookingDraft {
  resort: Resort;
  search: BookingSearch;
  unitType: UnitType;
  nights: number;
  checkInAs: "Member" | "Guest";
  // Cash total before tax; undefined for points bookings.
  cashSubtotal?: number;
  // Total points required; undefined for cash bookings.
  totalPoints?: number;
  billingInfo?: BillingInfo;
}

export const getNights = (earliestDate: string, latestDate: string): number => {
  const start = new Date(earliestDate).getTime();
  const end = new Date(latestDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

export const getCashTotal = (unitType: UnitType, nights: number) =>
  CASH_PRICE_PER_NIGHT[unitType] * nights;

export const getPointsTotal = (unitType: UnitType, nights: number) =>
  POINTS_PER_NIGHT[unitType] * nights;

// Cash bookings show a tax-inclusive total at checkout/payment.
export const getCashTotalWithTax = (unitType: UnitType, nights: number) =>
  getCashTotal(unitType, nights) + CASH_TAXES_AND_FEES;
