import mongoose from "mongoose";

const InventoryAuditLogSchema = new mongoose.Schema(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "ITEM_CREATED",
        "STATUS_CHANGED",
        "PRICE_UPDATED",
        "LOCATION_CHANGED",
        "ITEM_UPDATED",
        "ITEM_DELETED",
        "QUICK_STATUS_UPDATE",
        "PHOTOS_ADDED",
      ],
      required: true,
      index: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    scannedVia: {
      type: String,
      enum: ["WEB", "MOBILE_BARCODE", "MOBILE_QR", "API"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
InventoryAuditLogSchema.index({ inventoryId: 1, createdAt: -1 });
InventoryAuditLogSchema.index({ userId: 1, createdAt: -1 });
InventoryAuditLogSchema.index({ action: 1, createdAt: -1 });

export interface IInventoryAuditLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  inventoryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  scannedVia?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IInventoryAuditLog>(
  "InventoryAuditLog",
  InventoryAuditLogSchema
);
