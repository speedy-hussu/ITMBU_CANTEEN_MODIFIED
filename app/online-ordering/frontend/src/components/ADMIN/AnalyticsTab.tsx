import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Moon, Power } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
}

interface AnalyticsTabProps {
  analyticsData: AnalyticsData | null;
  canteenMode: "ONLINE" | "OFFLINE" | "DRAINING";
  isLoading: boolean;
  handleCanteenModeChange: (mode: "ONLINE" | "OFFLINE" | "DRAINING") => void;
}

export default function AnalyticsTab({
  analyticsData,
  canteenMode,
  isLoading,
  handleCanteenModeChange,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Business Analytics</h2>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white opacity-90 font-medium tracking-wide text-sm uppercase">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight">
              ₹{analyticsData?.totalRevenue || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white opacity-90 font-medium tracking-wide text-sm uppercase">
              Items Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight">
              {analyticsData?.totalItemsSold || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-white opacity-90 font-medium tracking-wide text-sm uppercase">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tracking-tight">
              {analyticsData?.totalOrders || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Canteen Mode Control */}
      <h2 className="text-xl font-bold text-gray-800 mt-10">Canteen Operations Control</h2>
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5 text-gradient-primary" />
            Canteen Mode Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleCanteenModeChange("ONLINE")}
              disabled={isLoading || canteenMode === "ONLINE"}
              className={`flex-1 ${
                canteenMode === "ONLINE"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <Store className="h-4 w-4 mr-2" />
              Online (Accepting)
            </Button>
            <Button
              onClick={() => handleCanteenModeChange("DRAINING")}
              disabled={isLoading || canteenMode === "DRAINING"}
              className={`flex-1 ${
                canteenMode === "DRAINING"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <Moon className="h-4 w-4 mr-2" />
              Draining (No New)
            </Button>
            <Button
              onClick={() => handleCanteenModeChange("OFFLINE")}
              disabled={isLoading || canteenMode === "OFFLINE"}
              className={`flex-1 ${
                canteenMode === "OFFLINE"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              <Power className="h-4 w-4 mr-2" />
              Offline (Closed)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
