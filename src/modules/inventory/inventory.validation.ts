import Joi from 'joi';

export const inventorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  quantity: Joi.number().required(),
  price: Joi.number().required(),
  sku: Joi.string().optional(),
});

export const updateInventorySchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    quantity: Joi.number().optional(),
    price: Joi.number().optional(),
    sku: Joi.string().optional(),
});

export const inventoryIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
