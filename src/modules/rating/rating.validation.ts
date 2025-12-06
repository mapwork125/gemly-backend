import Joi from "joi";

// Submit rating schema
export const submitRatingSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Deal ID must be a valid MongoDB ObjectId",
    "string.length": "Deal ID must be 24 characters",
    "any.required": "Deal ID is required",
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    "number.min": "Rating must be at least 1",
    "number.max": "Rating must be at most 5",
    "any.required": "Rating is required",
  }),
  categories: Joi.object({
    communication: Joi.number().min(1).max(5).required(),
    productQuality: Joi.number().min(1).max(5).required(),
    delivery: Joi.number().min(1).max(5).required(),
    pricing: Joi.number().min(1).max(5).required(),
    professionalism: Joi.number().min(1).max(5).required(),
  })
    .required()
    .messages({
      "any.required": "Rating categories are required",
    }),
  review: Joi.string().min(10).max(1000).optional().allow("").messages({
    "string.min": "Review must be at least 10 characters",
    "string.max": "Review cannot exceed 1000 characters",
  }),
  isAnonymous: Joi.boolean().default(false).messages({
    "boolean.base": "isAnonymous must be a boolean",
  }),
});

// Get ratings query parameters schema
export const getRatingsQuerySchema = Joi.object({
  includeReviews: Joi.string().valid("true", "false").default("true"),
  includeBadges: Joi.string().valid("true", "false").default("true"),
  includeStats: Joi.string().valid("true", "false").default("true"),
  period: Joi.string()
    .valid("daily", "weekly", "monthly", "quarterly", "yearly", "all")
    .default("monthly"),
  year: Joi.number().integer().min(2000).max(2100).optional().messages({
    "number.min": "Year must be 2000 or later",
    "number.max": "Year must be 2100 or earlier",
  }),
  month: Joi.number().integer().min(1).max(12).optional().messages({
    "number.min": "Month must be between 1 and 12",
    "number.max": "Month must be between 1 and 12",
  }),
});

// User ID parameter schema
export const userIdSchema = Joi.object({
  userId: Joi.string().hex().length(24).required().messages({
    "string.hex": "User ID must be a valid MongoDB ObjectId",
    "string.length": "User ID must be 24 characters",
    "any.required": "User ID is required",
  }),
});

// Legacy schema (backward compatibility)
export const ratingSchema = Joi.object({
  score: Joi.number().min(1).max(5).required(),
  review: Joi.string().required(),
});

// Abuse report schema
export const reportAbuseSchema = Joi.object({
  reason: Joi.string()
    .valid(
      "SPAM",
      "PROFANITY",
      "HARASSMENT",
      "FALSE_INFORMATION",
      "OFF_TOPIC",
      "OTHER"
    )
    .required()
    .messages({
      "any.only": "Invalid report reason",
      "any.required": "Report reason is required",
    }),
  description: Joi.string().max(500).optional().allow("").messages({
    "string.max": "Description cannot exceed 500 characters",
  }),
});

// Rating ID parameter schema
export const ratingIdSchema = Joi.object({
  ratingId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Rating ID must be a valid MongoDB ObjectId",
    "string.length": "Rating ID must be 24 characters",
    "any.required": "Rating ID is required",
  }),
});

// Report ID parameter schema
export const reportIdSchema = Joi.object({
  reportId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Report ID must be a valid MongoDB ObjectId",
    "string.length": "Report ID must be 24 characters",
    "any.required": "Report ID is required",
  }),
});

// Resolve report schema
export const resolveReportSchema = Joi.object({
  status: Joi.string()
    .valid("REVIEWED", "RESOLVED", "DISMISSED")
    .required()
    .messages({
      "any.only": "Status must be REVIEWED, RESOLVED, or DISMISSED",
      "any.required": "Status is required",
    }),
  resolution: Joi.string().max(500).required().messages({
    "string.max": "Resolution cannot exceed 500 characters",
    "any.required": "Resolution is required",
  }),
});
