import { useEffect, useState, useMemo } from "react";
import { Search, Wifi, WifiOff, X } from "lucide-react";
import OrderCard from "@/components/kds/order-card";
import { useOrdersStore } from "@/store/orderStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/api/api";

import type {
  WSMessage,
  UpdateOrderStatusPayload,
  CanteenMode,
} from "../../../../shared/types/websocket.types";
import type { DbOrder } from "../../../../shared/types/order.types";
import { Button } from "@/components/ui/button";

export default function Orders() {
  const { orders, addOrder, updateOrder, setOrders } = useOrdersStore();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED"
  >("IN QUEUE");
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(true);
  const [canteenMode, setCanteenMode] = useState<CanteenMode>("OFFLINE");
  const [cloudStatus, setCloudStatus] = useState<boolean | null>(null);

  // Fetch orders via HTTP API
  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      if (res.data.success) {
        setOrders(res.data.data);
        console.log("[KDS] Orders fetched from DB:", res.data.data);
      }
    } catch (err) {
      console.error("[KDS] Failed to fetch orders:", err);
    }
  };

  // WebSocket Connection
  useEffect(() => {
    const socket = new WebSocket(
      "ws://localhost:4000/ws/local?role=KDS&deviceId=KDS_1",
    );

    socket.onopen = () => {
      setIsConnecting(false);
      setConnectionError(false);
      // Fetch orders from DB via HTTP on connection
      fetchOrders();
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
          case "order_update":
            const { token, status } = msg.payload as UpdateOrderStatusPayload;
            if (token) {
              // Update status without deleting/removing anything
              updateOrder(token, status);
            }
            break;
          case "cloud_status":
            setCloudStatus(msg.payload.connected);
            console.log("Cloud status updated:", msg.payload.connected);
            break;
          case "canteen_status":
            setCanteenMode(msg.payload.mode);
            console.log("Canteen mode updated:", msg.payload.mode);
            break;
        }
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, addOrder, updateOrder, setCanteenMode, setCloudStatus, setOrders]);

  // Toggle between ONLINE and OFFLINE
  // Backend decides if OFFLINE becomes DRAINING (when pending orders exist)
  const toggleCanteenMode = () => {
    if (!ws || connectionError) return;
    // ONLINE → OFFLINE, DRAINING → ONLINE, OFFLINE → ONLINE
    const newMode = canteenMode === "ONLINE" ? "OFFLINE" : "ONLINE";
    ws.send(
      JSON.stringify({ event: "canteen_toggle", payload: { mode: newMode } }),
    );
    console.log(`Requested switch to ${newMode} mode`);
  };

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
  const readyCount = orders.filter((o) => o.status === "READY").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;

  if (isConnecting) {
    return (
      <div className="min-h-screen text-white grid place-items-center text-4xl bg-gradient-primary">
        KDS INITIALIZING...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-primary text-white">
      <div className="flex justify-between p-3 ">
        <div className="flex gap-10 items-center">
          <h1 className="text-3xl font-bold">ITMBU KITCHEN</h1>
          <div className="flex flex-wrap items-center gap-5">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(
                  value as "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED",
                )
              }
              className="w-auto"
            >
              <TabsList className="bg-white/20 border-white/30">
                <TabsTrigger
                  value="IN QUEUE"
                  className="data-[state=active]:bg-white text-white data-[state=active]:text-[#667eea] relative"
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
                  value="READY"
                  className="data-[state=active]:bg-white text-white data-[state=active]:text-[#667eea] relative"
                >
                  READY
                  {readyCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white text-[#667eea] hover:bg-white"
                    >
                      {readyCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="DELIVERED"
                  className="data-[state=active]:bg-white text-white data-[state=active]:text-[#667eea] relative"
                >
                  DELIVERED
                  {deliveredCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white text-[#667eea] hover:bg-white"
                    >
                      {deliveredCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="CANCELLED"
                  className="data-[state=active]:bg-white text-white data-[state=active]:text-[#667eea] relative"
                >
                  CANCELLED
                  {cancelledCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-white text-[#667eea] hover:bg-white"
                    >
                      {cancelledCount}
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
        <div className="flex items-center gap-4">
          {/* Connection Status Group */}
          <div className="flex items-center gap-3 mr-2">
            {/* Local Backend WiFi */}
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-full ${
                  connectionError ? "bg-red-500/20" : "bg-green-500/20"
                }`}
                title={
                  connectionError
                    ? "Local Backend Disconnected"
                    : "Local Backend Connected"
                }
              >
                {connectionError ? (
                  <WifiOff className="w-4 h-4 text-red-300" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-300" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/70">
                Local
              </span>
            </div>

            {/* Cloud Backend WiFi */}
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-full ${
                  cloudStatus === true
                    ? "bg-green-500/20"
                    : cloudStatus === false
                      ? "bg-red-500/20"
                      : "bg-gray-500/20"
                }`}
                title={
                  cloudStatus === true
                    ? "Cloud Backend Connected"
                    : cloudStatus === false
                      ? "Cloud Backend Disconnected"
                      : "Checking..."
                }
              >
                {cloudStatus === true ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : cloudStatus === false ? (
                  <WifiOff className="w-4 h-4 text-red-300" />
                ) : (
                  <Wifi className="w-4 h-4 text-gray-300" />
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wider text-white/70">
                Cloud
              </span>
            </div>
          </div>

          {/* Mode Toggle Button */}
          <Button
            onClick={toggleCanteenMode}
            variant="outline"
            disabled={connectionError}
            className={`text-white disabled:text-white/50 disabled:bg-white/10 hover:bg-white/30 ${
              canteenMode === "ONLINE"
                ? "bg-green-500/30 border-green-400"
                : canteenMode === "DRAINING"
                  ? "bg-yellow-500/30 border-yellow-400"
                  : "bg-red-500/30 border-red-400"
            }`}
          >
            {canteenMode === "ONLINE"
              ? "ONLINE"
              : canteenMode === "DRAINING"
                ? "DRAINING"
                : "OFFLINE"}
          </Button>
        </div>
      </div>

      {activeTab === "IN QUEUE" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Pending Orders</h1>
          </div>
        </div>
      ) : activeTab === "READY" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Ready Orders</h1>
          </div>
        </div>
      ) : activeTab === "DELIVERED" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Delivered Orders</h1>
          </div>
        </div>
      ) : activeTab === "CANCELLED" && filteredOrders.length === 0 ? (
        <div className="h-[calc(100vh-180px)] grid place-items-center">
          <div className="flex flex-col justify-center items-center text-center">
            <h1 className="text-4xl font-bold">No Cancelled Orders</h1>
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
