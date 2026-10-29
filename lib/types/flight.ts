// Shared shapes for the flight-booking flow. Kept separate from
// lib/types/booking.ts because the flight and resort booking domains
// don't overlap enough to justify a common union type — they simply
// share the same envelope shape (see ApiResponse in resort.ts).

export interface Airport {
  _id?: string;
  code: string;
  city: string;
  name: string;
  country: string;
  state?: string;
  stateCode?: string;
}

export type CabinClass =
  | "Economy"
  | "Premium Economy"
  | "Business"
  | "First";

export type TripType = "oneway" | "roundtrip" | "multicity";

// Every figure here is per traveler, for the whole itinerary — a round
// trip is already quoted as a round trip, the way an airline site
// quotes it. Multiply by the party's fare weight (see
// sumPassengerFareWeight below) to get a booking total.
export interface FlightPricing {
  retailPrice: number;
  discountedPrice: number;
  pointsRequired: number;
  processingFee: number;
  totalPoints: number;
}

export interface Flight {
  _id: string;
  flightId: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopLabel: string;
  cabinClass: CabinClass;
  retailPrice: number;
  seatsAvailable: number;
  aircraft: string;
  refundable: boolean;
  baggage: string;
  pricing: FlightPricing;
}

export interface FlightSearchResult {
  flights: Flight[];
  exactMatch: boolean;
  total: number;
}

export interface FlightPassenger {
  type: "Adult" | "Child" | "Infant";
  firstName: string;
  lastName: string;
  dob: string;
  gender: "Male" | "Female" | "Other" | "";
  passportNumber?: string;
  knownTravelerNumber?: string;
  mealPreference?: string;
  seat?: string | null;
}

export interface FlightBookingAddOns {
  extraBaggage: boolean;
  seatSelections: (string | null)[];
}

export interface CreateFlightBookingInput {
  email: string;
  flightId: string;
  tripType: TripType;
  departureDate: string;
  returnDate?: string | null;
  passengers: FlightPassenger[];
  contactInfo: { email: string; phone: string };
  addOns: FlightBookingAddOns;
  paymentMethod: "cash" | "points";
  // Sent when the user booked a flight whose route was synthesized on
  // the fly (most searches). Lets the server snapshot the actual route
  // the user saw instead of the template flight's original route.
  routeOverride?: { origin: string; destination: string };
}

export interface FlightBooking extends CreateFlightBookingInput {
  _id: string;
  bookingReference: string;
  flightSnapshot: {
    flightId: string;
    airline: string;
    airlineLogo?: string;
    flightNumber: string;
    origin: string;
    originCity: string;
    destination: string;
    destinationCity: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    cabinClass: string;
    aircraft: string;
    stopLabel: string;
    baggage: string;
    refundable: boolean;
    retailPrice: number;
  };
  pricing: FlightPricing & {
    // Optional because bookings taken before fares were priced per
    // party don't carry them; the confirmation page falls back to the
    // per-traveler figures for those.
    travelers?: number;
    fareCash?: number;
    farePoints?: number;
    addOnsCash: number;
    addOnsPoints: number;
    grandTotalCash: number;
    grandTotalPoints: number;
  };
  status: "confirmed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

// Add-on prices use the same 25 points per $1 rate as before ($0.04/pt).
export const FLIGHT_ADDON_PRICING = {
  seatCash: 45,
  seatPoints: 1125,
  baggageCash: 85,
  baggagePoints: 2125,
} as const;

// Member discount off the retail fare, shown on the flight detail page.
export const FLIGHT_MEMBER_DISCOUNT_RATE = 0.23;

// Share of the points fare charged as a processing fee (matches the
// "10% fee" shown on the detail page's points option).
const FLIGHT_POINTS_FEE_RATE = 0.1;

/**
 * Re-prices a flight at the current member discount. Cash is derived from
 * the retail fare; the points fare is scaled by the same change so cash
 * and points stay in step. Always derived from `retailPrice` (never
 * compounded on the discounted price), so applying it twice is harmless.
 */
export const withMemberDiscount = (pricing: FlightPricing): FlightPricing => {
  const discountedPrice =
    Math.round(
      pricing.retailPrice * (1 - FLIGHT_MEMBER_DISCOUNT_RATE) * 100,
    ) / 100;
  const scale =
    pricing.discountedPrice > 0 ? discountedPrice / pricing.discountedPrice : 1;
  const pointsRequired = Math.round(pricing.pointsRequired * scale);
  const processingFee = Math.round(pointsRequired * FLIGHT_POINTS_FEE_RATE);
  return {
    ...pricing,
    discountedPrice,
    pointsRequired,
    processingFee,
    totalPoints: pointsRequired + processingFee,
  };
};

// Mirrors PASSENGER_FARE_WEIGHT on the server (utils/flight-pricing.ts)
// so the Booking Summary previews the same total the server will
// charge. The server still recomputes it from the submitted passenger
// list — this is display only.
const PASSENGER_FARE_WEIGHT: Record<FlightPassenger["type"], number> = {
  Adult: 1,
  Child: 0.75,
  Infant: 0.1,
};

/**
 * Fare weight for a party: 2 adults + 1 child is 2.75 adult fares, not
 * 3, and a lap infant is a token 0.1. Never returns less than one fare
 * so a summary can't show $0.
 */
export const fareWeightForParty = (
  adults: number,
  children: number,
  infants: number,
): number => {
  const weight =
    adults * PASSENGER_FARE_WEIGHT.Adult +
    children * PASSENGER_FARE_WEIGHT.Child +
    infants * PASSENGER_FARE_WEIGHT.Infant;
  return weight > 0 ? weight : 1;
};
