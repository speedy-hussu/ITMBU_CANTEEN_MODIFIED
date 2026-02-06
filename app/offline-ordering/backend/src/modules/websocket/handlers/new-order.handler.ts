// offline-ordering/backend/src/modules/ws/handlers/new-order.handler.ts
import type { WebSocket } from "ws";
import { OrderService } from "../../order/order.service";
import { ClientMeta } from "../shared/types";

export async function handleNewOrder(
  socket: WebSocket,
  payload: any,
  meta: ClientMeta,
) {
  const orderService = OrderService.getInstance();

  // 1. HANDLER JOB: Extract data from the message
  const source = meta.role === "CLOUD" ? "CLOUD" : "LOCAL";

  // 2. HANDLER JOB: Call the Service to do the "Real Work"
  const result = await orderService.processIncomingOrder(payload, source);

  // 3. HANDLER JOB: Send the Acknowledgment (ACK) back to the sender
  const ack = {
    event: "order_ack",
    payload: {
      enrollmentId: result.enrollmentId,
      token: result.token,
      success: result.success,
    },
  };

  if (socket.readyState === 1) {
    socket.send(JSON.stringify(ack));
  }
}
