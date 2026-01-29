import type { DbOrder, PosOrderPayload, OrderStatus } from "./order.types";

// Only what is actually used in the Offline <=> Online flow
export type WSEvent =
  | "new_order" // POS or Cloud sending an order
  | "update_status" // KDS updating order status
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
export interface UpdateStatusPayload {
  token?: string; // For frontend communication
  _id?: string; // For internal backend processing
  status: OrderStatus;
}

// Generic Error Payload
export interface ErrorPayload {
  message: string;
  code?: string;
}
