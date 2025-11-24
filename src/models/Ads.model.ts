import mongoose from "mongoose";

const AdsSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    price: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export interface IAds extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  requester: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  status: "pending" | "approved" | "rejected";
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IAds>("Ad", AdsSchema);
