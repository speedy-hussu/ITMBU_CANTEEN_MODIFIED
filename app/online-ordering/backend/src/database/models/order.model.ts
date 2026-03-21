import mongoose from "mongoose";
import cloudDB from "../connections/cloudDB.connection";

const itemSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ["PENDING", "PREPARED", "REJECTED"], default: "PENDING" },
});

const orderSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  enrollmentId: { type: String, required: true, index: true },
  items: [itemSchema],
  totalAmount: { type: Number, required: true },
  refundedAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["IN QUEUE", "READY", "DELIVERED", "CANCELLED", "NOT RECEIVED"],
    default: "IN QUEUE",
  },
  source: { type: String, enum: ["LOCAL", "CLOUD"], default: "CLOUD" },
  isSyncedToCloudDB: { type: Boolean, default: true },
  createdAt: { type: String, required: true },
  readyAt: { type: String },
  lastSyncedAt: { type: String },
});

const Order = cloudDB.model("Order", orderSchema);

export default Order;
