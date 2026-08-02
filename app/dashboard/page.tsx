"use client";

// Landing page a member sees right after signing in. Gives a quick
// snapshot of their upcoming trips plus fast paths into the rest of the
// site (browse resorts, view all bookings, manage account) rather than
// dropping them straight into the resort directory with no context.
import Loading from "@/components/resorts/Loading";
import ResortCard from "@/components/resorts/ResortCard";
import { fetchBookingsByEmail, type Booking } from "@/lib/api/bookings";
import { searchResorts } from "@/lib/api/resorts";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getResortName, type Resort } from "@/lib/types/resort";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCompass,
  FaMapMarkerAlt,
  FaSuitcaseRolling,
  FaUserCircle,
} from "react-icons/fa";

const isUpcoming = (booking: Booking) => new Date(booking.startDate).getTime() >= Date.now();

const DashboardPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [featuredResorts, setFeaturedResorts] = useState<Resort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Signed-out visitors have nothing to see on a personal dashboard —
  // send them to sign in first, same as the rest of the members-only pages.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.email) return;
    let isCancelled = false;

    const loadDashboardData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [bookingsResult, resortsResult] = await Promise.all([
          fetchBookingsByEmail(user.email as string),
          searchResorts({ limit: 3 }),
        ]);
        if (isCancelled) return;
        setBookings(bookingsResult);
        setFeaturedResorts(resortsResult.resorts);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load your dashboard right now.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isCancelled = true;
    };
  }, [user?.email]);

  if (authLoading || !user) {
    return <Loading />;
  }

  const upcomingBookings = bookings.filter(isUpcoming).slice(0, 3);
  const displayName = user.displayName || user.email?.split("@")[0] || "Member";

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome header */}
        <div className="bg-[#18294B] dark:bg-[#101b30] rounded-2xl p-6 sm:p-8 mb-8 text-white shadow-sm">
          <p className="text-white/70 text-sm font-medium">Welcome back</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{displayName}</h1>
          {role === "admin" && (
            <span className="inline-block mt-3 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Admin Account
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Link
            href="/resort-directory"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaCompass className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Browse Resorts
            </span>
          </Link>
          <Link
            href="/dashboard/gateways"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaSuitcaseRolling className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Gateways
            </span>
          </Link>
          <Link
            href="/dashboard/exchange"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaCompass className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Exchange
            </span>
          </Link>
          <Link
            href="/dashboard/membership"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaUserCircle className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Membership
            </span>
          </Link>
          <Link
            href="/my-bookings"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaSuitcaseRolling className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              My Bookings
            </span>
          </Link>
          <Link
            href="/my-account"
            className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:shadow-md hover:border-[#0077be]/30 dark:hover:border-white/20 transition"
          >
            <FaUserCircle className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              My Account
            </span>
          </Link>
          <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex flex-col items-center text-center gap-2">
            <FaCalendarAlt className="text-[#0077be] dark:text-[#7fb8e6] w-5 h-5" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {isLoading ? "..." : upcomingBookings.length} Upcoming
            </span>
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0077be] rounded-full" />
              Upcoming Trips
            </h2>
            {bookings.length > 0 && (
              <Link
                href="/my-bookings"
                className="text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline font-medium"
              >
                View all &rarr;
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-32 bg-gray-100 dark:bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-white dark:bg-[#16223d] border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-8 text-center">
              <FaSuitcaseRolling className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                You don&apos;t have any upcoming trips yet.
              </p>
              <Link
                href="/resort-directory"
                className="inline-block mt-4 bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-5 py-2 rounded-lg text-sm hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
              >
                Start Exploring
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm"
                >
                  <p className="font-bold text-gray-800 dark:text-white text-sm leading-snug line-clamp-1">
                    {getResortName(booking.resort)}
                  </p>
                  {booking.resort.location && (
                    <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-1">
                      <FaMapMarkerAlt className="shrink-0" />
                      <span className="line-clamp-1">{booking.resort.location}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {new Date(booking.startDate).toLocaleDateString()} &rarr;{" "}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide text-[#0077be] dark:text-[#7fb8e6] bg-blue-50 dark:bg-white/10 px-2 py-1 rounded">
                    {booking.unitType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore more resorts */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#0077be] rounded-full" />
            Explore Resorts
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-64 bg-gray-100 dark:bg-white/5 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredResorts.map((resort) => (
                <ResortCard key={resort._id} resort={resort} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
