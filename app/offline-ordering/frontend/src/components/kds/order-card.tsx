import { toast } from "sonner";
import { useOrdersStore } from "@/store/orderStore";
import type { KdsOrderPayload } from "@shared/types/order.types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CardItem from "./card-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

interface Props {
  order: KdsOrderPayload;
  ws: WebSocket | null;
}

export default function OrderCard({ order, ws }: Props) {
  const { updateOrder, toggleItemStatus, removeOrder, updateItemStatus } =
    useOrdersStore();

  const isCompleted = order.status === "COMPLETED";

  // 1. Logic: Order can be "Done" if all non-rejected items are "PREPARED"
  const activeItems = order.items.filter((item) => item.status !== "REJECTED");
  const allPrepared =
    activeItems.length > 0 &&
    activeItems.every((item) => item.status === "PREPARED");
  const canComplete = !isCompleted && allPrepared;

  /**
   * Finalizes the order and notifies the backend.
   */
  const handleDone = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Kitchen Server Offline");
      return;
    }

    // Update local state
    updateOrder(order._id, "COMPLETED");

    // Notify backend
    ws.send(
      JSON.stringify({
        event: "order_update",
        payload: {
          _id: order._id,
          status: "COMPLETED",
        },
      }),
    );
    toast.success(`Order #${order.token} marked as Ready`);
  };

  /**
   * Completely removes the order from KDS (Cancelled).
   */
  const handleCancel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    removeOrder(order._id);

    ws.send(
      JSON.stringify({
        event: "order_update",
        payload: {
          _id: order._id,
          status: "CANCELLED",
        },
      }),
    );

    toast.error(`Order #${order.token} cancelled`);
  };

  /**
   * Rejects a single item and triggers the refund notification flow.
   */
  const handleRejectItem = (itemId: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Kitchen Server Offline");
      return;
    }

    // Update local state immediately
    updateItemStatus(order._id, itemId, "REJECTED");

    // Send item update event
    ws.send(
      JSON.stringify({
        event: "item_update",
        payload: {
          orderId: order._id,
          itemId: itemId,
          status: "REJECTED",
        },
      }),
    );

    toast.info("Item rejected - Notification sent to POS");
  };

  return (
    <Card
      className="text-[#333] relative h-72 flex flex-col justify-between bg-white p-4 
    rounded-xl transition duration-300 ease-in-out shadow-sm border"
    >
      <div>
        {/* Header Section */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-black">#{order.token}</h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
              order.source === "CLOUD"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {order.source}
          </span>
        </div>

        {/* Cancel Order Icon (X) */}
        {!isCompleted && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <X className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-red-500 transition-colors" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Entire Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove Token #{order.token} from the KDS. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-red-500"
                >
                  Confirm Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Scrollable Items List */}
        <div
          className="max-h-40 overflow-y-auto pr-1 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-thumb]:bg-gray-200 
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="flex flex-col gap-1">
            {order.items.map((item) => (
              <CardItem
                key={item._id}
                name={item.name}
                qty={item.quantity}
                status={item.status}
                onCheck={() => toggleItemStatus(order._id, item._id)}
                onReject={() => handleRejectItem(item._id)}
                disabled={isCompleted}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] 
            hover:from-[#5a6fd8] hover:to-[#6a3f8f] text-white font-semibold"
        disabled={!canComplete}
        onClick={handleDone}
      >
        {isCompleted ? "✓ Order Ready" : "Mark as Done"}
      </Button>
    </Card>
  );
}
