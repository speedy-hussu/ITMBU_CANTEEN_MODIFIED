// src/@types/fastify-jwt.d.ts
import "@fastify/jwt";

declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    jwt: {
      sign: (payload: object) => string;
    };
  }

  export interface FastifyRequest {
    user: { enrollmentId?: string; username?: string; role?: string };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { enrollmentId?: string; username?: string; role?: string };
    user: { enrollmentId?: string; username?: string; role?: string };
  }
}
