import Joi from 'joi';

export const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().optional(),
});

export const userIdSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});
