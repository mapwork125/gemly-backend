import mongoose from "mongoose";
import { BID_STATUS } from "../utils/constants.utility";

const BidSchema = new mongoose.Schema(
  {
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // BID STATUS
    status: {
      type: String,
      enum: [
        BID_STATUS.ACCEPTED,
        BID_STATUS.PENDING,
        BID_STATUS.REJECTED,
        BID_STATUS.WITHDRAWN,
      ],
      default: BID_STATUS.PENDING,
    },

    // PRICING INFORMATION
    bidAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "USD" },
    pricePerCarat: { type: Number },
    negotiable: { type: Boolean, required: true, default: false },
    negotiationNote: { type: String, maxlength: 500 },

    // DELIVERY TERMS
    deliveryDays: { type: Number, required: true, min: 1 },
    canMeetDeadline: { type: Boolean, required: true },
    shippingMethod: { type: String },
    shippingCost: { type: Number, min: 0 },
    shippingIncluded: { type: Boolean, required: true, default: false },
    insuranceIncluded: { type: Boolean, required: true, default: false },
    insuranceCost: { type: Number, min: 0 },

    // PAYMENT TERMS
    paymentTerms: { type: String, required: true, maxlength: 500 },
    acceptedPaymentMethods: { type: [String], required: true },
    depositRequired: { type: Boolean, required: true, default: false },
    depositAmount: { type: Number, min: 0 },
    depositPercentage: { type: Number, min: 0, max: 100 },

    // DIAMOND DETAILS
    diamondType: { type: String, required: true },
    caratWeight: { type: Number, required: true, min: 0.01 },
    shape: { type: String, required: true },
    cutGrade: { type: String, required: true },
    colorGrade: { type: String },
    clarityGrade: { type: String, required: true },
    certificateLab: { type: String },
    certificateNumber: { type: String },
    certificateUrl: { type: String },
    certificateDate: { type: Date },
    hasInscription: { type: Boolean, default: false },
    inscriptionText: { type: String },

    // DIAMOND SPECIFICATIONS
    polish: { type: String },
    symmetry: { type: String },
    fluorescence: { type: String },
    fluorescenceColor: { type: String },
    depthPercent: { type: Number, min: 0, max: 100 },
    tablePercent: { type: Number, min: 0, max: 100 },
    measurements: { type: String },

    // ADDITIONAL DETAILS
    treatmentStatus: { type: String },
    origin: { type: String },
    eyeClean: { type: Boolean },
    videoUrl: { type: String },
    imagesUrls: { type: [String] },

    // SELLER INFORMATION
    companyName: { type: String, required: true, maxlength: 200 },
    contactPerson: { type: String, required: true, maxlength: 100 },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    businessAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    businessRegistration: { type: String },
    yearsInBusiness: { type: Number, min: 0 },
    website: { type: String },

    // GUARANTEES & POLICIES
    returnPolicy: { type: String, required: true, maxlength: 1000 },
    warranty: { type: String, maxlength: 1000 },
    gradeGuarantee: { type: Boolean, required: true, default: false },
    buybackPolicy: { type: String, maxlength: 500 },

    // ADDITIONAL NOTES
    additionalNotes: { type: String, maxlength: 2000 },
    specialOffers: { type: String, maxlength: 500 },

    // REFERENCES
    previousSales: { type: Number, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    references: [
      {
        name: String,
        contact: String,
        testimonial: String,
      },
    ],

    // AVAILABILITY
    stockStatus: { type: String, required: true },
    locationOfDiamond: { type: String, required: true },
    canViewInPerson: { type: Boolean, required: true, default: false },
    viewingLocations: { type: [String] },

    // TERMS & CONDITIONS
    agreedToTerms: { type: Boolean, required: true, default: false },
    validUntil: { type: Date },

    // LEGACY FIELDS (for backward compatibility)
    price: { type: Number }, // deprecated, use bidAmount
    proposal: { type: String }, // deprecated, use additionalNotes
    isSeen: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export interface IBid extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  bidder: mongoose.Types.ObjectId;

  // BID STATUS
  status: BID_STATUS;

  // PRICING INFORMATION
  bidAmount: number;
  currency: string;
  pricePerCarat?: number;
  negotiable: boolean;
  negotiationNote?: string;

  // DELIVERY TERMS
  deliveryDays: number;
  canMeetDeadline: boolean;
  shippingMethod?: string;
  shippingCost?: number;
  shippingIncluded: boolean;
  insuranceIncluded: boolean;
  insuranceCost?: number;

  // PAYMENT TERMS
  paymentTerms: string;
  acceptedPaymentMethods: string[];
  depositRequired: boolean;
  depositAmount?: number;
  depositPercentage?: number;

  // DIAMOND DETAILS
  diamondType: string;
  caratWeight: number;
  shape: string;
  cutGrade: string;
  colorGrade?: string;
  clarityGrade: string;
  certificateLab?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  certificateDate?: Date;
  hasInscription?: boolean;
  inscriptionText?: string;

  // DIAMOND SPECIFICATIONS
  polish?: string;
  symmetry?: string;
  fluorescence?: string;
  fluorescenceColor?: string;
  depthPercent?: number;
  tablePercent?: number;
  measurements?: string;

  // ADDITIONAL DETAILS
  treatmentStatus?: string;
  origin?: string;
  eyeClean?: boolean;
  videoUrl?: string;
  imagesUrls?: string[];

  // SELLER INFORMATION
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
  };
  businessRegistration?: string;
  yearsInBusiness?: number;
  website?: string;

  // GUARANTEES & POLICIES
  returnPolicy: string;
  warranty?: string;
  gradeGuarantee: boolean;
  buybackPolicy?: string;

  // ADDITIONAL NOTES
  additionalNotes?: string;
  specialOffers?: string;

  // REFERENCES
  previousSales?: number;
  rating?: number;
  references?: {
    name: string;
    contact: string;
    testimonial: string;
  }[];

  // AVAILABILITY
  stockStatus: string;
  locationOfDiamond: string;
  canViewInPerson: boolean;
  viewingLocations?: string[];

  // TERMS & CONDITIONS
  agreedToTerms: boolean;
  validUntil?: Date;

  // LEGACY
  price?: number;
  proposal?: string;
  isSeen: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IBid>("Bid", BidSchema);
