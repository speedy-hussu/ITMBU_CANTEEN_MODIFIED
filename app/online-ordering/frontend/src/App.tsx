import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";

// Stores
import { useAuthStore } from "./store/authStore";
import { useOrderStore } from "./store/orderStore";

// Components & Pages
import Login from "./pages/Login";
import Home from "./pages/Home";
import Cashout from "./pages/Cashout";
import MyOrders from "./pages/MyOrders";
import UserProfile from "./pages/Profile";
import Nav from "./components/STUDENT/Nav";

// Types
import { type WSMessage } from "@shared/types/websocket.types";
import { getMe, logoutUser } from "./api/api";

const queryClient = new QueryClient();

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [, setConnectionError] = useState(false);
  const [kdsOnline, setKdsOnline] = useState(false);

  // Zustand State
  const { user } = useAuthStore();
  const { updateStatus } = useOrderStore();
  const isAuthenticated = !!user;

  // 1. Authentication validation Refined
  useEffect(() => {
    const validateAuth = async () => {
      // Only validate if we THINK we are authenticated
      if (isAuthenticated) {
        try {
          const response = await getMe();
          // If the server returns a user, ensure the store is synced
          if (response.user) {
            console.log("✅ Session verified");
            // Optional: useAuthStore.getState().login(response.user);
          }
        } catch (error) {
          console.error("❌ Session expired, cleaning up...");

          // 1. Clear Zustand store first
          useAuthStore.getState().logout();

          // 2. Call backend logout to clear cookies
          await logoutUser();

          // 3. Instead of reload, let Navigate handles the redirect
          toast.error("Session expired. Please login again.");
        }
      }
    };

    validateAuth();
  }, [isAuthenticated]);
  // 1. WebSocket Lifecycle Management
  useEffect(() => {
    if (!isAuthenticated) {
      if (ws) {
        ws.close(1000, "Logout");
        setWs(null);
      }
      return;
    }

    if (ws) return; // Prevent duplicate connections

    setIsConnecting(true);

    const enrollmentId = user?.enrollmentId;
    const socket = new WebSocket(
      `ws://localhost:5000/ws/user?enrollmentId=${enrollmentId}`,
    );
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnecting(false);
      setConnectionError(false);
    };

    socket.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as WSMessage;
        if (!data?.event) return;

        // Inside App.tsx -> socket.onmessage
        console.log(msg.data);
        switch (data.event) {
          case "canteen_status":
            setKdsOnline(data.payload.online);
            toast[data.payload.online ? "success" : "warning"](
              data.payload.online ? "Kitchen is online" : "Kitchen is offline",
            );
            break;

          case "order_ack":
            console.log(data.payload);
            if (data.payload.success) {
              toast.success("Order sent to kitchen!");
            }
            const status =
              data.payload.success == true ? "IN QUEUE" : "NOT RECEIVED";
            updateStatus({
              token: data.payload.token,
              status,
            });

            break;

          case "order_update":
            // Standard order-level update (PREPARING, COMPLETED, etc.)
            console.log(data.payload);
            updateStatus({
              token: data.payload.token,
              status: data.payload.status,
            });
            toast.info(data.payload.message);
            break;

          case "item_update":
            console.log(data.payload);
            updateStatus({
              token: data.payload.token,
              itemId: data.payload.itemId,
              status: data.payload.status,
            });

            if (data.payload.status === "REJECTED") {
              toast.error(
                `Rejected: ${data.payload.itemName || "An item"} was unavailable.`,
              );
            }
            break;

          case "pong":
            break;

          default:
            console.log("Unknown event:", data.event);
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socket.onerror = () => {
      setIsConnecting(false);
      setConnectionError(true);
    };

    socket.onclose = () => {
      setWs(null);
      setIsConnecting(false);
      setKdsOnline(false);

      // Auto-reconnect after 3 seconds if still authenticated
      if (isAuthenticated) {
        setTimeout(() => {
          console.log("Attempting reconnection...");
        }, 3000);
      }
    };

    setWs(socket);

    return () => {
      // Keep socket alive during navigation, only close on logout/unmount
    };
  }, [isAuthenticated, ws, updateStatus]);

  // Loading Screen for WebSocket initialization
  if (isAuthenticated && isConnecting) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">
            Connecting to Kitchen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-[calc(100dvh-260px)] w-full max-w-3xl mx-auto px-4 pb-20">
          <Routes>
            {/* Public Route */}
            <Route
              path="/login"
              element={
                !isAuthenticated ? <Login /> : <Navigate to="/" replace />
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Home /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/cart"
              element={
                isAuthenticated ? (
                  <Cashout ws={ws} kdsOnline={kdsOnline} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/orders"
              element={
                isAuthenticated ? (
                  <MyOrders />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <UserProfile />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Toaster position="top-center" richColors />
        {isAuthenticated && <Nav kdsOnline={kdsOnline} />}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
