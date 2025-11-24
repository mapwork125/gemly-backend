import mongoose from "mongoose";

const BidSchema = new mongoose.Schema(
  {
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    price: Number,
    proposal: String,
    isSeen: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export interface IBid extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  bidder: mongoose.Types.ObjectId;
  price: number;
  proposal: string;
  isSeen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IBid>("Bid", BidSchema);
