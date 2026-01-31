import type {
  DbOrder,
  PosOrderPayload,
  OrderStatus,
  OrderSource,
} from "@shared/types/order.types";
import type {
  WSMessage,
  UpdateOrderStatusPayload,
} from "@shared/types/websocket.types";
import { OrderModel } from "../../database/models/order.model";
import { WSManager } from "../websocket/ws.manager";

//OrderService: The core logic for order lifecycle management.
//Handles persistence, role-based broadcasting, and Atlas synchronization.
export class OrderService {
  private static instance: OrderService;
  private wsManager = WSManager.getInstance();

  private constructor() {}

  static getInstance(): OrderService {
    if (!this.instance) {
      this.instance = new OrderService();
    }
    return this.instance;
  }

  // Processes all incoming orders from POS (Local) and Cloud (Student).
  async processIncomingOrder(
    payload: PosOrderPayload,
    role: OrderSource,
  ): Promise<{ success: boolean; token?: string }> {
    try {
      const orderData: Omit<DbOrder, "_id"> = {
        ...payload,
        source: role,
        status: "IN QUEUE",
        isSyncedToCloudDB: false,
        createdAt: new Date().toISOString(),
      };

      const savedOrder = await OrderModel.create(orderData);

      const kdsMessage: WSMessage<DbOrder> = {
        event: "new_order",
        payload: savedOrder,
      };

      this.wsManager.broadcastToRole("KDS", kdsMessage);

      return { success: true, token: savedOrder.token };
    } catch (error) {
      console.error("[OrderService] Create Error:", error);
      return { success: false };
    }
  }

  // Updates order status (typically triggered by KDS).
  async orderUpdateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<DbOrder | null> {
    try {
      // 1. Prepare base update
      let updateQuery: any = { $set: { status: newStatus } };
      let options: any = { new: true };

      // 2. Handle Bulk Item Status Sync [cite: 2026-01-25]
      if (newStatus === "COMPLETED") {
        updateQuery.$set["items.$[elem].status"] = "PREPARED";
        options.arrayFilters = [{ "elem.status": { $ne: "REJECTED" } }];
      }
      if (newStatus === "CANCELLED") {
        updateQuery.$set["items.$[elem].status"] = "REJECTED";
        options.arrayFilters = [{ "elem.status": { $exists: true } }];
      }

      // 3. Fetch current state to calculate the FINAL refund [cite: 2026-01-31]
      const orderSnapshot = await OrderModel.findById(orderId);
      if (!orderSnapshot) return null;

      if (newStatus === "COMPLETED" || newStatus === "CANCELLED") {
        const totalRefund =
          newStatus === "CANCELLED"
            ? orderSnapshot.totalAmount
            : orderSnapshot.items
                .filter((i: any) => i.status === "REJECTED")
                .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);

        // Store the final calculated refund in the DB [cite: 2026-01-31]
        updateQuery.$set.refundedAmount = totalRefund;
      }

      // 4. Apply everything in one atomic update
      const updatedOrder = (await OrderModel.findByIdAndUpdate(
        orderId,
        updateQuery,
        options,
      ).lean()) as DbOrder;

      if (updatedOrder) {
        this.notifyStatusChange(updatedOrder);
      }

      return updatedOrder;
    } catch (error) {
      console.error("[OrderService] Update Error:", error);
      return null;
    }
  }

  private notifyStatusChange(order: DbOrder): void {
    const statusUpdate: WSMessage<any> = {
      event: "order_update",
      payload: {
        _id: order._id,
        token: order.token,
        status: order.status,
        refundedAmount: order.refundedAmount || 0, // Sending the saved value
        rejectedCount: order.items.filter((i) => i.status === "REJECTED")
          .length,
      },
    };
    this.wsManager.broadcastToRole(order.source, statusUpdate);
  }
}

//Pushes the completed order snapshot to Atlas.
// async syncToAtlas(order: DbOrder): Promise<void> {
//   try {
//     // Logic for Atlas connection goes here...
//     await OrderModel.findByIdAndUpdate(order._id, {
//       isSyncedToCloudDB: true,
//     });
//     console.log(`[Atlas Sync] Success for Token: ${order.token}`);
//   } catch (error) {
//     console.warn(`[Atlas Sync] Postponed for Token: ${order.token}`);
//   }
// }
