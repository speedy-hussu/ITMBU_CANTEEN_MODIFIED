// database/models/menuTemplate.model.ts
import mongoose from "mongoose";
import cloudDB from "../connections/cloudDB.connection";

const menuTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Regular Menu", "Special Menu"
    dayOfWeek: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    mealType: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Snacks", "Dinner"],
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        specialPrice: { type: Number }, // Optional special price for this day/meal
      },
    ],
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups by day and meal type
menuTemplateSchema.index({ dayOfWeek: 1, mealType: 1, isActive: 1 });

const MenuTemplate = cloudDB.model("MenuTemplate", menuTemplateSchema);

export default MenuTemplate;
