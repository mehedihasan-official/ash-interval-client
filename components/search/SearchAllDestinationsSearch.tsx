"use client";

// "Search All Destinations" tab — same idea as SingleDestinationSearch but
// with a weighted multi-field match and a live suggestions dropdown.
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { buildSuggestions, scoredDestinationSearch } from "@/lib/resortSearch";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";

const SearchAllDestinationsSearch = () => {
  const { resorts } = useResortData();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToResults = (query: string) => {
    router.push(`/search?${new URLSearchParams({ q: query, mode: "all-destinations" }).toString()}`);
  };

  const handleChange = (value: string) => {
    setDestination(value);
    setShowSuggestions(true);
    setSuggestions(value.trim() ? buildSuggestions(value, resorts) : []);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setDestination(suggestion);
    setShowSuggestions(false);
    goToResults(suggestion);
  };

  const handleSearch = () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }
    setError(null);

    if (resorts.length > 0 && scoredDestinationSearch(destination, resorts).length === 0) {
      setError("No matching destinations found.");
      return;
    }

    goToResults(destination);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSearch();
  };

  return (
    <div className="mt-8 px-2 relative">
      <label htmlFor="all-destinations" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
        Destination
      </label>
      <div className="relative">
        <input
          id="all-destinations"
          type="text"
          placeholder="Enter resort name, city, or location"
          className="w-full rounded-md bg-[#0f1c33] text-white placeholder-gray-400 border border-[#0f1c33] px-4 py-3 outline-none focus:ring-2 focus:ring-[#0077be]"
          value={destination}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-[#16223d] border border-gray-300 dark:border-white/10 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        type="button"
        onClick={handleSearch}
        className="w-full bg-[#0077be] hover:bg-[#005a8e] rounded-md text-white font-bold py-3.5 mt-6 transition-colors"
      >
        Find Getaway
      </button>
    </div>
  );
};

export default SearchAllDestinationsSearch;
