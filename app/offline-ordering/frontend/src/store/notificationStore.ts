// offline/frontend/src/store/notificationStore.ts
import { create } from "zustand";

interface OrderNotification {
  _id: string;
  token: string;
  status: string;
  refundedAmount: number;
  rejectedCount: number; // Added to match our Backend Service logic
  timestamp: number;
}

interface NotificationState {
  notifications: OrderNotification[];
  syncNotification: (payload: any) => void;
  dismissNotification: (orderId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  syncNotification: (payload) =>
    set((state) => {
      const existing = state.notifications.find((n) => n._id === payload._id);

      if (existing) {
        // Update existing notification with latest status and refund from server
        return {
          notifications: state.notifications.map((n) =>
            n._id === payload._id
              ? {
                  ...n,
                  status: payload.status,
                  refundedAmount: payload.refundedAmount, // This is now the "Final Truth" [cite: 2026-01-31]
                  rejectedCount: payload.rejectedCount,
                  timestamp: Date.now(),
                }
              : n,
          ),
        };
      } else {
        // Create new notification if it doesn't exist (e.g., POS just opened)
        const newEntry: OrderNotification = {
          _id: payload._id,
          token: payload.token || "???",
          status: payload.status,
          refundedAmount: payload.refundedAmount || 0,
          rejectedCount: payload.rejectedCount || 0,
          timestamp: Date.now(),
        };
        return { notifications: [newEntry, ...state.notifications] };
      }
    }),

  dismissNotification: (orderId) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== orderId),
    })),
}));
