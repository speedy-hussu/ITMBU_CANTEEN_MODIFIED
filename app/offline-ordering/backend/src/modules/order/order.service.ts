import type {
  DbOrder,
  PosOrderPayload,
  OrderStatus,
  OrderSource,
} from "@shared/types/order.types";
import type {
  WSMessage,
  UpdateStatusPayload,
} from "@shared/types/websocket.types";
import { OrderModel } from "../../database/models/order.model";
import { WSManager } from "../websocket/ws.manager";

/**
 * OrderService: The core logic for order lifecycle management.
 * Handles persistence, role-based broadcasting, and Atlas synchronization.
 */
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

  /**
   * Processes all incoming orders from POS (Local) and Cloud (Student).
   * Stacks server metadata (source, status, synced) before saving.
   */
  async processIncomingOrder(
    payload: PosOrderPayload,
    role: OrderSource,
  ): Promise<{ success: boolean; token?: string }> {
    try {
      // 1. Prepare the DB record (Server Stamping)
      const orderData = {
        ...payload,
        source: role,
        status: "IN QUEUE",
        synced: false,
        createdAt: new Date().toISOString(),
      };

      const savedOrder = await OrderModel.create(orderData);

      // 3. Construct WS Message for KDS
      const kdsMessage: WSMessage<DbOrder> = {
        event: "new_order",
        payload: savedOrder,
      };
      // 4. Broadcast to KDS (Zustand on KDS will add 'checked' flags locally)
      this.wsManager.broadcastToRole("KDS", kdsMessage);

      return { success: true, token: savedOrder.token };
    } catch (error) {
      console.error("[OrderService] Create Error:", error);
      return { success: false };
    }
  }

  /**
   * Updates order status (typically triggered by KDS).
   * Orchestrates notifications and cloud synchronization.
   */
  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<DbOrder | null> {
    try {
      console.log("[OrderService] Update Status:", orderId, newStatus);
      const updatedOrder = (await OrderModel.findByIdAndUpdate(
        orderId,
        { status: newStatus },
        { new: true },
      ).lean()) as DbOrder;

      if (!updatedOrder) return null;

      // 1. Notify the originator (POS or Student via Cloud)
      this.notifyStatusChange(updatedOrder);

      // 2. If order is finished, sync to Atlas Cloud DB
      if (newStatus === "COMPLETED") {
        await this.syncToAtlas(updatedOrder);
      }

      return updatedOrder;
    } catch (error) {
      console.error("[OrderService] Status Update Error:", error);
      return null;
    }
  }

  /**
   * Sends status updates back to the original source.
   */
  private notifyStatusChange(order: DbOrder): void {
    const statusUpdate: WSMessage<UpdateStatusPayload> = {
      event: "update_status",
      payload: {
        token: order.token, // Send token so frontend can identify the order
        status: order.status,
      },
    };

    console.log("Broadcasting status update:", statusUpdate);

    // Route message back to originator
    const targetRole = order.source;
    this.wsManager.broadcastToRole(targetRole, statusUpdate);
    console.log("Broadcasted to:", targetRole);

    // Also update KDS if multiple KDS screens are active
    this.wsManager.broadcastToRole("KDS", statusUpdate);
  }

  /**
   * Pushes the completed order snapshot to Atlas.
   */
  async syncToAtlas(order: DbOrder): Promise<void> {
    try {
      // Logic for Atlas connection goes here
      // await AtlasOrderModel.create(order);

      await OrderModel.findByIdAndUpdate(order._id, { synced: true });
      console.log(`[Atlas Sync] Success for Token: ${order.token}`);
    } catch (error) {
      console.warn(`[Atlas Sync] Postponed for Token: ${order.token}`);
    }
  }
}
