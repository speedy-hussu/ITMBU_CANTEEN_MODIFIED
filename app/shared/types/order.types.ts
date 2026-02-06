// shared/types/order.types.ts
import type { CartItem, KdsItem } from "./item.types";

export type OrderStatus =
  | "IN QUEUE"
  | "COMPLETED"
  | "CANCELLED"
  | "NOT RECEIVED";
export type OrderSource = "LOCAL" | "CLOUD";

// 1. The Master Shape
export interface OrderBase<I> {
  _id: string;
  token: string;
  enrollmentId?: string;
  items: I[];
  totalAmount: number;
  refundedAmount: number;
  status: OrderStatus;
  source: OrderSource;
  isSyncedToCloudDB: boolean;
  createdAt: string; //for kds sorting
}

// 2. What POS/Cloud sends
export type PosOrderPayload = Omit<
  OrderBase<CartItem>,
  | "_id"
  | "status"
  | "source" 
  | "createdAt"
  | "refundedAmount"
  | "isSyncedToCloudDB"
>;
export type KdsOrderPayload = OrderBase<KdsItem>;

// 3. The Database Record (The "Stamped" version)
export type DbOrder = OrderBase<CartItem>;
