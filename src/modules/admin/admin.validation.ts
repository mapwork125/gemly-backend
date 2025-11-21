import Joi from 'joi';

export const approveSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
