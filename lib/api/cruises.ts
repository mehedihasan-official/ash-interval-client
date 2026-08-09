// Typed client for the interval-ash-server cruise endpoints. Follows
// the same conventions as flights.ts/cars.ts — unwrap the standard
// { success, message, data } envelope; throw a plain Error with the
// backend's message on failure.
import type {
  CabinKey,
  CreateCruiseBookingInput,
  Cruise,
  CruiseBooking,
  CruiseMeta,
  CruiseSearchResult,
} from "@/lib/types/cruise";
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
    // Non-JSON — let !response.ok report it.
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

export interface CruiseSearchParams {
  category?: string;
  cruiseLine?: string;
  departurePort?: string;
  minDuration?: number;
  maxDuration?: number;
  cabinType: CabinKey;
  adults: number;
  children: number;
  infants: number;
}

export async function searchCruises(
  params: CruiseSearchParams,
): Promise<CruiseSearchResult> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.cruiseLine) query.set("cruiseLine", params.cruiseLine);
  if (params.departurePort) query.set("departurePort", params.departurePort);
  if (params.minDuration !== undefined)
    query.set("minDuration", String(params.minDuration));
  if (params.maxDuration !== undefined)
    query.set("maxDuration", String(params.maxDuration));
  query.set("cabinType", params.cabinType);
  query.set("adults", String(Math.max(1, params.adults)));
  query.set("children", String(Math.max(0, params.children)));
  query.set("infants", String(Math.max(0, params.infants)));

  const result = await apiFetch<CruiseSearchResult>(
    `/cruises?${query.toString()}`,
  );
  if (!result) {
    throw new Error("Unexpected response from the server while searching cruises.");
  }
  return result;
}

export async function fetchCruiseMeta(): Promise<CruiseMeta> {
  const result = await apiFetch<CruiseMeta>("/cruises/meta/categories");
  return result ?? { categories: [], departurePorts: [], cruiseLines: [] };
}

/**
 * Autocomplete-friendly port lookup. Server matches on partial port
 * names ("miami" → both "Miami, FL" matches), returning at most 15.
 */
export async function searchCruisePorts(
  search: string,
  limit = 10,
): Promise<{ port: string }[]> {
  const query = new URLSearchParams({ search, limit: String(limit) });
  const result = await apiFetch<{ port: string }[]>(
    `/cruises/meta/ports?${query.toString()}`,
  );
  return result ?? [];
}

export async function getCruiseById(
  id: string,
  params: {
    cabinType: CabinKey;
    adults: number;
    children: number;
    infants: number;
  },
): Promise<Cruise | null> {
  const query = new URLSearchParams({
    cabinType: params.cabinType,
    adults: String(params.adults),
    children: String(params.children),
    infants: String(params.infants),
  });
  return apiFetch<Cruise>(`/cruises/${encodeURIComponent(id)}?${query.toString()}`);
}

export async function createCruiseBooking(
  input: CreateCruiseBookingInput,
): Promise<CruiseBooking> {
  const result = await apiFetch<CruiseBooking>("/cruise-bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result) {
    throw new Error(
      "Unexpected response from the server while saving your cruise booking.",
    );
  }
  return result;
}

export async function getCruiseBookingByReference(
  reference: string,
): Promise<CruiseBooking | null> {
  return apiFetch<CruiseBooking>(
    `/cruise-bookings/reference/${encodeURIComponent(reference)}`,
  );
}

export async function fetchCruiseBookingsByEmail(
  email: string,
): Promise<CruiseBooking[]> {
  const result = await apiFetch<CruiseBooking[]>(
    `/cruise-bookings?email=${encodeURIComponent(email)}`,
  );
  return result ?? [];
}
