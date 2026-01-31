// offline/backend/src/modules/item/item.service.ts
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
      // Simply update the specific item status in the DB [cite: 2026-01-25]
      await OrderModel.findOneAndUpdate(
        { _id: orderId, "items._id": itemId },
        { $set: { "items.$.status": status } },
      );

      // We do NOT call notifyStatusChange here anymore.
      // The POS will get the update only when the OrderService.orderUpdateStatus is called.
      console.log(
        `[ItemService] Item ${itemId} set to ${status}. No POS broadcast sent.`,
      );
    } catch (error) {
      console.error("[ItemService] Error:", error);
    }
  }
}
