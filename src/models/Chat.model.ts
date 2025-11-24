import mongoose from "mongoose";
const MessageSchema = new mongoose.Schema(
  {
    conversationId: String,
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    read: { type: mongoose.Schema.Types.Boolean, default: false },
    text: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export interface IMessage extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  conversationId: string;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model("Message", MessageSchema);
