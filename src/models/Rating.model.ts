import mongoose from "mongoose";
const RatingSchema = new mongoose.Schema(
  {
    target: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rater: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    score: Number,
    review: String,
  },
  {
    timestamps: true,
  }
);

export interface IRating extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  rater: mongoose.Types.ObjectId;
  score: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Rating", RatingSchema);
