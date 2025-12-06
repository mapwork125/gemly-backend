import mongoose from "mongoose";

const DiamondDetailsSchema = new mongoose.Schema(
  {
    carat: { type: Number, required: true, min: 0.01, max: 100 },
    cut: {
      type: String,
      enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"],
      required: true,
    },
    color: {
      type: String,
      enum: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
      required: true,
    },
    clarity: {
      type: String,
      enum: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"],
      required: true,
    },
    shape: {
      type: String,
      enum: [
        "ROUND",
        "PRINCESS",
        "CUSHION",
        "EMERALD",
        "OVAL",
        "RADIANT",
        "ASSCHER",
        "MARQUISE",
        "HEART",
        "PEAR",
      ],
      required: true,
    },
    certificate: {
      type: String,
      enum: ["GIA", "IGI", "AGS", "HRD", "EGL", "NONE"],
      required: true,
    },
    certificateNumber: { type: String, maxlength: 50 },
  },
  { _id: false }
);

const PricingSchema = new mongoose.Schema(
  {
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR"],
      default: "USD",
    },
  },
  { _id: false }
);

const InventorySchema = new mongoose.Schema(
  {
    inventoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    barcodeImage: {
      type: String, // Base64 encoded PNG
      required: true,
    },
    diamondDetails: {
      type: DiamondDetailsSchema,
      required: true,
    },
    pricing: {
      type: PricingSchema,
      required: true,
    },
    location: {
      type: String,
      required: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: [
        "IN_LOCKER",
        "ON_MEMO",
        "SOLD",
        "IN_REPAIR",
        "IN_TRANSIT",
        "RETURNED",
        "RESERVED",
        "PENDING_CERTIFICATION",
      ],
      default: "IN_LOCKER",
      index: true,
    },
    photos: {
      type: [String], // Array of base64 image strings
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10; // Max 10 photos
        },
        message: "Maximum 10 photos allowed",
      },
      default: [],
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    soldAt: Date,
    soldTo: String,
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletionReason: {
      type: String,
      enum: ["DAMAGED", "LOST", "STOLEN", "RETURNED_TO_SUPPLIER", "OTHER"],
    },
    deletionNotes: String,

    // Legacy fields for backward compatibility
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    description: String,
    quantity: Number,
    price: Number,
    sku: String,
    details: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
InventorySchema.index({ userId: 1, status: 1 });
InventorySchema.index({ "diamondDetails.carat": 1 });
InventorySchema.index({ "diamondDetails.certificateNumber": 1 });
InventorySchema.index({ createdAt: -1 });
InventorySchema.index({ deletedAt: 1 });
InventorySchema.index({ barcode: 1, userId: 1 });

export interface IInventory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  inventoryId: string;
  barcode: string;
  barcodeImage: string;
  diamondDetails: {
    carat: number;
    cut: string;
    color: string;
    clarity: string;
    shape: string;
    certificate: string;
    certificateNumber?: string;
  };
  pricing: {
    costPrice: number;
    sellingPrice: number;
    currency: string;
  };
  location: string;
  status: string;
  photos: string[];
  notes?: string;
  userId: mongoose.Types.ObjectId;
  soldAt?: Date;
  soldTo?: string;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  deletionReason?: string;
  deletionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Legacy fields
  createdBy?: mongoose.Types.ObjectId;
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  sku?: string;
  details?: any;
}

export default mongoose.model<IInventory>("Inventory", InventorySchema);
