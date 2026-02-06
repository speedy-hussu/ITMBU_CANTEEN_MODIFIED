import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

//routes
import { authModule } from "./modules/auth/route";
import itemRoutes from "./modules/item/route";

//local ws server
import { registerLocalGateway } from "./modules/websocket/gateway/local.gateway";
import { CloudBridge } from "./modules/websocket/gateway/cloud.gateway";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    /* ... logger config ... */
  });

  // ========== PLUGINS ==========
  const isProduction = process.env.NODE_ENV === "production";
  await app.register(cors, {
    // 1. Explicitly name your production URL
    origin: isProduction ? "https://itmbu-canteen-modified.vercel.app" : true,

    credentials: true,

    // 2. Be explicit with headers so preflight doesn't fail
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });
  await app.register(cookie, { secret: process.env.COOKIE_SECRET });
  await app.register(formbody);
  await app.register(websocket);

  await app.register(authModule, { prefix: "/api/auth" });
  await app.register(itemRoutes, { prefix: "/api/items" });

  await app.register(registerLocalGateway);
  console.log("registered local ws");

  await CloudBridge.getInstance();
  // console.log("registered cloud ws");

  return app;
}
