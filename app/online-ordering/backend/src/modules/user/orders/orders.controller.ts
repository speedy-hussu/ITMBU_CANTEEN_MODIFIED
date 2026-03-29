// src/modules/user/user.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import Order from "../../../database/models/order.model";

export const getUserOrdersHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  // 1. Get the enrollmentId from the DECODED TOKEN (request.user)
  const { enrollmentId } = request.user as any;

  if (!enrollmentId) {
    return reply
      .code(401)
      .send({ message: "Unauthorized: Missing enrollment ID" });
  }

  try {
    // 2. Fetch from Atlas using Mongoose model
    const orders = await Order.find({ enrollmentId })
      .sort({ createdAt: -1 }) // Newest first
      .lean();

    return { success: true, orders };
  } catch (error) {
    console.error("[User Orders] Error fetching orders:", error);
    return reply
      .code(500)
      .send({ success: false, message: "Failed to fetch orders" });
  }
};
