"use client";

// "Resort Name or Code" search tab — matches against resort name or the
// resort's symbol/code field.
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { matchesNameOrCode } from "@/lib/resortSearch";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent } from "react";

const ResortNameOrCodeSearch = () => {
  const { resorts } = useResortData();
  const router = useRouter();

  const [resortInput, setResortInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!resortInput.trim()) {
      setError("Please enter a resort name or code.");
      return;
    }
    setError(null);

    if (resorts.length > 0 && !resorts.some((resort) => matchesNameOrCode(resort, resortInput))) {
      setError("No matching resorts found.");
      return;
    }

    router.push(`/search?${new URLSearchParams({ q: resortInput, mode: "name-or-code" }).toString()}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") handleSearch();
  };

  return (
    <div className="mt-8 px-2">
      <label htmlFor="resort-name-or-code" className="block text-gray-700 dark:text-gray-200 font-medium mb-2">
        Resort Name or Code
      </label>
      <input
        id="resort-name-or-code"
        type="text"
        placeholder="Enter resort name or code"
        className="w-full rounded-md bg-[#0f1c33] text-white placeholder-gray-400 border border-[#0f1c33] px-4 py-3 outline-none focus:ring-2 focus:ring-[#0077be]"
        value={resortInput}
        onChange={(event) => setResortInput(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <button
        type="button"
        onClick={handleSearch}
        className="w-full bg-[#0077be] hover:bg-[#005a8e] rounded-md text-white font-bold py-3.5 mt-6 transition-colors"
      >
        Find Resort
      </button>
    </div>
  );
};

export default ResortNameOrCodeSearch;
