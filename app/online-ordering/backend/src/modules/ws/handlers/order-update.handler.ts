// online/backend/src/modules/websocket/handlers/order-update.handler.ts
import { CloudWSManager } from "../ws-manager";

export const handleOrderUpdate = (payload: any) => {
  const manager = CloudWSManager.getInstance();
  const { enrollmentId, orderId, status } = payload;

  if (enrollmentId) {
    manager.sendToClient(enrollmentId, "order_update", {
      orderId,
      status,
      message: `Your order is now ${status.toLowerCase()}.`,
    });
    console.log(
      `[Cloud] Order status [${status}] relayed to student: ${enrollmentId}`,
    );
  }
};
