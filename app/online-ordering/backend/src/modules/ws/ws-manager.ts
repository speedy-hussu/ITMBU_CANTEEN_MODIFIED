import { WebSocket } from "ws";
import { ClientRole } from "./shared/types";
import { WSEvent } from "@shared/types";

interface CloudClient {
  socket: WebSocket;
  role: ClientRole;
  id: string;
  lastSeen: number;
}

export class CloudWSManager {
  private static instance: CloudWSManager;
  private clients = new Map<string, CloudClient>();
  private offlineCache = new Map<string, any[]>();

  // 🚩 Heartbeat timer reference
  private bridgeHeartbeat: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): CloudWSManager {
    if (!this.instance) this.instance = new CloudWSManager();
    return this.instance;
  }

  addClient(id: string, role: ClientRole, socket: WebSocket) {
    // 🚩 Initialize lastSeen with current time
    this.clients.set(id, {
      socket,
      role,
      id,
      lastSeen: Date.now(),
    });
    console.log(`[WS Manager] ${role} connected. ID: ${id}`);

    if (role === "USER") {
      this.sendToClient(id, "canteen_status", {
        online: this.isBridgeConnected(),
      });
      this.flushOfflineCache(id);
    }

    if (role === "LOCAL_BRIDGE") {
      this.broadcastToRole("USER", "canteen_status", { online: true });

      // 🚩 Start the heartbeat only if it's not already running
      if (!this.bridgeHeartbeat) {
        console.log("💓 Local Bridge connected. Starting heartbeat...");
        this.startBridgeHeartbeat();
      }
    }
  }

  // 🚩 Call this from your message handler when a 'pong' is received
  updateLastSeen(id: string) {
    const client = this.clients.get(id);
    if (client) {
      client.lastSeen = Date.now();
    }
  }

  private startBridgeHeartbeat() {
    const PING_INTERVAL = 15000; // 15s
    const TIMEOUT_LIMIT = 35000; // 35s

    this.bridgeHeartbeat = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((client, id) => {
        // We only care about checking the bridge
        if (client.role === "LOCAL_BRIDGE") {
          if (now - client.lastSeen > TIMEOUT_LIMIT) {
            console.log(`💀 Bridge ${id} timed out. Terminating.`);
            client.socket.terminate(); // This triggers removeClient automatically
            return;
          }

          if (client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify({ event: "ping" }));
          }
        }
      });
    }, PING_INTERVAL);
  }

  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client?.role === "LOCAL_BRIDGE") {
      this.broadcastToRole("USER", "canteen_status", { online: false });

      // 🚩 Cleanup: Stop heart if no more bridges are connected
      const hasOtherBridge = Array.from(this.clients.values()).some(
        (c) => c.role === "LOCAL_BRIDGE" && c.id !== id,
      );

      if (!hasOtherBridge && this.bridgeHeartbeat) {
        clearInterval(this.bridgeHeartbeat);
        this.bridgeHeartbeat = null;
        console.log("🛑 No bridges left. Heartbeat stopped.");
      }
    }
    this.clients.delete(id);
  }

  sendToClient(id: string, event: WSEvent, payload: any) {
    const client = this.clients.get(id);

    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(
        JSON.stringify({
          event,
          payload,
          timestamp: Date.now(),
        }),
      );
    } else {
      // If student is not online, store the update for later
      this.cacheMessage(id, event, payload);
    }
  }

  private cacheMessage(id: string, event: WSEvent, payload: any) {
    // We only care about caching order-related updates
    const cacheableEvents: WSEvent[] = [
      "order_update",
      "item_update",
      "new_order",
    ];
    if (!cacheableEvents.includes(event)) return;

    const existing = this.offlineCache.get(id) || [];
    this.offlineCache.set(id, [...existing, { event, payload }]);
    console.log(`💾 Cached ${event} for offline student: ${id}`);
  }

  private flushOfflineCache(id: string) {
    const pending = this.offlineCache.get(id);
    if (pending && pending.length > 0) {
      console.log(
        `📦 Delivering ${pending.length} missed messages to student: ${id}`,
      );
      pending.forEach((msg) => this.sendToClient(id, msg.event, msg.payload));
      this.offlineCache.delete(id);
    }
  }

  isBridgeConnected(): boolean {
    return Array.from(this.clients.values()).some(
      (c) => c.role === "LOCAL_BRIDGE",
    );
  }

  getBridgeId(): string | undefined {
    return Array.from(this.clients.values()).find(
      (c) => c.role === "LOCAL_BRIDGE",
    )?.id;
  }

  broadcastToRole(role: ClientRole, event: WSEvent, payload: any) {
    const message = JSON.stringify({ event, payload });
    this.clients.forEach((client) => {
      if (client.role === role && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  }
}
