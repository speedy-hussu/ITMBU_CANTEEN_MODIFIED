import { create } from "zustand";
import type {
  DbOrder,
  KdsOrderPayload,
  OrderStatus,
} from "@shared/types/order.types";

interface OrdersState {
  orders: KdsOrderPayload[];
  TotalOrders: number;

  // Handlers
  addOrder: (order: DbOrder) => void;
  setOrders: (orders: DbOrder[]) => void;
  updateOrder: (token: string, status: OrderStatus) => void;
  removeOrder: (token: string) => void;

  // KDS Specific Logic
  toggleItemChecked: (orderId: string, itemIndex: number) => void;
  isAllItemsChecked: (orderId: string) => boolean;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  TotalOrders: 0,

  // Map incoming DbOrder (CartItem) to KdsOrderPayload (KdsItem)
  addOrder: (newOrder) =>
    set((state) => {
      if (state.orders.some((o) => o.token === newOrder.token)) return state;

      const kdsOrder: KdsOrderPayload = {
        ...newOrder,
        items: newOrder.items.map((item) => ({ ...item, checked: false })),
      };

      return {
        orders: [kdsOrder, ...state.orders],
        TotalOrders: state.TotalOrders + 1,
      };
    }),

  setOrders: (dbOrders) =>
    set({
      orders: dbOrders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({ ...item, checked: false })),
      })),
      TotalOrders: dbOrders.length,
    }),

  updateOrder: (token, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.token === token ? { ...o, status } : o,
      ),
    })),

  toggleItemChecked: (orderId, itemIndex) =>
    set((state) => {
      console.log("toggleItemChecked called:", { orderId, itemIndex });
      const newState = {
        orders: state.orders.map((o) => {
          if (o.token !== orderId) return o;
          const newItems = [...o.items];
          const previousChecked = newItems[itemIndex].checked;
          newItems[itemIndex].checked = !newItems[itemIndex].checked;
          console.log("Toggling item:", {
            orderId,
            itemIndex,
            itemName: newItems[itemIndex].name,
            previousChecked,
            newChecked: newItems[itemIndex].checked,
          });
          return { ...o, items: newItems };
        }),
      };
      console.log(
        "New state after toggle:",
        newState.orders.find((o) => o.token === orderId)?.items,
      );
      return newState;
    }),

  isAllItemsChecked: (orderId) => {
    const order = get().orders.find((o) => o.token === orderId);
    return !!order && order.items.every((i) => i.checked);
  },

  removeOrder: (token) =>
    set((state) => {
      console.log("removeOrder called:", { token });
      console.log(
        "Current orders:",
        state.orders.map((o) => ({ _id: o._id, token: o.token })),
      );
      const remaining = state.orders.filter((o) => o.token !== token);
      console.log(
        "Remaining orders after removal:",
        remaining.map((o) => ({ _id: o._id, token: o.token })),
      );
      return { orders: remaining, TotalOrders: remaining.length };
    }),
}));
