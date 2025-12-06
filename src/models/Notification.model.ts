import mongoose from "mongoose";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
} from "../utils/constants.utility";
const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    message: String,
    actionUrl: String,
    type: {
      type: String,
      enum: [
        NOTIFICATION_TYPE.GENERAL,
        NOTIFICATION_TYPE.BID,
        NOTIFICATION_TYPE.CHAT,
        NOTIFICATION_TYPE.DEAL,
        NOTIFICATION_TYPE.SYSTEM,
        NOTIFICATION_TYPE.REQUIREMENT,
      ],
      default: NOTIFICATION_TYPE.GENERAL,
    },
    category: {
      type: String,
      enum: [NOTIFICATION_CATEGORY.ACTIONABLE, NOTIFICATION_CATEGORY.GENERAL],
      default: NOTIFICATION_CATEGORY.GENERAL,
    },
    read: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export interface INotification extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  actionUrl?: string;
  type: NOTIFICATION_TYPE;
  read: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Notification", NotificationSchema);
