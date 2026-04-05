// modules/user/menu/menu.controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import MenuTemplate from "../../../database/models/menuTemplate.model";

// Get today's menu based on current day of week
export async function getTodayMenuController(
  app: FastifyInstance,
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Get current day of week
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];

    console.log("🔍 Fetching menu for:", today);

    // Find all active templates for today
    const templates = await MenuTemplate.find({
      dayOfWeek: today,
      isActive: true,
    }).lean();

    console.log("✅ Found templates:", templates.length);

    // Flatten all items from templates
    const menuItems = templates.flatMap((template) =>
      template.items.map((item: any) => ({
        _id: item.itemId,
        itemId: item.itemId,
        name: item.name,
        category: item.category || "Dish",
        price: item.specialPrice || item.price,
        originalPrice: item.price,
        quantity: item.quantity,
        mealType: template.mealType,
        templateName: template.name,
        description: template.description,
      }))
    );

    return reply.send({
      day: today,
      templates: templates.map((t) => ({
        _id: t._id,
        name: t.name,
        mealType: t.mealType,
        description: t.description,
      })),
      items: menuItems,
    });
  } catch (error: any) {
    console.error("❌ Error fetching today's menu:", error.message);
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to fetch today's menu",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
