import mongoose, { Schema, Document } from "mongoose";

export interface IAdminLog extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId: mongoose.Types.ObjectId;
  details?: any;
  timestamp: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      "USER_APPROVE",
      "USER_REJECT",
      "USER_SUSPEND",
      "AD_APPROVE",
      "AD_REJECT",
    ],
  },
  resourceType: {
    type: String,
    enum: ["USER", "ADVERTISEMENT"],
    required: true,
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  details: {
    type: Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for efficient querying
AdminLogSchema.index({ adminId: 1, timestamp: -1 });
AdminLogSchema.index({ resourceType: 1, resourceId: 1 });

export default mongoose.model<IAdminLog>("AdminLog", AdminLogSchema);
