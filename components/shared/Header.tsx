"use client";

// Site header: shows a different nav for logged-out vs logged-in users,
// plus a mobile slide-out menu. Colors match the reference brand theme:
// navy (#18294B) for nav bars, blue (#0077be / #1a6fa8) for links/buttons.
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { useAuth } from "@/lib/providers/AuthProvider";

// Nav items shown once a regular (non-admin) user is logged in.
const userMenuItems = [
  { name: "Resort Directory", path: "/resort-directory" },
  { name: "My Account", path: "/my-account" },
  { name: "My Bookings", path: "/my-bookings" },
];

// Nav tabs shown to visitors who have not logged in yet.
const preLoginNavTabs = [
  { name: "Why Vacation Ownership?", path: "#" },
  { name: "Resort Directory", path: "/resort-directory" },
  { name: "Explore & Plan", path: "#" },
  { name: "Membership Benefits", path: "#" },
  { name: "Join Today", path: "#" },
];

// Items shown in the mobile slide-out menu before login.
const mobilePreLoginItems = [
  { name: "Home", path: "/" },
  { name: "Login", path: "/login" },
  { name: "Create a Profile", path: "/create-profile" },
  { name: "Resort Directory", path: "/resort-directory" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    try {
      await signOut();
      closeMenu();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const loggedInMobileItems = user ? userMenuItems : mobilePreLoginItems;

  return (
    <>
      {/* Top language bar — desktop only, hidden once logged in */}
      {!user && (
        <div className="hidden md:flex justify-end items-center bg-[#f2f2f2] px-4 py-1.5 border-b border-gray-300">
          <div className="max-w-[980px] mx-auto w-full flex justify-end items-center">
            <span className="text-gray-700 text-xs mr-2 font-medium">
              Language:
            </span>
            <select className="text-xs bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-700 outline-none">
              <option>English</option>
            </select>
          </div>
        </div>
      )}

      <header className="bg-white sticky top-0 z-50">
        {/* Logo + auth buttons row — desktop, logged out */}
        {!user && (
          <div className="hidden md:block w-full bg-white">
            <div className="max-w-[980px] mx-auto grid grid-cols-12 items-center">
              <div className="col-span-9">
                <Link href="/">
                  <span className="text-2xl font-bold text-[#18294B] py-6 block">
                    Interval
                  </span>
                </Link>
              </div>
              <div className="col-span-3 flex justify-center items-center gap-2 pr-4">
                <Link
                  href="/create-profile"
                  className="text-[#1a6fa8] text-xs hover:underline font-medium"
                >
                  Create Profile
                </Link>
                <Link
                  href="/login"
                  className="bg-[#0077be] text-white text-sm font-bold px-6 py-2 rounded hover:bg-[#005a8e] transition shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Logo + logout — desktop, logged in */}
        {user && (
          <div className="hidden md:flex items-center justify-between px-4 py-4 max-w-[980px] mx-auto">
            <Link href="/">
              <span className="text-2xl font-bold text-[#18294B]">Interval</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-white bg-red-500 px-5 py-1.5 rounded text-sm font-medium hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}

        {/* Desktop nav tabs */}
        <nav className="hidden md:flex bg-[#18294B]">
          <div className="max-w-[980px] mx-auto w-full flex">
            {user
              ? userMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`text-white text-xs px-4 py-3 hover:bg-white/10 transition border-r border-white/10 last:border-r-0 ${
                      pathname === item.path ? "bg-white/20" : ""
                    }`}
                  >
                    {item.name}
                  </Link>
                ))
              : preLoginNavTabs.map((tab) => (
                  <a
                    key={tab.name}
                    href={tab.path}
                    className="flex-1 text-center text-white text-sm py-2.5 border-r border-white/20 last:border-r-0 hover:bg-white/10 transition font-medium"
                  >
                    {tab.name}
                  </a>
                ))}
          </div>
        </nav>

        {/* Mobile header bar */}
        <div className="md:hidden flex items-center justify-between px-3 py-3 bg-[#18294B]">
          <Link href="/">
            <span className="text-white text-lg font-bold">Interval</span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-white p-1.5"
            aria-label="Menu"
          >
            <FaBars className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile slide-out sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl z-[70] transform transition-transform duration-300 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-[#18294B] p-5 flex justify-between items-center">
          <span className="text-white font-bold text-lg">Interval</span>
          <button onClick={closeMenu} className="text-white" aria-label="Close menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto h-[calc(100%-70px)]">
          {loggedInMobileItems.map((item) => (
            <Link
              href={item.path}
              key={item.name}
              onClick={closeMenu}
              className={`px-5 py-3.5 text-gray-700 hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 text-sm ${
                pathname === item.path ? "bg-blue-50 text-[#1a6fa8] font-medium" : ""
              }`}
            >
              <span>{item.name}</span>
              <IoIosArrowForward className="text-[#1a6fa8] flex-shrink-0" />
            </Link>
          ))}

          <div className="p-5 mt-auto">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-white bg-red-500 py-3 rounded-lg font-bold hover:bg-red-600 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="block w-full text-center text-white bg-[#1a6fa8] py-3 rounded-lg font-bold hover:bg-[#155a8a] transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
