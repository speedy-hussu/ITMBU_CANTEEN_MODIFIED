import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import websocket from "@fastify/websocket";

//routes
import { authModule } from "./modules/auth/route";
import itemRoutes from "./modules/item/route";
import orderRoutes from "./modules/order/route";

//local ws server
import { registerLocalGateway } from "./modules/websocket/gateway/local.gateway";
import { CloudBridge } from "./modules/websocket/gateway/cloud.gateway";
import { OrderSync } from "./modules/sync/orderSync.service";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({});

  // ========== PLUGINS ==========
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie, { secret: process.env.COOKIE_SECRET });
  await app.register(formbody);
  await app.register(websocket);

  await app.register(authModule, { prefix: "/api/auth" });
  await app.register(itemRoutes, { prefix: "/api/items" });
  await app.register(orderRoutes, { prefix: "/api/orders" });

  await app.register(registerLocalGateway);
  console.log("registered local ws");

  await CloudBridge.getInstance();

  // Start Atlas sync heartbeat
  OrderSync.startHeartbeat();
  console.log("🔄 Order sync to Atlas started");

  return app;
}
