"use client";

// Card summarizing a single resort inside the search results grid.
// This needs to be a client component (rather than the plain component it
// used to be) so it can read the signed-in admin's role to decide whether
// to show the edit icon — only ResortImage needed that before, now the
// card itself does too.
//
// The whole card is still a single clickable link through to the resort's
// detail page, same as before. The admin-only edit icon can't just be a
// nested <Link> inside that link (nested <a> tags are invalid HTML and
// React will warn/misbehave), so instead the outer element is a <div> and
// the "click anywhere on the card" behavior comes from a Link stretched
// to fill it via absolute positioning — a standard pattern for
// card-with-an-extra-clickable-control layouts. The edit button sits
// above it with a higher z-index and its own click handler, so clicking
// it navigates to the edit page instead of the resort detail page.
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  getResortImages,
  getResortName,
  type Resort,
} from "@/lib/types/resort";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaMapMarkerAlt, FaPen } from "react-icons/fa";
import ResortImage from "./ResortImage";

interface ResortCardProps {
  resort: Resort;
}

const ResortCard = ({ resort }: ResortCardProps) => {
  const { role } = useAuth();
  const router = useRouter();
  const image = getResortImages(resort)[0];
  const name = getResortName(resort);
  const isAdmin = role === "admin";

  const handleEditClick = (event: React.MouseEvent) => {
    // Stop the click from bubbling up to the card's stretched Link
    // overlay underneath, then navigate to the edit page ourselves.
    event.preventDefault();
    event.stopPropagation();
    router.push(`/dashboard/admin/resorts/${resort._id}/edit`);
  };

  return (
    <div className="group relative bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <Link
        href={`/resort-directory/${resort._id}`}
        aria-label={`View details for ${name}`}
        className="absolute inset-0 z-0"
      />

      <div className="relative h-48 w-full overflow-hidden pointer-events-none">
        <ResortImage
          src={image}
          alt={name}
          seed={resort._id || name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      {/* Edit is admin-only: regular visitors and signed-out users never
          see this icon and can't reach the edit page from the card. */}
      {isAdmin && (
        <button
          type="button"
          onClick={handleEditClick}
          aria-label={`Edit ${name}`}
          title="Edit resort"
          className="absolute top-2 right-2 z-10 flex items-center justify-center h-9 w-9 rounded-full bg-white/95 dark:bg-[#16223d]/95 text-[#0077be] dark:text-[#7fb8e6] shadow-md hover:bg-white dark:hover:bg-[#16223d] hover:scale-105 transition"
        >
          <FaPen className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="relative p-4 pointer-events-none">
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
    </div>
  );
};

export default ResortCard;
