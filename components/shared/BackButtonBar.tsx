"use client";

// Slim bar with a "Back" arrow, rendered site-wide by app/layout.tsx
// just under the header. Kept in one place because putting it into
// every inner page individually would mean touching 30+ files and
// makes it easy to forget the button on future pages.
//
// The button uses `router.back()` — the natural browser-back behavior
// members already expect. If the history stack is empty (member deep-
// linked into a detail page, opened in a fresh tab, etc.) the fallback
// is a sensible parent path chosen per section.
//
// Hidden entirely on:
//   • "/" — home has nowhere to go back to
//   • "/dashboard" — top-level after login
//   • "/login" / "/create-profile" — auth entry points
// Anywhere else the bar renders — cars/cruises/flights flows, admin
// sub-pages, resort directory, my bookings, etc.
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

// Paths where the bar should not appear at all — top-level entry
// points where there's nothing meaningful to go back to.
const HIDDEN_PATHS: ReadonlySet<string> = new Set([
  "/",
  "/dashboard",
  "/login",
  "/create-profile",
]);

// For a first-visit deep link (no browser history), sending
// router.back() would just leave the tab. These fallbacks pick a
// sensible parent for the section instead.
const FALLBACK_PARENTS: { prefix: string; parent: string }[] = [
  { prefix: "/cars/", parent: "/cars" },
  { prefix: "/cruises/", parent: "/cruises" },
  { prefix: "/flights/", parent: "/flights" },
  { prefix: "/resort-directory/", parent: "/resort-directory" },
  { prefix: "/dashboard/admin/", parent: "/dashboard/admin" },
  { prefix: "/dashboard/", parent: "/dashboard" },
];

function resolveFallback(pathname: string): string {
  for (const { prefix, parent } of FALLBACK_PARENTS) {
    if (pathname.startsWith(prefix)) return parent;
  }
  return "/dashboard";
}

export default function BackButtonBar() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  // Track whether the browser has a history entry to go back to.
  // window.history.length starts at 1 for a fresh tab, so anything
  // greater than 1 means we can safely pop.
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, [pathname]);

  if (HIDDEN_PATHS.has(pathname)) return null;

  const handleBack = () => {
    if (canGoBack) {
      router.back();
    } else {
      router.push(resolveFallback(pathname));
    }
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back to the previous page"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0077be] dark:text-[#7fb8e6] hover:opacity-80 py-1"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
