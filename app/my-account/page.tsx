"use client";

// Member's account page — shows the profile info Interval actually has on
// file (name, email, member-since date, role) and lets them sign out or
// jump to their bookings. There's no separate "edit profile" API on the
// backend yet, so this stays a clean read-only summary rather than a form
// that would silently fail to save.
import Loading from "@/components/resorts/Loading";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaCalendarAlt, FaEnvelope, FaIdBadge, FaSuitcaseRolling, FaUserCircle } from "react-icons/fa";
import Swal from "sweetalert2";

const MyAccountPage = () => {
  const { user, role, loading, signOut } = useAuth();
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
  const memberSince = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "Sign out?",
      text: "You'll need to sign in again to access your account.",
      showCancelButton: true,
      confirmButtonText: "Sign Out",
      confirmButtonColor: "#0077be",
    });

    if (!result.isConfirmed) return;

    try {
      await signOut();
      router.push("/");
    } catch {
      Swal.fire({
        icon: "error",
        title: "Couldn't sign out",
        text: "Please try again.",
        confirmButtonColor: "#0077be",
      });
    }
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#18294B] dark:text-white mb-6">
          My Account
        </h1>

        {/* Profile card */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#0077be]/10 dark:bg-white/10 flex items-center justify-center shrink-0">
              <FaUserCircle className="w-9 h-9 text-[#0077be] dark:text-[#7fb8e6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{displayName}</h2>
              {role === "admin" && (
                <span className="inline-block mt-1 bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
              <FaEnvelope className="text-[#0077be] dark:text-[#7fb8e6] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-all">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-4">
              <FaCalendarAlt className="text-[#0077be] dark:text-[#7fb8e6] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  Member Since
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {memberSince}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/5 rounded-xl p-4 sm:col-span-2">
              <FaIdBadge className="text-[#0077be] dark:text-[#7fb8e6] mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                  Account Type
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">
                  {role ?? "Member"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Quick Links</h3>
          <Link
            href="/my-bookings"
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-blue-50 dark:hover:bg-white/10 transition group"
          >
            <div className="flex items-center gap-3">
              <FaSuitcaseRolling className="text-[#0077be] dark:text-[#7fb8e6]" />
              <span className="font-medium text-gray-800 dark:text-gray-100">My Bookings</span>
            </div>
            <span className="text-[#1a6fa8] dark:text-[#7fb8e6] text-sm group-hover:underline">
              View &rarr;
            </span>
          </Link>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full sm:w-auto text-white bg-red-500 dark:bg-red-600 px-6 py-2.5 rounded-lg font-bold hover:bg-red-600 dark:hover:bg-red-500 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default MyAccountPage;
