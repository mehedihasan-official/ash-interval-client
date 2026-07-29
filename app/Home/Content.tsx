// Homepage content shown below the carousel to logged-out visitors.
// Mobile and desktop are deliberately different layouts:
//   - Mobile mirrors the compact "app menu" style reference: a plain
//     list of nav rows (Login / Resort Directory / Interval HD /
//     Create a Profile / Join Today) each with a chevron, followed by
//     social icons and a "View Full Site" link.
//   - Desktop mirrors the intervalworld.com-style layout: an "Important
//     Member Information" notice, a 4-tile image grid, a resort
//     directory link list next to an IntervalHD promo box, then socials.
import exchangeBanner from "@/app/asset/images/exchange-banner.jpg";
import getawaysBanner from "@/app/asset/images/getaways-banner.jpg";
import homeSlider4 from "@/app/asset/images/home-slider-4.jpg";
import intervalTravelBanner from "@/app/asset/images/interval_travel-banner.jpg";
import Image from "next/image";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPinterestP,
} from "react-icons/fa";

const featureTiles = [
  {
    label: "Vacation Ownership",
    image: homeSlider4,
    href: "/resort-directory",
  },
  {
    label: "Exchange",
    image: exchangeBanner,
    href: "/my-bookings",
  },
  {
    label: "Getaways",
    image: getawaysBanner,
    href: "/resort-directory",
  },
  {
    label: "Membership",
    image: intervalTravelBanner,
    href: "/create-profile",
  },
];

const resortDestinations = [
  ["Aruba", "Cancun, Mexico", "St. Maarten", "Puerto Vallarta, Mexico"],
  ["Orlando, Florida", "Williamsburg, Virginia", "Poconos, Pennsylvania", "Las Vegas, Nevada"],
  ["Palm Springs, California", "Phoenix, Arizona", "Hawaiian Islands", "Costa del Sol, Spain"],
  ["Paris, France", "Australia", "Asia", "View All"],
];

const socialLinks = [
  { icon: FaFacebookF, label: "Facebook" },
  { icon: FaInstagram, label: "Instagram" },
  { icon: FaYoutube, label: "YouTube" },
  { icon: FaPinterestP, label: "Pinterest" },
];

const mobileMenuRows = [
  { label: "Login", href: "/login" },
  { label: "Resort Directory", href: "/resort-directory" },
  { label: "Interval HD", href: "/resort-directory" },
  { label: "Create a Profile", href: "/create-profile" },
  { label: "Join Today", href: "/create-profile" },
];

const DesktopContent = () => (
  <div className="hidden md:block bg-white dark:bg-[#0f172a]">
    <div className="mx-auto max-w-[980px] px-4 py-8">
      <h2 className="text-[#1a6fa8] dark:text-[#7fb8e6] text-2xl font-semibold mb-2">
        Important Member Information
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-[820px]">
        The safety and well-being of our members is our top priority. Please
        refer to our{" "}
        <a href="#" className="text-[#1a6fa8] dark:text-[#7fb8e6] underline font-bold">
          Travel Advisories
        </a>{" "}
        page for information regarding resort closures. The page is updated
        frequently, so please review it before proceeding with your travel
        plans.
      </p>
    </div>

    <div className="mx-auto max-w-[980px] px-4 pb-8">
      <div className="grid grid-cols-4 gap-3">
        {featureTiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative overflow-hidden h-36 lg:h-40"
          >
            <Image
              src={tile.image}
              alt={tile.label}
              fill
              sizes="25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-3 text-white font-bold text-base drop-shadow-md">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </div>

    <div className="mx-auto max-w-[980px] px-4 pb-10">
      <div className="grid grid-cols-12 gap-4">
        {/* Resort directory list */}
        <div className="col-span-9 bg-[#f5f5f5] dark:bg-[#16223d] border border-gray-200 dark:border-white/10 p-5">
          <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
            <div className="pr-4 border-r border-gray-300 dark:border-white/10">
              <h3 className="text-[#1a6fa8] dark:text-[#7fb8e6] font-bold text-lg leading-tight mb-1">
                Interval&apos;s Resort Directory
              </h3>
              <Link
                href="/resort-directory"
                className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
              >
                Download Interval App
              </Link>
            </div>
            {resortDestinations.map((col, i) => (
              <ul key={i} className="text-sm space-y-1.5 min-w-[130px]">
                {col.map((place) =>
                  place === "View All" ? (
                    <li key={place}>
                      <Link
                        href="/resort-directory"
                        className="text-[#1a6fa8] dark:text-[#7fb8e6] font-bold hover:underline"
                      >
                        View All
                      </Link>
                    </li>
                  ) : (
                    <li key={place}>
                      <Link
                        href="/resort-directory"
                        className="text-gray-700 dark:text-gray-300 hover:text-[#1a6fa8] dark:hover:text-[#7fb8e6] hover:underline"
                      >
                        {place}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            ))}
          </div>
        </div>

        {/* IntervalHD promo box */}
        <Link
          href="/resort-directory"
          className="col-span-3 bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center p-4 hover:border-[#1a6fa8] dark:hover:border-[#7fb8e6] transition"
        >
          <span className="text-[#18294B] dark:text-white font-bold text-xl leading-none">
            interval<span className="text-[#0077be] dark:text-[#3ba0ea]">HD</span>
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
            Now with helpful videos.
          </span>
          <span className="bg-[#f5a623] text-[#18294B] text-xs font-bold px-4 py-1.5 rounded-full">
            Learn more
          </span>
        </Link>
      </div>
    </div>

    {/* Social icons */}
    <div className="mx-auto max-w-[980px] px-4 pb-8 flex items-center justify-center gap-3">
      <span className="h-px bg-gray-200 dark:bg-white/10 grow" />
      {socialLinks.map(({ icon: Icon, label }) => (
        <a
          key={label}
          href="#"
          aria-label={label}
          className="h-9 w-9 rounded-full bg-[#18294B] dark:bg-[#1c2b4a] text-white flex items-center justify-center hover:bg-[#0077be] dark:hover:bg-[#3ba0ea] transition shrink-0"
        >
          <Icon className="text-sm" />
        </a>
      ))}
      <span className="h-px bg-gray-200 dark:bg-white/10 grow" />
    </div>

    <div className="mx-auto max-w-[980px] px-4 py-6 border-t border-gray-100 dark:border-white/10 text-[10px] text-gray-500 dark:text-gray-400 flex flex-wrap justify-between gap-4">
      <p>Copyright © 2026 Interval International. All rights reserved.</p>
    </div>
  </div>
);

const MobileContent = () => (
  <div className="md:hidden bg-white dark:bg-[#0f172a]">
    <div className="px-4">
      {mobileMenuRows.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-white/10"
        >
          <span className="text-[#18294B] dark:text-gray-100 text-base">{item.label}</span>
          <IoIosArrowForward className="text-[#0077be] dark:text-[#7fb8e6] text-lg shrink-0" />
        </Link>
      ))}
    </div>

    {/* Social icons */}
    <div className="flex items-center justify-center gap-4 py-6">
      {socialLinks.map(({ icon: Icon, label }) => (
        <a
          key={label}
          href="#"
          aria-label={label}
          className="h-9 w-9 rounded-full bg-[#18294B] dark:bg-[#1c2b4a] text-white flex items-center justify-center"
        >
          <Icon className="text-sm" />
        </a>
      ))}
    </div>

    <div className="text-center pb-5">
      <a
        href="#"
        className="text-[#18294B] dark:text-gray-100 font-bold text-sm tracking-wide"
      >
        VIEW FULL SITE
      </a>
    </div>

    <div className="border-t border-gray-200 dark:border-white/10 px-4 py-4 text-center">
      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-[#1a6fa8] dark:text-[#7fb8e6] mb-3">
        <a href="#" className="hover:underline">About Us</a>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <a href="#" className="hover:underline">Privacy &amp; Cookie Policies</a>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <a href="#" className="hover:underline">Cookie Settings</a>
        <br className="w-full" />
        <a href="#" className="hover:underline">Do Not Sell/Share</a>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <a href="#" className="hover:underline">Legal</a>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <a href="#" className="hover:underline">Accessibility</a>
        <span className="text-gray-400 dark:text-gray-600">|</span>
        <a href="#" className="hover:underline">Support</a>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        Copyright © 2026 Interval International. All rights reserved.
      </p>
    </div>
  </div>
);

const Content = () => (
  <>
    <DesktopContent />
    <MobileContent />
  </>
);

export default Content;
