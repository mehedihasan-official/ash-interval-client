"use client";

// Admin resort browser. Unlike the public directory, this page is meant
// for full database access: it uses the API's paginated total for counts
// and lets admins page/search through every resort with direct edit links.
import Loading from "@/components/resorts/Loading";
import { searchResorts } from "@/lib/api/resorts";
import {
  getResortCountry,
  getResortName,
  getResortRegions,
  type Resort,
  type ResortPagination,
} from "@/lib/types/resort";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaPen,
  FaPlus,
  FaSearch,
} from "react-icons/fa";

const RESULTS_PER_PAGE = 50;

const emptyPagination: ResortPagination = {
  page: 1,
  limit: RESULTS_PER_PAGE,
  total: 0,
  totalPages: 0,
};

const AdminResortsPage = () => {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [pagination, setPagination] = useState<ResortPagination>(emptyPagination);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadResorts = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await searchResorts({
          search: searchTerm || undefined,
          page,
          limit: RESULTS_PER_PAGE,
        });
        if (isCancelled) return;
        setResorts(result.resorts);
        setPagination(result.pagination);
      } catch (error) {
        if (isCancelled) return;
        setResorts([]);
        setPagination(emptyPagination);
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load resorts.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadResorts();
    return () => {
      isCancelled = true;
    };
  }, [page, searchTerm, reloadToken]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  };

  const startResult =
    pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endResult = Math.min(pagination.page * pagination.limit, pagination.total);
  const canGoPrevious = page > 1 && !isLoading;
  const canGoNext = page < pagination.totalPages && !isLoading;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0077be]">Resorts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {pagination.total.toLocaleString()} total resort
            {pagination.total === 1 ? "" : "s"}
            {searchTerm ? ` matching "${searchTerm}"` : ""}
          </p>
        </div>

        <Link
          href="/dashboard/admin/resorts/new"
          className="inline-flex items-center gap-2 bg-[#0077be] hover:bg-[#005a8e] text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Resort
        </Link>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-5 flex flex-col sm:flex-row gap-3"
      >
        <label htmlFor="resort-search" className="sr-only">
          Search resorts
        </label>
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            id="resort-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, code, country, region, or location"
            className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#16223d] text-gray-800 dark:text-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30"
          />
        </div>
        <button
          type="submit"
          className="bg-[#18294B] hover:bg-[#101b30] text-white font-semibold px-5 py-2.5 rounded-lg transition"
        >
          Search
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearchTerm("");
              setPage(1);
            }}
            className="border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Clear
          </button>
        )}
      </form>

      {isLoading ? (
        <Loading />
      ) : errorMessage ? (
        <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
            Couldn&apos;t load resorts
          </p>
          <p className="text-red-500 dark:text-red-400/80 text-sm mb-4">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="bg-[#0077be] text-white font-semibold px-5 py-2 rounded hover:bg-[#005a8e] transition"
          >
            Try Again
          </button>
        </div>
      ) : resorts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400">
          No resorts found.
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Resort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Region
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {resorts.map((resort) => {
                    const name = getResortName(resort);
                    const country = getResortCountry(resort) || "Not set";
                    const regions = getResortRegions(resort).join(", ") || "Not set";

                    return (
                      <tr key={resort._id}>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">
                            {name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {resort.location || "Location not set"}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {resort.symbol || "Not set"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {country}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {regions}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              href={`/resort-directory/${resort._id}`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                              aria-label={`View ${name}`}
                              title="View resort"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                            </Link>
                            <Link
                              href={`/dashboard/admin/resorts/${resort._id}/edit`}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] hover:bg-[#0077be] hover:text-white transition"
                              aria-label={`Edit ${name}`}
                              title="Edit resort"
                            >
                              <FaPen className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
              {resorts.map((resort) => {
                const name = getResortName(resort);
                const country = getResortCountry(resort) || "Not set";
                const regions = getResortRegions(resort).join(", ") || "Not set";

                return (
                  <div key={resort._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white text-sm">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {resort.location || "Location not set"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/resort-directory/${resort._id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                          aria-label={`View ${name}`}
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/resorts/${resort._id}/edit`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                          aria-label={`Edit ${name}`}
                        >
                          <FaPen className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <p>
                        <span className="block font-semibold text-gray-700 dark:text-gray-200">
                          Code
                        </span>
                        {resort.symbol || "Not set"}
                      </p>
                      <p>
                        <span className="block font-semibold text-gray-700 dark:text-gray-200">
                          Country
                        </span>
                        {country}
                      </p>
                      <p className="col-span-2">
                        <span className="block font-semibold text-gray-700 dark:text-gray-200">
                          Region
                        </span>
                        {regions}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Showing {startResult.toLocaleString()}-{endResult.toLocaleString()} of{" "}
              {pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                <FaChevronLeft className="w-3 h-3" />
                Previous
              </button>
              <span className="px-2">
                Page {pagination.page.toLocaleString()} of{" "}
                {Math.max(1, pagination.totalPages).toLocaleString()}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                Next
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminResortsPage;
