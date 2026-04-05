import { FastifyInstance } from "fastify";
import { getAnalyticsHandler } from "./analytics.controller";

export const adminAnalyticsRoutes = async (fastify: FastifyInstance) => {
  // GET /api/admin/analytics - Get overall analytics
  fastify.get("/", {
    onRequest: [fastify.authenticate],
    handler: getAnalyticsHandler,
  });
};
