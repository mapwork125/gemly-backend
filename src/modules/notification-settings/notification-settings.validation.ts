import Joi from "joi";

export const notificationSettingsSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  channels: Joi.object({
    inApp: Joi.boolean().optional(),
    email: Joi.boolean().optional(),
    emailDigest: Joi.boolean().optional(),
    emailAddress: Joi.string().email().optional(),
    sms: Joi.boolean().optional(),
    phoneNumber: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    push: Joi.boolean().optional(),
  }).optional(),
  diamondTypes: Joi.array().items(Joi.string()).optional(),
  labGrownMethods: Joi.array().items(Joi.string()).optional(),
  treatmentPreferences: Joi.object({
    acceptUntreated: Joi.boolean().optional(),
    acceptTreated: Joi.boolean().optional(),
    acceptAny: Joi.boolean().optional(),
  }).optional(),
  certificationFilter: Joi.object({
    certifiedOnly: Joi.boolean().optional(),
    nonCertifiedOk: Joi.boolean().optional(),
    preferredLabs: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  shapes: Joi.array().items(Joi.string()).optional(),
  caratRanges: Joi.array()
    .items(
      Joi.object({
        min: Joi.number().min(0).required(),
        max: Joi.number().min(Joi.ref("min")).required(),
        description: Joi.string().optional(),
      })
    )
    .optional(),
  cutGrades: Joi.array().items(Joi.string()).optional(),
  colorGrades: Joi.array().items(Joi.string()).optional(),
  clarityGrades: Joi.array().items(Joi.string()).optional(),
  fancyColors: Joi.object({
    enabled: Joi.boolean().optional(),
    hues: Joi.array().items(Joi.string()).optional(),
    intensities: Joi.array().items(Joi.string()).optional(),
    naturalOnly: Joi.boolean().optional(),
  }).optional(),
  budgetRanges: Joi.array()
    .items(
      Joi.object({
        min: Joi.number().min(0).required(),
        max: Joi.number().min(Joi.ref("min")).required(),
        currency: Joi.string().optional(),
      })
    )
    .optional(),
  geographicPreferences: Joi.object({
    canShipTo: Joi.array().items(Joi.string()).optional(),
    localOnly: Joi.boolean().optional(),
    international: Joi.boolean().optional(),
  }).optional(),
  timingFilters: Joi.object({
    minimumLeadTime: Joi.number().min(0).optional(),
    maximumLeadTime: Joi.number().min(0).optional(),
    urgentOnly: Joi.boolean().optional(),
  }).optional(),
  advancedFilters: Joi.object({
    conflictFreeOnly: Joi.boolean().optional(),
    canProvideMatchingPairs: Joi.boolean().optional(),
    acceptsTradeIns: Joi.boolean().optional(),
    minimumBudget: Joi.number().min(0).optional(),
    currency: Joi.string().optional(),
    intendedUses: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  frequency: Joi.string()
    .valid("Instant", "Hourly", "Daily", "Weekly")
    .optional(),
  quietHours: Joi.object({
    enabled: Joi.boolean().optional(),
    timezone: Joi.string().optional(),
    startTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    endTime: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    daysOfWeek: Joi.array().items(Joi.number().min(0).max(6)).optional(),
  }).optional(),
});
