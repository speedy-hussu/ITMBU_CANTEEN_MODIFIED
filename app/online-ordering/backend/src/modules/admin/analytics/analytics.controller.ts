import { FastifyRequest, FastifyReply } from "fastify";
import Order from "../../../database/models/order.model";

// GET /api/admin/analytics - Get business analytics
export const getAnalyticsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    // Basic aggregation for total revenue and total orders
    const result = await Order.aggregate([
      {
        $match: {
          status: { $in: ["DELIVERED", "COMPLETED", "READY", "IN QUEUE"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalItemsSold: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.quantity"] }
              }
            }
          }
        },
      },
    ]);

    // Aggregate orders by status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = result.length > 0 ? result[0] : { totalRevenue: 0, totalOrders: 0, totalItemsSold: 0 };
    
    // Format status
    const ordersByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return reply.send({
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      totalItemsSold: stats.totalItemsSold,
      ordersByStatus,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ message: "Failed to fetch analytics" });
  }
};
