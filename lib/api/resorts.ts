// Thin typed client for the interval-ash-server "resorts" endpoints.
// Every function here mirrors one backend route and unwraps the
// { success, message, data } envelope the API always responds with,
// so calling code just works with plain data (or a thrown Error).
import type {
  ApiResponse,
  Resort,
  ResortPagination,
  ResortSearchResult,
} from "@/lib/types/resort";

export interface ResortSearchParams {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Resolves the backend base URL once, so a missing/misconfigured env
// var produces one clear error instead of a confusing failed fetch.
function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
}

// Shared fetch + unwrap logic. Throws a plain Error with the backend's
// own message when the request fails, so calling UI code can show it
// directly without needing to know about the envelope shape.
//
// A 404 is handled specially: it resolves to `null` instead of throwing,
// because "not found" is an expected, normal outcome (e.g. a stale link
// or a bad id) rather than a failure — callers that care about the
// distinction (like getResortById below) can map null to Next.js's
// notFound(), while every other failure (network error, 500, etc.)
// still throws so it reaches the route's error boundary.
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
    // Network failure (server down, CORS, offline, etc.) — fetch() itself
    // throws a generic TypeError with little useful detail for the user.
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
    // Non-JSON response (e.g. a proxy error page) — fall through and
    // let the !response.ok branch below report a generic failure.
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
 * Search/browse resorts. With no params, returns the first page of every
 * resort (matching GET /api/resorts with no query string).
 *
 * This endpoint has no plausible 404 case (an empty result set is still
 * a 200 with an empty array), so a null response here would indicate an
 * unexpected backend change — treat it as a hard error rather than
 * silently returning an empty list.
 */
export async function searchResorts(
  params: ResortSearchParams = {},
): Promise<ResortSearchResult> {
  const query = new URLSearchParams();

  if (params.search) query.set("search", params.search);
  if (params.location) query.set("location", params.location);
  if (params.minPrice !== undefined)
    query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined)
    query.set("maxPrice", String(params.maxPrice));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const result = await apiFetch<ResortSearchResult>(
    `/resorts${queryString ? `?${queryString}` : ""}`,
  );

  if (!result) {
    throw new Error(
      "Unexpected response from the server while searching resorts.",
    );
  }

  return normalizeResortSearchResult(result);
}

function normalizeResortSearchResult(
  result:
    | Resort[]
    | {
        resorts?: Resort[];
        results?: Resort[];
        data?: Resort[];
        pagination?: Partial<ResortPagination>;
      },
): ResortSearchResult {
  const resorts = Array.isArray(result)
    ? result
    : Array.isArray(result.resorts)
      ? result.resorts
      : Array.isArray(result.results)
        ? result.results
        : Array.isArray(result.data)
          ? result.data
          : [];
  const sourcePagination = Array.isArray(result)
    ? undefined
    : result.pagination;

  return {
    resorts,
    pagination: {
      page: sourcePagination?.page ?? 1,
      limit: sourcePagination?.limit ?? resorts.length,
      total: sourcePagination?.total ?? resorts.length,
      totalPages: sourcePagination?.totalPages ?? (resorts.length > 0 ? 1 : 0),
    },
  };
}

/**
 * Fetch a single resort by its MongoDB ID.
 * Returns `null` when the resort doesn't exist (backend 404) so the
 * caller can render Next.js's not-found UI; throws for any other failure.
 */
export async function getResortById(id: string): Promise<Resort | null> {
  return apiFetch<Resort>(`/resorts/${encodeURIComponent(id)}`);
}

// The directory flow needs the full resort dataset available client-side
// to build the country/region hierarchy accurately. Rather than making
// dozens of small page requests, fetch the dataset in larger chunks and
// only request the remaining pages if the backend reports more than one.
const FULL_DATASET_PAGE_SIZE = 1000;

/**
 * Fetch every resort in the dataset by walking all pages of
 * GET /api/resorts. Used once, app-wide, by ResortDataProvider so the
 * country -> region -> resort browsing flow can group/filter the full
 * dataset client-side instead of only ever seeing one page at a time.
 */
export async function fetchAllResorts(): Promise<Resort[]> {
  const firstPage = await searchResorts({
    page: 1,
    limit: FULL_DATASET_PAGE_SIZE,
  });

  const allResorts: Resort[] = [...firstPage.resorts];

  if (firstPage.pagination.totalPages <= 1) {
    return allResorts;
  }

  const remainingPages = Array.from(
    { length: firstPage.pagination.totalPages - 1 },
    (_, index) => index + 2,
  );

  const remainingResults = await Promise.all(
    remainingPages.map((page) =>
      searchResorts({ page, limit: FULL_DATASET_PAGE_SIZE }),
    ),
  );

  for (const result of remainingResults) {
    allResorts.push(...result.resorts);
  }

  return allResorts;
}
