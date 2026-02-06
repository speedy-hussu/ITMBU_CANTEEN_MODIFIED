import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderStore } from "@/store/orderStore";

export default function MyOrders() {
  const { orders } = useOrderStore();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "bg-green-500",
      "IN QUEUE": "bg-yellow-500",
      CANCELLED: "bg-red-500",
      "NOT RECEIVED": "bg-gray-500",
    };
    return colors[status] || "bg-blue-500";
  };

  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary">
      <div className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Order History
        </h1>
      </div>

      {orders ? (
        <div className="p-4 grid md:grid-cols-2 gap-3 sm:gap-4">
          {orders.map((order) => (
            <Card key={order._id} className={`border-l-4  shadow-sm`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono font-bold text-lg">
                    #{order.token}
                  </span>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {order.items.map((item: any, idx: number) => {
                    const isRejected = item.status === "REJECTED";

                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-start"
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-sm ${isRejected ? "line-through text-gray-400" : "text-gray-900 font-medium"}`}
                          >
                            {item.name} × {item.quantity}
                          </span>
                          {isRejected && (
                            <span className="text-[10px] text-red-600 font-bold uppercase">
                              Item Rejected
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-sm ${isRejected ? "line-through text-gray-400" : "font-semibold"}`}
                        >
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">Order Total</span>
                  <span className="text-lg font-bold text-orange-600">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>No Orders</div>
      )}
    </div>
  );
}
