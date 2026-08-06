// Shared types describing data returned by interval-ash-server.
//
// The backend's Resort schema is deliberately permissive (`strict: false`
// in Mongoose) because it holds a bulk-imported dataset of 1,700+ resorts
// with an inconsistent shape — only `name` is guaranteed to exist on every
// document. Everything else here is optional, and any extra fields the
// dataset happens to carry are still allowed through via the index
// signature at the bottom, so the UI never crashes on an unexpected field.

export interface Resort {
  _id: string;
  place_name: string;
  resortName?: string;
  country?: string;
  region?: string | string[];
  symbol?: string;
  location?: string;
  description?: string;
  onSite?: string;
  nearby?: string;
  contactInfo?: string;
  nearestAirport?: string;
  checkInDays?: string[];
  pricePerNight?: number;
  img?: string;
  img2?: string;
  img3?: string;
  img4?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Allows any additional, undeclared fields present on individual
  // documents in the imported dataset to pass through untouched.
  [key: string]: unknown;
}

export interface ResortPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResortSearchResult {
  resorts: Resort[];
  pagination: ResortPagination;
}

// Standard success/error envelope every interval-ash-server response uses.
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const getResortName = (resort: Resort): string =>
  resort.resortName || resort.place_name || "Unnamed resort";

export const dedupeResorts = (resorts: Resort[]): Resort[] => {
  const seen = new Set<string>();
  const deduped: Resort[] = [];

  for (const resort of resorts) {
    const id =
      typeof resort._id === "string" && resort._id.trim().length > 0
        ? resort._id.trim()
        : "";

    const fallbackKey = [
      getResortName(resort),
      getResortCountry(resort) ?? "",
      typeof resort.location === "string" ? resort.location.trim() : "",
      typeof resort.symbol === "string" ? resort.symbol.trim() : "",
      typeof resort.description === "string" ? resort.description.trim() : "",
    ]
      .filter(Boolean)
      .join("::");

    const key = id || fallbackKey;
    if (!key || seen.has(key)) continue;

    seen.add(key);
    deduped.push(resort);
  }

  return deduped;
};

export const getResortImages = (resort: Resort): string[] => {
  const apiImages = [resort.img, resort.img2, resort.img3, resort.img4];
  const additionalImages = Array.isArray(resort.images) ? resort.images : [];
  const images = [...apiImages, ...additionalImages];

  return Array.from(
    new Set(
      images.filter(
        (image): image is string =>
          typeof image === "string" && image.trim().length > 0,
      ),
    ),
  );
};

// `region` is typed as `string | string[]` because the bulk-imported
// dataset isn't consistent about it — normalize to an array of trimmed,
// non-empty names so every caller can treat it the same way.
export const getResortRegions = (resort: Resort): string[] => {
  const raw = resort.region;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list
    .map((region) => (typeof region === "string" ? region.trim() : ""))
    .filter(Boolean);
};

export const getResortCountry = (resort: Resort): string | null => {
  const country = resort.country;
  return typeof country === "string" && country.trim() ? country.trim() : null;
};

/**
 * Every distinct, non-empty country across the given resorts, sorted
 * alphabetically. Used by the top-level Resort Directory page to build
 * the "choose a country" grid from the full dataset.
 */
export const getUniqueCountries = (resorts: Resort[]): string[] => {
  const countries = new Set<string>();
  for (const resort of resorts) {
    const country = getResortCountry(resort);
    if (country) countries.add(country);
  }
  return Array.from(countries).sort((a, b) => a.localeCompare(b));
};

/**
 * Every distinct, non-empty region for resorts within one country,
 * sorted alphabetically. Used by the country page to decide whether to
 * show a region-picker step or go straight to resort cards.
 */
export const getUniqueRegionsForCountry = (
  resorts: Resort[],
  country: string,
): string[] => {
  const regions = new Set<string>();
  for (const resort of resorts) {
    if (getResortCountry(resort) !== country) continue;
    for (const region of getResortRegions(resort)) regions.add(region);
  }
  return Array.from(regions).sort((a, b) => a.localeCompare(b));
};

/**
 * Splits free-text amenity fields (onSite / nearby) into a clean list.
 * The source data separates items with commas, middle dots, or periods
 * inconsistently, so all three are treated as delimiters.
 */
export const splitAmenities = (text: string | undefined): string[] => {
  if (!text) return [];
  return text
    .split(/[,·.]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};
