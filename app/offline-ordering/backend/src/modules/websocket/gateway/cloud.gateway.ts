import { WebSocket } from "ws";
import { WSManager } from "../ws.manager";
import { handleWSMessage } from "../handlers/index.handler";

export class CloudBridge {
  private static instance: CloudBridge;
  private ws: WebSocket | null = null;
  private deviceId = "LOCAL_SERVER_01"; // Unique ID for this canteen
  private role = "ONLINE" as any;
  private retryGaps = [5000, 10000, 15000];
  private retryAttempt = 0;

  private constructor() {
    this.connect();
  }

  static getInstance(): CloudBridge {
    if (!this.instance) this.instance = new CloudBridge();
    return this.instance;
  }

  private connect() {
    // We connect to the Cloud URL (Atlas)
    const url = process.env.CLOUD_WS_URL || "ws://localhost:5000/ws/cloud";
    console.log(`🔄 Attempting to connect to: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log("☁️ Connected to Cloud Gateway");
      this.retryAttempt = 0;

      // 1. Register this socket in your local WSManager
      // This allows OrderService to send messages "OUT" to the cloud
      WSManager.getInstance().addClient(this.deviceId, this.role, this.ws!);
    });

    this.ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        // 2. Use your existing index.handler for "INCOMING" cloud orders
        // This is where the 'new_order' from cloud gets processed
        await handleWSMessage(this.ws!, message, {
          deviceId: this.deviceId,
          role: this.role,
        });
      } catch (err) {
        console.error("Cloud Message Error:", err);
      }
    });

    this.ws.on("close", () => {
      console.log("❌ Cloud connection closed");
      WSManager.getInstance().removeClient(this.deviceId);
      this.scheduleReconnect();
    });

    this.ws.on("error", (error: Error) => {
      console.error("❌ Cloud WebSocket error:", error.message);
      WSManager.getInstance().removeClient(this.deviceId);
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    const delay =
      this.retryGaps[Math.min(this.retryAttempt, this.retryGaps.length - 1)];
    setTimeout(() => {
      this.retryAttempt++;
      this.connect();
    }, delay);
  }
}
