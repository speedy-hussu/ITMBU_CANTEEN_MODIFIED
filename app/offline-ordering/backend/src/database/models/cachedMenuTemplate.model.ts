import mongoose from "mongoose";
import connectDB from "../connections/localDB.connection";

// Schema for cached menu items
const cachedMenuItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  specialPrice: { type: Number },
  originalPrice: { type: Number },
});

// Schema for cached menu templates (stored in local DB)
const cachedMenuTemplateSchema = new mongoose.Schema(
  {
    cloudTemplateId: { type: String, required: true, unique: true },
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
    items: [cachedMenuItemSchema],
    isActive: { type: Boolean, default: true },
    description: { type: String },
    cachedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

cachedMenuTemplateSchema.index({ dayOfWeek: 1, mealType: 1, isActive: 1 });
cachedMenuTemplateSchema.index({ cachedAt: 1 });

// Create model on local database connection
let CachedMenuTemplate: mongoose.Model<any>;

try {
  CachedMenuTemplate = mongoose.model("CachedMenuTemplate");
} catch {
  CachedMenuTemplate = mongoose.model("CachedMenuTemplate", cachedMenuTemplateSchema);
}

export default CachedMenuTemplate;
