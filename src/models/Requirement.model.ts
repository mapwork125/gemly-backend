// ...existing code...

import mongoose from "mongoose";

interface IRequirementDetails {
  shape?: string;
  carat?: number;
  color?: string;
  clarity?: string;
  lab?: string;
  location?: string;
  budget?: number;
  startDate: Date;
  endDate: Date;
  [key: string]: any; // Allow additional properties
}

const RequirementSchema = new mongoose.Schema(
  {
    requirementAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startDate: {
      type: Date,
      default: () => new Date(Date.now()), // +1 day
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
    },
    bids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Bid",
      default: [],
    },
    isActive: { type: Boolean, default: true },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export interface IRequirement {
  requirementAdmin: mongoose.Types.ObjectId;
  bids: mongoose.Types.ObjectId[];
  title: string;
  description: string;
  details: IRequirementDetails;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IRequirement>("Requirement", RequirementSchema);
