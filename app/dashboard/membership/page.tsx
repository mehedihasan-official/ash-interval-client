"use client";

// Membership — overview of what an Interval membership includes. Kept
// deliberately simple: the backend has no membership-number/expiry data
// on the user record yet, so this shows the member's real account info
// plus the standard benefits list rather than inventing placeholder data.
import Loading from "@/components/resorts/Loading";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";

const benefits = [
  "Exchange",
  "Getaways",
  "Guest Certificates",
  "Travel Insurance",
  "Resort Directory",
  "Entertainment\u00ae Coupon Sampler",
  "Interval World Mastercard\u00ae credit card",
  "Interval Travel\u00ae",
  "Member Publications",
  "Confirmation Information",
  "Up to 60% Off Hotels",
];

const MembershipPage = () => {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <Loading />;
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Member";

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0077be] mb-6">My Membership</h1>

        <div className="bg-[#18294B] dark:bg-[#101b30] rounded-2xl p-6 text-white shadow-sm mb-6">
          <p className="text-white/70 text-sm font-medium">Member</p>
          <h2 className="text-xl font-bold mt-1">{displayName}</h2>
          {user.email && <p className="text-white/70 text-sm mt-1">{user.email}</p>}
          {role === "admin" && (
            <span className="inline-block mt-3 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Admin Account
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-5 mb-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3">Benefits Included</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <FaCheckCircle className="text-[#0077be] dark:text-[#7fb8e6] shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/gateways"
            className="flex-1 text-center bg-[#0077be] hover:bg-[#005a8e] text-white font-bold px-5 py-3 rounded-lg transition"
          >
            Browse Getaways
          </Link>
          <Link
            href="/dashboard/exchange"
            className="flex-1 text-center bg-white dark:bg-[#16223d] border border-[#0077be] text-[#0077be] dark:text-[#7fb8e6] font-bold px-5 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-white/10 transition"
          >
            Start an Exchange
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MembershipPage;
