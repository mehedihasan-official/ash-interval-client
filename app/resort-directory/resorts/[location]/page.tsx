"use client";

// Resort Directory — Step 3 of the browsing flow: resort cards for one
// selected country or region. The :location param matches either a
// country name (for countries with no regions) or a region name (for
// countries that do), since both funnel here from the previous step.
import Loading from "@/components/resorts/Loading";
import ResortCard from "@/components/resorts/ResortCard";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { getResortCountry, getResortRegions } from "@/lib/types/resort";
import Link from "next/link";
import { use } from "react";
import { FaMapMarkedAlt } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

interface ResortsByLocationPageProps {
  params: Promise<{ location: string }>;
}

const ResortsByLocationPage = ({ params }: ResortsByLocationPageProps) => {
  const { location: encodedLocation } = use(params);
  const location = decodeURIComponent(encodedLocation);
  const { resorts, loading, error, reload } = useResortData();

  if (loading) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
        <div className="max-w-6xl mx-auto">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
        <div className="max-w-6xl mx-auto">
          <ResortLoadError message={error} onRetry={reload} />
        </div>
      </div>
    );
  }

  const matchingResorts = resorts.filter(
    (resort) =>
      getResortCountry(resort) === location ||
      getResortRegions(resort).includes(location),
  );

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/resort-directory"
          className="inline-flex items-center gap-1 text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-6"
        >
          <IoIosArrowBack /> Back to Countries
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-center my-2 text-[#18294B] dark:text-white">
          {location} Resorts
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          {matchingResorts.length}{" "}
          {matchingResorts.length === 1 ? "resort" : "resorts"} found
        </p>

        {matchingResorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-white/10">
            <FaMapMarkedAlt className="w-14 h-14 mb-4 text-gray-300 dark:text-white/20" />
            <p className="text-lg font-medium">
              No resorts found in {location}.
            </p>
            <Link
              href="/resort-directory"
              className="mt-4 text-[#0077be] dark:text-[#3ba0ea] hover:underline font-bold"
            >
              Return to Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchingResorts.map((resort) => (
              <ResortCard key={resort._id} resort={resort} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResortsByLocationPage;
