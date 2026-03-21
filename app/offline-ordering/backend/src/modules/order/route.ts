import { FastifyInstance } from "fastify";
import { getActiveOrders, getOrdersByStatus } from "./order.controller";

export default async function orderRoutes(fastify: FastifyInstance) {
  // GET /orders - Get all active orders
  fastify.get("/", getActiveOrders);

  // GET /orders?status=IN%20QUEUE - Get orders by specific status
  fastify.get("/by-status", getOrdersByStatus);
}
