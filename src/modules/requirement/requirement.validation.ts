import Joi from "joi";

export const requirementSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  endDate: Joi.date().optional(),
  startDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  details: Joi.object({
    shape: Joi.string().allow(null),
    carat: Joi.number().allow(null),
    color: Joi.string().allow(null),
    clarity: Joi.string().allow(null),
    lab: Joi.string().allow(null),
    location: Joi.string().allow(null),
    budget: Joi.number().allow(null),
  }).optional(),
});

export const updateRequirementSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  endDate: Joi.date().optional(),
  startDate: Joi.date().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  details: Joi.object({
    shape: Joi.string().allow(null),
    carat: Joi.number().allow(null),
    color: Joi.string().allow(null),
    clarity: Joi.string().allow(null),
    lab: Joi.string().allow(null),
    location: Joi.string().allow(null),
    budget: Joi.number().allow(null),
  }).optional(),
});

export const requirementIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
