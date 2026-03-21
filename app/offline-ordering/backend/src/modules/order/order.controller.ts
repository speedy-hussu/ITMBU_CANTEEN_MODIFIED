import { FastifyRequest, FastifyReply } from "fastify";
import { OrderModel } from "../../database/models/order.model";

// Get all orders for current day
export async function getActiveOrders(req: FastifyRequest, res: FastifyReply) {
  try {
    // Get start and end of current day
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const orders = await OrderModel.find({
      createdAt: {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString(),
      },
    }).sort({ createdAt: -1 });

    return res.send({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("[OrderController] Error fetching orders:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}

// Get orders by status
export async function getOrdersByStatus(
  req: FastifyRequest<{ Querystring: { status: string } }>,
  res: FastifyReply,
) {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const orders = await OrderModel.find(query).sort({ createdAt: -1 });

    return res.send({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("[OrderController] Error fetching orders:", error);
    return res.status(500).send({
      success: false,
      message: "Failed to fetch orders",
    });
  }
}
