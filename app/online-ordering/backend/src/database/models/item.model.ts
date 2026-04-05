// database/models/item.model.ts
import mongoose from "mongoose";
import cloudDB from "../connections/cloudDB.connection"; // Import your connection

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, 
    price: Number,
    category: { type: String, default: "Dish" },
    isAvailable: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// ⚠️ CRITICAL: Use cloudDB instead of mongoose.model()
const Item = cloudDB.model("Item", itemSchema);

export default Item;
