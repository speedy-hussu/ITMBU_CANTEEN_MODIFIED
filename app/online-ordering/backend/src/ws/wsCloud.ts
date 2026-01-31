// online/backend/src/modules/websocket/cloud.ws.ts
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import mongoose from "mongoose";

// We use the same standard roles for consistency
type CloudRole = "LOCAL_CANTEEN" | "STUDENT";

interface CloudClient {
  socket: WebSocket;
  role: CloudRole;
  identifier: string; // CanteenID or EnrollmentNo
}

export class CloudWebSocketServer {
  private clients: Map<string, CloudClient> = new Map();
  private pendingOrders: Map<string, any> = new Map();

  constructor(private app: FastifyInstance) {}

  async initialize() {
    console.log("☁️ Initializing Cloud WebSocket routes...");

    // Test HTTP endpoint
    this.app.get("/ws/cloud-test", async (req, reply) => {
      return { status: "WebSocket endpoint available", endpoint: "/ws/cloud" };
    });

    // 1. Endpoint for the LOCAL CANTEEN to connect (The CloudBridge we just built)
    this.app.get("/ws/cloud", { websocket: true }, (socket, req) => {
      console.log("📡 WEBSOCKET CONNECTION ESTABLISHED at /ws/cloud");
      const canteenId = (req.query as any).canteenId || "GHY_BRANCH_01";
      this.registerClient(canteenId, "LOCAL_CANTEEN", socket);
    });
    console.log("✅ Registered /ws/cloud endpoint");

    // 2. Endpoint for STUDENT APPS (Frontend or Backend)
    this.app.get("/ws/student", { websocket: true }, (socket, req) => {
      const enrollmentNo = (req.query as any).enrollmentNo;
      if (enrollmentNo) {
        this.registerClient(enrollmentNo, "STUDENT", socket);
      }
    });
    console.log("✅ Registered /ws/student endpoint");
  }

  private registerClient(id: string, role: CloudRole, socket: WebSocket) {
    console.log(`📡 Registering ${role}: ${id}`);

    this.clients.set(id, { socket, role, identifier: id });

    // Handle incoming messages
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.routeMessage(id, role, message);
      } catch (e) {
        console.error("Invalid JSON from", id);
      }
    });

    // Handle Disconnect
    socket.on("close", () => {
      console.log(`❌ ${role} ${id} disconnected`);
      this.clients.delete(id);
    });

    // If a canteen just connected, push pending orders
    if (role === "LOCAL_CANTEEN") {
      this.flushPendingOrders(id);
    }
  }

  private routeMessage(senderId: string, role: CloudRole, message: any) {
    const { event, payload } = message;

    // IF MESSAGE FROM LOCAL -> GOES TO STUDENT
    if (role === "LOCAL_CANTEEN") {
      const enrollmentNo = payload.enrollmentNo;
      if (enrollmentNo) {
        this.sendToClient(enrollmentNo, event, payload);
      } else {
        // Broadcast updates (like KDS status) to all students
        this.broadcastToRole("STUDENT", event, payload);
      }
    }

    // IF MESSAGE FROM STUDENT -> GOES TO LOCAL
    if (role === "STUDENT") {
      if (event === "new_order") {
        this.handleNewStudentOrder(senderId, payload);
      }
    }
  }

  private handleNewStudentOrder(enrollmentNo: string, orderData: any) {
    const cloudOrderId = new mongoose.Types.ObjectId().toString();

    // Prepare the order for the local canteen (matching your new_order format)
    const orderPayload = {
      ...orderData,
      _id: cloudOrderId,
      enrollmentNo,
      source: "ONLINE",
    };

    const localCanteen = this.findCanteen(); // Logic to find the right canteen

    if (localCanteen) {
      this.sendToClient(localCanteen.identifier, "new_order", orderPayload);
      console.log(`📤 Order ${cloudOrderId} sent to Local Canteen`);
    } else {
      // Store in memory if local is offline
      this.pendingOrders.set(cloudOrderId, orderPayload);
      console.log(`💾 Canteen offline. Order ${cloudOrderId} cached.`);
    }

    // Inform the student immediately
    this.sendToClient(enrollmentNo, "order_status", {
      cloudOrderId,
      status: localCanteen ? "RECEIVED" : "QUEUED_OFFLINE",
    });
  }

  private flushPendingOrders(canteenId: string) {
    if (this.pendingOrders.size > 0) {
      console.log(
        `🔄 Syncing ${this.pendingOrders.size} orders to reconnected canteen...`,
      );
      this.pendingOrders.forEach((order, id) => {
        this.sendToClient(canteenId, "new_order", order);
      });
      this.pendingOrders.clear();
    }
  }

  // --- Helper Communication Methods ---

  private sendToClient(id: string, event: string, payload: any) {
    const client = this.clients.get(id);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(
        JSON.stringify({ event, payload, timestamp: Date.now() }),
      );
    }
  }

  private broadcastToRole(role: CloudRole, event: string, payload: any) {
    this.clients.forEach((client) => {
      if (client.role === role && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({ event, payload }));
      }
    });
  }

  private findCanteen() {
    // For now, returns the first connected canteen
    return Array.from(this.clients.values()).find(
      (c) => c.role === "LOCAL_CANTEEN",
    );
  }
}

export async function registerCloudWS(app: FastifyInstance) {
  const cloudWS = new CloudWebSocketServer(app);
  await cloudWS.initialize();
}
