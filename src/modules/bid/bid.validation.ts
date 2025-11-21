import Joi from "joi";

export const bidSchema = Joi.object({
  amount: Joi.number().optional(),
  message: Joi.string().required(),
});

export const requirementIdSchema = Joi.object({
  requirementId: Joi.string().hex().length(24).required(),
});
