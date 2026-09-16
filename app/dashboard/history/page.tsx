"use client";

// The full My History screen, reached from "History" in the header menu.
// The dashboard embeds the same component capped at three rows per tab;
// this page shows everything.
import BookingHistory from "@/components/dashboard/BookingHistory";
import Loading from "@/components/resorts/Loading";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const HistoryPage = () => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  // Same guard the rest of the members-only pages use: wait for auth to
  // settle, then bounce anyone who isn't signed in.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (!loading && user && role && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading || !user || role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a6fa8] dark:text-[#7fb8e6] mb-1">
          My History
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Everything you&apos;ve booked — resorts, flights, cars and cruises.
        </p>

        <BookingHistory email={user.email} showHeading={false} />
      </div>
    </div>
  );
};

export default HistoryPage;
