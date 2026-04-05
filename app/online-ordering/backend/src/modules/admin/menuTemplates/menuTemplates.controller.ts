// modules/admin/menuTemplates/menuTemplates.controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import MenuTemplate from "../../../database/models/menuTemplate.model";
import Item from "../../../database/models/item.model";

// Get all menu templates
export async function getMenuTemplatesHandler(
  app: FastifyInstance,
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const templates = await MenuTemplate.find({ isActive: true })
      .populate("items.itemId", "name description price category")
      .sort({ dayOfWeek: 1, mealType: 1 });

    return reply.send({ templates });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to fetch menu templates",
      message: error.message,
    });
  }
}

// Get templates by day
export async function getMenuTemplatesByDayHandler(
  app: FastifyInstance,
  req: FastifyRequest<{ Params: { day: string } }>,
  reply: FastifyReply,
) {
  try {
    const { day } = req.params;
    const templates = await MenuTemplate.find({
      dayOfWeek: day,
      isActive: true,
    }).populate("items.itemId", "name description price category");

    return reply.send({ templates });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to fetch menu templates",
      message: error.message,
    });
  }
}

// Create menu template
export async function createMenuTemplateHandler(
  app: FastifyInstance,
  req: FastifyRequest<{
    Body: {
      name: string;
      dayOfWeek: string;
      mealType: string;
      items: Array<{
        itemId: string;
        quantity?: number;
        specialPrice?: number;
      }>;
      description?: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const { name, dayOfWeek, mealType, items, description } = req.body;

    // Validate items exist
    const itemIds = items.map((item) => item.itemId);
    const existingItems = await Item.find({ _id: { $in: itemIds } });

    if (existingItems.length !== items.length) {
      return reply.status(400).send({
        error: "Invalid items",
        message: "Some items do not exist in the database",
      });
    }

    // Map items with their details
    const templateItems = items.map((item) => {
      const dbItem = existingItems.find(
        (ei) => ei._id.toString() === item.itemId
      );
      return {
        itemId: item.itemId,
        name: dbItem?.name || "",
        price: dbItem?.price || 0,
        quantity: item.quantity || 1,
        specialPrice: item.specialPrice,
      };
    });

    const template = await MenuTemplate.create({
      name,
      dayOfWeek,
      mealType,
      items: templateItems,
      description,
      isActive: true,
    });

    return reply.status(201).send({
      message: "Menu template created successfully",
      template,
    });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to create menu template",
      message: error.message,
    });
  }
}

// Update menu template
export async function updateMenuTemplateHandler(
  app: FastifyInstance,
  req: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      items?: Array<{
        itemId: string;
        quantity?: number;
        specialPrice?: number;
      }>;
      description?: string;
      isActive?: boolean;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const { id } = req.params;
    const { name, items, description, isActive } = req.body;

    const updateData: any = { name, description, isActive };

    // If items provided, validate and map them
    if (items && items.length > 0) {
      const itemIds = items.map((item) => item.itemId);
      const existingItems = await Item.find({ _id: { $in: itemIds } });

      if (existingItems.length !== items.length) {
        return reply.status(400).send({
          error: "Invalid items",
          message: "Some items do not exist in the database",
        });
      }

      updateData.items = items.map((item) => {
        const dbItem = existingItems.find(
          (ei) => ei._id.toString() === item.itemId
        );
        return {
          itemId: item.itemId,
          name: dbItem?.name || "",
          price: dbItem?.price || 0,
          quantity: item.quantity || 1,
          specialPrice: item.specialPrice,
        };
      });
    }

    const template = await MenuTemplate.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!template) {
      return reply.status(404).send({ error: "Menu template not found" });
    }

    return reply.send({
      message: "Menu template updated successfully",
      template,
    });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to update menu template",
      message: error.message,
    });
  }
}

// Delete menu template
export async function deleteMenuTemplateHandler(
  app: FastifyInstance,
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const { id } = req.params;

    const template = await MenuTemplate.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      return reply.status(404).send({ error: "Menu template not found" });
    }

    return reply.send({
      message: "Menu template deleted successfully",
    });
  } catch (error: any) {
    app.log.error(error);
    return reply.status(500).send({
      error: "Failed to delete menu template",
      message: error.message,
    });
  }
}
