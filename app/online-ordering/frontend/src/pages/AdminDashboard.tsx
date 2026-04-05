import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  LogOut,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Moon, AlertCircle } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import {
  fetchOrders,
  setCanteenMode,
  getCanteenMode,
  fetchAnalytics,
} from "@/api/api";

import AnalyticsTab from "@/components/ADMIN/AnalyticsTab";
import OrderHistoryTab from "@/components/ADMIN/OrderHistoryTab";
import MenuManagementTab from "@/components/ADMIN/MenuManagementTab";

interface Order {
  _id: string;
  token: string;
  status: "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED" | "NOT RECEIVED";
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    status: "PENDING" | "IN QUEUE" | "READY" | "CANCELLED" | "PREPARED" | "REJECTED";
  }>;
  userId: string;
  totalAmount: number;
  createdAt: string;
  refundedAmount?: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "menu">(
    "dashboard"
  );
  
  const [analyticsData, setAnalyticsData] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalItemsSold: number;
    ordersByStatus: Record<string, number>;
  } | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [canteenMode, setCanteenModeState] = useState<
    "ONLINE" | "OFFLINE" | "DRAINING"
  >("OFFLINE");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      toast.error("Access denied. Admin only.");
      navigate("/admin/login");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Fetch orders
  const fetchOrdersData = useCallback(async () => {
    try {
      const response = await fetchOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, []);

  // Fetch canteen mode
  const fetchCanteenMode = useCallback(async () => {
    try {
      const response = await getCanteenMode();
      setCanteenModeState(response.mode || "OFFLINE");
    } catch (error) {
      console.error("Failed to fetch canteen mode:", error);
    }
  }, []);

  // Fetch analytics
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const response = await fetchAnalytics();
      setAnalyticsData(response);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  }, []);

  // UseEffects for data fetching
  useEffect(() => {
    fetchCanteenMode();
  }, [fetchCanteenMode]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrdersData();
    }
  }, [activeTab, fetchOrdersData]);

  useEffect(() => {
    if (activeTab === "dashboard") {
      fetchAnalyticsData();
    }
  }, [activeTab, fetchAnalyticsData]);

  // Handle canteen mode toggle
  const handleCanteenModeChange = async (
    mode: "ONLINE" | "OFFLINE" | "DRAINING"
  ) => {
    try {
      setIsLoading(true);
      await setCanteenMode(mode);
      setCanteenModeState(mode);
      toast.success(`Canteen is now ${mode.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to change mode");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Canteen Mode Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Canteen:
                </span>
                <Badge
                  variant={
                    canteenMode === "ONLINE"
                      ? "default"
                      : canteenMode === "DRAINING"
                      ? "secondary"
                      : "destructive"
                  }
                  className={
                    canteenMode === "ONLINE"
                      ? "bg-green-500 hover:bg-green-600"
                      : canteenMode === "DRAINING"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {canteenMode === "ONLINE" && (
                    <Store className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode === "DRAINING" && (
                    <Moon className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode === "OFFLINE" && (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "dashboard"
                ? "tab-gradient-active text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "orders"
                ? "tab-gradient-active text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            Order History
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "menu"
                ? "tab-gradient-active text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu Management
          </button>
        </div>

        {/* Tab Content Routing */}
        <div className="pb-12">
          {activeTab === "dashboard" && (
            <AnalyticsTab
              analyticsData={analyticsData}
              canteenMode={canteenMode}
              isLoading={isLoading}
              handleCanteenModeChange={handleCanteenModeChange}
            />
          )}

          {activeTab === "orders" && (
            <OrderHistoryTab orders={orders} />
          )}

          {activeTab === "menu" && (
            <MenuManagementTab />
          )}
        </div>
      </div>
    </div>
  );
}
