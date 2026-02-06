// online/backend/src/modules/websocket/handlers/item-update.handler.ts
import { CloudWSManager } from "../ws-manager";

export const handleItemUpdate = (payload: any) => {
  const manager = CloudWSManager.getInstance();
  const { enrollmentId, token, itemId, status } = payload;

  if (enrollmentId && status === "REJECTED") {
    manager.sendToClient(enrollmentId, "item_update", {
      token,
      itemId,
      status,
      message: "An item in your order is unavailable.",
    });
    console.log(`[Cloud] Item rejection relayed to student: ${enrollmentId}`);
  }
};
