import Joi from "joi";

export const ratingSchema = Joi.object({
  score: Joi.number().min(1).max(5).required(),
  review: Joi.string().required(),
});

export const userIdSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});
