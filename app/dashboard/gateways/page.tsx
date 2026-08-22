"use client";

// Gateways — lets a member search discounted "getaway" stays. Mirrors
// the reference site: hero banner, a horizontally-scrollable row of
// getaway-type tabs (parallel to the ones on /dashboard/exchange), and
// (for Vacation Getaways) the shared destination-search sub-tabs. The
// other three tabs are placeholders for now — Cruise Getaways routes
// straight over to /cruises like Cruise Exchange does.
import Loading from "@/components/resorts/Loading";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import DestinationSearchTabs from "@/components/search/DestinationSearchTabs";
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { useAuth } from "@/lib/providers/AuthProvider";
import getawaysBanner from "@/app/asset/images/getaways-banner.jpg";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";

const tabs = [
  "Vacation Getaways",
  "Cruise Getaways",
  "ShortStay Getaways",
  "Hotel Getaways",
] as const;
type Tab = (typeof tabs)[number];

const quickLinks = [
  { label: "Top Getaway Deals", path: "/dashboard/gateways" },
  { label: "Best Price Guarantee", path: "/dashboard/gateways" },
];

const GatewaysPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading, error, reload } = useResortData();
  const [activeTab, setActiveTab] = useState<Tab>("Vacation Getaways");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="w-full flex flex-col items-center bg-gray-50 dark:bg-[#0f172a]">
      <div className="w-full">
        {/* Natural aspect ratio (no fixed height, no object-cover) so
            the full banner shows on both phone and desktop — matches the
            image the client provided instead of a cropped centre. */}
        <Image
          src={getawaysBanner}
          alt="Interval Travel — hotel deals, cruise discounts, car savings"
          priority
          sizes="100vw"
          className="w-full h-auto"
        />
      </div>

      <div className="p-4 w-full md:w-11/12 lg:w-10/12 max-w-7xl">
        <div className="mt-6 px-2">
          <h1 className="text-left text-2xl font-bold text-[#0077be] sm:text-3xl lg:text-4xl">
            Search Getaways
          </h1>
          <p className="text-left text-gray-600 dark:text-gray-300 font-bold mt-1 text-sm sm:text-base">
            Take More Vacations At Irresistibly Low Prices
          </p>
        </div>

        <div className="mt-6 w-full">
          <div className="overflow-x-auto border-b border-gray-300 dark:border-white/10 pb-0.5">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    // Cruise Getaways shares the same dedicated cruise
                    // search page Cruise Exchange uses — jump there
                    // instead of rendering a placeholder inside the
                    // gateways shell.
                    if (tab === "Cruise Getaways") {
                      router.push("/cruises");
                      return;
                    }
                    setActiveTab(tab);
                  }}
                  className={`py-3 px-4 text-sm font-medium text-center flex-shrink-0 border-b-2 transition-colors ${
                    activeTab === tab
                      ? "text-[#0077be] border-[#0077be]"
                      : "text-gray-700 dark:text-gray-200 border-transparent hover:text-[#0077be]"
                  }`}
                >
                  {tab.split(" ").map((word) => (
                    <span key={word} className="block">
                      {word}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === "Vacation Getaways" ? (
          loading ? (
            <div className="mt-8">
              <Loading />
            </div>
          ) : error ? (
            <div className="mt-8">
              <ResortLoadError message={error} onRetry={reload} />
            </div>
          ) : (
            <div className="px-2 mt-4">
              <DestinationSearchTabs />
            </div>
          )
        ) : (
          <div className="mt-8 px-2 text-center py-12 bg-white dark:bg-[#16223d] border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300">
            {activeTab} deals will appear here.
          </div>
        )}

        <div className="w-full mt-10">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              className="flex border-t-2 border-gray-200 dark:border-white/10 p-3 font-semibold text-gray-600 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-white/5 items-center justify-between"
            >
              <span>{item.label}</span>
              <IoIosArrowForward className="text-[#f5a623] font-bold text-xl" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GatewaysPage;
