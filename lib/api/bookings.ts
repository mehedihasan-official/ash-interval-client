// Thin typed client for the interval-ash-server "bookings" endpoints.
// Mirrors the shape and error-handling conventions of lib/api/resorts.ts so
// booking calls behave the same way (unwrap the { success, message, data }
// envelope, throw a plain Error with the backend's message on failure).
import type { BillingInfo } from "@/lib/types/booking";
import type { ApiResponse, Resort } from "@/lib/types/resort";

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

  if (response.status === 404) {
    return null;
  }

  let body: ApiResponse<T> | T | null = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response — the !response.ok branch below reports a generic failure.
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

// Card details are only ever sent for a cash booking, and only the last
// four digits are meaningful to show back to the member afterwards — but
// the full number/expiry are still recorded server-side the same way the
// reference app captured them, since there's no real payment processor
// wired up yet.
export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface CreateBookingInput {
  resort: Resort;
  email: string;
  paymentMethod: "points" | "cash";
  price: number;
  points: number;
  unitType: string;
  startDate: string;
  endDate: string;
  nights: number;
  billingInfo: BillingInfo;
  paymentDetails: PaymentDetails | null;
}

export interface Booking extends CreateBookingInput {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

/** Records a confirmed booking. Called once payment/points redemption is submitted. */
export async function createBooking(
  input: CreateBookingInput,
): Promise<Booking> {
  const result = await apiFetch<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!result) {
    throw new Error(
      "Unexpected response from the server while saving your booking.",
    );
  }

  return result;
}

// The backend can respond to GET /bookings?email= with either a bare array
// or an object wrapping one, depending on how many records match — this
// normalizes either shape to a plain array so callers don't need to care.
function normalizeBookingList(
  result: Booking[] | { bookings?: Booking[] } | null,
): Booking[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return Array.isArray(result.bookings) ? result.bookings : [];
}

/** Fetches every booking made by the given member email, most recent first. */
export async function fetchBookingsByEmail(email: string): Promise<Booking[]> {
  const result = await apiFetch<Booking[] | { bookings?: Booking[] }>(
    `/bookings?email=${encodeURIComponent(email)}`,
  );

  const bookings = normalizeBookingList(result);
  return bookings.sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime(),
  );
}
