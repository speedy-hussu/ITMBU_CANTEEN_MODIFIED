// The core structure of an item as it exists in Atlas/Local DB
export interface BaseItem {
  _id: string; // The consistent ID from Atlas
  name: string;
  price: number;
  category: string;
}

// Used for POS/Student cart logic
export interface CartItem extends BaseItem {
  quantity: number;
  total: number;
}

// Used specifically for KDS display logic
export interface KdsItem extends BaseItem {
  quantity: number;
  checked?: boolean; // For the Chef's UI
}
export type IncomingItem = Omit<CartItem, "quantity" | "total">;