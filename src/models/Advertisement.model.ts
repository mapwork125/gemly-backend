import mongoose, { Schema, Document } from "mongoose";

export interface IAdvertisement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  duration: number;
  placement: string;
  status: string;
  estimatedCost: number;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  impressions: number;
  clicks: number;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
      trim: true,
    },
    imageUrl: {
      type: String, // Base64 image
      required: true,
    },
    linkUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Invalid URL format",
      },
    },
    duration: {
      type: Number,
      required: true,
      min: 7,
      max: 90,
    },
    placement: {
      type: String,
      enum: ["HOME_BANNER", "SEARCH_SIDEBAR", "LISTING_TOP", "FOOTER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
AdvertisementSchema.index({ status: 1, startDate: 1 });
AdvertisementSchema.index({ userId: 1, status: 1 });
AdvertisementSchema.index({ endDate: 1 });
AdvertisementSchema.index({ placement: 1, status: 1 });
AdvertisementSchema.index({ priority: -1, startDate: -1 });

export default mongoose.model<IAdvertisement>(
  "Advertisement",
  AdvertisementSchema
);
