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
  const { updateOrder, toggleItemChecked, removeOrder } = useOrdersStore();

  const isCompleted = order.status === "COMPLETED";

  // Directly use the order prop - Zustand's state management ensures this is reactive
  const allChecked =
    order.items.length > 0 && order.items.every((item) => item.checked);
  const canComplete = !isCompleted && allChecked;

  const handleDone = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      toast.error("Kitchen Server Offline");
      return;
    }

    // 1. Update local store by token
    updateOrder(order.token, "COMPLETED");

    // 2. Notify backend using the token
    ws.send(
      JSON.stringify({
        event: "update_status",
        payload: {
          _id: order._id,
          status: "COMPLETED",
        },
      }),
    );

    toast.success(`Order #${order.token} is ready!`);
  };

  const handleCancel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Remove from local store
    removeOrder(order.token);

    // Notify backend
    ws.send(
      JSON.stringify({
        event: "update_status",
        payload: { _id: order._id, status: "CANCELLED" },
      }),
    );

    toast.error(`Order #${order.token} removed`);
  };

  return (
    <Card
      className="text-[#333] relative h-65 flex flex-col gap-0 justify-between bg-white p-3 
    rounded-xl  transition duration-300 ease-in-out shadow-sm border"
    >
      <div>
        <h1 className="text-center text-2xl font-bold">#{order.token}</h1>

        {order.status === "COMPLETED" ? null : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <X className="absolute text-xl top-2 right-2 text-red-500 cursor-pointer hover:text-red-600 transition-colors" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove order #{order.token}? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <div
          className="max-h-40 overflow-y-auto 
          [&::-webkit-scrollbar]:w-1 
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div className="rounded-lg overflow-hidden mr-1">
            {order.items.map((item: any, index: number) => (
              <CardItem
                key={index}
                name={item.name}
                qty={item.quantity}
                checked={
                  order.status !== "COMPLETED" ? (item.checked ?? false) : false
                }
                onCheck={
                  order.status !== "COMPLETED"
                    ? () => toggleItemChecked(order.token, index)
                    : () => {}
                }
                disabled={order.status === "COMPLETED"}
              />
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] 
            hover:from-[#5a6fd8] hover:to-[#6a3f8f] text-white font-semibold"
        disabled={!canComplete}
        onClick={handleDone}
      >
        {isCompleted ? "✓ Completed" : "Mark as Done"}
      </Button>
    </Card>
  );
}
