import { CanteenMode } from "src/types/types";
import { CloudBridge } from "../gateway/cloud.gateway";
import { ClientMeta } from "../shared/types";
import { OrderUtils } from "../utils/util";
import { WSManager } from "../ws.manager";
import type { WebSocket } from "ws";

export async function handleKdsModeSwitch(
  socket: WebSocket,
  payload: any,
  meta: ClientMeta,
) {
  // Security check - only KDS can toggle
  if (meta.role !== "KDS") {
    return socket.send(
      JSON.stringify({
        event: "error",
        payload: { message: "Only KDS can toggle canteen mode" },
      }),
    );
  }

  const cloudBridge = CloudBridge.getInstance();

  const currentMode = cloudBridge.getCanteenMode();
  console.log(`🔄 Toggle requested. Current mode: ${currentMode}`);

  // Determine target mode: use provided mode or toggle
  const targetMode: CanteenMode =
    payload?.mode || (currentMode === "ONLINE" ? "OFFLINE" : "ONLINE");

  // If trying to go OFFLINE, check for active cloud orders
  if (targetMode === "OFFLINE" && currentMode !== "OFFLINE") {
    const cloudOrdersLeft = await OrderUtils.getActiveCloudOrdersCount();

    if (cloudOrdersLeft > 0) {
      console.log(
        `⏳ ${cloudOrdersLeft} Cloud orders pending. Entering DRAINING...`,
      );
      cloudBridge.updateCanteenMode("DRAINING");

      // Broadcast to all KDS
      WSManager.getInstance().broadcastToRole("KDS", {
        event: "canteen_status",
        payload: {
          mode: "DRAINING",
          message: `Finishing ${cloudOrdersLeft} cloud orders before disconnect.`,
          timestamp: Date.now(),
        },
      });
      return;
    }
  }

  // Proceed with requested mode
  console.log(`✅ Switching to ${targetMode}`);
  cloudBridge.updateCanteenMode(targetMode);

  // Broadcast to all KDS
  WSManager.getInstance().broadcastToRole("KDS", {
    event: "canteen_status",
    payload: {
      mode: targetMode,
      message:
        targetMode === "OFFLINE"
          ? "Disconnected from cloud"
          : "Connected to cloud",
      timestamp: Date.now(),
    },
  });
}
