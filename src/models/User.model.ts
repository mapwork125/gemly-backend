import mongoose from "mongoose";
import { USER_STATUS, USER_ROLE, USER_TYPE } from "../utils/constants.utility";
export interface IIdentityProof {
  proofType: "Aadhar" | "PAN";
  proofNumber: string;
}

export interface IDocuments {
  aadharDocument?: string;
  panDocument?: string;
}

export interface ICompanyAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface ICompanyDetails {
  companyName: string;
  companyRegistrationNumber?: string;
  companyAddress: ICompanyAddress;
  companyCountry: string;
}

export interface IKYC {
  fullName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  identityProof: IIdentityProof;
  documents?: IDocuments;
  companyDetails: ICompanyDetails;
  businessType: string;
  diamondIndustryActivity: string;
  isAuthorizedPerson?: boolean;
}

export interface INotificationSettings {
  enabled: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    emailDigest: boolean;
    emailAddress?: string;
    sms: boolean;
    phoneNumber?: string;
    push: boolean;
  };
  diamondTypes: string[];
  labGrownMethods: string[];
  treatmentPreferences: {
    acceptUntreated: boolean;
    acceptTreated: boolean;
    acceptAny: boolean;
  };
  certificationFilter: {
    certifiedOnly: boolean;
    nonCertifiedOk: boolean;
    preferredLabs: string[];
  };
  shapes: string[];
  caratRanges: {
    min: number;
    max: number;
    description?: string;
  }[];
  cutGrades: string[];
  colorGrades: string[];
  clarityGrades: string[];
  fancyColors: {
    enabled: boolean;
    hues: string[];
    intensities: string[];
    naturalOnly: boolean;
  };
  budgetRanges: {
    min: number;
    max: number;
    currency: string;
  }[];
  geographicPreferences: {
    canShipTo: string[];
    localOnly: boolean;
    international: boolean;
  };
  timingFilters: {
    minimumLeadTime: number;
    maximumLeadTime: number;
    urgentOnly: boolean;
  };
  advancedFilters: {
    conflictFreeOnly: boolean;
    canProvideMatchingPairs: boolean;
    acceptsTradeIns: boolean;
    minimumBudget: number;
    currency: string;
    intendedUses: string[];
  };
  frequency: string;
  quietHours: {
    enabled: boolean;
    timezone: string;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// User stats interface for ratings and reputation
export interface IUserStats {
  averageRating: number;
  totalRatings: number;
  reputationScore: number;
  badgeCount: number;
  completedDeals: number;
  canceledDeals: number;
  totalVolume: number;
  totalShipments: number;
  onTimeDeliveryRate: number;
  avgResponseTime: number; // in seconds
}

// User badge interface
export interface IUserBadge {
  badgeId: string;
  earnedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    rejectionReason: String,
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
    },
    userType: {
      type: String,
      enum: [USER_TYPE.BUYER, USER_TYPE.SELLER],
      default: USER_TYPE.BUYER,
    },
    status: {
      type: String,
      enum: [
        USER_STATUS.PENDING_KYC,
        USER_STATUS.PENDING_ADMIN_APPROVAL,
        USER_STATUS.APPROVED,
        USER_STATUS.REJECTED,
        USER_STATUS.SUSPENDED,
      ],
      default: USER_STATUS.PENDING_KYC,
    },
    notificationsEnabled: { type: Boolean, default: true },
    kyc: {
      fullName: { type: String, minlength: 3 },
      dateOfBirth: { type: Date },
      phoneNumber: { type: String },
      identityProof: {
        type: {
          proofType: { type: String, enum: ["Aadhar", "PAN"], required: true },
          proofNumber: { type: String, required: true },
        },
      },
      documents: {
        aadharDocument: { type: String },
        panDocument: { type: String },
      },
      companyDetails: {
        companyName: { type: String },
        companyRegistrationNumber: { type: String },
        companyAddress: {
          line1: { type: String },
          line2: { type: String },
          city: { type: String },
          state: { type: String },
          postalCode: { type: String },
        },
        companyCountry: { type: String },
      },
      businessType: { type: String },
      diamondIndustryActivity: { type: String, maxlength: 300 },
      isAuthorizedPerson: { type: Boolean, default: true },
    },
    fcmToken: { type: String },
    tokenVersion: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    type: { type: String, enum: ["INDIVIDUAL", "COMPANY"] },
    badges: [
      {
        badgeId: {
          type: String,
          required: true,
        },
        earnedAt: {
          type: Date,
          required: true,
        },
      },
    ],
    stats: {
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0, min: 0 },
      reputationScore: { type: Number, default: 0, min: 0, max: 1000 },
      badgeCount: { type: Number, default: 0, min: 0 },
      completedDeals: { type: Number, default: 0, min: 0 },
      canceledDeals: { type: Number, default: 0, min: 0 },
      totalVolume: { type: Number, default: 0, min: 0 },
      totalShipments: { type: Number, default: 0, min: 0 },
      onTimeDeliveryRate: { type: Number, default: 0, min: 0, max: 100 },
      avgResponseTime: { type: Number, default: 0, min: 0 }, // in seconds
    },
    notificationSettings: {
      type: Object,
      default: {
        enabled: true,
        channels: {
          inApp: true,
          email: false,
          emailDigest: false,
          sms: false,
          push: true,
        },
        diamondTypes: [],
        labGrownMethods: [],
        treatmentPreferences: {
          acceptUntreated: true,
          acceptTreated: true,
          acceptAny: true,
        },
        certificationFilter: {
          certifiedOnly: true,
          nonCertifiedOk: false,
          preferredLabs: [],
        },
        shapes: [],
        caratRanges: [],
        cutGrades: [],
        colorGrades: [],
        clarityGrades: [],
        fancyColors: {
          enabled: false,
          hues: [],
          intensities: [],
          naturalOnly: true,
        },
        budgetRanges: [],
        geographicPreferences: {
          canShipTo: [],
          localOnly: false,
          international: true,
        },
        timingFilters: {
          minimumLeadTime: 0,
          maximumLeadTime: 0,
          urgentOnly: false,
        },
        advancedFilters: {
          conflictFreeOnly: true,
          canProvideMatchingPairs: false,
          acceptsTradeIns: false,
          minimumBudget: 0,
          currency: "USD",
          intendedUses: [],
        },
        frequency: "Instant",
        quietHours: {
          enabled: false,
          timezone: "UTC",
          startTime: "00:00",
          endTime: "00:00",
          daysOfWeek: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
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
  rejectionReason?: string;
  role: string;
  userType: USER_TYPE;
  status: USER_STATUS;
  notificationsEnabled: boolean;
  kyc?: IKYC;
  fcmToken?: string;
  tokenVersion: number;
  isVerified: boolean;
  type?: string;
  badges?: IUserBadge[];
  stats?: IUserStats;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IUser>("User", UserSchema);
