import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  getItemsHandler,
  createItemHandler,
  updateItemHandler,
  deleteItemHandler,
} from "./items.controller";

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

export const adminItemRoutes = async (fastify: FastifyInstance) => {
  // All routes protected by JWT authentication
  fastify.get("/", {
    onRequest: [fastify.authenticate],
    handler: getItemsHandler,
  });
  fastify.post("/", {
    onRequest: [fastify.authenticate],
    handler: createItemHandler,
  });
  fastify.patch("/:id", {
    onRequest: [fastify.authenticate],
    handler: updateItemHandler,
  });
  fastify.delete("/:id", {
    onRequest: [fastify.authenticate],
    handler: deleteItemHandler,
  });
};
