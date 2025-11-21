import mongoose from "mongoose";
const RequirementSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    details: mongoose.Schema.Types.Mixed,
    deadline: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Requirement", RequirementSchema);
