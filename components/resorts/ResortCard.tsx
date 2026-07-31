// Card summarizing a single resort inside the search results grid.
// Kept as a plain (non-"use client") component since it has no state or
// event handlers of its own — only ResortImage underneath needs to be a
// client component, for its onError fallback.
import {
  getResortImages,
  getResortName,
  type Resort,
} from "@/lib/types/resort";
import Link from "next/link";
import { FaMapMarkerAlt } from "react-icons/fa";
import ResortImage from "./ResortImage";

interface ResortCardProps {
  resort: Resort;
}

const ResortCard = ({ resort }: ResortCardProps) => {
  const image = getResortImages(resort)[0];
  const name = getResortName(resort);

  return (
    <Link
      href={`/resort-directory/${resort._id}`}
      className="group block bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <ResortImage
          src={image}
          alt={name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        <h3 className="text-[#18294B] dark:text-white font-bold text-lg leading-snug line-clamp-2">
          {name}
        </h3>

        {resort.location && (
          <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mt-1.5">
            <FaMapMarkerAlt className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
            <span className="line-clamp-1">{resort.location}</span>
          </p>
        )}

        {resort.symbol && (
          <p className="font-bold uppercase border border-gray-300 dark:border-white/20 px-3 py-1.5 mt-3 inline-block text-sm text-gray-700 dark:text-gray-200">
            {resort.symbol}
          </p>
        )}

        {resort.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">
            {resort.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4">
          {typeof resort.pricePerNight === "number" ? (
            <p className="text-[#0077be] dark:text-[#7fb8e6] font-bold">
              ${resort.pricePerNight.toLocaleString()}
              <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">
                {" "}
                /night
              </span>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Price on request
            </p>
          )}
          <span className="text-[#0077be] dark:text-[#7fb8e6] text-sm font-semibold group-hover:underline">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ResortCard;
