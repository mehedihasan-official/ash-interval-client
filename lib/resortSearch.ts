// Shared search/matching logic for the Gateways & Exchange search tabs
// (Single Destination, Search All Destinations, Resort Name or Code) and
// the /search results page. Kept in one place so every entry point
// ranks and filters resorts the same way.
import { getResortCountry, getResortName, type Resort } from "@/lib/types/resort";

/**
 * Simple substring search across resort name, place name, and location.
 * Used by "Single Destination" and the results page's own re-filter.
 */
export const matchesDestination = (resort: Resort, query: string): boolean => {
  const queryLower = query.trim().toLowerCase();
  if (!queryLower) return false;

  const resortName = getResortName(resort).toLowerCase();
  const placeName = resort.place_name?.toLowerCase() || "";
  const location = resort.location?.toLowerCase() || "";
  const country = getResortCountry(resort)?.toLowerCase() || "";

  return (
    resortName.includes(queryLower) ||
    placeName.includes(queryLower) ||
    location.includes(queryLower) ||
    country.includes(queryLower)
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
  const queryLower = query.trim().toLowerCase();
  if (!queryLower) return [];

  const queryWords = queryLower.split(/\s+/).filter(Boolean);

  return resorts
    .map((resort) => {
      let score = 0;
      const resortNameLower = getResortName(resort).toLowerCase();
      const locationLower = resort.location?.toLowerCase() || "";
      const countryLower = getResortCountry(resort)?.toLowerCase() || "";
      const placeNameLower = resort.place_name?.toLowerCase() || "";

      if (resortNameLower === queryLower) {
        score += 10;
      }

      for (const word of queryWords) {
        if (resortNameLower.includes(word)) score += 3;
        if (placeNameLower.includes(word)) score += 2;
        if (locationLower.includes(word)) score += 2;
        if (countryLower.includes(word)) score += 1;
      }

      return { ...resort, _searchScore: score };
    })
    .filter((resort) => resort._searchScore > 0)
    .sort((a, b) => b._searchScore - a._searchScore);
};

/** Matches on resort name or resort code/symbol. Used by "Resort Name or Code". */
export const matchesNameOrCode = (resort: Resort, query: string): boolean => {
  const queryLower = query.trim().toLowerCase();
  if (!queryLower) return false;

  const resortName = getResortName(resort).toLowerCase();
  const symbol = resort.symbol?.toLowerCase() || "";

  return resortName.includes(queryLower) || symbol.includes(queryLower);
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
    if (resort.location && !suggestions.includes(resort.location)) {
      suggestions.push(resort.location);
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
