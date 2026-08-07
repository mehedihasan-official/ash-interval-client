"use client";

// Lists every booking the signed-in member has made, split into Upcoming
// and Past so the most relevant trips surface first.
import Loading from "@/components/resorts/Loading";
import ResortImage from "@/components/resorts/ResortImage";
import { fetchBookingsByEmail, type Booking } from "@/lib/api/bookings";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getResortName, type Resort } from "@/lib/types/resort";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMedal,
  FaSuitcaseRolling,
  FaUtensils,
} from "react-icons/fa";

const getBookingStartDate = (booking: Booking) =>
  new Date(booking.startDate ?? booking.checkInDate ?? 0);

const getBookingEndDate = (booking: Booking) =>
  new Date(booking.endDate ?? booking.checkOutDate ?? 0);

const isUpcoming = (booking: Booking) =>
  getBookingStartDate(booking).getTime() >= Date.now();

const BookingCard = ({ booking }: { booking: Booking }) => {
  const fallbackResort: Resort = {
    _id: booking._id,
    place_name: "Unknown resort",
  };
  const resort = booking.resort ?? fallbackResort;
  const resortName = getResortName(resort);
  const isPoints = booking.paymentMethod === "points";
  const nights = booking.nights ?? 1;
  const startDate = getBookingStartDate(booking);
  const endDate = getBookingEndDate(booking);
  const formatDate = (date: Date) =>
    Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();

  return (
    <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-40 h-36 shrink-0">
          <ResortImage
            src={resort.img}
            alt={resortName}
            seed={resort._id || resortName}
            sizes="160px"
          />
        </div>
        <div className="p-4 grow">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white leading-snug">
                {resortName}
              </h3>
              {resort.location && (
                <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-1">
                  <FaMapMarkerAlt className="shrink-0" />
                  <span className="line-clamp-1">{resort.location}</span>
                </p>
              )}
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isPoints
                  ? "bg-blue-50 dark:bg-white/10 text-[#18294B] dark:text-[#7fb8e6]"
                  : "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
              }`}
            >
              {isPoints ? (
                <FaMedal className="w-3 h-3" />
              ) : (
                <FaUtensils className="w-3 h-3" />
              )}
              {isPoints ? "Points" : "Getaway"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mt-2">
            <p className="flex items-center gap-1.5">
              <FaCalendarAlt className="text-gray-400 dark:text-gray-500 shrink-0" />
              {formatDate(startDate)} &rarr; {formatDate(endDate)}
            </p>
            <p>
              <span className="font-semibold">{nights}</span> night
              {nights === 1 ? "" : "s"}
            </p>
            <p>
              <span className="font-semibold">Unit:</span>{" "}
              {booking.unitType ?? "Unknown"}
            </p>
            <p>
              <span className="font-semibold">Total:</span>{" "}
              {isPoints
                ? `${(booking.points ?? 0).toLocaleString()} pts`
                : `$${(booking.price ?? 0).toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MyBookingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.email) return;
    let isCancelled = false;

    const loadBookings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchBookingsByEmail(user.email as string);
        if (!isCancelled) setBookings(result);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load your bookings.",
          );
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadBookings();
    return () => {
      isCancelled = true;
    };
  }, [user?.email]);

  if (authLoading || !user) {
    return <Loading />;
  }

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((booking) => !isUpcoming(booking));

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18294B] dark:text-white mb-6">
          My Bookings
        </h1>

        {errorMessage && (
          <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-36 bg-gray-100 dark:bg-white/5 rounded-xl"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white dark:bg-[#16223d] border border-dashed border-gray-300 dark:border-white/10 rounded-xl p-10 text-center">
            <FaSuitcaseRolling className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">
              You haven&apos;t made any bookings yet.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              Browse the resort directory to plan your next stay.
            </p>
            <Link
              href="/resort-directory"
              className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded-lg hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
            >
              Browse Resort Directory
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#0077be] rounded-full" />
                Upcoming ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No upcoming trips right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </div>

            {past.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-gray-300 dark:bg-white/20 rounded-full" />
                  Past Trips ({past.length})
                </h2>
                <div className="space-y-4 opacity-80">
                  {past.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
