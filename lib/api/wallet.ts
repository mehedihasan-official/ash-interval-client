// Thin typed client for the interval-ash-server "wallet" endpoints.
// Mirrors the shape and error-handling conventions of lib/api/bookings.ts
// (unwrap the { success, message, data } envelope, throw a plain Error with
// the backend's message on failure). See SERVER_NOTES.md for the backend
// contract these calls expect (routes, schema, signup-bonus + conversion
// logic) — that server code lives in the separate interval-ash-server repo,
// not in this frontend project.
import type { ApiResponse } from "@/lib/types/resort";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  let body: ApiResponse<T> | T | null = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response — the !response.ok branch below reports a generic failure.
  }

  if (!response.ok) {
    throw new Error(
      body && typeof body === "object" && "message" in body
        ? String((body as { message?: string }).message)
        : `Request failed with status ${response.status}`,
    );
  }

  if (body && typeof body === "object" && "success" in body) {
    const envelope = body as ApiResponse<T>;
    if (!envelope.success) throw new Error(envelope.message);
    return envelope.data;
  }

  return body as T;
}

// The commission the backend deducts when converting points to cash.
// Kept here too (not just server-side) purely so the UI can preview the
// payout before the member submits — the backend is the source of truth
// and re-applies this same rate when it processes the conversion.
export const POINTS_CONVERSION_COMMISSION_RATE = 0.3;

// How many points a member is granted the moment their account is created.
// Applied server-side inside POST /users (see SERVER_NOTES.md) so it can
// never be triggered twice for the same account.
export const SIGNUP_BONUS_POINTS = 1000;

// USD value of a single point when converting to cash, before commission.
// Mirrors POINTS_PER_NIGHT / CASH_PRICE_PER_NIGHT in lib/types/booking.ts —
// a Studio night costs 2000 points or $50, so 1 point ≈ $0.025.
export const POINTS_TO_USD_RATE = 0.025;

export interface WalletSummary {
  points: number;
  cashBalance: number;
}

export interface ConvertPointsResult {
  points: number;
  cashBalance: number;
  pointsConverted: number;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
}

/** Fetches the signed-in member's current points balance and cash wallet balance. */
export async function fetchWallet(email: string): Promise<WalletSummary> {
  return apiFetch<WalletSummary>(`/wallet?email=${encodeURIComponent(email)}`);
}

/**
 * Converts a given number of points into cash at a 30% commission rate and
 * credits the result to the member's cash wallet. The backend recomputes
 * the payout itself (never trusts a client-sent amount) and rejects the
 * request if the member doesn't have enough points.
 */
export async function convertPointsToCash(
  email: string,
  pointsToConvert: number,
): Promise<ConvertPointsResult> {
  return apiFetch<ConvertPointsResult>("/wallet/convert", {
    method: "POST",
    body: JSON.stringify({ email, points: pointsToConvert }),
  });
}
