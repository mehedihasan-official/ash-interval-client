// Shared search/matching logic for the Gateways & Exchange search tabs
// (Single Destination, Search All Destinations, Resort Name or Code) and
// the /search results page. Kept in one place so every entry point
// ranks and filters resorts the same way.
import {
  getResortCountry,
  getResortLocationTextValues,
  getResortName,
  normalizeResortText,
  type Resort,
} from "@/lib/types/resort";

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

const getResortSearchTextValues = (resort: Resort): string[] => {
  const values = [
    getResortName(resort),
    ...collectStringValues(resort.name),
    ...collectStringValues(resort.resortName),
    ...collectStringValues(resort.place_name),
    ...collectStringValues(resort.symbol),
    ...collectStringValues(resort.description),
    ...getResortLocationTextValues(resort),
  ];

  return Array.from(new Set(values.filter(Boolean)));
};

const getNormalizedSearchText = (resort: Resort): string =>
  getResortSearchTextValues(resort).map(normalizeResortText).join(" ");

/**
 * Simple substring search across resort name, place name, and location.
 * Used by "Single Destination" and the results page's own re-filter.
 */
export const matchesDestination = (resort: Resort, query: string): boolean => {
  const normalizedQuery = normalizeResortText(query);
  if (!normalizedQuery) return false;

  const searchableText = getNormalizedSearchText(resort);
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  return (
    searchableText.includes(normalizedQuery) ||
    queryWords.every((word) => searchableText.includes(word))
  );
};

export interface ScoredResort extends Resort {
  _searchScore: number;
}

/**
 * Weighted, multi-field, multi-word search used by "Search All
 * Destinations". Exact resort-name matches rank highest, then partial
 * matches across resort name, location, and country — each additional
 * matched query word adds to the score, so more relevant results sort
 * first.
 */
export const scoredDestinationSearch = (
  query: string,
  resorts: Resort[],
): ScoredResort[] => {
  const normalizedQuery = normalizeResortText(query);
  if (!normalizedQuery) return [];

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);

  return resorts
    .map((resort) => {
      let score = 0;
      const resortNameLower = normalizeResortText(getResortName(resort));
      const locationLower = getResortLocationTextValues(resort)
        .map(normalizeResortText)
        .join(" ");
      const countryLower = normalizeResortText(getResortCountry(resort) || "");
      const placeNameLower = normalizeResortText(resort.place_name || "");
      const descriptionLower = normalizeResortText(resort.description || "");

      if (resortNameLower === normalizedQuery) {
        score += 10;
      }

      if (locationLower.includes(normalizedQuery)) score += 6;
      if (countryLower === normalizedQuery) score += 5;

      for (const word of queryWords) {
        if (resortNameLower.includes(word)) score += 3;
        if (placeNameLower.includes(word)) score += 2;
        if (locationLower.includes(word)) score += 3;
        if (countryLower.includes(word)) score += 2;
        if (descriptionLower.includes(word)) score += 1;
      }

      return { ...resort, _searchScore: score };
    })
    .filter((resort) => resort._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
};

/** Matches on resort name or resort code/symbol. Used by "Resort Name or Code". */
export const matchesNameOrCode = (resort: Resort, query: string): boolean => {
  const normalizedQuery = normalizeResortText(query);
  if (!normalizedQuery) return false;

  const resortName = normalizeResortText(getResortName(resort));
  const symbol = normalizeResortText(resort.symbol || "");

  return resortName.includes(normalizedQuery) || symbol.includes(normalizedQuery);
};

/**
 * Up to 5 unique suggestion labels (resort name / location / country) for
 * the "Search All Destinations" typeahead dropdown.
 */
export const buildSuggestions = (query: string, resorts: Resort[]): string[] => {
  const results = scoredDestinationSearch(query, resorts);
  const suggestions: string[] = [];

  for (const resort of results.slice(0, 8)) {
    const name = getResortName(resort);
    if (name && !suggestions.includes(name)) suggestions.push(name);
    for (const location of getResortLocationTextValues(resort)) {
      if (!suggestions.includes(location)) suggestions.push(location);
      if (suggestions.length >= 5) break;
    }
    const country = getResortCountry(resort);
    if (country && !suggestions.includes(country)) suggestions.push(country);
    if (suggestions.length >= 5) break;
  }

  return suggestions.slice(0, 5);
};

export type SearchMode = "destination" | "all-destinations" | "name-or-code";

/**
 * Re-runs the appropriate search for a given mode. Used by the /search
 * results page so a full page refresh (which loses any client-side
 * navigation state) still reproduces the exact same results from the
 * query string alone.
 */
export const runSearch = (
  mode: SearchMode,
  query: string,
  resorts: Resort[],
): Resort[] => {
  if (!query.trim()) return [];

  if (mode === "all-destinations") {
    return scoredDestinationSearch(query, resorts);
  }

  if (mode === "name-or-code") {
    return resorts.filter((resort) => matchesNameOrCode(resort, query));
  }

  return resorts.filter((resort) => matchesDestination(resort, query));
};
