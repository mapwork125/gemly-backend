import mongoose from "mongoose";

/**
 * Notification Queue Model
 * Stores notifications that need to be sent later based on frequency settings
 */
const NotificationQueueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ["Instant", "Hourly", "Daily", "Weekly"],
      required: true,
      index: true,
    },
    notifications: [
      {
        title: String,
        message: String,
        actionUrl: String,
        type: String,
        category: String,
        data: mongoose.Schema.Types.Mixed,
        queuedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    sent: {
      type: Boolean,
      default: false,
      index: true,
    },
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
NotificationQueueSchema.index({ userId: 1, frequency: 1, sent: 1 });
NotificationQueueSchema.index({ scheduledFor: 1, sent: 1 });

export interface INotificationQueue extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  frequency: "Instant" | "Hourly" | "Daily" | "Weekly";
  notifications: Array<{
    title: string;
    message: string;
    actionUrl?: string;
    type: string;
    category: string;
    data?: any;
    queuedAt: Date;
  }>;
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<INotificationQueue>(
  "NotificationQueue",
  NotificationQueueSchema
);
