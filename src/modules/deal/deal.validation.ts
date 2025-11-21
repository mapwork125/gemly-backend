import Joi from 'joi';

export const dealIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const bidIdSchema = Joi.object({
  bidId: Joi.string().hex().length(24).required(),
});
