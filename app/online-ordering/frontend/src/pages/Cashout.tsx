import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { useOrderStore } from "@/store/orderStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/store/authStore";
import AppCartItem from "@/components/STUDENT/cart-item";

import type { PosOrderPayload, WSMessage, CanteenMode } from "@shared/types";

interface CartProps {
  ws: WebSocket | null;
  canteenMode: CanteenMode;
}

export default function Cashout({ ws, canteenMode }: CartProps) {
  const { cart, emptyCart, getCartTotal } = useCartStore();
  const { addOrder } = useOrderStore();
  const cartTotal = getCartTotal();
  const { user } = useAuthStore();
  if (!user) {
    toast.error("User not found", {
      description: "Please login to place an order",
    });
    return;
  }

  const placeOrder = () => {
    if (canteenMode === "DRAINING" || canteenMode === "OFFLINE") {
      toast.error(
        canteenMode === "DRAINING"
          ? "Kitchen is closing - no new orders"
          : "Kitchen is offline",
      );
      return;
    }

    // ✅ Check if cart is empty
    if (cart.length === 0) {
      toast.error("Cart is empty", {
        description: "Add items to your cart before placing an order",
      });
      return;
    }

    // ✅ Check if WebSocket is connected
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Not connected to server", {
        description: "Please check your internet connection",
      });
      return;
    }
    const orderToken = `${user.enrollmentId}-${Math.floor(
      Math.random() * 100 + 1,
    )}`;

    // ✅ Create ORDER (reusable)
    const order: PosOrderPayload = {
      token: orderToken,
      enrollmentId: user.enrollmentId,
      items: cart.map((item) => ({
        _id: item._id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
        quantity: Number(item.quantity),
      })),
      totalAmount: cartTotal,
    };

    // ✅ Store locally (Zustand)
    addOrder(order);

    // ✅ Wrap order for WebSocket using typed message builder
    const orderMessage: WSMessage = {
      event: "new_order",
      payload: order,
    };

    emptyCart();

    try {
      ws.send(JSON.stringify(orderMessage));
      console.log("📤 Order sent:", order);
    } catch (error) {
      toast.error("Failed to place order", {
        description: "Please try again",
      });
      console.error("Failed to send order:", error);
    }
  };

  return (
    <div className="pb-20 min-h-[calc(100dvh-65px)] bg-gradient-primary">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Cart & Payment
          </h1>
        </div>
      </div>

      <div className="p-4 min-h-[calc(100dvh-150px)] flex flex-col justify-between">
        {/* Your Order */}
        <div>
          {cart.length === 0 ? (
            <div className="p-8 text-center flex flex-col justify-center items-center min-h-[calc(100dvh-250px)]">
              <ShoppingCart className="w-30 h-30 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-300 text-xl">Your cart is empty</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100dvh-250px)] px-3">
              <div className="flex flex-col gap-2 overflow-y-auto">
                {cart.map((cartItem) => (
                  <AppCartItem item={cartItem} key={cartItem._id} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Proceed Button */}
        {cart.length > 0 && (
          <div>
            <Button
              disabled={canteenMode !== "ONLINE"}
              className={`w-full h-12 sm:h-14 text-base sm:text-lg font-semibold text-white transition-all ${
                canteenMode === "ONLINE"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={placeOrder}
            >
              {canteenMode === "ONLINE" ? (
                <>PAY ₹{cartTotal.toFixed(2)}</>
              ) : canteenMode === "DRAINING" ? (
                "Kitchen is closing - Orders paused"
              ) : (
                "Kitchen is Offline - Try later"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
