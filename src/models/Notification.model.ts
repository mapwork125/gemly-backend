import mongoose from "mongoose";
const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    body: String,
    type: { type: String, enum: ["business", "general"], default: "general" },
    read: { type: Boolean, default: false },
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export interface INotification extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: "business" | "general";
  read: boolean;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Notification", NotificationSchema);
