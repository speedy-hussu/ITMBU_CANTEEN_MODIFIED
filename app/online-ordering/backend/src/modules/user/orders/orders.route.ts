// src/modules/user/route.ts
import { FastifyInstance } from "fastify";
import { getUserOrdersHandler } from "./orders.controller";

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    { onRequest: [fastify.authenticate] },
    getUserOrdersHandler,
  );
}
