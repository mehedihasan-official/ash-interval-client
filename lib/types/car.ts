// Shapes shared between the car-rental UI and the API client. Mirror
// the server's plain (lean) documents plus the pricing block the
// server attaches on the way out.

export interface CarPricing {
  baseTotal: number;
  mileageOverageTotal: number;
  addOnsCash: number;
  addOnsPoints: number;
  subtotal: number;
  memberDiscount: number;
  discountedTotal: number;
  pointsRequired: number;
  processingFee: number;
  totalPoints: number;
  grandTotalCash: number;
  grandTotalPoints: number;
}

export interface Car {
  _id: string;
  carId: string;
  type: string;
  category: string;
  brand: string;
  image?: string;
  passengers: number;
  transmission: "Automatic" | "Manual";
  bags: number;
  mileagePolicy: string;
  freeMilesPerDay: number;
  overageRatePerMile: number;
  fuelType: string;
  airConditioning: boolean;
  vendor: string;
  vendorLogo?: string;
  rating: number;
  reviewCount: number;
  retailPricePerDay: number;
  features: string[];
  pricing: CarPricing;
}

export interface CarAddOnPricing {
  insurancePerDay: number;
  gpsPerDay: number;
  childSeatPerDay: number;
  additionalDriverPerDay: number;
}

export interface CarSearchResult {
  cars: Car[];
  total: number;
  rentalDays: number;
  estimatedDailyMiles: number;
  addOnPricing: CarAddOnPricing;
}

export interface CarAddOns {
  insurance: boolean;
  gps: boolean;
  childSeat: boolean;
  additionalDriver: boolean;
}

export interface CarDriver {
  firstName: string;
  lastName: string;
  dob: string;
  licenseNumber: string;
  licenseCountry: string;
  isPrimary: boolean;
}

export interface CreateCarBookingInput {
  email: string;
  carId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  rentalDays: number;
  estimatedDailyMiles: number;
  drivers: CarDriver[];
  contactInfo: { email: string; phone: string };
  addOns: CarAddOns;
  paymentMethod: "cash" | "points";
}

export interface CarBooking extends CreateCarBookingInput {
  _id: string;
  bookingReference: string;
  carSnapshot: {
    carId: string;
    type: string;
    brand: string;
    image?: string;
    vendor: string;
    vendorLogo?: string;
    passengers: number;
    bags: number;
    transmission: string;
    mileagePolicy: string;
    freeMilesPerDay: number;
    overageRatePerMile: number;
    retailPricePerDay: number;
  };
  pricing: CarPricing;
  status: "confirmed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}
