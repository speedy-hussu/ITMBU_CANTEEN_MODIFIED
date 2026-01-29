import { WebSocket } from "ws";
import { handleNewOrder } from "../handlers/new-order.handler";
import { handleStatusUpdate } from "./order-status.handler";
import { ClientMeta } from "../shared/types";
import { WSMessage, WSEvent } from "@shared/types/websocket.types";

export async function handleWSMessage(
  socket: WebSocket,
  message: WSMessage,
  meta: ClientMeta,
) {
  const { event, payload } = message;

  console.log(`📩 [${meta.role}]: ${event}`);

  switch (event as WSEvent) {
    case "new_order":
      // Unified handler for POS and CLOUD orders
      return await handleNewOrder(socket, payload, meta);

    case "update_status":
      return await handleStatusUpdate(socket, payload, meta);

    case "ping":
      socket.send(
        JSON.stringify({ event: "pong", payload: { timestamp: Date.now() } }),
      );
      break;

    default:
      console.warn(`⚠️ Unknown message type: ${event} from ${meta.role}`);
  }
}
