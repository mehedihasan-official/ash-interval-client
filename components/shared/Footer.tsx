"use client";

// Site footer with legal/info links. Client-side so it can inspect the
// current pathname and stay hidden inside /dashboard/admin/*, where the
// admin layout provides its own chrome.
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard/admin")) return null;

  return (
    <footer className="bg-white dark:bg-[#0f172a] text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-white/10">
      {/* Desktop footer */}
      <div className="hidden md:block">
        <div className="max-w-[980px] mx-auto px-4 py-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Copyright&copy; 2026 Interval. All rights reserved.
          </p>
          <div className="flex justify-center flex-wrap gap-x-1 text-xs text-gray-600 dark:text-gray-300">
            <a href="#" className="hover:underline hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6]">About</a>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <a href="#" className="hover:underline hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6]">Privacy and Cookie Policies</a>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <a href="#" className="hover:underline hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6]">Legal Information</a>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <a href="#" className="hover:underline hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6]">Customer Support</a>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <a href="#" className="hover:underline hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6]">FAQs</a>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="md:hidden text-center py-4 px-4">
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-gray-300 mb-2">
          <a href="#" className="hover:underline">About Us</a>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <a href="#" className="hover:underline">Privacy &amp; Cookie Policies</a>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <a href="#" className="hover:underline">Legal</a>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <a href="#" className="hover:underline">Support</a>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Copyright&copy; 2026 Interval. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
