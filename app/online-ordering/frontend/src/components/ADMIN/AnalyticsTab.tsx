import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
}

interface AnalyticsTabProps {
  analyticsData: AnalyticsData | null;
}

export default function AnalyticsTab({
  analyticsData,
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

    </div>
  );
}
