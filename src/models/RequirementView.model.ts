import mongoose from "mongoose";

/**
 * Tracks unique views per requirement per user
 * Prevents duplicate view counting
 */
const RequirementViewSchema = new mongoose.Schema(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for anonymous users
    },
    ipAddress: {
      type: String,
      default: null, // fallback for anonymous users
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one view per user per requirement
RequirementViewSchema.index(
  { requirementId: 1, userId: 1 },
  { unique: true, sparse: true }
);

// Index for IP-based tracking (for anonymous users)
RequirementViewSchema.index({ requirementId: 1, ipAddress: 1 });

export interface IRequirementView extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  requirementId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IRequirementView>(
  "RequirementView",
  RequirementViewSchema
);
