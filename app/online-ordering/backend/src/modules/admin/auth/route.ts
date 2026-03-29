import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { loginHandler, logoutHandler, meHandler } from "./auth.controller";

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

export const authRoute = async (fastify: FastifyInstance) => {
  fastify.post("/login", loginHandler);
  fastify.post("/logout", logoutHandler);
  fastify.get("/me", { onRequest: [fastify.authenticate] }, meHandler);
};
