"use client";

// Results page for every Gateways/Exchange search tab. The query and
// search mode travel in the URL (not client-side navigation state), so
// results are reproducible on a fresh page load, back/forward nav, or a
// shared link — the same matching logic just re-runs against the shared
// resort dataset.
import Loading from "@/components/resorts/Loading";
import ResortCard from "@/components/resorts/ResortCard";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import { ResortDataProvider, useResortData } from "@/lib/providers/ResortDataProvider";
import { runSearch, type SearchMode } from "@/lib/resortSearch";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { FaSearchLocation } from "react-icons/fa";

const RESULTS_PER_PAGE = 12;

const isSearchMode = (value: string | null): value is SearchMode =>
  value === "destination" || value === "all-destinations" || value === "name-or-code";

const SearchResultsContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const modeParam = searchParams.get("mode");
  const mode: SearchMode = isSearchMode(modeParam) ? modeParam : "destination";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  const { resorts, loading, error, reload } = useResortData();
  const [currentPage, setCurrentPage] = useState(1);

  const results = useMemo(() => runSearch(mode, query, resorts), [mode, query, resorts]);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const start = (page - 1) * RESULTS_PER_PAGE;
  const pageResults = results.slice(start, start + RESULTS_PER_PAGE);

  // Wraps page changes so the viewport jumps back to the top of the
  // results — otherwise the browser keeps its scroll position and the
  // new page renders below the fold, making it look like nothing
  // changed on mobile.
  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setCurrentPage(clamped);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <ResortLoadError message={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-[#18294B] dark:text-white mb-1">
        Search Results
      </h1>
      {query && (
        <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
          Showing results for &ldquo;{query}&rdquo;
          {fromDate ? ` from ${fromDate}` : ""}
          {toDate ? ` to ${toDate}` : ""}
        </p>
      )}
      <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
        {results.length} {results.length === 1 ? "resort" : "resorts"} found
      </p>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
          <FaSearchLocation className="w-14 h-14 mb-4 text-gray-300 dark:text-white/20" />
          <p className="text-lg font-medium">No matching destinations found.</p>
          <p className="text-sm mt-1">Try a different city, resort name, or code.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageResults.map((resort) => (
              <ResortCard key={resort._id} resort={resort} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <nav className="flex flex-wrap justify-center items-center gap-2 max-w-full">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base transition-colors ${
                    page === 1
                      ? "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-[#0077be] hover:bg-[#005a8e] text-white shadow-sm"
                  }`}
                >
                  Prev
                </button>

                <div className="hidden sm:flex gap-2">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      type="button"
                      onClick={() => goToPage(index + 1)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        page === index + 1
                          ? "bg-[#0077be] text-white shadow-md"
                          : "bg-white dark:bg-[#16223d] border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="sm:hidden flex items-center px-4 font-medium text-gray-700 dark:text-gray-200">
                  {page} / {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-sm sm:text-base transition-colors ${
                    page === totalPages
                      ? "bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      : "bg-[#0077be] hover:bg-[#005a8e] text-white shadow-sm"
                  }`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const SearchPage = () => (
  <ResortDataProvider>
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-10">
          <Loading />
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  </ResortDataProvider>
);

export default SearchPage;
