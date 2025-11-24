import Joi from "joi";

export const notificationSettingsSchema = Joi.object({
  notificationsEnabled: Joi.boolean().required(),
});
