import Joi from "joi";

export const adSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  meta: Joi.any().optional(),
});

export const approveAdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
