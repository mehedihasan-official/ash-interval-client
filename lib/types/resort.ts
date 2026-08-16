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
  name?: string;
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
  resort.resortName || resort.place_name || resort.name || "Unnamed resort";

export const normalizeResortText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const collectStringValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectStringValues);
  }

  return [];
};

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

const LOCATION_FIELD_NAMES = [
  "location",
  "country",
  "region",
  "continent",
  "city",
  "state",
  "province",
  "destination",
  "area",
  "resortArea",
  "address",
] as const;

export const getResortLocationTextValues = (resort: Resort): string[] => {
  const values = LOCATION_FIELD_NAMES.flatMap((field) =>
    collectStringValues(resort[field]),
  );

  return Array.from(new Set(values));
};

export const resortMatchesLocation = (
  resort: Resort,
  location: string,
): boolean => {
  const normalizedLocation = normalizeResortText(location);
  if (!normalizedLocation) return false;

  return getResortLocationTextValues(resort).some((value) => {
    const normalizedValue = normalizeResortText(value);
    return (
      normalizedValue === normalizedLocation ||
      normalizedValue.includes(normalizedLocation)
    );
  });
};

/**
 * Every distinct, non-empty country across the given resorts, sorted
 * alphabetically. Used by the top-level Resort Directory page to build
 * the "choose a country" grid from the full dataset.
 *
 * Resorts whose `country` field is a placeholder like "Unknown" (case-
 * insensitive) are hidden from the grid — routing to
 * `/resort-directory/region/Unknown` isn't a useful destination for a
 * member, so we don't advertise it as a browseable country. The resort
 * documents themselves stay in the database, they're just not surfaced
 * as a country choice.
 */
const PLACEHOLDER_COUNTRY_NAMES = new Set(["unknown", "n/a", "none", "null"]);

const isPlaceholderCountry = (country: string): boolean =>
  PLACEHOLDER_COUNTRY_NAMES.has(country.trim().toLowerCase());

export const getUniqueCountries = (resorts: Resort[]): string[] => {
  const countries = new Set<string>();
  for (const resort of resorts) {
    const country = getResortCountry(resort);
    if (country && !isPlaceholderCountry(country)) countries.add(country);
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
  const normalizedCountry = normalizeResortText(country);
  const regions = new Set<string>();
  for (const resort of resorts) {
    const resortCountry = getResortCountry(resort);
    if (
      !resortCountry ||
      normalizeResortText(resortCountry) !== normalizedCountry
    ) {
      continue;
    }

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
