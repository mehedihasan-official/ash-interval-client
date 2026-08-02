"use client";

// Exchange — lets a member trade their ownership week for a stay
// elsewhere. Mirrors the reference site: page title, hero banner, a
// horizontally-scrollable row of exchange-type tabs, and (for Vacation
// Exchange) the same shared destination-search sub-tabs used on Gateways.
import Loading from "@/components/resorts/Loading";
import ResortLoadError from "@/components/resorts/ResortLoadError";
import DestinationSearchTabs from "@/components/search/DestinationSearchTabs";
import { useResortData } from "@/lib/providers/ResortDataProvider";
import { useAuth } from "@/lib/providers/AuthProvider";
import exchangeBanner from "@/app/asset/images/exchange-banner.jpg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const tabs = [
  "Vacation Exchange",
  "Cruise Exchange",
  "ShortStay Exchange",
  "Hotel Exchange",
  "My Units",
] as const;
type Tab = (typeof tabs)[number];

const ExchangePage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { loading, error, reload } = useResortData();
  const [activeTab, setActiveTab] = useState<Tab>("Vacation Exchange");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="py-5 px-6">
        <h1 className="text-2xl font-bold text-[#0077be]">Exchange</h1>
      </div>

      <div className="w-full flex flex-col items-center">
        <div className="relative w-full h-40 sm:h-56 md:h-72">
          <Image
            src={exchangeBanner}
            alt="Savor Orlando — great adventures and magic moments await you"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>

        <div className="mt-6 w-full px-2 sm:px-6">
          <div className="overflow-x-auto border-b border-gray-300 dark:border-white/10 pb-0.5">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
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

          {activeTab === "Vacation Exchange" ? (
            loading ? (
              <div className="mt-8">
                <Loading />
              </div>
            ) : error ? (
              <div className="mt-8">
                <ResortLoadError message={error} onRetry={reload} />
              </div>
            ) : (
              <DestinationSearchTabs />
            )
          ) : (
            <div className="mt-8 text-center py-12 bg-white dark:bg-[#16223d] border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300">
              {activeTab} options will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;
