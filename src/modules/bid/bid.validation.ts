import Joi from "joi";
import {
  DIAMOND_TYPE,
  DIAMOND_SHAPE,
  CUT_GRADE,
  COLOR_GRADE,
  CLARITY_GRADE,
  CERTIFICATION_LAB,
  POLISH_SYMMETRY,
  FLUORESCENCE,
  FLUORESCENCE_COLOR,
  TREATMENT_STATUS,
  CURRENCY,
  PAYMENT_METHOD,
  STOCK_STATUS,
} from "../../utils/constants.utility";

export const bidSchema = Joi.object({
  // PRICING INFORMATION
  bidAmount: Joi.number().greater(0).required(),
  currency: Joi.string()
    .valid(...Object.values(CURRENCY))
    .required()
    .default("USD"),
  pricePerCarat: Joi.number().min(0),
  negotiable: Joi.boolean().required().default(false),
  negotiationNote: Joi.string().max(500),

  // DELIVERY TERMS
  deliveryDays: Joi.number().greater(0).required(),
  canMeetDeadline: Joi.boolean().required(),
  shippingMethod: Joi.string().max(200),
  shippingCost: Joi.number().min(0),
  shippingIncluded: Joi.boolean().required().default(false),
  insuranceIncluded: Joi.boolean().required().default(false),
  insuranceCost: Joi.number().min(0),

  // PAYMENT TERMS
  paymentTerms: Joi.string().max(500).required(),
  acceptedPaymentMethods: Joi.array()
    .items(Joi.string().valid(...Object.values(PAYMENT_METHOD)))
    .min(1)
    .required(),
  depositRequired: Joi.boolean().required().default(false),
  depositAmount: Joi.number().min(0).when("depositRequired", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  depositPercentage: Joi.number()
    .min(0)
    .max(100)
    .when("depositRequired", {
      is: true,
      then: Joi.when("depositAmount", {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
      }),
      otherwise: Joi.optional(),
    }),

  // DIAMOND DETAILS
  diamondType: Joi.string()
    .valid(...Object.values(DIAMOND_TYPE))
    .required(),
  caratWeight: Joi.number().greater(0).required(),
  shape: Joi.string()
    .valid(...Object.values(DIAMOND_SHAPE))
    .required(),
  cutGrade: Joi.string()
    .valid(...Object.values(CUT_GRADE))
    .required(),
  colorGrade: Joi.string()
    .valid(...Object.values(COLOR_GRADE))
    .required(),
  clarityGrade: Joi.string()
    .valid(...Object.values(CLARITY_GRADE))
    .required(),
  certificateLab: Joi.string().valid(...Object.values(CERTIFICATION_LAB)),
  certificateNumber: Joi.string().max(100).when("certificateLab", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.optional(),
  }),
  certificateUrl: Joi.string().uri(),
  certificateDate: Joi.date(),
  hasInscription: Joi.boolean(),
  inscriptionText: Joi.string().max(100).when("hasInscription", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // DIAMOND SPECIFICATIONS
  polish: Joi.string().valid(...Object.values(POLISH_SYMMETRY)),
  symmetry: Joi.string().valid(...Object.values(POLISH_SYMMETRY)),
  fluorescence: Joi.string().valid(...Object.values(FLUORESCENCE)),
  fluorescenceColor: Joi.string().valid(...Object.values(FLUORESCENCE_COLOR)),
  depthPercent: Joi.number().min(0).max(100),
  tablePercent: Joi.number().min(0).max(100),
  measurements: Joi.string().max(100),

  // ADDITIONAL DETAILS
  treatmentStatus: Joi.string().valid(...Object.values(TREATMENT_STATUS)),
  origin: Joi.string().max(100),
  eyeClean: Joi.boolean(),
  videoUrl: Joi.string().uri(),
  imagesUrls: Joi.array().items(Joi.string().uri()).max(10),

  // SELLER INFORMATION
  companyName: Joi.string().max(200).required(),
  contactPerson: Joi.string().max(100).required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().max(50).required(),
  businessAddress: Joi.object({
    street: Joi.string().max(200).required(),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100),
    country: Joi.string().max(100).required(),
    postalCode: Joi.string().max(20).required(),
  }).required(),
  businessRegistration: Joi.string().max(100),
  yearsInBusiness: Joi.number().min(0),
  website: Joi.string().uri(),

  // GUARANTEES & POLICIES
  returnPolicy: Joi.string().max(1000).required(),
  warranty: Joi.string().max(1000),
  gradeGuarantee: Joi.boolean().required().default(false),
  buybackPolicy: Joi.string().max(500),

  // ADDITIONAL NOTES
  additionalNotes: Joi.string().max(2000),
  specialOffers: Joi.string().max(500),

  // REFERENCES
  previousSales: Joi.number().min(0),
  rating: Joi.number().min(0).max(5),
  references: Joi.array().items(
    Joi.object({
      name: Joi.string().max(100),
      contact: Joi.string().max(100),
      testimonial: Joi.string().max(500),
    })
  ),

  // AVAILABILITY
  stockStatus: Joi.string()
    .valid(...Object.values(STOCK_STATUS))
    .required(),
  locationOfDiamond: Joi.string().max(200).required(),
  canViewInPerson: Joi.boolean().required().default(false),
  viewingLocations: Joi.array().items(Joi.string().max(200)).max(20),

  // TERMS & CONDITIONS
  agreedToTerms: Joi.boolean().valid(true).required(),
  validUntil: Joi.date().min("now"),

  // LEGACY FIELDS (for backward compatibility)
  price: Joi.number().min(0),
  proposal: Joi.string(),
});

export const requirementIdSchema = Joi.object({
  requirementId: Joi.string().hex().length(24).required(),
});

export const bidUpdateSchema = Joi.object({
  // PRICING INFORMATION (all optional for update)
  bidAmount: Joi.number().greater(0),
  currency: Joi.string().valid(...Object.values(CURRENCY)),
  pricePerCarat: Joi.number().min(0),
  negotiable: Joi.boolean(),
  negotiationNote: Joi.string().max(500).allow(""),

  // DELIVERY TERMS
  deliveryDays: Joi.number().greater(0),
  canMeetDeadline: Joi.boolean(),
  shippingMethod: Joi.string().max(200).allow(""),
  shippingCost: Joi.number().min(0),
  shippingIncluded: Joi.boolean(),
  insuranceIncluded: Joi.boolean(),
  insuranceCost: Joi.number().min(0),

  // PAYMENT TERMS
  paymentTerms: Joi.string().max(500),
  acceptedPaymentMethods: Joi.array()
    .items(Joi.string().valid(...Object.values(PAYMENT_METHOD)))
    .min(1),
  depositRequired: Joi.boolean(),
  depositAmount: Joi.number().min(0),
  depositPercentage: Joi.number().min(0).max(100),

  // DIAMOND DETAILS
  diamondType: Joi.string().valid(...Object.values(DIAMOND_TYPE)),
  caratWeight: Joi.number().greater(0),
  shape: Joi.string().valid(...Object.values(DIAMOND_SHAPE)),
  cutGrade: Joi.string().valid(...Object.values(CUT_GRADE)),
  colorGrade: Joi.string().valid(...Object.values(COLOR_GRADE)),
  clarityGrade: Joi.string().valid(...Object.values(CLARITY_GRADE)),
  certificateLab: Joi.string().valid(...Object.values(CERTIFICATION_LAB)),
  certificateNumber: Joi.string().max(100).allow(""),
  certificateUrl: Joi.string().uri().allow(""),
  certificateDate: Joi.date(),
  hasInscription: Joi.boolean(),
  inscriptionText: Joi.string().max(100).allow(""),

  // DIAMOND SPECIFICATIONS
  polish: Joi.string().valid(...Object.values(POLISH_SYMMETRY)),
  symmetry: Joi.string().valid(...Object.values(POLISH_SYMMETRY)),
  fluorescence: Joi.string().valid(...Object.values(FLUORESCENCE)),
  fluorescenceColor: Joi.string().valid(...Object.values(FLUORESCENCE_COLOR)),
  depthPercent: Joi.number().min(0).max(100),
  tablePercent: Joi.number().min(0).max(100),
  measurements: Joi.string().max(100).allow(""),

  // ADDITIONAL DETAILS
  treatmentStatus: Joi.string().valid(...Object.values(TREATMENT_STATUS)),
  origin: Joi.string().max(100).allow(""),
  eyeClean: Joi.boolean(),
  videoUrl: Joi.string().uri().allow(""),
  imagesUrls: Joi.array().items(Joi.string().uri()).max(10),

  // SELLER INFORMATION
  companyName: Joi.string().max(200),
  contactPerson: Joi.string().max(100),
  contactEmail: Joi.string().email(),
  contactPhone: Joi.string().max(50),
  businessAddress: Joi.object({
    street: Joi.string().max(200),
    city: Joi.string().max(100),
    state: Joi.string().max(100).allow(""),
    country: Joi.string().max(100),
    postalCode: Joi.string().max(20),
  }),
  businessRegistration: Joi.string().max(100).allow(""),
  yearsInBusiness: Joi.number().min(0),
  website: Joi.string().uri().allow(""),

  // GUARANTEES & POLICIES
  returnPolicy: Joi.string().max(1000),
  warranty: Joi.string().max(1000).allow(""),
  gradeGuarantee: Joi.boolean(),
  buybackPolicy: Joi.string().max(500).allow(""),

  // ADDITIONAL NOTES
  additionalNotes: Joi.string().max(2000).allow(""),
  specialOffers: Joi.string().max(500).allow(""),

  // REFERENCES
  previousSales: Joi.number().min(0),
  rating: Joi.number().min(0).max(5),
  references: Joi.array().items(
    Joi.object({
      name: Joi.string().max(100),
      contact: Joi.string().max(100).allow(""),
      testimonial: Joi.string().max(500).allow(""),
    })
  ),

  // AVAILABILITY
  stockStatus: Joi.string().valid(...Object.values(STOCK_STATUS)),
  locationOfDiamond: Joi.string().max(200),
  canViewInPerson: Joi.boolean(),
  viewingLocations: Joi.array().items(Joi.string().max(200)).max(20),

  // TERMS & CONDITIONS
  validUntil: Joi.date().min("now"),

  // LEGACY FIELDS
  price: Joi.number().min(0),
  proposal: Joi.string().allow(""),
}).min(1); // At least one field must be provided
