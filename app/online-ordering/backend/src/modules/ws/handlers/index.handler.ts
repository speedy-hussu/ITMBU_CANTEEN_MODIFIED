// online/backend/src/modules/websocket/handlers/index.handler.ts
import { WebSocket } from "ws";
import { handleNewOrder } from "./new-order.handler";
import { handleOrderUpdate } from "./order-update.handler";
import { handleItemUpdate } from "./item-status.handler";
import { handleOrderAck } from "./order-ack.handler";
import { WSMessage } from "@shared/types/websocket.types";
import { ClientMeta } from "../shared/types";

export async function handleWSMessage(
  socket: WebSocket,
  message: WSMessage<any>,
  meta: ClientMeta,
) {
  const { event, payload } = message;

  console.log(`📩 [Cloud Gateway] From ${meta.role} (${meta.id}): ${event}`);

  switch (event) {
    case "new_order":
      return handleNewOrder(payload);

    case "order_ack":
      return handleOrderAck(payload);

    case "order_update":
      return handleOrderUpdate(payload);

    case "item_update":
      return handleItemUpdate(payload);

    case "ping":
      socket.send(
        JSON.stringify({ event: "pong", payload: { ts: Date.now() } }),
      );
      console.log("pong send to & recieved from Local");
      break;

    default:
      console.warn(`⚠️ Unknown event: ${event} from ${meta.role}`);
  }
}
