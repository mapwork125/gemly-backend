import mongoose from "mongoose";
const InventorySchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    description: String,
    quantity: Number,
    price: Number,
    sku: String,
    details: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["on_memo", "in_locker", "sold"],
      default: "in_locker",
    },
    barcode: String,
  },
  {
    timestamps: true,
  }
);

export interface IInventory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  description: string;
  quantity: number;
  price: number;
  sku: string;
  details: any;
  status: "on_memo" | "in_locker" | "sold";
  barcode: string;
  createdAt: Date;
}

export default mongoose.model("Inventory", InventorySchema);
