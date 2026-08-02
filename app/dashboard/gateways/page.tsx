"use client";

// Gateways — lets a member search discounted "getaway" stays. Mirrors the
// reference site: hero banner, a Getaways / ShortStay Getaways pill
// toggle, and (for Getaways) the shared destination-search sub-tabs.
// ShortStay Getaways has no search form in the reference design, so it
// just shows an informational placeholder.
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

const tabs = ["Getaways", "ShortStay Getaways"] as const;
type Tab = (typeof tabs)[number];

const quickLinks = [
  { label: "Top Getaway Deals", path: "/dashboard/gateways" },
  { label: "Best Price Guarantee", path: "/dashboard/gateways" },
];

const GatewaysPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading, error, reload } = useResortData();
  const [activeTab, setActiveTab] = useState<Tab>("Getaways");

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
      <div className="relative w-full h-40 sm:h-56 md:h-72">
        <Image
          src={getawaysBanner}
          alt="Interval Travel — hotel deals, cruise discounts, car savings"
          fill
          priority
          sizes="100vw"
          className="object-cover"
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

        <div className="flex flex-row items-center justify-center mt-6 px-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-xs sm:text-sm font-bold border-2 py-3 transition-all ${
                activeTab === tab
                  ? "bg-[#0077be] text-white border-[#0077be]"
                  : "bg-white dark:bg-[#16223d] text-[#0077be] dark:text-[#7fb8e6] border-[#0077be] hover:bg-blue-50 dark:hover:bg-white/10"
              } ${tab === "Getaways" ? "rounded-s-md" : "rounded-e-md"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Getaways" ? (
          loading ? (
            <div className="mt-8">
              <Loading />
            </div>
          ) : error ? (
            <div className="mt-8">
              <ResortLoadError message={error} onRetry={reload} />
            </div>
          ) : (
            <div className="px-2">
              <DestinationSearchTabs />
            </div>
          )
        ) : (
          <div className="mt-8 px-2 text-center py-12 bg-white dark:bg-[#16223d] border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300">
            ShortStay Getaways deals will appear here.
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
