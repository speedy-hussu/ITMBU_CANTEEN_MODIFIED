import { CanteenMode } from "@shared/types";
import { CloudWSManager } from "../ws-manager";

export function handleCanteenStatus(
  payload: { mode: CanteenMode },
  manager: CloudWSManager,
) {
  console.log(`🏪 Cloud: Received canteen status update: ${payload.mode}`);

  // Update the mode in the manager
  manager.setCanteenMode(payload.mode);

  // Broadcast to all connected users
  manager.broadcastToRole("USER", "canteen_status", {
    mode: payload.mode,
    timestamp: Date.now(),
  });

  console.log(`📢 Cloud: Broadcasted canteen mode ${payload.mode} to users`);
}
