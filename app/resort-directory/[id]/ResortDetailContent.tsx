"use client";

// Renders a single resort's photo gallery, key details, points/cash
// booking options (Exchange vs Getaways), and description/amenities
// tabs. Availability search and checkout are a later stage — the
// Exchange/Getaways component below confirms the visitor's intent
// (sign in, then continue) rather than opening an incomplete flow.
import ExchangeGetaways from "@/components/resorts/ExchangeGetaways";
import ResortImage from "@/components/resorts/ResortImage";
import ResortInfoTabs from "@/components/resorts/ResortInfoTabs";
import {
  getResortCountry,
  getResortImages,
  getResortName,
  getResortRegions,
  type Resort,
} from "@/lib/types/resort";
import Link from "next/link";
import { useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

interface ResortDetailContentProps {
  resort: Resort;
}

const ResortDetailContent = ({ resort }: ResortDetailContentProps) => {
  const resortImages = getResortImages(resort);
  const images = resortImages.length > 0 ? resortImages : [undefined];
  const resortName = getResortName(resort);
  const country = getResortCountry(resort);
  const regions = getResortRegions(resort);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb back to the resort's location page, falling back to
            the country directory if we don't have a location to return to */}
        <Link
          href={
            regions[0]
              ? `/resort-directory/resorts/${encodeURIComponent(regions[0])}`
              : country
                ? `/resort-directory/resorts/${encodeURIComponent(country)}`
                : "/resort-directory"
          }
          className="inline-block text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-6"
        >
          &larr; Back to Results
        </Link>

        {/* Photo gallery */}
        <div className="relative h-64 sm:h-80 md:h-[420px] w-full rounded-lg overflow-hidden mb-3">
          <ResortImage
            src={images[activeImageIndex]}
            alt={resortName}
            priority
            sizes="(min-width: 1024px) 980px, 100vw"
          />
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`View photo ${index + 1}`}
                className={`relative h-16 w-24 shrink-0 rounded overflow-hidden border-2 transition ${
                  index === activeImageIndex
                    ? "border-[#0077be] dark:border-[#3ba0ea]"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
              >
                <ResortImage
                  src={image}
                  alt={`${resortName} photo ${index + 1}`}
                  sizes="96px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Resort name, location, symbol */}
        <div className="bg-white dark:bg-[#16223d] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl text-[#0077be] dark:text-[#3ba0ea] font-bold mb-2">
                {resortName}
              </h1>
              {resort.location && (
                <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400 dark:text-gray-500 shrink-0" />
                  {resort.location}
                </p>
              )}
            </div>
            {resort.symbol && (
              <p className="font-bold uppercase bg-blue-50 dark:bg-white/5 text-blue-700 dark:text-[#7fb8e6] px-4 py-2 rounded border border-blue-200 dark:border-white/10 inline-block shrink-0">
                Symbol: {resort.symbol}
              </p>
            )}
          </div>
        </div>

        {/* Points / Cash booking options */}
        <ExchangeGetaways resort={resort} />

        {/* Description / amenities / map tabs */}
        <ResortInfoTabs resort={resort} />
      </div>
    </div>
  );
};

export default ResortDetailContent;
