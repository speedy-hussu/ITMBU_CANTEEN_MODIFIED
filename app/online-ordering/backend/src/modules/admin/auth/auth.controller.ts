import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAdmin } from "./auth.service";

interface LoginBody {
  username: string;
  password: string;
}

export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply,
) => {
  const { username, password } = request.body;

  const admin = await verifyAdmin(username, password);
  if (!admin) {
    return reply.code(401).send({ message: "Invalid credentials" });
  }

  const token = request.server.jwt.sign({
    username: admin.username,
    role: "ADMIN",
  });

  const isProduction = process.env.NODE_ENV === "production";

  reply.setCookie("token", token, {
    path: "/",
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  return reply.send({
    message: "Login successful",
    user: { username: admin.username, role: "ADMIN", enrollmentId: "" },
  });
};

export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  reply.clearCookie("token", { path: "/" });
  return { message: "Logged out" };
};

export const meHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const user = request.user;
  return user;
};
