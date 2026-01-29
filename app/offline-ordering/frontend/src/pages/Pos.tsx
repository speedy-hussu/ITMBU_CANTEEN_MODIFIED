import Cart from "@/components/pos/cart";
import Menu from "@/components/pos/menu";
import { useEffect, useState } from "react";
import { toast } from "sonner";
// Importing your shared types as defined in our latest conversation
import type {
  WSMessage,
  UpdateStatusPayload,
} from "../../../../shared/types/websocket.types";
export default function Pos() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(true); // Start with error state until connection is established

  // WebSocket Connection Setup
  useEffect(() => {
    // Note:deviceId=POS_1 identifies this terminal to the Fastify backend
    const socket = new WebSocket(
      "ws://localhost:4000/ws/local?role=LOCAL&deviceId=POS_1",
    );

    socket.onopen = () => {
      console.log("✅ POS Connected");
      setIsConnecting(false);
      setConnectionError(false);
    };

    socket.onerror = () => {
      setConnectionError(true);
      setIsConnecting(false);
    };

    socket.onclose = () => {
      setConnectionError(true);
      setIsConnecting(false);
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  // Message Handler logic aligned with KDS Token system
  useEffect(() => {
    if (!ws) return;

    const handleStatusUpdate = (payload: UpdateStatusPayload) => {
      const { token, status } = payload;

      // 1. Early return if status is unknown
      if (status === "IN QUEUE") return;

      // 2. Map statuses to toast configurations
      const toastConfig = {
        COMPLETED: {
          message: `Order ${token} completed`,
          description: "Order is prepared. Call the student for pickup.",
          icon: "🔔",
          type: "success",
        },
        CANCELLED: {
          message: `Order ${token} cancelled`,
          description: "This order was removed by the kitchen staff.",
          icon: "🚫",
          type: "error",
        },
      };

      const config = toastConfig[status as keyof typeof toastConfig];

      if (config) {
        toast[config.type as "success" | "error"](config.message, {
          description: config.description,
          icon: config.icon,
          duration: status === "COMPLETED" ? 5000 : 3000,
        });
      }
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;

        switch (msg.event) {
          case "new_order":
            // Accessing _id here if needed for local tracking
            toast.success(`Order #${msg.payload.token} sent to kitchen!`, {
              icon: "🍳",
            });
            break;

          case "update_status":
            console.log("status update called", msg.payload);
            handleStatusUpdate(msg.payload as UpdateStatusPayload);
            break;
          case "order_ack":
            console.log("order ack called", msg.payload);
            toast.success(`Order ${msg.payload.token} send to kitchen`);
            break;

          default:
            console.log("Unhandled POS Event:", msg.event);
        }
      } catch (err) {
        console.error("Failed to parse POS message", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws]);

  if (isConnecting)
    return (
      <div className="min-h-screen text-white grid place-items-center text-4xl bg-gradient-primary">
        <div className="flex gap-5 items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-5 border-white border-t-transparent"></div>
          <span className="">Connecting to server...</span>
        </div>
      </div>
    );
  return (
    <div className="h-dvh w-full flex">
      <Menu />
      <Cart ws={ws} connectionError={connectionError} />
    </div>
  );
}
