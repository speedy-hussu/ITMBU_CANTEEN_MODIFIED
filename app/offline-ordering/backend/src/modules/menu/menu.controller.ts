import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import MenuTemplate from "../../database/models/menuTemplate.model";
import CachedMenuTemplate from "../../database/models/cachedMenuTemplate.model";

export async function getTodayMenuController(
  app: FastifyInstance,
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = days[new Date().getDay()];

    console.log("🔍 [Offline] Fetching menu for:", today);

    let templates: any[] = [];
    let source = "cloud";

    try {
      // Try to fetch from cloud database first
      templates = await MenuTemplate.find({
        dayOfWeek: today,
        isActive: true,
      }).lean();

      console.log("✅ [Offline] Found templates from cloud:", templates.length);

      // Cache the fetched templates to local database
      if (templates.length > 0) {
        for (const template of templates) {
          const cacheData = {
            cloudTemplateId: template._id.toString(),
            name: template.name,
            dayOfWeek: template.dayOfWeek,
            mealType: template.mealType,
            items: template.items.map((item: any) => ({
              itemId: item.itemId,
              name: item.name,
              price: item.price,
              quantity: item.quantity || 1,
              specialPrice: item.specialPrice,
              originalPrice: item.price,
            })),
            isActive: template.isActive,
            description: template.description || "",
            cachedAt: new Date(),
          };

          // Upsert: update if exists, insert if not
          await CachedMenuTemplate.findOneAndUpdate(
            { cloudTemplateId: template._id.toString() },
            cacheData,
            { upsert: true, new: true },
          );
        }
        console.log(
          "💾 [Offline] Cached",
          templates.length,
          "templates to local DB",
        );
      }
    } catch (cloudError: any) {
      console.warn("⚠️ [Offline] Cloud DB error:", cloudError.message);
      console.log("📦 [Offline] Falling back to local cache...");
      source = "local";

      // Fallback to local cached data
      templates = await CachedMenuTemplate.find({
        dayOfWeek: today,
        isActive: true,
      }).lean();

      console.log(
        "✅ [Offline] Found cached templates from local:",
        templates.length,
      );
    }

    const menuItems = templates.flatMap((template) =>
      template.items.map((item: any) => ({
        itemId: item.itemId,
        _id: item.itemId?.toString?.() || item.itemId,
        name: item.name,
        price: item.specialPrice || item.price,
        originalPrice: item.originalPrice || item.price,
        category: "Dish",
        mealType: template.mealType,
        templateName: template.name,
        quantity: item.quantity || 1,
      })),
    );

    return reply.send({
      day: today,
      source,
      templates: templates.map((t) => ({
        _id: t.cloudTemplateId || t._id,
        name: t.name,
        mealType: t.mealType,
        description: t.description,
      })),
      items: menuItems,
    });
  } catch (error: any) {
    console.error("❌ [Offline] Error fetching today's menu:", error.message);
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to fetch today's menu",
      message: error.message,
    });
  }
}
