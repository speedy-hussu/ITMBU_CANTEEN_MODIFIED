import { FastifyInstance } from "fastify";
import { authRoute } from "./auth/route";
import { adminItemRoutes } from "./items/items.route";
import { adminOrderRoutes } from "./orders/orders.route";

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.register(authRoute, { prefix: "/auth" });
  fastify.register(adminItemRoutes, { prefix: "/items" });
  fastify.register(adminOrderRoutes, { prefix: "/orders" });
};
