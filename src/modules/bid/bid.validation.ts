import Joi from "joi";

export const bidSchema = Joi.object({
  price: Joi.number().required(),
  proposal: Joi.string().required(),
});

export const requirementIdSchema = Joi.object({
  requirementId: Joi.string().hex().length(24).required(),
});
