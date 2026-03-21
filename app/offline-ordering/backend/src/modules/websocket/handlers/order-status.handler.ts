import { OrderService } from "src/modules/order/order.service";
import { ClientMeta } from "../shared/types";
import {
  UpdateOrderStatusPayload,
  WSMessage,
  ErrorPayload,
} from "@shared/types/websocket.types";
import type { WebSocket } from "ws";
import { CloudBridge } from "../gateway/cloud.gateway";
import { OrderUtils } from "../utils/util";

export async function handleOrderStatusUpdate(
  socket: WebSocket,
  payload: UpdateOrderStatusPayload,
  meta: ClientMeta,
) {
  console.log("handleOrderUpdateStatus called:", { payload, meta });

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
  await OrderService.getInstance().orderUpdateStatus(orderId, payload.status);

  // Check auto-drain after order update
  const currentMode = CloudBridge.getInstance().getCanteenMode();
  console.log(`🔍 Auto-drain check: mode=${currentMode}, orderId=${orderId}`);

  if (currentMode === "DRAINING") {
    const cloudOrdersLeft = await OrderUtils.getActiveCloudOrdersCount();
    console.log(`🔍 Active cloud orders remaining: ${cloudOrdersLeft}`);

    if (cloudOrdersLeft === 0) {
      console.log("🏁 All Cloud orders cleared. Disconnecting Bridge.");
      CloudBridge.getInstance().updateCanteenMode("OFFLINE");
    }
  }
}
