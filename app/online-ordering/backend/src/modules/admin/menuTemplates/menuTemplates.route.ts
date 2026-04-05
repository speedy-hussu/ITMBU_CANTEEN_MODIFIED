// modules/admin/menuTemplates/menuTemplates.route.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getMenuTemplatesHandler,
  getMenuTemplatesByDayHandler,
  createMenuTemplateHandler,
  updateMenuTemplateHandler,
  deleteMenuTemplateHandler,
} from "./menuTemplates.controller";

export default async function menuTemplateRoutes(app: FastifyInstance) {
  // Get all menu templates
  app.get("/", async (req: FastifyRequest, reply: FastifyReply) => {
    return getMenuTemplatesHandler(app, req, reply);
  });

  // Get templates by day
  app.get("/day/:day", async (req: FastifyRequest, reply: FastifyReply) => {
    return getMenuTemplatesByDayHandler(
      app,
      req as FastifyRequest<{ Params: { day: string } }>,
      reply
    );
  });

  // Create menu template
  app.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
    return createMenuTemplateHandler(
      app,
      req as FastifyRequest<{
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
      reply
    );
  });

  // Update menu template
  app.patch("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    return updateMenuTemplateHandler(
      app,
      req as FastifyRequest<{
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
      reply
    );
  });

  // Delete menu template (soft delete)
  app.delete("/:id", async (req: FastifyRequest, reply: FastifyReply) => {
    return deleteMenuTemplateHandler(
      app,
      req as FastifyRequest<{ Params: { id: string } }>,
      reply
    );
  });
}
