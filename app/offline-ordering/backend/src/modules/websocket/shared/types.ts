import type { WebSocket } from "ws";

export type ClientRole = "KDS" | "LOCAL" | "CLOUD";

export interface ConnectedClient {
  socket: WebSocket;
  role: ClientRole;
  deviceId: string;
}

export interface ClientMeta {
  deviceId: string;
  role: ClientRole;
}
