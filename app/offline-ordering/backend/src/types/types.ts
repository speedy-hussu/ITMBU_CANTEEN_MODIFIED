export type CanteenMode = "ONLINE" | "DRAINING" | "OFFLINE";

export interface SystemStatus {
  isCloudConnected: boolean;
  canteenMode: CanteenMode;
}
