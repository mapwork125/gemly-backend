import Joi from "joi";

export const escrowSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required(),
  amount: Joi.number().required(),
});

export const dealIdSchema = Joi.object({
  dealId: Joi.string().hex().length(24).required(),
});
