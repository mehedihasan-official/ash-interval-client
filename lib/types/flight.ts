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
}

export type CabinClass =
  | "Economy"
  | "Premium Economy"
  | "Business"
  | "First";

export type TripType = "oneway" | "roundtrip" | "multicity";

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
    addOnsCash: number;
    addOnsPoints: number;
    grandTotalCash: number;
    grandTotalPoints: number;
  };
  status: "confirmed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export const FLIGHT_ADDON_PRICING = {
  seatCash: 15,
  seatPoints: 375,
  baggageCash: 35,
  baggagePoints: 875,
} as const;
