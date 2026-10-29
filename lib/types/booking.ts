// Shared types + pricing helpers for the booking flow (available units ->
// checkout -> payment -> confirmation). Pricing here mirrors the tiers shown
// on the resort page's Exchange/Getaways panel so the numbers a visitor sees
// while browsing stay consistent all the way through checkout.
import {
  getBookableUnitPricing,
  getResortUnitPricing,
  hasConfiguredUnitPricing,
  isDisneyResort,
  toFiniteNumber,
  type Resort,
  type ResortUnitType,
} from "@/lib/types/resort";

export type VacationType = "exchange" | "getaways";

export type UnitType = ResortUnitType;

export const UNIT_TYPES: UnitType[] = [
  "Studio",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "4+ Bedroom",
];

export const DISNEY_UNIT_TYPES: UnitType[] = ["Studio", "1 Bedroom"];

// Which unit types a member can pick, decided by the shape of the resort
// document: resorts without their own `unitPricing` offer the standard unit
// types; resorts with `unitPricing` offer the units configured on them.
export const getAvailableUnitTypes = (resort?: Resort | null): UnitType[] => {
  if (!hasConfiguredUnitPricing(resort)) {
    return isDisneyResort(resort) ? DISNEY_UNIT_TYPES : UNIT_TYPES;
  }

  return getBookableUnitPricing(resort).map((unit) => unit.unitType);
};

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

export const DISNEY_POINTS_PER_NIGHT: Record<"Studio" | "1 Bedroom", number> = {
  Studio: 3500,
  "1 Bedroom": 5000,
};

export const getPointsPerNight = (
  unitType: UnitType,
  resort?: Resort | null,
): number => {
  const configured = resort?.unitPricing?.find(
    (unit) => unit?.unitType === unitType,
  );
  const configuredPoints = toFiniteNumber(configured?.pointsPerNight);
  if (configuredPoints !== undefined) {
    return configuredPoints;
  }

  if (isDisneyResort(resort)) {
    const disneyPrice =
      DISNEY_POINTS_PER_NIGHT[unitType as keyof typeof DISNEY_POINTS_PER_NIGHT];
    if (typeof disneyPrice === "number") return disneyPrice;
  }

  return POINTS_PER_NIGHT[unitType];
};

// Cash price per night (USD, before tax), by unit type.
export const CASH_PRICE_PER_NIGHT: Record<UnitType, number> = {
  Studio: 50,
  "1 Bedroom": 60,
  "2 Bedroom": 72,
  "3 Bedroom": 80,
  "4+ Bedroom": 100,
};

export const getCashPricePerNight = (
  unitType: UnitType,
  resort?: Resort | null,
): number => {
  return (
    getResortUnitPricing(resort).find((unit) => unit.unitType === unitType)
      ?.cashPerNight ?? CASH_PRICE_PER_NIGHT[unitType]
  );
};

// Flat tax + fees applied to a cash (Getaways) booking at checkout.
export const CASH_TAXES_AND_FEES = 20;

// Exchange (points) bookings carry a cash exchange fee: a flat fee for the
// first night plus a smaller fee for every additional night of the stay.
export const EXCHANGE_FEE_FIRST_NIGHT = 59;
export const EXCHANGE_FEE_ADDITIONAL_NIGHT = 20;

export const getExchangeFee = (nights: number): number => {
  const stayNights = Math.max(1, Math.floor(nights) || 1);
  return (
    EXCHANGE_FEE_FIRST_NIGHT + (stayNights - 1) * EXCHANGE_FEE_ADDITIONAL_NIGHT
  );
};

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

export const getCashTotal = (
  unitType: UnitType,
  nights: number,
  resort?: Resort | null,
) => getCashPricePerNight(unitType, resort) * nights;

export const getPointsTotal = (
  unitType: UnitType,
  nights: number,
  resort?: Resort | null,
) => getPointsPerNight(unitType, resort) * nights;

// Cash bookings show a tax-inclusive total at checkout/payment.
export const getCashTotalWithTax = (
  unitType: UnitType,
  nights: number,
  resort?: Resort | null,
) => getCashTotal(unitType, nights, resort) + CASH_TAXES_AND_FEES;
