"use client";

// Tabbed detail section for a resort: description, amenities (on-site
// and nearby, plus collapsible resort information), and a placeholder
// map tab. Mirrors the reference app's resort detail tabs.
import { splitAmenities, type Resort } from "@/lib/types/resort";
import { useState } from "react";
import { FaChevronDown, FaChevronUp, FaMapMarkerAlt } from "react-icons/fa";

type TabKey = "description" | "amenities" | "map";

interface ResortInfoTabsProps {
  resort: Resort;
}

const TAB_LABELS: Record<TabKey, string> = {
  description: "Description",
  amenities: "Amenities",
  map: "Map",
};

const ResortInfoTabs = ({ resort }: ResortInfoTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [isResortInfoOpen, setIsResortInfoOpen] = useState(false);

  const onSiteAmenities = splitAmenities(resort.onSite);
  const nearbyAmenities = splitAmenities(resort.nearby);
  const hasResortInfo = Boolean(
    (resort.checkInDays && resort.checkInDays.length > 0) ||
      resort.nearestAirport ||
      resort.contactInfo,
  );

  return (
    <div className="w-full mt-8">
      {/* Tab headers */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-md text-sm font-semibold border-2 border-b-0 transition-colors ${
              activeTab === tab
                ? "bg-[#0077be] text-white border-[#0077be]"
                : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-b-lg rounded-tr-lg border border-gray-200 dark:border-white/10">
        {activeTab === "description" && (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {resort.description ||
              "Description not available for this resort yet."}
          </p>
        )}

        {activeTab === "amenities" && (
          <div>
            <h3 className="text-base font-bold text-[#18294B] dark:text-white mb-2">
              On-Site Amenities
            </h3>
            {onSiteAmenities.length > 0 ? (
              <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 space-y-1">
                {onSiteAmenities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Not available.
              </p>
            )}

            <h3 className="text-base font-bold text-[#18294B] dark:text-white mt-5 mb-2">
              Nearby Amenities
            </h3>
            {nearbyAmenities.length > 0 ? (
              <ul className="list-disc ml-5 text-gray-700 dark:text-gray-300 space-y-1">
                {nearbyAmenities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Not available.
              </p>
            )}

            {hasResortInfo && (
              <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsResortInfoOpen((open) => !open)}
                  className="w-full flex items-center justify-between text-left font-bold text-[#18294B] dark:text-white"
                >
                  Resort Information
                  {isResortInfoOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {isResortInfoOpen && (
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        Check-In Days
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {resort.checkInDays && resort.checkInDays.length > 0
                          ? resort.checkInDays.join(", ")
                          : "Not available."}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        Nearest Airport
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {resort.nearestAirport || "Not available."}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        Contact Information
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {resort.contactInfo || "Not available."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "map" && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
            <FaMapMarkerAlt className="w-10 h-10 mb-3 text-gray-300 dark:text-white/20" />
            <p className="font-medium">
              {resort.location || "Location not available."}
            </p>
            <p className="text-sm mt-1">Interactive map coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResortInfoTabs;
