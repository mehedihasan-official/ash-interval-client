"use client";

// All registered users, with a filter toggle for admins-only, and a
// promote/demote action per row. Combines what the reference app split
// across two separate pages (User Control + Admin Control) into one list
// with a filter — same data source, so there is no reason to fetch twice.
import Loading from "@/components/resorts/Loading";
import { fetchAllUsers, updateUserRole, type AdminUser } from "@/lib/api/admin";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useEffect, useState } from "react";
import { FaEnvelope, FaUserShield } from "react-icons/fa";
import Swal from "sweetalert2";

type Filter = "all" | "admins";

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await fetchAllUsers();
        if (isCancelled) return;
        setUsers(result);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load registered users.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadUsers();
    return () => {
      isCancelled = true;
    };
  }, [reloadToken]);

  const visibleUsers = filter === "admins" ? users.filter((u) => u.isAdmin) : users;
  const adminCount = users.filter((u) => u.isAdmin).length;

  const handleToggleRole = async (targetUser: AdminUser) => {
    // An admin can never demote their own account — prevents a lockout
    // where the only signed-in admin removes their own access.
    if (currentUser?.email === targetUser.email && targetUser.isAdmin) {
      Swal.fire({
        title: "Not allowed",
        text: "You can't remove your own admin access.",
        icon: "warning",
        confirmButtonColor: "#0077be",
      });
      return;
    }

    const nextIsAdmin = !targetUser.isAdmin;
    const confirmed = await Swal.fire({
      title: nextIsAdmin ? "Make admin?" : "Remove admin?",
      text: nextIsAdmin
        ? `${targetUser.name || targetUser.email} will get full admin access.`
        : `${targetUser.name || targetUser.email} will lose admin access.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: nextIsAdmin ? "Make Admin" : "Remove Admin",
      confirmButtonColor: nextIsAdmin ? "#0077be" : "#ef4444",
      cancelButtonText: "Cancel",
    });
    if (!confirmed.isConfirmed) return;

    setPendingEmail(targetUser.email);
    try {
      const updated = await updateUserRole(targetUser.email, nextIsAdmin);
      setUsers((prev) =>
        prev.map((u) => (u.email === targetUser.email ? { ...u, ...updated } : u)),
      );
    } catch (error) {
      Swal.fire({
        title: "Update failed",
        text: error instanceof Error ? error.message : "Could not update this user's role.",
        icon: "error",
        confirmButtonColor: "#0077be",
      });
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0077be]">Registered Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} total &middot; {adminCount} admin{adminCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 dark:border-white/10 p-1 bg-white dark:bg-[#16223d]">
          {(["all", "admins"] as Filter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition ${
                filter === option
                  ? "bg-[#0077be] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {option === "all" ? "All Users" : "Admins Only"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : errorMessage ? (
        <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
            Couldn&apos;t load users
          </p>
          <p className="text-red-500 dark:text-red-400/80 text-sm mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setReloadToken((token) => token + 1)}
            className="bg-[#0077be] text-white font-semibold px-5 py-2 rounded hover:bg-[#005a8e] transition"
          >
            Try Again
          </button>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-white/10 rounded-lg text-gray-500 dark:text-gray-400">
          {filter === "admins" ? "No admins yet." : "No registered users yet."}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {visibleUsers.map((u) => {
                  const isSelf = currentUser?.email === u.email;
                  return (
                    <tr key={u.email}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white whitespace-nowrap">
                        {u.name || "—"}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-[#0077be] dark:text-[#7fb8e6]">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            u.isAdmin
                              ? "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                              : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {u.isAdmin && <FaUserShield className="w-3 h-3" />}
                          {u.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={pendingEmail === u.email || (isSelf && u.isAdmin)}
                          onClick={() => handleToggleRole(u)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.isAdmin
                              ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                              : "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] hover:bg-[#0077be] hover:text-white"
                          }`}
                        >
                          {pendingEmail === u.email
                            ? "Saving..."
                            : u.isAdmin
                              ? "Remove Admin"
                              : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {visibleUsers.map((u) => {
              const isSelf = currentUser?.email === u.email;
              return (
                <div key={u.email} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                      {u.name || "—"} {isSelf && <span className="text-[#0077be]">(You)</span>}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        u.isAdmin
                          ? "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                          : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {u.isAdmin ? "Admin" : "User"}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <FaEnvelope className="shrink-0" /> {u.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {u.points.toLocaleString()} points
                  </p>
                  <button
                    type="button"
                    disabled={pendingEmail === u.email || (isSelf && u.isAdmin)}
                    onClick={() => handleToggleRole(u)}
                    className={`w-full mt-3 text-xs font-bold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      u.isAdmin
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                    }`}
                  >
                    {pendingEmail === u.email
                      ? "Saving..."
                      : u.isAdmin
                        ? "Remove Admin"
                        : "Make Admin"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
