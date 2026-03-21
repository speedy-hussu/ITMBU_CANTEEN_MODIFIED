// offline/backend/src/utils/order.utils.ts

import { OrderModel } from "src/database/models/order.model";

export const OrderUtils = {
  async getActiveCloudOrdersCount(): Promise<number> {
    return await OrderModel.countDocuments({
      source: "CLOUD", 
      status: "IN QUEUE",
    });
  },

  async getTotalActiveOrdersCount(): Promise<number> {
    return await OrderModel.countDocuments({
      status: "IN QUEUE",
    });
  },
};
