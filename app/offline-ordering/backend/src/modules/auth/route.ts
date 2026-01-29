// src/modules/auth/auth.routes.ts
import type { FastifyInstance } from "fastify";
import { handleLogin } from "./auth.controller";

export async function authModule(fastify: FastifyInstance) {
  fastify.post("/login", handleLogin);

  fastify.post("/logout", async (req, reply) => {
    reply.clearCookie("session_id", { path: "/" });
    return { success: true };
  });
}
