import { useEffect, useState } from "react";
import ItemCard from "./item-card";
import { Search, X, RefreshCw } from "lucide-react";

import { getTodayMenu } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { BaseItem } from "@shared/types/item.types";
type CategoryType = "All" | "Product" | "Dish";

// Hardcoded fallback menu items when network/fetch fails
const HARDCODED_MENU: BaseItem[] = [
  { _id: "1", name: "Samosa", price: 15, category: "Dish" },
  { _id: "2", name: "Paratha", price: 40, category: "Dish" },
  { _id: "3", name: "Smoodh", price: 15, category: "Product" },
  { _id: "4", name: "Frenchie", price: 60, category: "Dish" },
  { _id: "5", name: "Frooti", price: 10, category: "Product" },
  { _id: "6", name: "Chocobar", price: 20, category: "Product" },
  { _id: "7", name: "Nescafe", price: 40, category: "Product" },
  { _id: "8", name: "Paneer Chilli", price: 50, category: "Dish" },
  { _id: "9", name: "Poha", price: 20, category: "Dish" },
  { _id: "10", name: "Tea", price: 10, category: "Dish" },
  { _id: "11", name: "Maggie", price: 40, category: "Dish" },
  { _id: "12", name: "Masala Dosa", price: 35, category: "Dish" },
  { _id: "13", name: "Paneer Roll", price: 30, category: "Dish" },
  { _id: "14", name: "Chocolate Shake", price: 30, category: "Product" },
  { _id: "15", name: "Masala Cha", price: 15, category: "Dish" },
  { _id: "16", name: "Paneer Masala", price: 90, category: "Dish" },
  { _id: "17", name: "Candy Pie", price: 10, category: "Product" },
  { _id: "18", name: "Cola", price: 25, category: "Product" },
  { _id: "19", name: "Dud", price: 20, category: "Product" },
];
//  interface CanteenItem {
//    _id: string;
//    name: string;
//    price: number;
//    category: "Dish" | "Product";
//    synced?: boolean;
//    createdAt?: string;
//    updatedAt?: string;
//    v: number;
//  }
function Menu() {
  const [category, setCategory] = useState<CategoryType>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [menuItems, setMenuItems] = useState<BaseItem[]>([]);
  const [todayDay, setTodayDay] = useState<string>("");
  const [templates, setTemplates] = useState<
    Array<{ _id: string; name: string; mealType: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Fetch today's menu from local backend
  const fetchTodayMenuData = async () => {
    // Check network availability first
    if (!navigator.onLine) {
      console.warn("Browser reports offline - using fallback menu");
      setMenuItems(HARDCODED_MENU);
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      setTodayDay(today);
      setUseFallback(true);
      setIsLoading(false);
      toast.info("Offline mode - using default menu");
      return;
    }

    setIsLoading(true);
    setUseFallback(false);

    try {
      console.log(
        "Fetching today's menu from http://localhost:4000/api/menu/today",
      );

      // Add timeout to detect network issues quickly
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await getTodayMenu();
      clearTimeout(timeoutId);

      console.log("Menu response:", response);

      if (response.items && response.items.length > 0) {
        setMenuItems(response.items);
        setTodayDay(response.day || "");
        setTemplates(response.templates || []);
        setUseFallback(false);
        toast.success(
          `Loaded ${response.day}'s menu (${response.items.length} items)`,
        );
      } else {
        console.warn("No items in response, using fallback");
        setMenuItems(HARDCODED_MENU);
        setTodayDay(
          response.day ||
            new Date().toLocaleDateString("en-US", { weekday: "long" }),
        );
        setUseFallback(true);
        toast.info(
          `No menu templates for ${response.day}. Using default menu.`,
        );
      }
    } catch (err: any) {
      console.error("Error fetching today's menu:", err);
      console.error("Error details:", err.response?.data || err.message || err);

      // Fallback to hardcoded menu on any error
      setMenuItems(HARDCODED_MENU);
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
      setTodayDay(today);
      setUseFallback(true);

      if (
        err.name === "AbortError" ||
        err.code === "ECONNABORTED" ||
        err.code === "ERR_NETWORK"
      ) {
        toast.error("Cannot connect to local server. Using offline menu.");
      } else {
        toast.error("Failed to fetch menu. Using offline menu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayMenuData();
  }, []);
  //   {
  //     _id: "68c5cfe2af17ce21185a611f",
  //     name: "samosa",
  //     price: 15,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d072af17ce21185a6154",
  //     name: "paratha",
  //     price: 40,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d07caf17ce21185a6159",
  //     name: "smoodh",
  //     price: 15,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d099af17ce21185a6165",
  //     name: "frenchie",
  //     price: 60,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0a1af17ce21185a6169",
  //     name: "frooti",
  //     price: 10,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0aeaf17ce21185a6170",
  //     name: "chocobar",
  //     price: 20,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0bbaf17ce21185a6176",
  //     name: "nescafe",
  //     price: 40,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0cbaf17ce21185a617d",
  //     name: "paneer chilli",
  //     price: 50,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0daaf17ce21185a6184",
  //     name: "poha",
  //     price: 20,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0e4af17ce21185a618a",
  //     name: "tea",
  //     price: 10,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d0f3af17ce21185a6191",
  //     name: "maggie",
  //     price: 40,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d12daf17ce21185a61a8",
  //     name: "Masala Dosa",
  //     price: 35,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d141af17ce21185a61b1",
  //     name: "Paneer Roll",
  //     price: 30,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "68c5d16caf17ce21185a61c1",
  //     name: "Chocolate Shake",
  //     price: 30,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "690e5dc854b90525ccf0f457",
  //     name: "Masala cha",
  //     price: 15,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "690e5ddc54b90525ccf0f460",
  //     name: "paneer masala",
  //     price: 90,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "690e5dec54b90525ccf0f467",
  //     name: "candy pie",
  //     price: 10,
  //     category: "Product",
  //     v: 0,
  //   },
  //   {
  //     _id: "691f076c7e3e86ba4a0e6ed2",
  //     name: "dsdw",
  //     price: 2000,
  //     category: "Dish",
  //     v: 0,
  //   },
  //   {
  //     _id: "6930ebb2a6bd44c4f9ff4808",
  //     name: "bhaji",
  //     price: 120,
  //     category: "Dish",
  //     synced: true,
  //     createdAt: "2025-12-04T02:02:26.147Z",
  //     updatedAt: "2025-12-04T02:02:48.903Z",
  //     v: 0,
  //   },
  //   {
  //     _id: "6930ec22a6bd44c4f9ff4812",
  //     name: "soup",
  //     price: 20,
  //     category: "Dish",
  //     synced: true,
  //     createdAt: "2025-12-04T02:04:18.701Z",
  //     updatedAt: "2025-12-04T02:04:18.919Z",
  //     v: 0,
  //   },
  //   {
  //     _id: "6930ec3da6bd44c4f9ff481a",
  //     name: "cola",
  //     price: 25,
  //     category: "Product",
  //     synced: true,
  //     createdAt: "2025-12-04T02:04:45.706Z",
  //     updatedAt: "2025-12-04T02:04:49.052Z",
  //     v: 0,
  //   },
  //   {
  //     _id: "6930fe71b67d63bee3525e3b",
  //     name: "dud",
  //     price: 20,
  //     category: "Product",
  //     synced: true,
  //     createdAt: "2025-12-04T03:22:25.360Z",
  //     updatedAt: "2025-12-04T03:22:32.131Z",
  //     v: 0,
  //   },
  // ];

  const categories: CategoryType[] = ["All", "Product", "Dish"];

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div>
        {/* ✅ Header with Fetch Button */}
        <div className="px-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold my-2 text-white">ITMBU MENU</h1>
            {todayDay && (
              <p className="text-white/80 text-sm">
                {todayDay}'s Special Menu
                {useFallback && (
                  <span className="ml-2 text-yellow-300">(Offline Mode)</span>
                )}
              </p>
            )}
            {templates.length > 0 && !useFallback && (
              <div className="flex gap-1 mt-1">
                {templates.map((t) => (
                  <span
                    key={t._id}
                    className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full"
                  >
                    {t.mealType}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={fetchTodayMenuData}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Loading..." : "Fetch Latest"}
          </Button>
        </div>

        {/* ✅ Category buttons + Search bar */}
        <div className="px-5 flex flex-wrap items-center gap-2">
          {/* Category Badges */}
          <div className="flex items-center gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? "default" : "secondary"}
                className={`cursor-pointer text-sm px-4 py-2 transition-all ${
                  category === cat
                    ? "bg-white text-[#667eea] hover:bg-white/90"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
                onClick={() => {
                  setCategory(cat);
                  setSearchTerm("");
                }}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute text-white/70 z-10 top-1/2 left-3 transform -translate-y-1/2 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search Item"
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCategory("All");
              }}
              className="w-40 pl-9 pr-9 text-white placeholder:text-white/50 rounded-lg bg-white/20 border-2 border-transparent
             outline-none focus:border-white "
              value={searchTerm}
            />
            {searchTerm !== "" && (
              <X
                className="text-white absolute z-10 top-1/2 right-10 transform -translate-y-1/2 cursor-pointer hover:text-white/70 h-4 w-4"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>
      </div>

      {/* ✅ Items List */}
      <div
        className="overflow-y-auto p-5 mt-2 md:h-[calc(100dvh-100px)] h-[calc(100dvh-175px)]
        [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-thumb]:bg-white/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:hover:bg-white/60"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
            {menuItems
              .filter((item) => {
                return category === "All" ? true : item.category === category;
              })
              .filter((item) => {
                return item.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              })
              .map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Menu;
