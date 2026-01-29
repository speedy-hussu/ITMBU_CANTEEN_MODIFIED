import { useEffect, useState, useMemo } from "react";
import { Search, Wifi, WifiOff, X } from "lucide-react";
import OrderCard from "@/components/kds/order-card";
import { useOrdersStore } from "@/store/orderStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type {
  WSMessage,
  UpdateStatusPayload,
} from "../../../../shared/types/websocket.types";
import type { DbOrder } from "../../../../shared/types/order.types";

export default function Orders() {
  const { orders, addOrder, updateOrder } = useOrdersStore();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"IN QUEUE" | "COMPLETED">(
    "IN QUEUE",
  );
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(true); // Start with error state until connection is established

  // WebSocket Connection
  useEffect(() => {
    const socket = new WebSocket(
      "ws://localhost:4000/ws/local?role=KDS&deviceId=KDS_1",
    );

    socket.onopen = () => {
      setIsConnecting(false);
      setConnectionError(false);
    };

    socket.onerror = () => setConnectionError(true);
    socket.onclose = () => setConnectionError(true);

    setWs(socket);
    return () => socket.close();
  }, []);

  // Event Listener
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;

        switch (msg.event) {
          case "new_order":
            // Per your instructions: all orders (Local/Cloud) treated as new_order
            addOrder(msg.payload as DbOrder);
            break;

          case "update_status":
            const { token, status } = msg.payload as UpdateStatusPayload;
            if (token) {
              // Update status without deleting/removing anything
              updateOrder(token, status);
            }
            break;
        }
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, addOrder, updateOrder]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return (
      orders
        .filter((o) => o.status === activeTab)
        .filter((o) => (searchTerm ? o.token.includes(searchTerm) : true))
        // Newest on top/left
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
    );
  }, [orders, activeTab, searchTerm]);

  const pendingCount = orders.filter((o) => o.status === "IN QUEUE").length;
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;

  if (isConnecting) {
    return (
      <div className="min-h-screen text-white grid place-items-center text-4xl bg-gradient-primary">
        KDS INITIALIZING...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-primary text-white">
      <div className="flex h-15 gap-10 p-3  items-center">
        <div className="flex items-center gap-2">
          {connectionError ? (
            <WifiOff className="text-red-300" />
          ) : (
            <Wifi className="text-green-300" />
          )}
          <h1 className="text-3xl font-bold">ITMBU KITCHEN</h1>
        </div>
        <div className="flex flex-wrap items-center gap-5 ">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "IN QUEUE" | "COMPLETED")
            }
            className="w-auto"
          >
            <TabsList className="bg-white/20 border-white/30">
              <TabsTrigger
                value="IN QUEUE"
                className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] relative"
              >
                IN QUEUE
                {pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-[#667eea] hover:bg-white"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="COMPLETED"
                className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] relative"
              >
                COMPLETED
                {completedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white text-[#667eea] hover:bg-white"
                  >
                    {completedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute z-10 top-1/2 left-3 transform -translate-y-1/2 text-white/70" />
            <Input
              type="text"
              placeholder="Search Order"
              value={searchTerm}
              className="pl-10 pr-10 bg-white/20 border-2 border-white/30 text-white placeholder:text-white/70 focus-visible:ring-white focus-visible:border-white"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                className="cursor-pointer absolute z-10 top-1/2 right-3 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>
      </div>

      {activeTab === "IN QUEUE" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Pending Orders</h1>
          </div>
        </div>
      ) : activeTab === "COMPLETED" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Completed Orders</h1>
          </div>
        </div>
      ) : (
        <div
          className="h-[calc(100vh-100px)] overflow-y-auto
          grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]
          gap-6 px-5 pb-5
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-thumb]:bg-white/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:hover:bg-white/60"
        >
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              ws={!connectionError ? ws : null}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
}
