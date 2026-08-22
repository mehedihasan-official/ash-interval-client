// Thin typed client for the interval-ash-server admin endpoints.
// Mirrors the shape and error-handling conventions of lib/api/bookings.ts
// (unwrap the { success, message, data } envelope, throw a plain Error with
// the backend's message on failure). See SERVER_NOTES.md for the exact
// backend routes/schema these calls expect — that server code lives in the
// separate interval-ash-server repo, not in this frontend project.
import firebaseApp, { isFirebaseConfigured } from "@/lib/firebase/firebase.config";
import type { CabinKey, Cruise } from "@/lib/types/cruise";
import type { ApiResponse, Resort } from "@/lib/types/resort";
import { getAuth } from "firebase/auth";

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

// The backend identifies the calling admin by this header (see
// interval-ash-server's requireAdmin middleware) rather than a bearer
// token, matching how the rest of this app already treats the signed-in
// Firebase user's email as the admin identity (AuthProvider looks up
// `isAdmin` in Mongo by that same email). Reading it here, in the shared
// fetch helper, means every admin call below sends it automatically
// instead of each function having to thread it through by hand.
function getCurrentUserEmail(): string | null {
  if (!isFirebaseConfigured || !firebaseApp) return null;
  return getAuth(firebaseApp).currentUser?.email ?? null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const callerEmail = getCurrentUserEmail();

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(callerEmail ? { "x-user-email": callerEmail } : {}),
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

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  points: number;
  cashBalance: number;
  createdAt?: string;
}

// The backend can respond with either a bare array or an object wrapping
// one, same normalization pattern used for bookings in lib/api/bookings.ts.
function normalizeUserList(result: AdminUser[] | { users?: AdminUser[] } | null): AdminUser[] {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  return Array.isArray(result.users) ? result.users : [];
}

/** Fetches every registered user, admins and regular members alike. */
export async function fetchAllUsers(): Promise<AdminUser[]> {
  const result = await apiFetch<AdminUser[] | { users?: AdminUser[] }>("/all-users");
  return normalizeUserList(result);
}

/**
 * Promotes or demotes a member's admin status. The signed-in admin can
 * never demote themselves — that guard is enforced in the UI (the button
 * is disabled for the admin's own row) and should also be enforced
 * server-side as a defense-in-depth measure.
 */
export async function updateUserRole(email: string, isAdmin: boolean): Promise<AdminUser> {
  return apiFetch<AdminUser>("/update-user", {
    method: "PATCH",
    body: JSON.stringify({ email, isAdmin }),
  });
}

// Fields the admin resort-input form collects. Mirrors the shape already
// read throughout the app (lib/types/resort.ts) so a resort created here
// renders correctly everywhere else without any extra mapping.
export interface CreateResortInput {
  resortName: string;
  location: string;
  symbol: string;
  region: string;
  country: string;
  continent: string;
  description: string;
  onSite: string;
  nearby: string;
  contactInfo: string;
  nearestAirport: string;
  checkInDays: string[];
  img: string;
  img2: string;
  img3: string;
  img4: string;
}

/** Creates a new resort listing. Admin-only on the backend. */
export async function createResort(input: CreateResortInput): Promise<Resort> {
  return apiFetch<Resort>("/resorts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Same field set as CreateResortInput, but every field is optional since
// an edit only needs to send what actually changed (or, in this form's
// case, the full set re-derived from the existing resort — either way
// the backend applies these with $set, so omitted fields are left alone).
export type UpdateResortInput = Partial<CreateResortInput>;

/** Updates an existing resort listing by id. Admin-only on the backend. */
export async function updateResort(
  id: string,
  input: UpdateResortInput,
): Promise<Resort> {
  return apiFetch<Resort>(`/resorts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

// Fields the admin cruise-input form collects. Mirrors the Cruise
// schema on the backend (interval-ash-server/src/models/cruise.model.ts)
// so a cruise created here renders correctly across search, detail,
// and the booking flow without any extra mapping.
export interface CruiseCabinInput {
  name: string;
  retailPrice: number;
}

export interface CreateCruiseInput {
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
  cabinTypes: Record<CabinKey, CruiseCabinInput>;
  departureDates: string[];
  includes: string[];
}

export type UpdateCruiseInput = Partial<CreateCruiseInput>;

/** Creates a new cruise listing. Admin-only on the backend. */
export async function createCruise(input: CreateCruiseInput): Promise<Cruise> {
  return apiFetch<Cruise>("/cruises", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Updates an existing cruise by id. Admin-only on the backend. */
export async function updateCruise(
  id: string,
  input: UpdateCruiseInput,
): Promise<Cruise> {
  return apiFetch<Cruise>(`/cruises/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
