// offline/frontend/src/components/NotificationSidebar.tsx
import { useNotificationStore } from "../../store/notificationStore";

export const NotificationSidebar = () => {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismiss = useNotificationStore((state) => state.dismissNotification);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "IN QUEUE":
        return {
          border: "border-blue-500",
          badge: "bg-blue-100 text-blue-700",
        };
      case "COMPLETED":
        return {
          border: "border-green-500",
          badge: "bg-green-100 text-green-700",
        };
      case "CANCELLED":
        return { border: "border-red-600", badge: "bg-red-100 text-red-700" };
      default:
        return {
          border: "border-gray-400",
          badge: "bg-gray-100 text-gray-700",
        };
    }
  };

  return (
    <div className="w-100 h-full flex flex-col gap-3 p-4 bg-gray-50 overflow-y-auto border-r">
      <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">
        Live Updates
      </h2>

      {notifications.map((order) => {
        const styles = getStatusStyles(order.status);
        const hasRefund = order.refundedAmount > 0;

        return (
          <div
            key={order._id}
            className={`p-4 rounded-xl shadow-sm border-l-4 transition-all duration-300 bg-white ${styles.border}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-black text-gray-800">
                #{order.token}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${styles.badge}`}
              >
                {order.status}
              </span>
            </div>

            {hasRefund && (
              <div className="bg-red-600 text-white p-3 rounded-lg mb-2 flex flex-col items-center justify-center animate-pulse">
                <span className="text-[10px] font-bold uppercase opacity-80">
                  Give Cash Back:
                </span>
                <span className="text-2xl font-black text-yellow-300">
                  ₹{order.refundedAmount}
                </span>
              </div>
            )}

            <button
              onClick={() => dismiss(order._id)}
              className="w-full mt-2 py-1.5 text-[10px] font-bold text-gray-400 border border-gray-100 rounded hover:bg-gray-100 hover:text-gray-800"
            >
              DISMISS
            </button>
          </div>
        );
      })}
    </div>
  );
};
