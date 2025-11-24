import Joi from "joi";

export const dealIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const createDealSchema = Joi.object({
  bidId: Joi.string().hex().length(24).required(),
  requirementId: Joi.string().hex().length(24).required(),
});
