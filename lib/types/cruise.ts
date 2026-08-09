// Shared shapes for the cruise-booking flow. Mirror the server's lean
// documents plus the pricing block the server attaches on the way out.

export type CabinKey = "inside" | "outside" | "balcony" | "suite";

export interface CabinType {
  name: string;
  retailPrice: number;
}

export interface CruisePricing {
  cabinBaseTotal: number;
  taxesAndPortFees: number;
  gratuities: number;
  addOnsCash: number;
  subtotal: number;
  memberDiscount: number;
  discountedTotal: number;
  pointsRequired: number;
  processingFee: number;
  totalPoints: number;
  grandTotalCash: number;
  grandTotalPoints: number;
}

export interface Cruise {
  _id: string;
  cruiseId: string;
  name: string;
  cruiseLine: string;
  cruiseLineLogo?: string;
  route: string;
  departurePort: string;
  duration: number;
  category: string;
  image?: string;
  rating: number;
  reviews: number;
  itinerary: string[];
  shipFeatures: string[];
  cabinTypes: Record<CabinKey, CabinType>;
  departureDates: string[];
  includes: string[];
  pricing: CruisePricing;
  selectedCabin: CabinKey;
}

export interface CruiseAddOnPricing {
  travelInsurancePerGuest: number;
  drinkPackagePerGuestPerNight: number;
  wifiPackagePerGuestPerNight: number;
  excursionPackagePerGuestPerNight: number;
}

export interface CruiseSearchResult {
  cruises: Cruise[];
  total: number;
  pricingParams: {
    cabinType: CabinKey;
    adults: number;
    children: number;
    infants: number;
  };
  addOnPricing: CruiseAddOnPricing;
}

export interface CruiseMeta {
  categories: string[];
  departurePorts: string[];
  cruiseLines: string[];
}

export interface CruiseGuest {
  type: "Adult" | "Child" | "Infant";
  firstName: string;
  lastName: string;
  dob: string;
  gender: "Male" | "Female" | "Other" | "";
  passportNumber?: string;
  nationality?: string;
  diningPreference?: string;
}

export interface CruiseAddOns {
  travelInsurance: boolean;
  drinkPackage: boolean;
  wifiPackage: boolean;
  excursionPackage: boolean;
}

export interface CreateCruiseBookingInput {
  email: string;
  cruiseId: string;
  cabinType: CabinKey;
  departureDate: string;
  guests: CruiseGuest[];
  contactInfo: { email: string; phone: string };
  addOns: CruiseAddOns;
  paymentMethod: "cash" | "points";
}

export interface CruiseBooking extends CreateCruiseBookingInput {
  _id: string;
  bookingReference: string;
  cruiseSnapshot: {
    cruiseId: string;
    name: string;
    cruiseLine: string;
    cruiseLineLogo?: string;
    route: string;
    departurePort: string;
    duration: number;
    image?: string;
    itinerary: string[];
    cabinName: string;
    cabinRetailPrice: number;
  };
  returnDate: string;
  pricing: CruisePricing;
  status: "confirmed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}
