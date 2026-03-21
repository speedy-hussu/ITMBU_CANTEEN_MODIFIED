import { cloudDB } from "../../database/connections/cloudDB.connection";
import { OrderModel as LocalOrder } from "../../database/models/order.model";

export class OrderSync {
  private static isSyncing = false;
  private static SYNC_INTERVAL = 30000; // 30 Seconds

  // Define the Cloud Model using the cloud connection
  private static CloudOrder = cloudDB.model("Order", LocalOrder.schema);

  static async startHeartbeat() {
    try {
      await this.syncToAtlas();
    } finally {
      // Schedule next run 30s after the current one finishes
      setTimeout(() => this.startHeartbeat(), this.SYNC_INTERVAL);
    }
  }

  private static async syncToAtlas() {
    // 1. Safety Checks
    if (this.isSyncing) return;
    if (cloudDB.readyState !== 1) {
      console.warn("☁️ Atlas Sync Skipped: Cloud DB not connected.");
      return;
    }

    this.isSyncing = true;

    try {
      // 2. Fetch up to 50 unsynced orders from Local DB
      const pendingOrders = await LocalOrder.find({ isSyncedToCloudDB: false })
        .limit(50)
        .lean();

      if (pendingOrders.length === 0) return;

      console.log(`📤 Pushing ${pendingOrders.length} orders to Atlas...`);

      // 3. Prepare Bulk Operations (Upsert based on _id)
      const ops = pendingOrders.map((order) => {
        const { _id, id, ...orderData } = order; // Exclude _id and id
        return {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                ...orderData,
                isSyncedToCloudDB: true,
                lastSyncedAt: new Date().toISOString(),
              },
            },
            upsert: true,
          },
        };
      });

      // 4. Execute on Atlas
      await this.CloudOrder.bulkWrite(ops);

      // 5. Update Local Status ONLY after Atlas confirms success
      const orderIds = pendingOrders.map((o) => o._id);
      await LocalOrder.updateMany(
        { _id: { $in: orderIds } },
        { $set: { isSyncedToCloudDB: true } },
      );

      console.log(`✅ Successfully synced ${orderIds.length} orders.`);
    } catch (error) {
      console.error("❌ Direct Sync Error:", error);
    } finally {
      this.isSyncing = false;
    }
  }
}
