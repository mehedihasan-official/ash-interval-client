"use client";

// All Cruises — a members-facing browse page that shows every cruise
// in the catalog as a card. Admins see a pencil overlay on each card
// that jumps into /dashboard/admin/cruises/[id]/edit; regular members
// don't see it. Mobile-first grid: 1 column on phones, 2 on tablets,
// 3 on desktop.
import Loading from "@/components/resorts/Loading";
import { searchCruises } from "@/lib/api/cruises";
import { useAuth } from "@/lib/providers/AuthProvider";
import type { Cruise } from "@/lib/types/cruise";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaPen,
  FaRegClock,
  FaRoute,
  FaShip,
  FaStar,
  FaTag,
} from "react-icons/fa";

const formatUsd = (value: number) =>
  value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const AllCruisesPage = () => {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [cruises, setCruises] = useState<Cruise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // Empty filters return every cruise. Pricing params only affect
        // the pricing block; we default them so cards can show a "from"
        // price without another round trip.
        const result = await searchCruises({
          cabinType: "inside",
          adults: 2,
          children: 0,
          infants: 0,
        });
        if (cancelled) return;
        setCruises(result.cruises);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load cruises.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (authLoading || !user) return <Loading />;

  const isAdmin = role === "admin";

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18294B] dark:text-white flex items-center gap-2">
              <FaShip className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
              All Cruises
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isLoading
                ? "Loading..."
                : `${cruises.length} cruise${cruises.length === 1 ? "" : "s"} available`}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <div
                key={k}
                className="h-72 rounded-2xl bg-white/60 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : cruises.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400">
            <FaShip className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
            <p className="font-medium">No cruises available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {cruises.map((cruise) => (
              <div
                key={cruise._id}
                className="group bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
                  {cruise.image ? (
                    // Using a plain <img> because these are hot-linked
                    // third-party URLs (some do not have a size we can
                    // pre-declare) — next/image would require an
                    // allowlist per host.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cruise.image}
                      alt={cruise.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-white/20">
                      <FaShip className="w-10 h-10" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-[#18294B]/85 dark:bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {cruise.category}
                  </span>
                  {isAdmin && (
                    <Link
                      href={`/dashboard/admin/cruises/${cruise._id}/edit`}
                      className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 dark:bg-black/70 text-[#0077be] dark:text-[#7fb8e6] shadow hover:bg-[#0077be] hover:text-white transition"
                      aria-label={`Edit ${cruise.name}`}
                      title="Edit cruise"
                    >
                      <FaPen className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-white text-base leading-snug line-clamp-1">
                      {cruise.name}
                    </h3>
                    {cruise.rating > 0 && (
                      <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-gray-700 dark:text-gray-200">
                        <FaStar className="text-[#f5a623]" />
                        {cruise.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                    {cruise.cruiseLine}
                  </p>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4">
                    <p className="flex items-start gap-2">
                      <FaRoute className="text-[#0077be] dark:text-[#7fb8e6] mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{cruise.route}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <FaRegClock className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
                      {cruise.duration} nights &middot; from {cruise.departurePort}
                    </p>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 dark:border-white/5 pt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                        <FaTag className="inline mr-1 -mt-0.5" /> from
                      </p>
                      <p className="text-lg font-bold text-[#18294B] dark:text-[#7fb8e6]">
                        {formatUsd(cruise.cabinTypes.inside.retailPrice)}
                      </p>
                    </div>
                    <Link
                      href="/cruises"
                      className="text-xs font-bold text-[#0077be] dark:text-[#7fb8e6] hover:underline"
                    >
                      Book &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCruisesPage;
