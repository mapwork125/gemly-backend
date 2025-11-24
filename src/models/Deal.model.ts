import mongoose from "mongoose";
const DealSchema = new mongoose.Schema(
  {
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
    requirement: { type: mongoose.Schema.Types.ObjectId, ref: "Requirement" },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    price: Number,
    status: { type: String, default: "created" },
    pdf: Buffer,
  },
  {
    timestamps: true,
  }
);

export interface IDeal extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  bid: mongoose.Types.ObjectId;
  requirement: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  price: number;
  status: string;
  pdf?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Deal", DealSchema);
