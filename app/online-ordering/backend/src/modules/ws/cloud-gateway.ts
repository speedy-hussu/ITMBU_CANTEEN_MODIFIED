// online/backend/src/modules/websocket/cloud.router.ts
import { FastifyInstance } from "fastify";
import { CloudWSManager } from "./ws-manager";
import { handleWSMessage } from "./handlers/index.handler";
import { ClientRole } from "./shared/types";

export async function registerCloudWS(app: FastifyInstance) {
  const manager = CloudWSManager.getInstance();

  // Unified logic for any incoming connection
  const setupSocket = (socket: any, id: string, role: ClientRole) => {
    manager.addClient(id, role, socket);

    socket.on("message", async (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWSMessage(socket, message, { id, role });
      } catch (e) {
        console.error(`Invalid JSON from ${id}`);
      }
    });

    socket.on("close", () => manager.removeClient(id));
  };
  // 1. BRIDGE ENDPOINT
  app.get("/ws/bridge", { websocket: true }, (socket, req) => {
    const canteenId = (req.query as any).canteenId || "MASTER_CANTEEN";
    setupSocket(socket, canteenId, "LOCAL_BRIDGE");
  });

  // 2. USER ENDPOINT
  app.get("/ws/user", { websocket: true }, (socket, req) => {
    const enrollmentId = (req.query as any).enrollmentId;
    if (!enrollmentId) return socket.close();
    setupSocket(socket, enrollmentId, "USER");
  });
}
