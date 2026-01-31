import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["PREPARING", "REJECTED", "PREPARED"],
      default: "PREPARING",
    },
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: any[]) => items && items.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      // 👽 Updated to match your shared types logic
      enum: ["IN QUEUE", "COMPLETED", "CANCELLED", "NOT RECEIVED"],
      default: "IN QUEUE",
      required: true,
      index: true,
    },
    source: {
      type: String,
      // 👽 Updated to match your "Offline/Online" folder structure
      enum: ["LOCAL", "CLOUD"],
      required: true,
    },
    isSyncedToCloudDB: {
      type: Boolean,
      default: false,
    },
    createdAt: { type: String, required: true },
    completedAt: { type: String, required: false },
  },
  {
    timestamps: false,
  },
);

export const OrderModel =
  mongoose.models.CanteenOrder ||
  mongoose.model("CanteenOrder", OrderSchema, "CanteenOrders");
