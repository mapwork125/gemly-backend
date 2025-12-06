import Joi from "joi";
import {
  CERTIFICATION_LAB,
  CLARITY_GRADE,
  COLOR_DISTRIBUTION,
  COLOR_GRADE,
  COLOR_ORIGIN,
  COLOR_TYPE,
  CURRENCY,
  CUT_GRADE,
  CULET_SIZE,
  DIAMOND_SHAPE,
  DIAMOND_TYPE,
  FANCY_COLOR_HUE,
  FANCY_COLOR_INTENSITY,
  FANCY_COLOR_MODIFIER,
  FLUORESCENCE,
  FLUORESCENCE_COLOR,
  GIRDLE_THICKNESS,
  INCLUSION_TYPE,
  INTENDED_USE,
  LAB_GROWN_TYPE,
  METAL_TYPE,
  OPTICAL_PROPERTY,
  POLISH_SYMMETRY,
  SETTING_TYPE,
  STATUS,
  SUSTAINABILITY_PREFERENCE,
  TREATMENT_STATUS,
  TREATMENT_TYPE,
} from "../../utils/constants.utility";

// Shared details schema for both create and update
const detailsSchema = (isRequired = true) => {
  const schema = Joi.object({
    diamondType: Joi.string()
      .valid(...Object.values(DIAMOND_TYPE))
      .required(),
    labGrownMethod: Joi.string()
      .valid(...Object.values(LAB_GROWN_TYPE))
      .when("diamondType", {
        is: DIAMOND_TYPE.LAB_GROWN,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
    treatmentStatus: Joi.string()
      .valid(...Object.values(TREATMENT_STATUS))
      .optional(),
    treatmentTypes: Joi.array()
      .items(Joi.string().valid(...Object.values(TREATMENT_TYPE)))
      .optional(),
    originCountry: Joi.array().items(Joi.string()).optional(),
    mineOrigin: Joi.array().items(Joi.string()).optional(),

    // CERTIFICATION
    certified: Joi.boolean().required(),
    preferredLabs: Joi.array()
      .items(Joi.string().valid(...Object.values(CERTIFICATION_LAB)))
      .optional(),
    requiresInscription: Joi.boolean().optional(),

    // SHAPE
    shapes: Joi.array()
      .items(Joi.string().valid(...Object.values(DIAMOND_SHAPE)))
      .min(1)
      .required(),

    // CARAT WEIGHT
    caratMin: Joi.number().min(0.01).required(),
    caratMax: Joi.number().min(Joi.ref("caratMin")).required(),

    // MEASUREMENTS
    measurements: Joi.object({
      lengthMin: Joi.number().optional(),
      lengthMax: Joi.number().optional(),
      widthMin: Joi.number().optional(),
      widthMax: Joi.number().optional(),
      depthMin: Joi.number().optional(),
      depthMax: Joi.number().optional(),
      lengthWidthRatioMin: Joi.number().optional(),
      lengthWidthRatioMax: Joi.number().optional(),
    }).optional(),

    // CUT QUALITY
    cutGrades: Joi.array()
      .items(Joi.string().valid(...Object.values(CUT_GRADE)))
      .required(),
    polish: Joi.array()
      .items(Joi.string().valid(...Object.values(POLISH_SYMMETRY)))
      .optional(),
    symmetry: Joi.array()
      .items(Joi.string().valid(...Object.values(POLISH_SYMMETRY)))
      .optional(),

    // PROPORTIONS
    depthPercentMin: Joi.number().min(0).max(100).optional(),
    depthPercentMax: Joi.number().min(0).max(100).optional(),
    tablePercentMin: Joi.number().min(0).max(100).optional(),
    tablePercentMax: Joi.number().min(0).max(100).optional(),
    crownAngleMin: Joi.number().optional(),
    crownAngleMax: Joi.number().optional(),
    crownHeightMin: Joi.number().optional(),
    crownHeightMax: Joi.number().optional(),
    pavilionAngleMin: Joi.number().optional(),
    pavilionAngleMax: Joi.number().optional(),
    pavilionDepthMin: Joi.number().optional(),
    pavilionDepthMax: Joi.number().optional(),
    girdleThickness: Joi.array()
      .items(Joi.string().valid(...Object.values(GIRDLE_THICKNESS)))
      .optional(),
    culetSize: Joi.array()
      .items(Joi.string().valid(...Object.values(CULET_SIZE)))
      .optional(),

    // COLOR GRADING
    colorType: Joi.string()
      .valid(...Object.values(COLOR_TYPE))
      .required(),
    colorGrades: Joi.array()
      .items(Joi.string().valid(...Object.values(COLOR_GRADE)))
      .optional(),
    fancyColorGrades: Joi.array()
      .items(
        Joi.object({
          intensity: Joi.string()
            .valid(...Object.values(FANCY_COLOR_INTENSITY))
            .required(),
          modifier: Joi.string()
            .valid(...Object.values(FANCY_COLOR_MODIFIER))
            .optional(),
          primaryHue: Joi.string()
            .valid(...Object.values(FANCY_COLOR_HUE))
            .required(),
          secondaryHue: Joi.string()
            .valid(...Object.values(FANCY_COLOR_HUE))
            .optional(),
        })
      )
      .optional(),
    colorOrigin: Joi.string()
      .valid(...Object.values(COLOR_ORIGIN))
      .optional(),
    colorDistribution: Joi.string()
      .valid(...Object.values(COLOR_DISTRIBUTION))
      .optional(),

    // CLARITY
    clarityGrades: Joi.array()
      .items(Joi.string().valid(...Object.values(CLARITY_GRADE)))
      .required(),
    eyeClean: Joi.boolean().optional(),
    inclusionTypes: Joi.array()
      .items(Joi.string().valid(...Object.values(INCLUSION_TYPE)))
      .optional(),

    // FLUORESCENCE
    fluorescence: Joi.array()
      .items(Joi.string().valid(...Object.values(FLUORESCENCE)))
      .optional(),
    fluorescenceColor: Joi.array()
      .items(Joi.string().valid(...Object.values(FLUORESCENCE_COLOR)))
      .optional(),

    // OPTICAL PROPERTIES
    brilliance: Joi.string()
      .valid(...Object.values(OPTICAL_PROPERTY))
      .optional(),
    fire: Joi.string()
      .valid(...Object.values(OPTICAL_PROPERTY))
      .optional(),
    scintillation: Joi.string()
      .valid(...Object.values(OPTICAL_PROPERTY))
      .optional(),

    // BUDGET
    budgetMin: Joi.number().optional(),
    budgetMax: Joi.number().min(Joi.ref("budgetMin")).optional(),
    currency: Joi.string()
      .valid(...Object.values(CURRENCY))
      .optional(),
    pricePerCarat: Joi.boolean().optional(),

    // ETHICAL & SOURCING
    conflictFree: Joi.boolean().optional(),
    ethicalSourcing: Joi.boolean().optional(),
    sustainabilityPreference: Joi.string()
      .valid(...Object.values(SUSTAINABILITY_PREFERENCE))
      .optional(),

    // SETTING & PURPOSE
    intendedUse: Joi.string()
      .valid(...Object.values(INTENDED_USE))
      .optional(),
    settingType: Joi.string()
      .valid(...Object.values(SETTING_TYPE))
      .optional(),
    metalType: Joi.array()
      .items(Joi.string().valid(...Object.values(METAL_TYPE)))
      .optional(),

    // LOCATION & DELIVERY
    locationPreference: Joi.object({
      countries: Joi.array().items(Joi.string()).optional(),
      cities: Joi.array().items(Joi.string()).optional(),
      regions: Joi.array().items(Joi.string()).optional(),
      excludeCountries: Joi.array().items(Joi.string()).optional(),
    }).optional(),
    shippingPreference: Joi.object({
      method: Joi.array().items(Joi.string()).optional(),
      requiresSignature: Joi.boolean().optional(),
      requiresInsurance: Joi.boolean().optional(),
      maxShippingDays: Joi.number().optional(),
    }).optional(),
    insuranceRequired: Joi.boolean().optional(),
    inspectionPeriod: Joi.number().optional(),

    // TIMING
    deadline_start: Joi.date().optional(),
    deadline_end: Joi.date().optional(),
    deliveryTimeline: Joi.date().required(),
    flexibleTimeline: Joi.boolean().optional(),

    // ADDITIONAL PREFERENCES
    brandPreference: Joi.array().items(Joi.string()).optional(),
    exclusions: Joi.array().items(Joi.string()).optional(),
    matching: Joi.object({
      requiresMatching: Joi.boolean().required(),
      quantity: Joi.number().required(),
      matchingTolerance: Joi.object({
        caratVariance: Joi.number().required(),
        colorVariance: Joi.number().required(),
        clarityVariance: Joi.number().required(),
      }).required(),
    }).optional(),
    tradeInAvailable: Joi.boolean().optional(),

    // DOCUMENTATION
    requiresAppraisal: Joi.boolean().optional(),
    requiresGradingReport: Joi.boolean().optional(),
    requiresOriginReport: Joi.boolean().optional(),
  });

  return isRequired ? schema.required() : schema.optional();
};

export const requirementSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  endDate: Joi.date().optional(),
  startDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  details: detailsSchema(true),
});

export const updateRequirementSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  endDate: Joi.date().optional(),
  startDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  details: detailsSchema(false),
});

export const requirementIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const filterRequirementsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid(...Object.values(STATUS))
    .optional(),
  diamondType: Joi.string()
    .valid(...Object.values(DIAMOND_TYPE))
    .optional(),
  shapes: Joi.string() // Comma-separated values
    .pattern(/^[^,]+(,[^,]+)*$/)
    .optional(),
  caratMin: Joi.number().min(0).optional(),
  caratMax: Joi.number().min(Joi.ref("caratMin")).optional(),
  budgetMin: Joi.number().min(0).optional(),
  budgetMax: Joi.number().min(Joi.ref("budgetMin")).optional(),
  colorType: Joi.string()
    .valid(...Object.values(COLOR_TYPE))
    .optional(),
  certified: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("createdAt", "deadline", "budgetMax", "views")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});
