// online/backend/src/database/models/user.model.ts
import { Schema } from "mongoose";
import cloudDB from "../connections/cloudDB.connection"; // Path to your cloudDB file

const userSchema = new Schema({
  enrollmentId: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "STUDENT" },
});

export const User = cloudDB.model("User", userSchema);
