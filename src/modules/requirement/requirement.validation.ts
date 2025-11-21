import Joi from "joi";

export const requirementSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  budget: Joi.number().optional(),
  deadline: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const updateRequirementSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  budget: Joi.number().optional(),
  deadline: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

export const requirementIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
