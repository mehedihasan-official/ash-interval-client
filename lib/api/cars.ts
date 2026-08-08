// Typed client for the interval-ash-server car endpoints. Follows the
// same conventions as flights.ts and resorts.ts — unwrap the standard
// { success, message, data } envelope; throw a plain Error with the
// backend's own message on failure.
import type {
  Car,
  CarBooking,
  CarSearchResult,
  CreateCarBookingInput,
} from "@/lib/types/car";
import type { ApiResponse } from "@/lib/types/resort";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const url = `${getApiBaseUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error(
      "Could not reach the server. Please check your connection and try again.",
    );
  }
  if (response.status === 404) return null;

  let body: ApiResponse<T> | T | null = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON error page — let !response.ok report it.
  }
  if (!response.ok) {
    throw new Error(
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : `Request failed with status ${response.status}`,
    );
  }
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message);
    return body.data;
  }
  return body as T;
}

export interface CarSearchParams {
  category?: string;
  vendor?: string;
  transmission?: "Automatic" | "Manual";
  minPrice?: number;
  maxPrice?: number;
  rentalDays: number;
  estimatedDailyMiles?: number;
}

/**
 * Search available rental cars, pre-priced for the trip length and
 * mileage estimate the caller supplies — so the results grid can show
 * every car's true total without a second round trip.
 */
export async function searchCars(
  params: CarSearchParams,
): Promise<CarSearchResult> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.vendor) query.set("vendor", params.vendor);
  if (params.transmission) query.set("transmission", params.transmission);
  if (params.minPrice !== undefined)
    query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    query.set("maxPrice", String(params.maxPrice));
  query.set("rentalDays", String(Math.max(1, params.rentalDays)));
  if (params.estimatedDailyMiles !== undefined) {
    query.set("estimatedDailyMiles", String(params.estimatedDailyMiles));
  }

  const result = await apiFetch<CarSearchResult>(
    `/cars?${query.toString()}`,
  );
  if (!result) {
    throw new Error("Unexpected response from the server while searching cars.");
  }
  return result;
}

export async function getCarById(
  id: string,
  rentalDays: number,
  estimatedDailyMiles = 0,
): Promise<Car | null> {
  const query = new URLSearchParams({
    rentalDays: String(rentalDays),
    estimatedDailyMiles: String(estimatedDailyMiles),
  });
  return apiFetch<Car>(
    `/cars/${encodeURIComponent(id)}?${query.toString()}`,
  );
}

export async function createCarBooking(
  input: CreateCarBookingInput,
): Promise<CarBooking> {
  const result = await apiFetch<CarBooking>("/car-bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result) {
    throw new Error(
      "Unexpected response from the server while saving your car booking.",
    );
  }
  return result;
}

export async function getCarBookingByReference(
  reference: string,
): Promise<CarBooking | null> {
  return apiFetch<CarBooking>(
    `/car-bookings/reference/${encodeURIComponent(reference)}`,
  );
}

export async function fetchCarBookingsByEmail(
  email: string,
): Promise<CarBooking[]> {
  const result = await apiFetch<CarBooking[]>(
    `/car-bookings?email=${encodeURIComponent(email)}`,
  );
  return result ?? [];
}
