// Homepage content shown below the carousel to logged-out visitors.
import exchangeBanner from "@/app/asset/images/exchange-banner.jpg";
import getawaysBanner from "@/app/asset/images/getaways-banner.jpg";
import homeSlider4 from "@/app/asset/images/home-slider-4.jpg";
import intervalTravelBanner from "@/app/asset/images/interval_travel-banner.jpg";
import Image from "next/image";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";

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

const mobileHighlights = [
  {
    title: "Resort Directory",
    description: "Browse resorts and find your next stay.",
    href: "/resort-directory",
    image: homeSlider4,
  },
  {
    title: "Create a Profile",
    description: "Set up your account and plan with confidence.",
    href: "/create-profile",
    image: intervalTravelBanner,
  },
];

const DesktopContent = () => (
  <div className="hidden md:block">
    <div className="mx-auto max-w-245 px-4 py-8">
      <h2 className="text-[#1a6fa8] text-2xl font-semibold mb-2">
        Important Member Information
      </h2>
      <p className="text-sm text-gray-700 leading-relaxed max-w-225">
        The safety and well-being of our members is our top priority. Please
        refer to our{" "}
        <a href="#" className="text-[#1a6fa8] underline font-bold">
          Travel Advisories
        </a>{" "}
        page for information regarding resort closures. The page is updated
        frequently, so please review it before proceeding with your travel
        plans.
      </p>
    </div>

    <div className="mx-auto max-w-245 px-4 pb-10">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {featureTiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative overflow-hidden rounded-xl border border-gray-100 shadow-sm h-40 sm:h-44"
          >
            <Image
              src={tile.image}
              alt={tile.label}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/35 to-black/70" />
            <span className="absolute inset-0 flex items-start p-4 text-white font-bold text-lg drop-shadow-md">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </div>

    <div className="mx-auto max-w-245 px-4 pb-8">
      <div className="bg-[#f8f9fa] border border-gray-200 p-6 rounded-sm">
        <h3 className="text-[#1a6fa8] font-bold text-xl mb-2">
          Explore Our Resort Directory
        </h3>
        <p className="text-sm text-gray-700 mb-3">
          Browse resorts by destination and find your next stay.
        </p>
        <Link
          href="/resort-directory"
          className="text-[#1a6fa8] font-bold hover:underline text-sm"
        >
          View All Resorts &rarr;
        </Link>
      </div>
    </div>

    <div className="mx-auto max-w-245 px-4 py-6 border-t border-gray-100 text-[10px] text-gray-500 flex flex-wrap justify-between gap-4">
      <p>Copyright © 2026 Interval. All rights reserved.</p>
    </div>
  </div>
);

const MobileContent = () => (
  <div className="md:hidden px-3 pb-6">
    <div className="mt-2 space-y-3">
      {mobileHighlights.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="relative h-32 w-full">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {item.title}
              </p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
            <IoIosArrowForward className="text-[#1a6fa8] text-lg" />
          </div>
        </Link>
      ))}

      <Link
        href="/login"
        className="flex items-center justify-between border-t border-gray-200 py-3 px-1 hover:bg-gray-50"
      >
        <span className="text-gray-800 text-sm">Login</span>
        <IoIosArrowForward className="text-[#1a6fa8] text-lg" />
      </Link>
      <Link
        href="/resort-directory"
        className="flex items-center justify-between border-t border-gray-200 py-3 px-1 hover:bg-gray-50"
      >
        <span className="text-gray-800 text-sm">Resort Directory</span>
        <IoIosArrowForward className="text-[#1a6fa8] text-lg" />
      </Link>
      <Link
        href="/create-profile"
        className="flex items-center justify-between border-t border-b border-gray-200 py-3 px-1 hover:bg-gray-50"
      >
        <span className="text-gray-800 text-sm">Create a Profile</span>
        <IoIosArrowForward className="text-[#1a6fa8] text-lg" />
      </Link>
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
