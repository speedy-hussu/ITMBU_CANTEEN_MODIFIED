import mongoose from "mongoose";
import { cloudDB } from "../connections/cloudDB.connection";

const menuTemplateItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  specialPrice: { type: Number },
});

const menuTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    mealType: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Snacks", "Dinner"],
    },
    items: [menuTemplateItemSchema],
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  {
    timestamps: true,
  },
);

menuTemplateSchema.index({ dayOfWeek: 1, mealType: 1, isActive: 1 });

export default cloudDB.model("MenuTemplate", menuTemplateSchema);
