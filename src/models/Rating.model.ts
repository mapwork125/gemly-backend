import mongoose from "mongoose";

// Category ratings interface
export interface IRatingCategories {
  communication: number;
  productQuality: number;
  delivery: number;
  pricing: number;
  professionalism: number;
}

const RatingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    raterId: {
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    categories: {
      communication: { type: Number, min: 1, max: 5 },
      productQuality: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      pricing: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },
    review: {
      type: String,
      minlength: 10,
      maxlength: 1000,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    // Legacy fields (for backward compatibility)
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    score: Number,
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate ratings for the same deal
RatingSchema.index({ dealId: 1, raterId: 1 }, { unique: true });

// Index for efficient queries
RatingSchema.index({ userId: 1, createdAt: -1 });
RatingSchema.index({ raterId: 1, createdAt: -1 });

export interface IRating extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  raterId: mongoose.Types.ObjectId;
  dealId: mongoose.Types.ObjectId;
  rating: number;
  categories: IRatingCategories;
  review?: string;
  isAnonymous: boolean;
  // Legacy fields
  target?: mongoose.Types.ObjectId;
  rater?: mongoose.Types.ObjectId;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IRating>("Rating", RatingSchema);
