import type { ItemStatus } from "./item.types";
import type { DbOrder, PosOrderPayload, OrderStatus } from "./order.types";

// Only what is actually used in the Offline <=> Online flow
export type WSEvent =
  | "new_order" // POS or Cloud sending an order
  | "order_update" // KDS updating order status
  | "item_update"
  | "sync_orders" // Offline syncing to Atlas
  | "order_ack"
  | "error" // Generic error reporting
  | "ping"
  | "pong";

export interface WSMessage<T = any> {
  event: WSEvent;
  payload: T;
}

//For New Order
//Frontend sends PosOrderPayload, Backend responds/broadcasts with DbOrder.
export type NewOrderMessage = WSMessage<PosOrderPayload | DbOrder>;

//For Update Status
export interface UpdateOrderStatusPayload {
  token?: string; // For frontend communication
  _id?: string; // For internal backend processing
  status: OrderStatus;
  refundedAmount: number;
}
export interface UpdateItemStatusPayload {
  orderId: string;
  itemId: string;
  status: ItemStatus;
}

export interface UpdatedItemStatusPayload {
  _id: string;
  token: string;
  items: DbOrder["items"];
  status: OrderStatus;
  refundedAmount: number;
}
// Generic Error Payload
export interface ErrorPayload {
  message: string;
  code?: string;
}
