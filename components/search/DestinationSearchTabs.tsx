"use client";

// The 4-way sub-menu (Single Destination / Search All Destinations /
// Resort Name or Code / Area List) shared by the Gateways and Exchange
// pages. "Area List" isn't a search form — it navigates straight to the
// Resort Directory, matching the reference site's behavior.
import { useRouter } from "next/navigation";
import { useState } from "react";
import ResortNameOrCodeSearch from "./ResortNameOrCodeSearch";
import SearchAllDestinationsSearch from "./SearchAllDestinationsSearch";
import SingleDestinationSearch from "./SingleDestinationSearch";

const menuItems = [
  "Single Destination",
  "Search All Destinations",
  "Resort Name or Code",
  "Area List",
] as const;

type MenuItem = (typeof menuItems)[number];

const DestinationSearchTabs = () => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuItem>("Single Destination");

  const handleMenuClick = (menu: MenuItem) => {
    if (menu === "Area List") {
      router.push("/resort-directory");
      return;
    }
    setActiveMenu(menu);
  };

  return (
    <div>
      <div className="w-full mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-[#0077be] rounded-md overflow-hidden">
          {menuItems.map((menu) => (
            <button
              key={menu}
              type="button"
              onClick={() => handleMenuClick(menu)}
              className={`py-3 px-2 font-medium text-[10px] sm:text-xs text-center border-b md:border-b-0 md:border-r border-[#0077be]/40 last:border-0 transition-colors ${
                activeMenu === menu
                  ? "bg-[#0077be] text-white"
                  : "text-gray-700 dark:text-gray-200 bg-white dark:bg-[#16223d] hover:bg-blue-50 dark:hover:bg-white/10"
              }`}
            >
              {menu}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeMenu === "Single Destination" && <SingleDestinationSearch />}
        {activeMenu === "Search All Destinations" && <SearchAllDestinationsSearch />}
        {activeMenu === "Resort Name or Code" && <ResortNameOrCodeSearch />}
      </div>
    </div>
  );
};

export default DestinationSearchTabs;
