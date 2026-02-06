import { CloudWSManager } from "../ws-manager";

export const handleOrderAck = (payload: any) => {
  const manager = CloudWSManager.getInstance();
  const { enrollmentId, token, success } = payload;
  console.log(payload, "order ack payload");
  const targetId =
    enrollmentId || payload.enrollmentId || payload.to || payload.userId;

  if (targetId) {
    manager.sendToClient(targetId, "order_ack", {
      token,
      success,
    });
    console.log(`[Cloud] order_ack relayed to student: ${targetId}`);
  } else {
    console.warn("[Cloud] order_ack received without enrollmentId", payload);
  }
};
