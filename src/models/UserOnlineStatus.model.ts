import mongoose from "mongoose";

const UserOnlineStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

UserOnlineStatusSchema.index({ userId: 1 });
UserOnlineStatusSchema.index({ isOnline: 1 });

export interface IUserOnlineStatus extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isOnline: boolean;
  lastSeen: Date;
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IUserOnlineStatus>(
  "UserOnlineStatus",
  UserOnlineStatusSchema
);
