"use client";

// Resort search/directory experience: a search bar (name or location) plus
// a paginated results grid. The current search term and page number are
// kept in the URL's query string (via useSearchParams/useRouter) so a
// search is shareable/bookmarkable and survives a page refresh.

import { searchResorts } from "@/lib/api/resorts";
import type { Resort } from "@/lib/types/resort";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";

const RESULTS_PER_PAGE = 12;

const ResortDirectoryContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The query string is the source of truth for the active search/page;
  // this local state just mirrors the search input while the user types,
  // so the field doesn't jump around before they submit.
  const urlSearchTerm = searchParams.get("search") ?? "";
  const urlLocation = searchParams.get("location") ?? "";
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [resorts, setResorts] = useState<Resort[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch resorts whenever the URL's search term or page changes.
  useEffect(() => {
    let isCancelled = false;

    const loadResorts = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await searchResorts({
          search: urlSearchTerm || undefined,
          location: urlLocation || undefined,
          page: urlPage,
          limit: RESULTS_PER_PAGE,
        });
        if (isCancelled) return;
        setResorts(result.resorts);
      } catch (error) {
        if (isCancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load resorts. Please try again.";
        setErrorMessage(message);
        setResorts([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadResorts();

    return () => {
      isCancelled = true;
    };
  }, [urlSearchTerm, urlLocation, urlPage]);

  const countries = Array.from(
    new Set(
      resorts
        .map((resort) =>
          typeof resort.country === "string" ? resort.country.trim() : "",
        )
        .filter(Boolean),
    ),
  ).sort((first, second) => first.localeCompare(second));

  const handleCountryClick = (country: string) => {
    const params = new URLSearchParams();
    params.set("location", country);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#18294B] dark:text-white mb-2">
          Resort Directory
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Search our resort collection by name or destination.
        </p>

        {countries.length > 0 && !urlSearchTerm && !urlLocation && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#18294B] dark:text-white mb-3">
              Browse by country
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {countries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountryClick(country)}
                  className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg p-4 flex items-center justify-between text-left hover:border-[#0077be] hover:shadow-sm transition"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {country}
                  </span>
                  <IoIosArrowForward className="text-[#f5a623]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search form */}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && errorMessage && (
          <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
              Couldn&apos;t load resorts
            </p>
            <p className="text-red-500 dark:text-red-400/80 text-sm">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResortDirectoryContent;
