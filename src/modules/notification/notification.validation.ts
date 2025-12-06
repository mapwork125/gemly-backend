import Joi from "joi";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
} from "../../utils/constants.utility";

export const notificationIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const filterNotificationsSchema = Joi.object({
  type: Joi.string()
    .valid(
      NOTIFICATION_TYPE.GENERAL,
      NOTIFICATION_TYPE.BID,
      NOTIFICATION_TYPE.CHAT,
      NOTIFICATION_TYPE.DEAL,
      NOTIFICATION_TYPE.REQUIREMENT,
      NOTIFICATION_TYPE.SYSTEM
    )
    .optional(),
  category: Joi.string()
    .valid(NOTIFICATION_CATEGORY.ACTIONABLE, NOTIFICATION_CATEGORY.GENERAL)
    .optional(),
  read: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(50),
});
