import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getTodayMenuController } from "./menu.controller";

export default async function menuRoutes(app: FastifyInstance) {
  console.log("📝 [Offline] Registering menu routes...");

  app.get("/today", async (req: FastifyRequest, reply: FastifyReply) => {
    console.log("🎯 [Offline] GET /api/menu/today route hit!");
    return getTodayMenuController(app, req, reply);
  });

  console.log("✅ [Offline] Menu routes registered");
}
