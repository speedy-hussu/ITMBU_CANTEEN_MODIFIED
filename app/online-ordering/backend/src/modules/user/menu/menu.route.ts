// modules/user/menu/menu.route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getTodayMenuController } from "./menu.controller";

export default async function todayMenuRoutes(app: FastifyInstance) {
  console.log("📝 Registering today's menu routes...");

  // Get today's menu (no auth required - public endpoint)
  app.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    console.log("🎯 GET /api/menu/today route hit!");
    return getTodayMenuController(app, req, reply);
  });

  console.log("✅ Today's menu routes registered");
}
