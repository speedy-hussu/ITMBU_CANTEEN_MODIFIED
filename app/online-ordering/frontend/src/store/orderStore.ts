import { create } from "zustand";
import type { DbOrder, OrderStatus, CartItem, ItemStatus } from "@shared/types";

interface UpdatePayload {
  token: string; // Backend always sends token
  status: OrderStatus | ItemStatus;
  itemId?: string; // Only provided for item-level updates
  newMongoId?: string; // In case the cloud DB ID needs updating
}

interface OrderStore {
  orders: DbOrder[];
  addOrder: (order: any) => void;
  updateStatus: (payload: UpdatePayload) => void;
  clearOrders: () => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateStatus: ({ token, status, itemId, newMongoId }) =>
    set((state) => ({
      orders: state.orders.map((order) => {
        // Match by token as requested
        if (order.token !== token) return order;

        // CASE 1: Specific Item Update (Backend provided token + itemId + status)
        if (itemId) {
          return {
            ...order,
            _id: newMongoId ?? order._id, // Update DB ID if sync just happened
            items: order.items.map((item: CartItem) =>
              item._id === itemId
                ? { ...item, status: status as ItemStatus }
                : item,
            ),
          };
        }

        // CASE 2: Whole Order Update (Backend provided token + status)
        return {
          ...order,
          _id: newMongoId ?? order._id,
          status: status as OrderStatus,
        };
      }),
    })),

  clearOrders: () => set({ orders: [] }),
}));
