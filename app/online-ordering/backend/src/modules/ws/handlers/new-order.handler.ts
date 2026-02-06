// online/backend/src/modules/websocket/handlers/new-order.handler.ts
import { OrderStatus } from "@shared/types";
import { CloudWSManager } from "../ws-manager";

export const handleNewOrder = (payload: any) => {
  const manager = CloudWSManager.getInstance();
  const bridgeId = (
    Array.from((manager as any).clients.values()) as any[]
  ).find((c: any) => c.role === "LOCAL_BRIDGE")?.id;

  const orderPayload = {
    ...payload,
    enrollmentId: payload.enrollmentId,
    source: "CLOUD",
  };

  if (bridgeId) {
    manager.sendToClient(bridgeId, "new_order", orderPayload);
    manager.sendToClient(payload.enrollmentId, "order_ack", {
      token: payload.token,
      status: "QUEUED",
    });
  } else {
    // manager.sendToClient handles the caching if the student is offline,
    // but here we know the BRIDGE is offline, so we notify the student.
    manager.sendToClient(payload.enrollmentId, "order_ack", {
      token: payload.token,
      status: "NOT RECIEVED",
    });
  }
};
