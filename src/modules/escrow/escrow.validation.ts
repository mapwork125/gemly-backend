import Joi from "joi";

export const initiateEscrowSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid deal ID format",
    "string.length": "Deal ID must be 24 characters",
    "any.required": "Deal ID is required",
  }),
  amount: Joi.number()
    .integer()
    .positive()
    .min(100)
    .max(100000000)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.integer": "Amount must be an integer (in cents)",
      "number.positive": "Amount must be positive",
      "number.min": "Amount must be at least $1.00 (100 cents)",
      "number.max": "Amount cannot exceed $1,000,000.00",
      "any.required": "Amount is required",
    }),
  currency: Joi.string()
    .valid("usd", "eur", "gbp")
    .lowercase()
    .default("usd")
    .messages({
      "any.only": "Currency must be usd, eur, or gbp",
    }),
  idempotencyKey: Joi.string().uuid().optional().messages({
    "string.uuid": "Idempotency key must be a valid UUID",
  }),
});

export const releaseEscrowSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid deal ID format",
    "string.length": "Deal ID must be 24 characters",
    "any.required": "Deal ID is required",
  }),
  confirmationType: Joi.string()
    .valid("BUYER_CONFIRMATION", "SELLER_CONFIRMATION")
    .required()
    .messages({
      "any.only":
        "Confirmation type must be BUYER_CONFIRMATION or SELLER_CONFIRMATION",
      "any.required": "Confirmation type is required",
    }),
  notes: Joi.string().max(1000).optional().allow("").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
  idempotencyKey: Joi.string().uuid().optional(),
});

export const refundEscrowSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid deal ID format",
    "string.length": "Deal ID must be 24 characters",
    "any.required": "Deal ID is required",
  }),
  reason: Joi.string()
    .valid(
      "DEAL_CANCELED",
      "FRAUD_DETECTED",
      "MUTUAL_AGREEMENT",
      "ITEM_NOT_AS_DESCRIBED",
      "OTHER"
    )
    .required()
    .messages({
      "any.only": "Invalid refund reason",
      "any.required": "Refund reason is required",
    }),
  refundAmount: Joi.number().integer().positive().min(100).optional().messages({
    "number.base": "Refund amount must be a number",
    "number.integer": "Refund amount must be an integer (in cents)",
    "number.positive": "Refund amount must be positive",
    "number.min": "Refund amount must be at least $1.00 (100 cents)",
  }),
  notes: Joi.string().max(1000).optional().allow("").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
  idempotencyKey: Joi.string().uuid().optional(),
});

export const dealIdSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required(),
});
