// offline/backend/src/services/cloud-bridge.service.ts
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";
import { WSManager } from "../ws.manager";
import { handleWSMessage } from "../handlers/index.handler";
import { ClientRole } from "../shared/types";
import { CanteenMode, SystemStatus } from "src/types/types";

export class CloudBridge {
  private static instance: CloudBridge;
  private rws: ReconnectingWebSocket | null = null;
  private deviceId = "LOCAL_SERVER_01";
  private role: ClientRole = "CLOUD";
  private currentMode: CanteenMode = "OFFLINE";
  private constructor() {
    this.connect();
  }

  static getInstance(): CloudBridge {
    if (!this.instance) this.instance = new CloudBridge();
    return this.instance;
  }

  // Get current cloud connection status from real-time readyState
  public getCloudStatus(): boolean {
    return this.rws?.readyState === 1;
  }

  // Get full system status
  public getSystemStatus(): SystemStatus {
    return {
      isCloudConnected: this.getCloudStatus(),
      canteenMode: this.currentMode,
    };
  }

  // Update canteen mode and notify cloud + KDS
  public updateCanteenMode(mode: CanteenMode) {
    this.currentMode = mode;
    console.log(`🔄 Canteen mode updated to: ${mode}`);

    // Notify cloud about mode change
    if (this.rws && this.rws.readyState === 1) {
      this.rws.send(
        JSON.stringify({
          event: "canteen_status",
          payload: { mode },
        }),
      );
    }

    // Logic Gate: OFFLINE = close socket, ONLINE = reconnect if needed
    if (mode === "OFFLINE") {
      console.log("🛑 Closing Cloud Bridge - OFFLINE mode");
      this.rws?.close(1000, "GRACEFUL_SHUTDOWN");
    } else if (mode === "ONLINE" && this.rws && this.rws.readyState !== 1) {
      console.log("🟢 Reconnecting to Cloud - ONLINE mode");
      this.rws.reconnect();
    }
  }

  // Get current canteen mode
  public getCanteenMode(): CanteenMode {
    return this.currentMode;
  }

  private connect() {
    const url = process.env.CLOUD_WS_URL || "ws://localhost:5000/ws/bridge";

    // Custom WebSocket class that catches errors on underlying sockets
    // This prevents crashes when cloud server is sleeping
    class ErrorHandlingWebSocket extends WS {
      constructor(address: any, protocols?: any, options?: any) {
        super(address, protocols, options);

        // Catch errors on this underlying WebSocket instance
        this.on("error", (err: Error) => {
          // Silently ignore pre-connection close errors - RWS will retry
          if (this.readyState === WS.CONNECTING) {
            return;
          }
          console.error("Underlying WebSocket error:", err.message);
        });
      }
    }

    this.rws = new ReconnectingWebSocket(url, [], {
      WebSocket: ErrorHandlingWebSocket,
      connectionTimeout: 10000, // Increased for sleeping servers
      maxRetries: Infinity,
      minReconnectionDelay: 3000, // Faster initial retry
      maxReconnectionDelay: 60000,
      reconnectionDelayGrowFactor: 1.5,
    });

    this.rws.addEventListener("open", () => {
      console.log("☁️ Connected to Cloud Gateway via RWS");
      WSManager.getInstance().addClient(
        this.deviceId,
        this.role,
        this.rws as any,
      );
      // Update mode to ONLINE
      this.currentMode = "ONLINE";
      // Broadcast cloud_status to KDS
      WSManager.getInstance().broadcastToRole("KDS", {
        event: "cloud_status",
        payload: { connected: true },
      });
    });

    // Use { data } destructuring for cleaner code in Node.js
    this.rws.addEventListener("message", ({ data }) => {
      try {
        const message = JSON.parse(data.toString());
        handleWSMessage(this.rws as any, message, {
          deviceId: this.deviceId,
          role: this.role,
        });
      } catch (err) {
        console.error("Cloud Message Error:", err);
      }
    });

    this.rws.addEventListener("error", (err: any) => {
      console.error("❌ RWS Error:", err.error?.message || err.message);
    });

    this.rws.addEventListener("close", () => {
      console.log("❌ Cloud connection lost. RWS will handle retry.");
      WSManager.getInstance().removeClient(this.deviceId);
      // Broadcast cloud_status to KDS
      WSManager.getInstance().broadcastToRole("KDS", {
        event: "cloud_status",
        payload: { connected: false },
      });
    });
  }
}
