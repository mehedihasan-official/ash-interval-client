"use client";

// Renders a single resort's gallery, details, and a "Book Now" call to
// action. Booking/checkout itself is a later stage — the button here
// shows what happens next without implementing payment, so the client
// can see the intended flow (sign in, then continue to booking).
import ResortImage from "@/components/resorts/ResortImage";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  getResortImages,
  getResortName,
  type Resort,
} from "@/lib/types/resort";
import Link from "next/link";
import { useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import Swal from "sweetalert2";

interface ResortDetailContentProps {
  resort: Resort;
}

const ResortDetailContent = ({ resort }: ResortDetailContentProps) => {
  const { user } = useAuth();
  const resortImages = getResortImages(resort);
  const images = resortImages.length > 0 ? resortImages : [undefined];
  const resortName = getResortName(resort);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking/checkout is intentionally out of scope for this stage. If a
  // signed-in user clicks "Book Now", let them know booking is coming
  // soon rather than taking them to an incomplete flow. If they aren't
  // signed in yet, send them to login first — that part of the journey
  // (search -> details -> login -> [future] booking) is real.
  const handleBookNow = () => {
    Swal.fire({
      icon: "info",
      title: "Booking coming soon",
      text: "Online booking for this resort will be available in an upcoming update.",
      confirmButtonColor: "#0077be",
    });
  };

  return (
    <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb back to the search results */}
        <Link
          href="/resort-directory"
          className="inline-block text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-6"
        >
          &larr; Back to Resort Directory
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main details */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-[#18294B] dark:text-white mb-2">
              {resortName}
            </h1>

            {resort.location && (
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-6">
                <FaMapMarkerAlt className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
                {resort.location}
              </p>
            )}

            {resort.symbol && (
              <p className="font-bold uppercase border border-gray-300 dark:border-white/20 px-3 py-1.5 inline-block text-sm text-gray-700 dark:text-gray-200 mb-6">
                Symbol: {resort.symbol}
              </p>
            )}

            <h2 className="text-lg font-bold text-[#18294B] dark:text-white mb-2">
              About this resort
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {resort.description ||
                "Details for this resort will be added soon. Please check back, or contact us for more information."}
            </p>
          </div>

          {/* Booking sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-[#f5f5f5] dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-lg p-5">
              {typeof resort.pricePerNight === "number" ? (
                <p className="text-2xl font-bold text-[#18294B] dark:text-white mb-1">
                  ${resort.pricePerNight.toLocaleString()}
                  <span className="text-gray-500 dark:text-gray-400 font-normal text-base">
                    {" "}
                    /night
                  </span>
                </p>
              ) : (
                <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Price on request
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                Final pricing may vary by dates and availability.
              </p>

              {user ? (
                <button
                  onClick={handleBookNow}
                  className="w-full bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold py-3 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
                >
                  Book Now
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block text-center w-full bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold py-3 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
                >
                  Sign In to Book
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortDetailContent;
