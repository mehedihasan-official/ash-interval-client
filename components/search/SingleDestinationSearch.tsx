"use client";

// "Single Destination" search tab, shared by the Gateways and Exchange
// pages. Submits the destination + optional date range to /search, which
// re-runs the same search from the URL so the results page works on a
// fresh page load too.
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { matchesDestination } from "@/lib/resortSearch";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";

const SingleDestinationSearch = () => {
  const { resorts } = useResortData();
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [earliestDate, setEarliestDate] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!destination.trim()) {
      setError("Please enter a destination.");
      return;
    }
    setError(null);

    const hasResults = resorts.some((resort) => matchesDestination(resort, destination));
    if (resorts.length > 0 && !hasResults) {
      // Still navigate — the results page shows its own "no matches"
      // state — but let the shopper know up front too.
    }

    const params = new URLSearchParams({ q: destination, mode: "destination" });
    if (earliestDate) params.set("from", earliestDate);
    if (latestDate) params.set("to", latestDate);
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSearch();
  };

  return (
    <div className="mt-8 px-2">
      <label htmlFor="single-destination" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
        Destination
      </label>
      <input
        id="single-destination"
        type="text"
        placeholder="Enter city, resort name, or location"
        className="w-full rounded-md bg-[#0f1c33] text-white placeholder-gray-400 border border-[#0f1c33] px-4 py-3 outline-none focus:ring-2 focus:ring-[#0077be]"
        value={destination}
        onChange={(event) => setDestination(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="w-full">
          <label htmlFor="earliest-date" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
            Earliest Travel Date
          </label>
          <input
            id="earliest-date"
            type="date"
            className="w-full rounded-md bg-[#0f1c33] text-white border border-[#0f1c33] px-4 py-3 outline-none focus:ring-2 focus:ring-[#0077be] [color-scheme:dark]"
            value={earliestDate}
            onChange={(event) => setEarliestDate(event.target.value)}
          />
        </div>
        <div className="w-full">
          <label htmlFor="latest-date" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
            Latest Travel Date
          </label>
          <input
            id="latest-date"
            type="date"
            className="w-full rounded-md bg-[#0f1c33] text-white border border-[#0f1c33] px-4 py-3 outline-none focus:ring-2 focus:ring-[#0077be] [color-scheme:dark]"
            value={latestDate}
            min={earliestDate || undefined}
            onChange={(event) => setLatestDate(event.target.value)}
          />
        </div>
      </div>

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

export default SingleDestinationSearch;
