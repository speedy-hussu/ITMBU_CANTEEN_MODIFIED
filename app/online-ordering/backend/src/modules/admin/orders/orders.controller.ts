import { FastifyRequest, FastifyReply } from "fastify";
import Order from "../../../database/models/order.model";

// GET /api/admin/orders - Get all orders
export const getOrdersHandler = async (
  request: FastifyRequest<{ Querystring: { status?: string } }>,
  reply: FastifyReply,
) => {
  const { status } = request.query;

  const query: any = {};
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  return reply.send({ orders });
};

// PATCH /api/admin/orders/:id/items/:itemId - Update item status
export const updateOrderItemHandler = async (
  request: FastifyRequest<{
    Params: { id: string; itemId: string };
    Body: { status: string };
  }>,
  reply: FastifyReply,
) => {
  const { id, itemId } = request.params;
  const { status } = request.body;

  const order = await Order.findById(id);
  if (!order) {
    return reply.status(404).send({ message: "Order not found" });
  }

  // Update the item status
  const item = order.items.find(
    (i: any) => i._id?.toString() === itemId || i.itemId === itemId,
  );
  if (!item) {
    return reply.status(404).send({ message: "Item not found in order" });
  }

  item.status = status as "PENDING" | "PREPARING" | "COMPLETED" | "REJECTED";
  await order.save();

  return reply.send({ message: "Item status updated", order });
};

// PATCH /api/admin/orders/:id/complete - Complete entire order
export const completeOrderHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  const order = await Order.findByIdAndUpdate(
    id,
    { status: "COMPLETED" },
    { new: true },
  );

  if (!order) {
    return reply.status(404).send({ message: "Order not found" });
  }

  return reply.send({ message: "Order completed", order });
};
