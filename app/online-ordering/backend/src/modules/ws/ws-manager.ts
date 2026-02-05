// online/backend/src/modules/websocket/ws.manager.ts
import { WebSocket } from "ws";
import { ClientRole } from "./shared/types";
import { WSEvent } from "@shared/types";

interface CloudClient {
  socket: WebSocket;
  role: ClientRole;
  id: string; // enrollmentId for Students, CanteenID for Bridge
}

export class CloudWSManager {
  private static instance: CloudWSManager;
  private clients = new Map<string, CloudClient>();

  // Cache: enrollmentId -> Array of { event, payload }
  private offlineCache = new Map<string, any[]>();

  private constructor() {}

  static getInstance(): CloudWSManager {
    if (!this.instance) this.instance = new CloudWSManager();
    return this.instance;
  }

  /**
   * Registers a client and handles initial logic like cache flushing
   */
  addClient(id: string, role: ClientRole, socket: WebSocket) {
    this.clients.set(id, { socket, role, id });

    if (role === "USER") {
      // 1. Immediately send current canteen status to the new student
      this.sendToClient(id, "canteen_status", {
        online: this.isBridgeConnected(),
      });

      // 2. Deliver any missed notifications (Orders ready, etc.)
      this.flushOfflineCache(id);
    }

    if (role === "LOCAL_BRIDGE") {
      // Notify all connected students that the kitchen is now open
      this.broadcastToRole("USER", "canteen_status", { online: true });
    }
  }

  /**
   * Cleans up client and notifies students if the bridge goes down
   */
  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client?.role === "LOCAL_BRIDGE") {
      this.broadcastToRole("USER", "canteen_status", { online: false });
    }
    this.clients.delete(id);
  }

  /**
   * Core delivery logic: Sends to socket or saves to cache
   */
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
