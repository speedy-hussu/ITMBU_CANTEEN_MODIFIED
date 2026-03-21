// src/modules/user/route.ts
import { FastifyInstance } from "fastify";
import { getUserOrdersHandler } from "./user.controller";

async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/orders",
    { onRequest: [fastify.authenticate] },
    getUserOrdersHandler,
  );
}

export default userRoutes;
