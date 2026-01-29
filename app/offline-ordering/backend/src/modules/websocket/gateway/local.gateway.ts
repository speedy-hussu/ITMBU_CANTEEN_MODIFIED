import { FastifyInstance } from "fastify";
import { WSManager } from "../ws.manager";
import { ClientRole } from "../shared/types";
import { handleWSMessage } from "../handlers/index.handler";

export async function registerLocalGateway(fastify: FastifyInstance) {
  fastify.get("/ws/local", { websocket: true }, (socket, req) => {
    // 1. Extract identification from URL: /local?role=KDS&deviceId=TAB_01
    const { role, deviceId } = req.query as {
      role: ClientRole;
      deviceId: string;
    };

    if (!role || !deviceId) {
      console.error("Connection rejected: Missing role or deviceId");
      socket.close(1008, "Missing identification");
      return;
    }

    // 2. Register the device
    const wsManager = WSManager.getInstance();
    wsManager.addClient(deviceId, role, socket);

    // 3. Handle incoming messages
    socket.on("message", async (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        // Pass the socket AND deviceId to the handler for easy ACKing
        await handleWSMessage(socket, message, { deviceId, role });
      } catch (err) {
        console.error("Invalid JSON received");
      }
    });

    // 4. Cleanup on disconnect
    socket.on("close", () => {
      wsManager.removeClient(deviceId);
    });
  });
}
