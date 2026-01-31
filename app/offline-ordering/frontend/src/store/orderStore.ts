import { create } from "zustand";
import type {
  DbOrder,
  KdsOrderPayload,
  OrderStatus,
} from "@shared/types/order.types";
import type { ItemStatus } from "@shared/types/item.types";

interface OrdersState {
  orders: KdsOrderPayload[];
  TotalOrders: number;
  addOrder: (order: DbOrder) => void;
  setOrders: (orders: DbOrder[]) => void;
  updateOrder: (orderId: string, status: OrderStatus) => void;
  removeOrder: (orderId: string) => void;
  toggleItemStatus: (orderId: string, itemId: string) => void;
  updateItemStatus: (
    orderId: string,
    itemId: string,
    status: ItemStatus,
  ) => void;
}

export const useOrdersStore = create<OrdersState>((set) => ({
  orders: [],
  TotalOrders: 0,

  addOrder: (newOrder) =>
    set((state) => {
      if (state.orders.some((o) => o._id === newOrder._id)) return state;
      const kdsOrder: KdsOrderPayload = {
        ...newOrder,
        items: newOrder.items.map((item) => ({
          ...item,
          status: item.status || "PREPARING",
        })),
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
        items: order.items.map((item) => ({
          ...item,
          status: item.status || "PREPARING",
        })),
      })),
      TotalOrders: dbOrders.length,
    }),

  updateOrder: (orderId, status) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o._id === orderId ? { ...o, status } : o,
      ),
    })),

  toggleItemStatus: (orderId, itemId) =>
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o._id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((item) => {
            if (item._id !== itemId || item.status === "REJECTED") return item;
            return {
              ...item,
              status: item.status === "PREPARED" ? "PREPARING" : "PREPARED",
            };
          }),
        };
      }),
    })),

  updateItemStatus: (orderId, itemId, status) =>
    set((state) => ({
      orders: state.orders.map((o) => {
        if (o._id !== orderId) return o;
        return {
          ...o,
          items: o.items.map((item) =>
            item._id === itemId ? { ...item, status } : item,
          ),
        };
      }),
    })),

  removeOrder: (orderId) =>
    set((state) => {
      const remaining = state.orders.filter((o) => o._id !== orderId);
      return { orders: remaining, TotalOrders: remaining.length };
    }),
}));
