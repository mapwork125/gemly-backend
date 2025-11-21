import Joi from 'joi';

export const notificationSettingsSchema = Joi.object({
  email: Joi.boolean().optional(),
  push: Joi.boolean().optional(),
  sms: Joi.boolean().optional(),
});
