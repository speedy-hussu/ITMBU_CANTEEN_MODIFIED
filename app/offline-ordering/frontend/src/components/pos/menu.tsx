import { useEffect, useState } from "react";
import ItemCard from "./item-card";
import { Search, X } from "lucide-react";

import api from "@/api/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { BaseItem } from "@shared/types/item.types";
type CategoryType = "All" | "Product" | "Dish";
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
  

  //  const canteenItems: CanteenItem[] = [
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

  // ✅ MongoDB se items fetch
    useEffect(() => {
      const fetchItems = async () => {
        try {
          const res = await api.get<BaseItem[]>("/items/getItems");
          setMenuItems(res.data);
        } catch (err) {
          console.error("Error fetching items:", err);
          toast.error("Failed to fetch menu items");
        }
      };
      fetchItems();
    }, []);


  const categories: CategoryType[] = ["All", "Product", "Dish"];

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div>
        <h1 className="px-5 text-3xl font-bold my-2 text-white">ITMBU MENU</h1>

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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
          {menuItems
            .filter((item) => {
              return category === "All" ? true : item.category === category;
            })
            .filter((item) => {
              return item.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default Menu;
