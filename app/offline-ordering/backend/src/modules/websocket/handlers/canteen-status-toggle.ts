import { CloudBridge } from "../gateway/cloud.gateway";
import { ClientMeta } from "../shared/types";
import type { WebSocket } from "ws";

export async function handleCanteenStatusToggle(
  socket: WebSocket,
  payload: any,
  meta: ClientMeta,
) {
  console.log("Canteen status toggle handler called:", { payload, meta });

  // Security check - only KDS can toggle
  if (meta.role !== "KDS") {
    console.log("Unauthorized canteen toggle attempt from:", meta.role);
    const errorMsg = {
      event: "error",
      payload: {
        message: "Unauthorized: Only KDS can toggle canteen status",
        code: "UNAUTHORIZED",
      },
    };
    return socket.send(JSON.stringify(errorMsg));
  }

  // Execute toggle
  const isPaused = CloudBridge.getInstance().toggleCloudSync();

  // Send response back to KDS
  const response = {
    event: "cloud_status",
    payload: {
      connected: !isPaused,
    },
  };

  socket.send(JSON.stringify(response));
}
