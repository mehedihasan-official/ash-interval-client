"use client";

// Admin cruise browser. Mirrors the resort admin list layout — table on
// desktop, cards on mobile, plus an Add Cruise CTA. Uses the same
// searchCruises endpoint as the members page; the admin surface just
// exposes the edit link on every row.
import Loading from "@/components/resorts/Loading";
import { searchCruises } from "@/lib/api/cruises";
import type { Cruise } from "@/lib/types/cruise";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaPen, FaPlus, FaShip } from "react-icons/fa";

const AdminCruisesPage = () => {
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await searchCruises({
          cabinType: "inside",
          adults: 2,
          children: 0,
          infants: 0,
        });
        if (cancelled) return;
        setCruises(result.cruises);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load cruises.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0077be]">Cruises</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {cruises.length} total cruise{cruises.length === 1 ? "" : "s"}
          </p>
        </div>

        <Link
          href="/dashboard/admin/cruises/new"
          className="inline-flex items-center gap-2 bg-[#0077be] hover:bg-[#005a8e] text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          <FaPlus className="w-3.5 h-3.5" />
          Add Cruise
        </Link>
      </div>

      {isLoading ? (
        <Loading />
      ) : errorMessage ? (
        <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
            Couldn&apos;t load cruises
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
      ) : cruises.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400">
          <FaShip className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p>No cruises in the catalog yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Cruise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Departure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Nights
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {cruises.map((cruise) => (
                  <tr key={cruise._id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">
                        {cruise.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cruise.cruiseLine} &middot; {cruise.cruiseId}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {cruise.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {cruise.departurePort}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {cruise.duration}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href="/dashboard/all-cruises"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                          aria-label={`View ${cruise.name}`}
                          title="View catalog"
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/dashboard/admin/cruises/${cruise._id}/edit`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] hover:bg-[#0077be] hover:text-white transition"
                          aria-label={`Edit ${cruise.name}`}
                          title="Edit cruise"
                        >
                          <FaPen className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {cruises.map((cruise) => (
              <div key={cruise._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                      {cruise.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {cruise.cruiseLine} &middot; {cruise.cruiseId}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/admin/cruises/${cruise._id}/edit`}
                    className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                    aria-label={`Edit ${cruise.name}`}
                  >
                    <FaPen className="w-3 h-3" />
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    <span className="block font-semibold text-gray-700 dark:text-gray-200">
                      Category
                    </span>
                    {cruise.category}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-700 dark:text-gray-200">
                      Nights
                    </span>
                    {cruise.duration}
                  </p>
                  <p>
                    <span className="block font-semibold text-gray-700 dark:text-gray-200">
                      From
                    </span>
                    ${cruise.cabinTypes.inside.retailPrice}
                  </p>
                  <p className="col-span-3">
                    <span className="block font-semibold text-gray-700 dark:text-gray-200">
                      Departure
                    </span>
                    {cruise.departurePort}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCruisesPage;
