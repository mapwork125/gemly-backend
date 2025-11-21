import mongoose from "mongoose";
const EscrowSchema = new mongoose.Schema({
  deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
  amount: Number,
  status: {
    type: String,
    enum: ["held", "released", "refunded", "failed", "canceled"],
    default: "held",
  },
  paymentIntentId: { type: String, required: true },
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Escrow", EscrowSchema);
