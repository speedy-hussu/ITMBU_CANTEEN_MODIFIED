import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package } from "lucide-react";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  status: "PENDING" | "IN QUEUE" | "READY" | "CANCELLED" | "PREPARED" | "REJECTED";
}

interface Order {
  _id: string;
  token: string;
  status: "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED" | "NOT RECEIVED";
  items: OrderItem[];
  userId: string;
  totalAmount: number;
  createdAt: string;
  refundedAmount?: number;
}

interface OrderHistoryTabProps {
  orders: Order[];
}

type OrderFilter = "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED";

export default function OrderHistoryTab({ orders }: OrderHistoryTabProps) {
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("IN QUEUE");

  const filteredOrders = orders.filter((o) => o.status === orderFilter);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
        {/* We can potentially add date pickers or export buttons here in the future */}
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm p-1 overflow-x-auto scrollbar-none border">
        {(["IN QUEUE", "READY", "DELIVERED", "CANCELLED"] as OrderFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setOrderFilter(status)}
              className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${
                orderFilter === status
                  ? "bg-gray-900 text-white shadow-md transform scale-[1.02]"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()} (
              {orders.filter((o) => o.status === status).length})
            </button>
          )
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            <Package className="h-16 w-16 mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-xl font-medium text-gray-700">
              No {orderFilter.toLowerCase()} orders
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Historical orders will appear here
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order._id}
              className="border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
            >
              <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                       Order #{order.token}
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={order.status === "DELIVERED" ? "default" : "secondary"}
                    className={`uppercase text-[10px] font-bold tracking-wider px-2 py-1 ${
                      order.status === "DELIVERED"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : order.status === "IN QUEUE"
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : order.status === "READY"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ScrollArea className="h-44 pr-4 -mr-4 mb-4">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-gray-800 text-sm group-hover:text-purple-600 transition-colors line-clamp-2">
                            {item.name}
                          </p>
                          <p className="font-bold text-gray-700 text-sm whitespace-nowrap ml-2">
                            ₹{item.price}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-medium text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-md">
                            Qty: {item.quantity}
                          </p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                item.status === "CANCELLED" || item.status === "REJECTED"
                                  ? "text-red-500"
                                  : item.status === "READY" || item.status === "PREPARED"
                                  ? "text-green-500"
                                  : item.status === "IN QUEUE"
                                  ? "text-amber-500"
                                  : "text-gray-500"
                              }`}>
                            • {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex flex-col gap-1 pt-4 border-t border-gray-100 mt-2">
                   <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Amount</p>
                      <p className="font-black text-xl text-gray-900">
                        ₹{order.totalAmount}
                      </p>
                   </div>
                   {order.refundedAmount ? (
                     <div className="flex items-center justify-between mt-1 p-2 bg-red-50 rounded-md">
                       <p className="text-xs text-red-600 font-semibold">Refunded</p>
                       <p className="text-sm font-bold text-red-600">-₹{order.refundedAmount}</p>
                     </div>
                   ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
