import mongoose from "mongoose";

const EscrowSchema = new mongoose.Schema(
  {
    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "usd" },
    status: {
      type: String,
      enum: [
        "PENDING",
        "HELD",
        "RELEASED",
        "REFUNDED",
        "FAILED",
        "CANCELLED",
        "DISPUTED",
        "EXPIRED",
      ],
      default: "PENDING",
    },
    paymentIntentId: { type: String, required: true },
    paymentMethodId: { type: String },

    // Confirmation tracking
    buyerConfirmedAt: { type: Date },
    buyerConfirmationNotes: { type: String },
    sellerConfirmedAt: { type: Date },
    sellerConfirmationNotes: { type: String },

    // Fees and transfer
    platformFeePercentage: { type: Number, default: 3 }, // 3%
    stripeFee: { type: Number }, // Stripe fee: 2.9% + $0.30
    platformFee: { type: Number }, // Platform fee after Stripe fee
    releasedAmount: { type: Number }, // Amount sent to seller after all fees
    stripeTransferId: { type: String },

    // Refund tracking
    refundReason: {
      type: String,
      enum: [
        "DEAL_CANCELED",
        "FRAUD_DETECTED",
        "MUTUAL_AGREEMENT",
        "ITEM_NOT_AS_DESCRIBED",
        "OTHER",
      ],
    },
    refundAmount: { type: Number },
    stripeRefundId: { type: String },
    refundNotes: { type: String },

    // Timeline
    expiresAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },

    // Timeline events
    timeline: [
      {
        event: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        notes: { type: String },
      },
    ],

    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Index for preventing duplicate escrows
EscrowSchema.index({ deal: 1 }, { unique: true });

export interface IEscrow extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  deal: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status:
    | "PENDING"
    | "HELD"
    | "RELEASED"
    | "REFUNDED"
    | "FAILED"
    | "CANCELLED"
    | "DISPUTED"
    | "EXPIRED";
  paymentIntentId: string;
  paymentMethodId?: string;

  buyerConfirmedAt?: Date;
  buyerConfirmationNotes?: string;
  sellerConfirmedAt?: Date;
  sellerConfirmationNotes?: string;

  platformFeePercentage: number;
  platformFee?: number;
  releasedAmount?: number;
  stripeTransferId?: string;

  refundReason?:
    | "DEAL_CANCELED"
    | "FRAUD_DETECTED"
    | "MUTUAL_AGREEMENT"
    | "ITEM_NOT_AS_DESCRIBED"
    | "OTHER";
  refundAmount?: number;
  stripeRefundId?: string;
  refundNotes?: string;

  expiresAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;

  timeline: Array<{
    event: string;
    timestamp: Date;
    userId?: mongoose.Types.ObjectId;
    notes?: string;
  }>;

  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IEscrow>("Escrow", EscrowSchema);
