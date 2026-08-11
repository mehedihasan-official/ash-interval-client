"use client";

// Shell for every /dashboard/admin/* page: a sidebar of admin-only links
// on desktop, a slide-out menu on mobile, and a guard that keeps non-admins
// out entirely. Mirrors the member dashboard's auth-guard pattern (redirect
// while loading, then again once role is known) rather than trusting a
// single check, since `role` starts as null and only resolves after the
// backend sync in AuthProvider finishes.
import Loading from "@/components/resorts/Loading";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FaBars, FaHome, FaHotel, FaPlus, FaSignOutAlt, FaTachometerAlt, FaTimes, FaUsers } from "react-icons/fa";

// The first entry sends the admin back to the members-facing
// dashboard so they can jump out of the admin shell without having
// to sign out. Keeping it at the top of the list because it's the
// most common escape hatch during day-to-day admin work.
const adminLinks = [
  { name: "Member Dashboard", href: "/dashboard", icon: FaHome },
  { name: "Admin Overview", href: "/dashboard/admin", icon: FaTachometerAlt },
  { name: "Registered Users", href: "/dashboard/admin/users", icon: FaUsers },
  { name: "Resorts", href: "/dashboard/admin/resorts", icon: FaHotel },
  { name: "Add Resort", href: "/dashboard/admin/resorts/new", icon: FaPlus },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Two-stage guard: bounce signed-out visitors to /login, and bounce
  // signed-in-but-non-admin members back to the regular dashboard. Both
  // wait for `loading`/`role` to settle first so a real admin never gets
  // flashed a redirect while the backend sync is still in flight.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (role && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, role, router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  if (loading || !user || role !== "admin") {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#18294B] dark:bg-[#101b30] text-white">
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
            Interval
          </Link>
          <p className="text-xs text-blue-300 mt-1 uppercase tracking-widest">Owner Details</p>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  isActive ? "bg-[#0077be]" : "hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition font-semibold"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#18294B] dark:bg-[#101b30] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg"
          aria-label="Open admin menu"
        >
          <FaBars className="w-5 h-5" />
        </button>

        {/* Logo doubles as a shortcut back to the members dashboard —
            common pattern so an admin can jump out of the admin shell
            with a single tap. */}
        <Link href="/dashboard" className="flex items-baseline gap-1.5" aria-label="Go to member dashboard">
          <span className="text-lg font-bold lowercase tracking-tight">interval</span>
          <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">
            Admin
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="text-xs font-bold bg-red-500 px-3 py-1.5 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Mobile menu overlay + slide-out */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white dark:bg-[#16223d] shadow-2xl z-60 transform transition-transform duration-300 lg:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="bg-[#18294B] dark:bg-[#101b30] p-5 flex justify-between items-center text-white">
          <div>
            <span className="text-lg font-bold">Owner Details</span>
            <p className="text-xs text-blue-300 uppercase tracking-wide">Interval</p>
          </div>
          <button onClick={() => setIsMenuOpen(false)} aria-label="Close admin menu">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  isActive
                    ? "bg-blue-50 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6]"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
