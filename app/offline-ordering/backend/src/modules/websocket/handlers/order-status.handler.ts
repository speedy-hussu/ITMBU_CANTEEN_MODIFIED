import { OrderService } from "src/modules/order/order.service";
import { ClientMeta } from "../shared/types";
import {
  UpdateStatusPayload,
  WSMessage,
  ErrorPayload,
} from "@shared/types/websocket.types";
import type { WebSocket } from "ws";

export async function handleStatusUpdate(
  socket: WebSocket,
  payload: UpdateStatusPayload,
  meta: ClientMeta,
) {
  console.log("handleStatusUpdate called:", { payload, meta });

  // 1. SECURITY: Only KDS can update status
  if (meta.role !== "KDS") {
    console.log("Unauthorized status update attempt from:", meta.role);
    const errorMsg: WSMessage<ErrorPayload> = {
      event: "error",
      payload: {
        message: "Unauthorized: Only Chef can update status",
        code: "UNAUTHORIZED",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  // 2. VALIDATION: Check if data exists
  if (!payload.status || (!payload._id && !payload.token)) {
    console.error("Missing status and identifier in update request:", payload);
    const errorMsg: WSMessage<ErrorPayload> = {
      event: "error",
      payload: {
        message: "Missing status and identifier (_id or token)",
        code: "INVALID_PAYLOAD",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  // Use _id if provided, otherwise find by token
  const orderId = payload._id || payload.token;

  if (!orderId) {
    console.error("No valid identifier found in payload");
    const errorMsg: WSMessage<ErrorPayload> = {
      event: "error",
      payload: {
        message: "No valid identifier found",
        code: "INVALID_PAYLOAD",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  console.log(
    "Calling OrderService.updateStatus with:",
    orderId,
    payload.status,
  );

  // 3. EXECUTION: Now call the service
  await OrderService.getInstance().updateStatus(orderId, payload.status);
}
