// modules/items/routes/item.user.route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getItemsController } from "./items.controller";

export default async function itemRoutes(app: FastifyInstance) {
  console.log("📝 Registering item routes...");

  // Fetch all items
  app.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    console.log("🎯 GET /api/items/ route hit!");
    return getItemsController(app, req, reply);
  });

  console.log("✅ Item routes registered");
}
