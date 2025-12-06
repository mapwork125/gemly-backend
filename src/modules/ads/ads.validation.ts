import Joi from "joi";

// Submit ad request validation
export const submitAdSchema = Joi.object({
  title: Joi.string().min(5).max(100).required(),
  description: Joi.string().min(10).max(500).required(),
  imageUrl: Joi.string().required(),
  linkUrl: Joi.string().uri().optional(),
  duration: Joi.number().min(7).max(90).required(),
  placement: Joi.string()
    .valid("HOME_BANNER", "SEARCH_SIDEBAR", "LISTING_TOP", "FOOTER")
    .required(),
});

// Legacy alias for backward compatibility
export const submitAdRequestSchema = submitAdSchema;

// Get ads query validation
export const getAdsQuerySchema = Joi.object({
  placement: Joi.string()
    .valid("HOME_BANNER", "SEARCH_SIDEBAR", "LISTING_TOP", "FOOTER")
    .optional(),
  limit: Joi.number().integer().min(1).max(50).default(10).optional(),
});

// Ad ID parameter validation
export const adIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required().messages({
    "string.hex": "Ad ID must be a valid MongoDB ObjectId",
    "string.length": "Ad ID must be 24 characters",
    "any.required": "Ad ID is required",
  }),
});

// Approve/Reject ad validation
export const approveAdSchema = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT").required(),
  startDate: Joi.date().when("action", {
    is: "APPROVE",
    then: Joi.required(),
  }),
  priority: Joi.number().min(1).max(10).optional(),
  rejectionReason: Joi.string().max(500).when("action", {
    is: "REJECT",
    then: Joi.required(),
  }),
});

// Admin get ads query validation
export const adminGetAdsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
  status: Joi.string()
    .valid("PENDING", "APPROVED", "REJECTED", "EXPIRED")
    .optional(),
  sortBy: Joi.string()
    .valid("submittedAt", "title", "placement", "duration")
    .default("submittedAt")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
});
