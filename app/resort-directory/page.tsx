"use client";

// Resort Directory — Step 1 of the browsing flow: a list of every
// country that has at least one resort. Selecting a country moves to
// Step 2 (region list, if that country has regions) or Step 3 (resort
// cards directly, if it doesn't). Uses the resort dataset shared by
// ResortDataProvider (see app/resort-directory/layout.tsx) rather than
// fetching its own page of results, since an accurate country list
// requires seeing every resort, not just one page of them.
import Loading from "@/components/resorts/Loading";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import { useResortData } from "@/lib/providers/ResortDataProvider";
import {
  getUniqueCountries,
  getUniqueRegionsForCountry,
} from "@/lib/types/resort";
import Link from "next/link";
import { FaGlobeAmericas } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";

const ResortDirectoryPage = () => {
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

  const countries = getUniqueCountries(resorts);

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-[#18294B] dark:text-white mb-2">
          Resort Directory
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Choose a country to browse resorts.
        </p>

        {countries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
            <FaGlobeAmericas className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-white/20" />
            <p className="text-lg font-medium">No resorts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => {
              // A country with at least one region goes through the
              // region-picker step first; one with none skips straight
              // to its resort cards.
              const hasRegions =
                getUniqueRegionsForCountry(resorts, country).length > 0;
              const href = hasRegions
                ? `/resort-directory/region/${encodeURIComponent(country)}`
                : `/resort-directory/resorts/${encodeURIComponent(country)}`;

              return (
                <Link
                  key={country}
                  href={href}
                  className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:shadow-md hover:border-[#0077be] dark:hover:border-[#3ba0ea] transition-all flex justify-between items-center group"
                >
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#0077be] dark:group-hover:text-[#3ba0ea]">
                    {country}
                  </span>
                  <IoIosArrowForward className="text-xl text-[#f5a623] group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResortDirectoryPage;
