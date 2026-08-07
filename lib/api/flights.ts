// Thin typed client for the interval-ash-server flight endpoints.
// Mirrors the conventions used by lib/api/resorts.ts and lib/api/bookings.ts
// (unwrap the { success, message, data } envelope; throw a plain Error with
// the backend's own message on failure) so calling components don't need
// to know anything about the transport layer.
import type {
  Airport,
  CabinClass,
  CreateFlightBookingInput,
  Flight,
  FlightBooking,
  FlightSearchResult,
} from "@/lib/types/flight";
import type { ApiResponse } from "@/lib/types/resort";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const url = `${getApiBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
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
    // Non-JSON error page — fall through and let !response.ok report it.
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

/**
 * Look up airports for the autocomplete on the search form. The server
 * matches on IATA code, city, and airport name, so a member typing
 * "new" gets both New York (JFK/LGA) and Newark (EWR).
 */
export async function searchAirports(
  search: string,
  limit = 10,
): Promise<Airport[]> {
  const query = new URLSearchParams({ search, limit: String(limit) });
  const result = await apiFetch<Airport[]>(`/airports?${query.toString()}`);
  return result ?? [];
}

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  cabinClass?: CabinClass;
  airline?: string;
  stops?: "nonstop" | "1stop" | "2plus";
  refundable?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Run a flight search. The server returns a fallback (all flights) when
 * the exact origin/destination pairing has no matches; `exactMatch: false`
 * tells the UI to show that hint so the traveler knows they're looking
 * at demo results rather than routes that literally exist.
 */
export async function searchFlights(
  params: FlightSearchParams = {},
): Promise<FlightSearchResult> {
  const query = new URLSearchParams();
  if (params.origin) query.set("origin", params.origin);
  if (params.destination) query.set("destination", params.destination);
  if (params.cabinClass) query.set("cabinClass", params.cabinClass);
  if (params.airline) query.set("airline", params.airline);
  if (params.stops) query.set("stops", params.stops);
  if (params.refundable) query.set("refundable", "true");
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));

  const qs = query.toString();
  const result = await apiFetch<FlightSearchResult>(
    `/flights${qs ? `?${qs}` : ""}`,
  );

  if (!result) {
    throw new Error("Unexpected response from the server while searching flights.");
  }
  return result;
}

/**
 * Fetch a single flight by _id or human `flightId`. Returns null on 404
 * so the detail page can render a friendly "flight no longer available"
 * screen instead of crashing.
 */
export async function getFlightById(id: string): Promise<Flight | null> {
  return apiFetch<Flight>(`/flights/${encodeURIComponent(id)}`);
}

/**
 * Persist the confirmed booking. The server recomputes all totals from
 * the flight and add-on selections so a tampered client payload cannot
 * lower the final price — we only submit intent, not pricing.
 */
export async function createFlightBooking(
  input: CreateFlightBookingInput,
): Promise<FlightBooking> {
  const result = await apiFetch<FlightBooking>("/flight-bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result) {
    throw new Error(
      "Unexpected response from the server while saving your flight booking.",
    );
  }
  return result;
}

/** Fetch a single confirmed booking by its human reference. */
export async function getFlightBookingByReference(
  reference: string,
): Promise<FlightBooking | null> {
  return apiFetch<FlightBooking>(
    `/flight-bookings/reference/${encodeURIComponent(reference)}`,
  );
}

/** List all flight bookings for a member email, newest first. */
export async function fetchFlightBookingsByEmail(
  email: string,
): Promise<FlightBooking[]> {
  const result = await apiFetch<FlightBooking[]>(
    `/flight-bookings?email=${encodeURIComponent(email)}`,
  );
  return result ?? [];
}
