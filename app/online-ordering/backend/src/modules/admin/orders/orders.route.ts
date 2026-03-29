import { FastifyInstance } from "fastify";
import {
  getOrdersHandler,
  updateOrderItemHandler,
  completeOrderHandler,
} from "./orders.controller";

export const adminOrderRoutes = async (fastify: FastifyInstance) => {
  // GET /api/admin/orders - Get all orders (with optional status filter)
  fastify.get("/", {
    onRequest: [fastify.authenticate],
    handler: getOrdersHandler,
  });

  // PATCH /api/admin/orders/:id/items/:itemId - Update item status
  fastify.patch("/:id/items/:itemId", {
    onRequest: [fastify.authenticate],
    handler: updateOrderItemHandler,
  });

  // PATCH /api/admin/orders/:id/complete - Complete order
  fastify.patch("/:id/complete", {
    onRequest: [fastify.authenticate],
    handler: completeOrderHandler,
  });
};
