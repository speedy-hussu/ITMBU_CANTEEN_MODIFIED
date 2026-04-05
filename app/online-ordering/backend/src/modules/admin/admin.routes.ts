import { FastifyInstance } from "fastify";
import { authRoute } from "./auth/route";
import { adminItemRoutes } from "./items/items.route";
import { adminOrderRoutes } from "./orders/orders.route";
import menuTemplateRoutes from "./menuTemplates/menuTemplates.route";
import { adminAnalyticsRoutes } from "./analytics/analytics.route";

export const adminRoutes = async (fastify: FastifyInstance) => {
  fastify.register(authRoute, { prefix: "/auth" });
  fastify.register(adminItemRoutes, { prefix: "/items" });
  fastify.register(adminOrderRoutes, { prefix: "/orders" });
  fastify.register(menuTemplateRoutes, { prefix: "/menu-templates" });
  fastify.register(adminAnalyticsRoutes, { prefix: "/analytics" });
};
