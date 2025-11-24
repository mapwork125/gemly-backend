import mongoose from "mongoose";
import { USER_TYPE } from "../utils/constants.utility";

interface IKYC {
  documentType?: string;
  documentNumber?: string;
  documentUrl?: string;
  status?: "pending" | "approved" | "rejected";
  verifiedAt?: Date;
  [key: string]: any;
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: Object.values(USER_TYPE),
      default: USER_TYPE.USER,
    },
    isVerified: { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true },
    kyc: mongoose.Schema.Types.Mixed,
    fcmToken: { type: String },
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export interface IUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: string;
  isVerified: boolean;
  notificationsEnabled: boolean;
  kyc?: IKYC;
  fcmToken?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IUser>("User", UserSchema);
