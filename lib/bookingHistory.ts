// Normalizes the four booking types (resort, flight, car, cruise) into
// the single row shape the My History table renders.
//
// The table's columns come from Interval's own history screen —
// Exchange Type / Relinquishment / Confirmation / Status / Actions — so
// each booking type has to be expressed in those terms rather than in
// its own vocabulary. A flight's "confirmation" is the airline and
// route; a car's is the vendor and the pick-up/drop-off pair. That
// mapping lives here, in one place, so the component stays presentation
// only and a fifth booking type later is one more mapper rather than a
// new branch inside the JSX.
import type { Booking } from "@/lib/api/bookings";
import type { CarBooking } from "@/lib/types/car";
import type { CruiseBooking } from "@/lib/types/cruise";
import type { FlightBooking } from "@/lib/types/flight";
import { getResortName } from "@/lib/types/resort";

export type HistoryTabKey = "resorts" | "flights" | "cars" | "cruises";

export const HISTORY_TABS: { key: HistoryTabKey; label: string }[] = [
  { key: "resorts", label: "Resorts" },
  { key: "flights", label: "Flights" },
  { key: "cars", label: "Cars" },
  { key: "cruises", label: "Cruises" },
];

/** One side of a row — what was given up, or what was confirmed. */
export interface HistoryParty {
  name: string;
  code: string;
  details: string[];
  startDate: string;
  endDate: string;
}

export interface HistoryRow {
  id: string;
  reference: string;
  typeLabel: string;
  transactionDate: string;
  relinquishment: HistoryParty | null;
  confirmation: HistoryParty;
  status: string;
  actionLabel: string | null;
  actionHref: string | null;
}

/**
 * Whether a row has enough on it to be worth a line in the table.
 *
 * The bookings collection carries a handful of stub records that only
 * ever got an email and a status written to them — no resort, no dates,
 * no unit. Mapped straight through they render as a row that is blank
 * except for "Pending", which reads as a bug rather than as history.
 * Treating them as absent lets the tab fall back to its sample instead.
 */
export const hasHistoryContent = (row: HistoryRow): boolean =>
  Boolean(
    row.confirmation.code ||
      row.confirmation.startDate ||
      row.confirmation.details.length > 0,
  );

// "Mon, October 20, 2025" — the exact format Interval's history uses.
export const formatHistoryDate = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
};

// Timeshare weeks are the unit resort inventory is sold in, and the
// history screen shows one per stay, so derive it from the check-in date
// (ISO 8601 week — the Thursday rule).
const isoWeekNumber = (value?: string | null): number | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  target.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7) + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3,
  );
  return (
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
  );
};

const titleCase = (value?: string | null): string => {
  if (!value) return "Confirmed";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

// Resort bookings predate the reference-number scheme the flight, car and
// cruise flows use, so their Mongo id stands in. Trimmed to the tail
// because the leading bytes of an ObjectId are a timestamp shared by
// everything booked in the same second — the tail is what actually
// distinguishes one row from another.
const referenceFromId = (id: string): string =>
  id ? id.slice(-9).toUpperCase() : "—";

export const resortBookingToRow = (booking: Booking): HistoryRow => {
  // Older records in this collection predate the current booking shape:
  // no embedded resort, no unitType, and check-in under a different key.
  // Read through both rather than rendering "undefined" at the member.
  const start = booking.startDate ?? booking.checkInDate;
  const end = booking.endDate ?? booking.checkOutDate;
  const week = isoWeekNumber(start);
  const nights = booking.nights;

  return {
    id: booking._id,
    reference: referenceFromId(booking._id),
    // Points redemptions are exchanges; cash stays are Getaways. Same
    // split the rest of the site already makes.
    typeLabel: booking.paymentMethod === "cash" ? "Getaway" : "Exchange",
    transactionDate: formatHistoryDate(booking.createdAt),
    relinquishment: null,
    confirmation: {
      name: booking.resort ? getResortName(booking.resort) : "Resort stay",
      code: booking.resort?.symbol ?? "",
      details: [
        booking.unitType ? `Unit: ${booking.unitType}` : "",
        week ? `Week: ${week}` : "",
        nights ? `${nights} night${nights === 1 ? "" : "s"}` : "",
      ].filter(Boolean),
      startDate: formatHistoryDate(start),
      endDate: formatHistoryDate(end),
    },
    status: titleCase(booking.status),
    actionLabel: "View Details",
    actionHref: "/my-bookings",
  };
};

export const flightBookingToRow = (booking: FlightBooking): HistoryRow => {
  const flight = booking.flightSnapshot;
  const travelers = booking.pricing?.travelers ?? booking.passengers.length;

  return {
    id: booking._id,
    reference: booking.bookingReference,
    typeLabel: booking.tripType === "roundtrip" ? "Round Trip" : "Flight",
    transactionDate: formatHistoryDate(booking.createdAt),
    relinquishment: null,
    confirmation: {
      name: `${flight.airline} ${flight.flightNumber}`,
      code: `${flight.origin} → ${flight.destination}`,
      details: [
        `Cabin: ${flight.cabinClass}`,
        `${flight.duration} · ${flight.stopLabel}`,
        `${travelers} traveler${travelers === 1 ? "" : "s"}`,
      ],
      startDate: formatHistoryDate(booking.departureDate),
      endDate: formatHistoryDate(booking.returnDate),
    },
    status: titleCase(booking.status),
    actionLabel: "View Details",
    actionHref: `/flights/confirmation?ref=${encodeURIComponent(booking.bookingReference)}`,
  };
};

export const carBookingToRow = (booking: CarBooking): HistoryRow => {
  const car = booking.carSnapshot;

  return {
    id: booking._id,
    reference: booking.bookingReference,
    typeLabel: "Car Rental",
    transactionDate: formatHistoryDate(booking.createdAt),
    relinquishment: null,
    confirmation: {
      name: `${car.brand} ${car.type}`.trim(),
      code: car.vendor,
      details: [
        `Pick-up: ${booking.pickupLocation}`,
        `Drop-off: ${booking.dropoffLocation}`,
        `${booking.rentalDays} day${booking.rentalDays === 1 ? "" : "s"} · ${car.transmission}`,
      ],
      startDate: formatHistoryDate(booking.pickupDate),
      endDate: formatHistoryDate(booking.dropoffDate),
    },
    status: titleCase(booking.status),
    actionLabel: "View Details",
    actionHref: `/cars/confirmation?ref=${encodeURIComponent(booking.bookingReference)}`,
  };
};

export const cruiseBookingToRow = (booking: CruiseBooking): HistoryRow => {
  const cruise = booking.cruiseSnapshot;
  const guests = booking.guests?.length ?? 0;

  return {
    id: booking._id,
    reference: booking.bookingReference,
    typeLabel: "Cruise",
    transactionDate: formatHistoryDate(booking.createdAt),
    relinquishment: null,
    confirmation: {
      name: cruise.name,
      code: cruise.cruiseLine,
      details: [
        cruise.route,
        `Cabin: ${cruise.cabinName}`,
        `${cruise.duration} night${cruise.duration === 1 ? "" : "s"}${guests ? ` · ${guests} guest${guests === 1 ? "" : "s"}` : ""}`,
      ],
      startDate: formatHistoryDate(booking.departureDate),
      endDate: formatHistoryDate(booking.returnDate),
    },
    status: titleCase(booking.status),
    actionLabel: "View Details",
    actionHref: `/cruises/confirmation?ref=${encodeURIComponent(booking.bookingReference)}`,
  };
};
