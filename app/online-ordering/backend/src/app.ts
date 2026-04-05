import fastify, { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import cookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { authDecorator } from "./decorator/auth.decorator";

// Routes

import { registerCloudWS } from "./modules/ws/cloud-gateway";
import authRoutes from "./modules/user/auth/auth.route";
import { orderRoutes } from "./modules/user/orders/orders.route";
import itemRoutes from "./modules/user/items/items.route";
import todayMenuRoutes from "./modules/user/menu/menu.route";
import { adminRoutes } from "./modules/admin/admin.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify();

  // ========== PLUGINS ==========

  // CORS - Allow credentials for cookies
  const isProduction = process.env.NODE_ENV === "production";
  console.log("isProduction", isProduction);
  await app.register(cors, {
    // 1. Explicitly name your production URL
    origin: isProduction ? "https://itmbu-canteen-modified.vercel.app" : true,

    credentials: true,

    // 2. Be explicit with headers so preflight doesn't fail
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  // Cookie parser
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "your-cookie-secret-key",
    parseOptions: {},
  });

  // Parse application/x-www-form-urlencoded
  await app.register(formbody);

  // WebSocket support - MUST BE REGISTERED BEFORE WEBSOCKET ROUTES
  await app.register(websocket);

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "supersecret",
    cookie: {
      cookieName: "token",
      signed: false, // Set to true if you want to sign the cookie itself
    },
  });
  console.log("✅ Fastify plugins registered");
  await app.register(authDecorator);

  app.register(authRoutes, { prefix: "api/auth" });
  // ========== ROUTES ==========

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  //admin
  await app.register(adminRoutes, { prefix: "/api/admin" });

  // API Routes
  await app.register(itemRoutes, { prefix: "/api/items" });
  await app.register(orderRoutes, { prefix: "/api/user/orders" });
  await app.register(todayMenuRoutes, { prefix: "/api/menu/today" });

  // ========== WebSocket Routes ==========

  console.log(`\n🔧 Server Mode:  "CLOUD"`);

  console.log("☁️  Initializing Cloud WebSocket Server...\n");

  await app.register(registerCloudWS);

  console.log("✅ Cloud WebSocket Server registered\n");

  // ========== ERROR HANDLERS ==========

  // Global error handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error(error);

    // JWT errors
    if (error.message === "No Authorization was found in request.headers") {
      return reply.code(401).send({
        error: "Unauthorized",
        message: "Missing authentication token",
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation,
      });
    }

    // Default error
    reply.code(error.statusCode || 500).send({
      error: error.name || "Internal Server Error",
      message: error.message || "Something went wrong",
    });
  });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: "Not Found",
      message: `Route ${request.method}:${request.url} not found`,
    });
  });

  // ========== LIFECYCLE HOOKS ==========

  // Log all requests
  app.addHook("onRequest", async (request) => {
    // Skip logging for WebSocket routes
    if (request.url.startsWith("/ws/")) return;

    app.log.info(
      { url: request.url, method: request.method },
      "Incoming request",
    );
  });

  // Response time logging
  app.addHook("onResponse", async (request, reply) => {
    const responseTime = reply.elapsedTime.toFixed(2);
    app.log.info(
      {
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
      },
      "Request completed",
    );
  });

  return app;
}
