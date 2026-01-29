// src/modules/auth/auth.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { validateStaffCredentials } from "./auth.service";

export const handleLogin = async (req: FastifyRequest, reply: FastifyReply) => {
  const body = req.body as any;

  if (!validateStaffCredentials(body)) {
    return reply
      .status(401)
      .send({ success: false, message: "Invalid credentials" });
  }

  reply.setCookie("session_id", "active", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  return { success: true, user: { username: body.username, role: body.role } };
};
