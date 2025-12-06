import mongoose from "mongoose";

// Rating audit log schema for tracking all rating submissions
const RatingAuditLogSchema = new mongoose.Schema(
  {
    raterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
      index: true,
    },
    ratingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["CREATED", "UPDATED", "DELETED", "FLAGGED", "UNFLAGGED"],
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying audit logs
RatingAuditLogSchema.index({ raterId: 1, createdAt: -1 });
RatingAuditLogSchema.index({ ratingId: 1 });
RatingAuditLogSchema.index({ action: 1, createdAt: -1 });

// Abuse report schema for flagging inappropriate reviews
const AbuseReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rating",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "SPAM",
        "PROFANITY",
        "HARASSMENT",
        "FALSE_INFORMATION",
        "OFF_TOPIC",
        "OTHER",
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    resolution: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate reports
AbuseReportSchema.index({ reporterId: 1, ratingId: 1 }, { unique: true });
AbuseReportSchema.index({ status: 1, createdAt: -1 });

// Rate limit tracking schema
const RateLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    ratingsToday: {
      type: Number,
      default: 0,
    },
    lastRatingDate: {
      type: Date,
      required: true,
    },
    ratingsThisHour: {
      type: Number,
      default: 0,
    },
    lastRatingHour: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export interface IRatingAuditLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  dealId: mongoose.Types.ObjectId;
  ratingId: mongoose.Types.ObjectId;
  action: "CREATED" | "UPDATED" | "DELETED" | "FLAGGED" | "UNFLAGGED";
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAbuseReport extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  ratingId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRateLimit extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ratingsToday: number;
  lastRatingDate: Date;
  ratingsThisHour: number;
  lastRatingHour: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const RatingAuditLog = mongoose.model<IRatingAuditLog>(
  "RatingAuditLog",
  RatingAuditLogSchema
);

export const AbuseReport = mongoose.model<IAbuseReport>(
  "AbuseReport",
  AbuseReportSchema
);

export const RateLimit = mongoose.model<IRateLimit>(
  "RateLimit",
  RateLimitSchema
);
