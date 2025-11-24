import mongoose from "mongoose";
const EscrowSchema = new mongoose.Schema(
  {
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    amount: Number,
    status: {
      type: String,
      enum: ["held", "released", "refunded", "failed", "canceled"],
      default: "held",
    },
    paymentIntentId: { type: String, required: true },
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export interface IEscrow extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  deal: mongoose.Types.ObjectId;
  amount: number;
  status: "held" | "released" | "refunded" | "failed" | "canceled";
  paymentIntentId: string;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Escrow", EscrowSchema);
