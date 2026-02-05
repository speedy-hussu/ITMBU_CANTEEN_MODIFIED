export interface BaseItem {
  _id: string; // The consistent ID from Atlas
  name: string;
  price: number;
  category: string;
}

export type ItemStatus = "REJECTED" | "PREPARED" | "PREPARING";
// Used for POS/Student cart logic
export interface CartItem extends BaseItem {
  quantity: number;
}
// Used specifically for KDS display logic
export interface KdsItem extends BaseItem {
  quantity: number;
  checked?: boolean;
}
export type IncomingItem = Omit<CartItem, "quantity" | "total">;
