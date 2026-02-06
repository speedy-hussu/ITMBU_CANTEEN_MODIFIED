import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, IncomingItem } from "@shared/types/item.types";

interface CartActions {
  addToCart: (item: IncomingItem) => void;
  removeFromCart: (id: string) => void;
  emptyCart: () => void;
  getCartTotal: () => number;
}
interface CartState {
  cart: CartItem[];
  totalItems: number;
}
type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      totalItems: 0,

      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c._id === item._id); // Search by ID

          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c._id === item._id
                  ? {
                      ...c,
                      quantity: c.quantity + 1,
                      total: (c.quantity + 1) * c.price,
                    }
                  : c,
              ),
            };
          }
          return {
            cart: [
              ...state.cart,
              { ...item, quantity: 1, total: item.price } as CartItem,
            ],
            totalItems: state.totalItems + 1,
          };
        }),

      removeFromCart: (id) =>
        set((state) => {
          const existing = state.cart.find((c) => c._id === id);
          if (!existing) return state;

          if (existing.quantity > 1) {
            return {
              cart: state.cart.map((c) =>
                c._id === id
                  ? {
                      ...c,
                      quantity: c.quantity - 1,
                      total: (c.quantity - 1) * c.price,
                    }
                  : c,
              ),
            };
          }
          return {
            cart: state.cart.filter((c) => c._id !== id),
            totalItems: state.totalItems - 1,
          };
        }),

      getCartTotal: () => get().cart.reduce((t, i) => t + (i.quantity * i.price), 0),
      emptyCart: () => set({ cart: [], totalItems: 0 }),
    }),
    { name: "cart-storage" },
  ),
);
