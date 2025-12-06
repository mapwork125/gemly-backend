import mongoose from "mongoose";

// Badge progress interface
export interface IBadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

// Badge schema
const BadgeSchema = new mongoose.Schema(
  {
    badgeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"],
      required: true,
    },
    criteria: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// User badge schema (tracks which badges users have earned)
const UserBadgeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    badgeId: {
      type: String,
      required: true,
      index: true,
    },
    earnedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    progress: {
      current: { type: Number, default: 0 },
      target: { type: Number, required: true },
      percentage: { type: Number, default: 0 },
    },
    isEarned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate badges per user
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export interface IBadge extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
  criteria: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  badgeId: string;
  earnedAt: Date;
  progress: IBadgeProgress;
  isEarned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Badge = mongoose.model<IBadge>("Badge", BadgeSchema);
export const UserBadge = mongoose.model<IUserBadge>(
  "UserBadge",
  UserBadgeSchema
);
