"use client";

// Admin landing page — quick counts (total users, admins, resorts) with
// links into the detail pages. Kept intentionally light: this fetches the
// same data the Users page needs anyway, just to get counts, rather than
// requiring a dedicated backend stats endpoint that doesn't exist yet.
import Loading from "@/components/resorts/Loading";
import { fetchAllUsers, type AdminUser } from "@/lib/api/admin";
import { searchCruises } from "@/lib/api/cruises";
import { fetchResortCount } from "@/lib/api/resorts";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaHotel, FaShip, FaUserShield, FaUsers } from "react-icons/fa";

const AdminOverviewPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [resortCount, setResortCount] = useState<number | null>(null);
  const [cruiseCount, setCruiseCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadOverview = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [usersResult, resorts, cruises] = await Promise.all([
          fetchAllUsers(),
          fetchResortCount(),
          searchCruises({
            cabinType: "inside",
            adults: 2,
            children: 0,
            infants: 0,
          }).then((result) => result.total),
        ]);
        if (isCancelled) return;
        setUsers(usersResult);
        setResortCount(resorts);
        setCruiseCount(cruises);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load admin overview.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadOverview();
    return () => {
      isCancelled = true;
    };
  }, []);

  const adminCount = users.filter((u) => u.isAdmin).length;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Admin";

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Admin Overview</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Welcome back, {displayName}.</p>

      {errorMessage && (
        <div className="mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/admin/users"
          className="bg-gradient-to-br from-[#0077be] to-[#005a8e] rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Registered Users</p>
              <p className="text-4xl font-bold mt-2">{users.length}</p>
            </div>
            <FaUsers className="w-9 h-9 text-white/70" />
          </div>
          <p className="text-xs mt-4 text-white/70">Manage roles &rarr;</p>
        </Link>

        <Link
          href="/dashboard/admin/users"
          className="bg-gradient-to-br from-[#18294B] to-[#101b30] rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Admins</p>
              <p className="text-4xl font-bold mt-2">{adminCount}</p>
            </div>
            <FaUserShield className="w-9 h-9 text-white/70" />
          </div>
          <p className="text-xs mt-4 text-white/70">View admin accounts &rarr;</p>
        </Link>

        <Link
          href="/dashboard/admin/resorts"
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Resorts Listed</p>
              <p className="text-4xl font-bold mt-2">{resortCount ?? "—"}</p>
            </div>
            <FaHotel className="w-9 h-9 text-white/70" />
          </div>
          <p className="text-xs mt-4 text-white/70">Manage all resorts &rarr;</p>
        </Link>

        <Link
          href="/dashboard/admin/cruises"
          className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-2xl p-6 text-white shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Cruises Listed</p>
              <p className="text-4xl font-bold mt-2">{cruiseCount ?? "—"}</p>
            </div>
            <FaShip className="w-9 h-9 text-white/70" />
          </div>
          <p className="text-xs mt-4 text-white/70">Manage all cruises &rarr;</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
