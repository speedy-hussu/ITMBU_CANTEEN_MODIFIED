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

  private constructor() {
    this.connect();
  }

  static getInstance(): CloudBridge {
    if (!this.instance) this.instance = new CloudBridge();
    return this.instance;
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
      // Use this.rws.binaryType or just pass the instance.
      // Note: WSManager needs to be okay with the RWS wrapper.
      WSManager.getInstance().addClient(
        this.deviceId,
        this.role,
        this.rws as any,
      );
    });

    // Use { data } destructuring for cleaner code in Node.js
    this.rws.addEventListener("message", ({ data }) => {
      try {
        const message = JSON.parse(data.toString());
        // No need for 'await' if handleWSMessage isn't returning a promise
        // but keeping it safe based on your previous snippets.
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
    });
  }
}
