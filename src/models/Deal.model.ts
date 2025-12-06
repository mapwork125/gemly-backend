import mongoose from "mongoose";
import { DEAL_STATUS } from "../utils/constants.utility";

const DealSchema = new mongoose.Schema(
  {
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
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

    // Pricing
    agreedPrice: { type: Number, required: true },
    currency: { type: String, required: true, default: "USD" },

    // Immutable snapshots
    diamondSnapshot: { type: mongoose.Schema.Types.Mixed },
    requirementSnapshot: { type: mongoose.Schema.Types.Mixed },
    bidSnapshot: { type: mongoose.Schema.Types.Mixed },

    // Deal status
    status: {
      type: String,
      enum: Object.values(DEAL_STATUS),
      default: DEAL_STATUS.DEAL_CREATED,
    },

    // PDF storage
    pdfUrl: { type: String },
    pdfFilePath: { type: String },
    pdfExpiryTime: { type: Date },
    pdf: { type: Buffer },

    // Legacy field
    price: { type: Number },
  },
  {
    timestamps: true,
  }
);

// Index for ensuring one deal per bid
DealSchema.index({ bid: 1 }, { unique: true });

export interface IDeal extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  bid: mongoose.Types.ObjectId;
  requirement: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  agreedPrice: number;
  currency: string;
  diamondSnapshot?: any;
  requirementSnapshot?: any;
  bidSnapshot?: any;
  status: string;
  pdfUrl?: string;
  pdfFilePath?: string;
  pdfExpiryTime?: Date;
  pdf?: Buffer;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IDeal>("Deal", DealSchema);
