// ...existing code...

import mongoose from "mongoose";
import {
  COLOR_DISTRIBUTION,
  COLOR_ORIGIN,
  COLOR_TYPE,
  DIAMOND_TYPE,
  LAB_GROWN_TYPE,
  STATUS,
  TREATMENT_STATUS,
} from "../utils/constants.utility";

interface IRequirementDetails {
  // DIAMOND TYPE & ORIGIN
  diamondType: DIAMOND_TYPE; // required
  labGrownMethod?: LAB_GROWN_TYPE; // required if Lab-Grown
  treatmentStatus?: TREATMENT_STATUS; // optional
  treatmentTypes?: string[]; // optional
  originCountry?: string[]; // array of country codes, optional
  mineOrigin?: string[]; // array of mine names, optional

  // CERTIFICATION
  certified: boolean; // required
  preferredLabs?: string[]; // optional
  requiresInscription?: boolean; // optional

  // SHAPE
  shapes: string[]; // required, min 1

  // CARAT WEIGHT
  caratMin: number; // required, min 0.01
  caratMax: number; // required, >= caratMin

  // MEASUREMENTS
  measurements?: {
    lengthMin?: number; // in mm, optional
    lengthMax?: number; // in mm, optional
    widthMin?: number; // in mm, optional
    widthMax?: number; // in mm, optional
    depthMin?: number; // in mm, optional
    depthMax?: number; // in mm, optional
    lengthWidthRatioMin?: number; // optional
    lengthWidthRatioMax?: number; // optional
  };

  // CUT QUALITY
  cutGrades: string[]; // required
  polish?: string[]; // optional
  symmetry?: string[]; // optional

  // PROPORTIONS (Advanced)
  depthPercentMin?: number; // 0-100, optional
  depthPercentMax?: number; // 0-100, optional
  tablePercentMin?: number; // 0-100, optional
  tablePercentMax?: number; // 0-100, optional
  crownAngleMin?: number; // in degrees, optional
  crownAngleMax?: number; // in degrees, optional
  crownHeightMin?: number; // percentage, optional
  crownHeightMax?: number; // percentage, optional
  pavilionAngleMin?: number; // in degrees, optional
  pavilionAngleMax?: number; // in degrees, optional
  pavilionDepthMin?: number; // percentage, optional
  pavilionDepthMax?: number; // percentage, optional
  girdleThickness?: string[]; // optional
  culetSize?: string[]; // optional

  // COLOR GRADING
  colorType: COLOR_TYPE; // required
  colorGrades?: string[]; // required if Standard
  fancyColorGrades?: {
    intensity: string; // required
    modifier?: string; // optional
    primaryHue: string; // required
    secondaryHue?: string; // optional
  }[]; // array of objects, required if Fancy
  colorOrigin?: COLOR_ORIGIN; // optional
  colorDistribution?: COLOR_DISTRIBUTION; // optional

  // CLARITY
  clarityGrades: string[]; // required
  eyeClean?: boolean; // optional
  inclusionTypes?: string[]; // optional

  // FLUORESCENCE
  fluorescence?: string[]; // optional
  fluorescenceColor?: string[]; // optional

  // OPTICAL PROPERTIES
  brilliance?: string; // optional
  fire?: string; // optional
  scintillation?: string; // optional

  // BUDGET
  budgetMin?: number; // optional
  budgetMax?: number; // optional, >= budgetMin
  currency?: string; // optional, default USD
  pricePerCarat?: boolean; // optional

  // ETHICAL & SOURCING
  conflictFree?: boolean; // optional
  ethicalSourcing?: boolean; // optional
  sustainabilityPreference?: string; // optional

  // SETTING & PURPOSE
  intendedUse?: string; // optional
  settingType?: string; // optional
  metalType?: string[]; // optional

  // LOCATION & DELIVERY
  locationPreference?: {
    countries?: string[]; // optional
    cities?: string[]; // optional
    regions?: string[]; // optional
    excludeCountries?: string[]; // optional
  };
  shippingPreference?: {
    method?: string[]; // optional
    requiresSignature?: boolean; // optional
    requiresInsurance?: boolean; // optional
    maxShippingDays?: number; // optional
  };
  insuranceRequired?: boolean; // optional
  inspectionPeriod?: number; // in days, optional

  // TIMING
  deadline_start?: Date; // ISO 8601 timestamp, optional, bid timing
  deadline_end?: Date; // ISO 8601 timestamp, optional, bid timing
  deliveryTimeline: Date; // ISO 8601 timestamp, required, > deadline
  flexibleTimeline?: boolean; // optional

  // ADDITIONAL PREFERENCES
  brandPreference?: string[]; // optional
  exclusions?: string[]; // array of strings, optional
  matching?: {
    requiresMatching: boolean;
    quantity: number;
    matchingTolerance: {
      caratVariance: number;
      colorVariance: number;
      clarityVariance: number;
    };
  }; // object, optional
  tradeInAvailable?: boolean; // optional

  // DOCUMENTATION
  requiresAppraisal?: boolean; // optional
  requiresGradingReport?: boolean; // optional
  requiresOriginReport?: boolean; // optional
}

const RequirementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    views: { type: Number, default: 0 },
    bidsReceived: { type: Number, default: 0 },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startDate: {
      type: Date,
      default: () => new Date(Date.now()), // +1 day
    },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 day
    },
    bids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Bid",
      default: [],
    },
    status: {
      type: String,
      enum: [
        STATUS.ACTIVE,
        STATUS.CANCELLED,
        STATUS.EXPIRED,
        STATUS.FULFILLED,
        STATUS.CLOSED,
      ],
      default: STATUS.ACTIVE,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export interface IRequirement {
  userId: mongoose.Types.ObjectId;
  bids: mongoose.Types.ObjectId[];
  title: string;
  description: string;
  bidsReceived: number;
  views: number;
  details: IRequirementDetails;
  startDate: Date;
  endDate: Date;
  status: STATUS;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IRequirement>("Requirement", RequirementSchema);
