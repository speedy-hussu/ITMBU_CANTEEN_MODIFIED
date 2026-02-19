import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOrderStore } from "@/store/orderStore";

export default function MyOrders() {
  const { orders } = useOrderStore();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: "green-500",
      "IN QUEUE": "yellow-500",
      CANCELLED: "red-500",
      "NOT RECEIVED": "gray-500",
    };
    return colors[status] || "blue-500";
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
            <Card
              key={order._id}
              className={`border-l-4 border-${getStatusColor(order.status)} shadow-sm p-0 `}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono font-bold text-lg">
                    #{order.token}
                  </span>
                  <Badge className={`bg-${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {order.items.map((item: any, idx: number) => {
                    const isItemRejected = item.status === "REJECTED";
                    const isOrderCancelled = order.status === "CANCELLED";
                    const isRejected = isItemRejected || isOrderCancelled;

                    return (
                      <div
                        key={idx}
                        className="flex justify-between items-start"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`${isRejected ? "line-through text-gray-400" : "text-gray-900 font-medium"}`}
                          >
                            {item.name} × {item.quantity}
                          </span>
                          {isRejected && (
                            <span className="text-xs text-red-600 font-bold uppercase">
                              {isOrderCancelled ? "Rejected" : "Item Rejected"}
                            </span>
                          )}
                        </div>
                        <span
                          className={`${isRejected ? "line-through text-gray-400" : "font-semibold"}`}
                        >
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-t space-y-2">
                  {order.refundedAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-600 font-medium">
                        Refunded Amount
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        ₹{order.refundedAmount}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className=" text-gray-500">Order Total</span>
                    <span className="text-lg font-bold text-orange-600">
                      ₹{order.totalAmount}
                    </span>
                  </div>
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
