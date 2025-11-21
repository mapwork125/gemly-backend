import mongoose from "mongoose";
import { USER_TYPE } from "../utils/constants.utility";

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
    kyc: mongoose.Schema.Types.Mixed,
    fcmToken: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);
