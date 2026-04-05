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
  async processIncomingOrder(payload: PosOrderPayload, role: OrderSource) {
    try {
      const orderData: Omit<DbOrder, "_id" | "refundedAmount"> = {
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

      return {
        success: true,
        token: savedOrder.token,
        enrollmentId: savedOrder.enrollmentId,
      };
    } catch (error: any) {
      console.error("[OrderService] Create Error:", error.message);
      return { 
        success: false, 
        token: payload.token, 
        enrollmentId: payload.enrollmentId,
        error: error.message 
      };
    }
  }
  async orderUpdateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<DbOrder | null> {
    try {
      // 1. Fetch Snapshot (Required for refund calculations)
      const orderSnapshot = await OrderModel.findById(orderId);
      if (!orderSnapshot) return null;

      // 2. Initialize Base Update
      const updateQuery: any = {
        $set: {
          status: newStatus,
          isSyncedToCloudDB: false,
          updatedAt: new Date(), // Good practice for syncing
        },
      };
      const options: any = { new: true };

      // 3. Shared Logic: Item Status Updates (READY, DELIVERED, CANCELLED)
      const terminalStates: OrderStatus[] = ["READY", "DELIVERED", "CANCELLED"];

      if (terminalStates.includes(newStatus)) {
        updateQuery.$set["items.$[elem].status"] = "PREPARED";
        options.arrayFilters = [{ "elem.status": { $ne: "REJECTED" } }];

        if (newStatus === "READY") {
          updateQuery.$set.readyAt = new Date().toISOString();
        }
      }

      // 4. Refund Logic
      if (newStatus === "READY") {
        updateQuery.$set.refundedAmount = orderSnapshot.items
          .filter((i: any) => i.status === "REJECTED")
          .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
      } else if (newStatus === "CANCELLED") {
        updateQuery.$set.refundedAmount = orderSnapshot.totalAmount;
      }

      // 5. Atomic Update
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
    if (order.source == "LOCAL") {
      const posPayload: WSMessage<any> = {
        event: "order_update",
        payload: {
          _id: order._id,
          token: order.token,
          status: order.status,
          refundedAmount: order.refundedAmount || 0,
        },
      };
      this.wsManager.broadcastToRole("LOCAL", posPayload);
    } else if (order.source === "CLOUD" && order.enrollmentId) {
      const cloudPayload: WSMessage<any> = {
        event: "order_update",
        payload: {
          enrollmentId: order.enrollmentId,
          _id: order._id,
          token: order.token,
          status: order.status,
          refundedAmount: order.refundedAmount,
          items: order.items,
        },
      };
      this.wsManager.broadcastToRole("CLOUD", cloudPayload);
    }
  }
}
