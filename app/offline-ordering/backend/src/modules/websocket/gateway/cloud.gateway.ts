// offline/backend/src/services/cloud-bridge.service.ts
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";
import { WSManager } from "../ws.manager";
import { handleWSMessage } from "../handlers/index.handler";
import { ClientRole } from "../shared/types";

export class CloudBridge {
  private static instance: CloudBridge;
  private rws: ReconnectingWebSocket | null = null;
  private deviceId = "LOCAL_SERVER_01";
  private role: ClientRole = "CLOUD";
  private isManuallyPaused = false;
  private constructor() {
    this.connect();
  }

  static getInstance(): CloudBridge {
    if (!this.instance) this.instance = new CloudBridge();
    return this.instance;
  }

  // Get current cloud connection status
  public getCloudStatus(): boolean {
    const isPaused = this.isManuallyPaused;
    const isConnected = !isPaused && this.rws?.readyState === 1;
    return isConnected;
  }

  // Toggle cloud sync on/off
  public toggleCloudSync() {
    // 1. Invert the state
    this.isManuallyPaused = !this.isManuallyPaused;

    if (this.isManuallyPaused) {
      // 2. If now paused, close the connection
      console.log("🛑 Action: Manual Disconnect");
      this.rws?.close(1000, "KDS_MANUAL_OFFLINE");
    } else {
      // 3. If now unpaused, reconnect
      console.log("🟢 Action: Manual Reconnect");
      if (this.rws) {
        this.rws.reconnect();
      } else {
        this.connect();
      }
    }

    // 4. Return the new state so the KDS UI can update immediately
    return this.isManuallyPaused;
  }
  private connect() {
    const url = process.env.CLOUD_WS_URL || "ws://localhost:5000/ws/bridge";

    this.rws = new ReconnectingWebSocket(url, [], {
      WebSocket: WS,
      connectionTimeout: 5000,
      maxRetries: Infinity,
      minReconnectionDelay: 5000,
      maxReconnectionDelay: 60000,
      reconnectionDelayGrowFactor: 1.3,
    });

    this.rws.addEventListener("open", () => {
      console.log("☁️ Connected to Cloud Gateway via RWS");
      WSManager.getInstance().addClient(
        this.deviceId,
        this.role,
        this.rws as any,
      );
      (this.rws as any).send(
        JSON.stringify({ event: "cloud_status", payload: { connected: true } }),
      );
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

      // Notify about cloud disconnection
      if (this.rws && this.rws.readyState === 1) {
        (this.rws as any).send(
          JSON.stringify({
            event: "cloud_status",
            payload: { connected: false },
          }),
        );
      }
    });
  }
}
