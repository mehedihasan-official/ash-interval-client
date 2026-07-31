"use client";

// Resort Directory — Step 2 of the browsing flow: the list of regions
// within one country (only reached for countries that have regions —
// see the country-list page's routing logic). Selecting a region moves
// to Step 3 (resort cards for that region).
import Loading from "@/components/resorts/Loading";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { getUniqueRegionsForCountry } from "@/lib/types/resort";
import Link from "next/link";
import { use } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

interface RegionPageProps {
  params: Promise<{ country: string }>;
}

const RegionPage = ({ params }: RegionPageProps) => {
  const { country: encodedCountry } = use(params);
  const country = decodeURIComponent(encodedCountry);
  const { resorts, loading, error, reload } = useResortData();

  if (loading) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
        <div className="max-w-5xl mx-auto">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
        <div className="max-w-5xl mx-auto">
          <ResortLoadError message={error} onRetry={reload} />
        </div>
      </div>
    );
  }

  const regions = getUniqueRegionsForCountry(resorts, country);

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/resort-directory"
          className="inline-flex items-center gap-1 text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-6"
        >
          <IoIosArrowBack /> Back to Countries
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-[#18294B] dark:text-white mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
          Regions in {country}
        </h1>

        {regions.length === 0 ? (
          // A country can lose its only regions between renders in rare
          // cases (e.g. stale link, data changed) — send the visitor
          // straight to that country's resort cards instead of a dead end.
          <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
            <p className="text-lg font-medium mb-4">
              No regions found for {country}.
            </p>
            <Link
              href={`/resort-directory/resorts/${encodeURIComponent(country)}`}
              className="text-[#0077be] dark:text-[#3ba0ea] font-bold hover:underline"
            >
              View all {country} resorts instead
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regions.map((region) => (
              <Link
                key={region}
                href={`/resort-directory/resorts/${encodeURIComponent(region)}`}
                className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16223d] rounded-lg py-3 px-4 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-[#0077be] dark:hover:border-[#3ba0ea] flex justify-between items-center transition-all group"
              >
                <span className="text-gray-700 dark:text-gray-200 group-hover:text-[#0077be] dark:group-hover:text-[#3ba0ea]">
                  {region}
                </span>
                <IoIosArrowForward className="text-[#f5a623]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionPage;
