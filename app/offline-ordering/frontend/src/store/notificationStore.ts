// offline/frontend/src/store/notificationStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrderNotification {
  _id: string;
  token: string;
  status: string;
  refundedAmount: number;
  rejectedCount: number;
  timestamp: number;
}

interface NotificationState {
  notifications: OrderNotification[];
  syncNotification: (payload: any) => void;
  dismissNotification: (orderId: string) => void;
  clearAllNotifications: () => void;
}

const STORAGE_KEY = "pos_notifications";

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      syncNotification: (payload) => {
        const current = get().notifications;
        const existing = current.find((n) => n._id === payload._id);

        let updated: OrderNotification[];
        if (existing) {
          updated = current.map((n) =>
            n._id === payload._id
              ? {
                  ...n,
                  status: payload.status,
                  refundedAmount: payload.refundedAmount,
                  rejectedCount: payload.rejectedCount,
                  timestamp: Date.now(),
                }
              : n,
          );
        } else {
          const newEntry: OrderNotification = {
            _id: payload._id,
            token: payload.token || "???",
            status: payload.status,
            refundedAmount: payload.refundedAmount || 0,
            rejectedCount: payload.rejectedCount || 0,
            timestamp: Date.now(),
          };
          updated = [newEntry, ...current];
        }

        set({ notifications: updated });
      },

      dismissNotification: (orderId) => {
        const filtered = get().notifications.filter((n) => n._id !== orderId);
        set({ notifications: filtered });
      },

      clearAllNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: STORAGE_KEY,
    },
  ),
);
