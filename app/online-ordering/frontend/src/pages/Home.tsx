import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ItemCard from "@/components/STUDENT/item-card";
import { getTodayMenu } from "@/api/api";
import { toast } from "sonner";


const categories = ["All", "Dish", "Product"];

interface MenuItem {
  itemId: string;
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  isAvailable?: boolean;
  mealType?: string;
  templateName?: string;
  quantity?: number;
}

interface TodayMenuResponse {
  day: string;
  templates: Array<{
    _id: string;
    name: string;
    mealType: string;
    description?: string;
  }>;
  items: MenuItem[];
}

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [todayDay, setTodayDay] = useState<string>("");
  const [templates, setTemplates] = useState<TodayMenuResponse["templates"]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch today's menu from API
  useEffect(() => {
    const fetchTodayMenu = async () => {
      try {
        setIsLoading(true);
        const response = await getTodayMenu();
        setMenuItems(response.items || []);
        setTodayDay(response.day || "");
        setTemplates(response.templates || []);
      } catch (error) {
        console.error("Failed to fetch today's menu:", error);
        toast.error("Failed to load today's menu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayMenu();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary ">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm ">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                Canteen
              </h1>
              {todayDay && (
                <p className="text-sm text-gray-500">
                  {todayDay}'s Special Menu
                </p>
              )}
            </div>
            {templates.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Available for</p>
                <div className="flex gap-1 flex-wrap justify-end">
                  {templates.map((t) => (
                    <span
                      key={t._id}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full"
                    >
                      {t.mealType}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 rounded-lg"
            />
          </div>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap text-xs sm:text-sm ${
                  selectedCategory === cat && "btn-gradient-primary text-white"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="p-4 overflow-y-auto scrollbar-none ">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-white">
            <p className="text-lg font-medium">
              No menu available for {todayDay || "today"}
            </p>
            <p className="text-sm opacity-75">
              Check back later or contact admin
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
