import {
  UpdatedItemStatusPayload,
  WSMessage,
} from "@shared/types/websocket.types";
import { OrderModel } from "../../database/models/order.model";
import type { DbOrder } from "@shared/types/order.types";
import { WSManager } from "../websocket/ws.manager";

export class ItemService {
  private static instance: ItemService;
  private constructor() {}
  private wsManager = WSManager.getInstance();

  static getInstance(): ItemService {
    if (!this.instance) this.instance = new ItemService();
    return this.instance;
  }

  async itemStatusUpdate(orderId: string, itemId: string, status: string) {
    try {
      // Added { new: true } to get the updated object back
      const updatedItemOrder = (await OrderModel.findOneAndUpdate(
        { _id: orderId, "items._id": itemId },
        { $set: { "items.$.status": status } },
        { new: true },
      ).lean()) as DbOrder;

      if (!updatedItemOrder) return;

      // "Stay Cool" Logic: Notify student early only if an item is REJECTED
      if (
        updatedItemOrder.source === "CLOUD" &&
        updatedItemOrder.enrollmentId &&
        status === "REJECTED"
      ) {
        const cloudNotification: WSMessage<any> = {
          event: "item_update",
          payload: {
            enrollmentId: updatedItemOrder.enrollmentId,
            orderId: updatedItemOrder._id,
            itemId: itemId,
            status: "REJECTED",
          },
        };

        // Broadcast to the "CLOUD" role (The bridge to your Online folder)
        this.wsManager.broadcastToRole("CLOUD", cloudNotification);

        console.log(
          `[ItemService] Early rejection notice sent to Cloud for: ${updatedItemOrder.enrollmentId}`,
        );
      }

      console.log(
        `[ItemService] Item ${itemId} set to ${status}. DB updated successfully.`,
      );
    } catch (error) {
      console.error("[ItemService] Error:", error);
    }
  }
}
