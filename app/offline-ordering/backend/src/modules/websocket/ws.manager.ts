import type { WebSocket } from "ws";
import { ClientRole, ConnectedClient } from "./shared/types";

export class WSManager {
  private static instance: WSManager;
  private clients: Map<string, ConnectedClient> = new Map();
  private pendingKdsOrders: any[] = [];

  static getInstance() {
    if (!this.instance) this.instance = new WSManager();
    return this.instance;
  }

  addClient(deviceId: string, role: ClientRole, socket: WebSocket) {
    // If device is already connected, close the old one to avoid 'ghosts'
    if (this.clients.has(deviceId)) {
      this.clients.get(deviceId)?.socket.close();
    }

    this.clients.set(deviceId, { deviceId, role, socket });
    console.log(`[WS Manager] ${role} connected. ID: ${deviceId}`);

    // If a KDS just connected, flush the memory cache immediately
    if (role === "KDS") {
      this.flushPendingOrders(socket);
    }
  }

  removeClient(deviceId: string) {
    this.clients.delete(deviceId);
    console.log(`[WS Manager] Device disconnected: ${deviceId}`);
  }
  // Broadcast to Role with Offline Memory Support
  broadcastToRole(role: string, message: any): boolean {
    const data = JSON.stringify(message);
    let delivered = false;

    this.clients.forEach((client) => {
      if (client.role === role && client.socket.readyState === 1) {
        client.socket.send(data);
        delivered = true;
      }
    });

    // If it's a new order and NO KDS received it, save to memory
    if (role === "KDS" && !delivered && message.event === "new_order") {
      console.log("[WS] KDS Offline. Saving order to memory cache...");
      this.pendingKdsOrders.push(message);
    }

    return delivered;
  }

  //Send all missed orders to the KDS once it's "Alive"
  private flushPendingOrders(socket: WebSocket) {
    if (this.pendingKdsOrders.length > 0) {
      console.log(
        `[WS] KDS back online. Flushing ${this.pendingKdsOrders.length} orders.`,
      );

      while (this.pendingKdsOrders.length > 0) {
        const msg = this.pendingKdsOrders.shift(); // Remove from memory as we send
        socket.send(JSON.stringify(msg));
      }
    }
  }
}
