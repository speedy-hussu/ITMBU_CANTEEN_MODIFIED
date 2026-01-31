import { ItemService } from "src/modules/item/item.service";
import { ClientMeta } from "../shared/types";
import {
  UpdateItemStatusPayload,
  WSMessage,
  ErrorPayload,
} from "@shared/types/websocket.types";
import type { WebSocket } from "ws";

export async function handleItemStatusUpdate(
  socket: WebSocket,
  payload: UpdateItemStatusPayload,
  meta: ClientMeta,
) {
  console.log("handleItemUpdate called:", { payload, meta });

  // 1. SECURITY: Only KDS (Chef) can reject or change item status
  if (meta.role !== "KDS") {
    console.log("Unauthorized item update attempt from:", meta.role);
    const errorMsg: WSMessage<ErrorPayload> = {
      event: "error",
      payload: {
        message: "Unauthorized: Only Chef can update item status",
        code: "UNAUTHORIZED",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  // 2. VALIDATION: Ensure we have the Order, the specific Item, and the new Status
  if (!payload.orderId || !payload.itemId || !payload.status) {
    console.error("Incomplete payload for item update:", payload);
    const errorMsg: WSMessage<ErrorPayload> = {
      event: "error",
      payload: {
        message: "Missing required fields: orderId, itemId, or status",
        code: "INVALID_PAYLOAD",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  console.log(
    "Calling ItemService.handleItemUpdate with:",
    payload.orderId,
    payload.itemId,
    payload.status,
  );

  // 3. EXECUTION: Delegate to the ItemService
  // The service handles DB update, price deduction, and broadasting the "UpdatedItemStatusPayload"
  await ItemService.getInstance().itemStatusUpdate(
    payload.orderId,
    payload.itemId,
    payload.status,
  );
}
