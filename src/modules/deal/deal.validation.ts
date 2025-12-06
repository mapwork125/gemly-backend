import Joi from "joi";
import { DEAL_STATUS } from "../../utils/constants.utility";

export const dealIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const bidIdSchema = Joi.object({
  bidId: Joi.string().hex().length(24).required(),
});

export const dealQuerySchema = Joi.object({
  status: Joi.string().valid(
    DEAL_STATUS.DEAL_CREATED,
    DEAL_STATUS.IN_PROGRESS,
    DEAL_STATUS.COMPLETED,
    DEAL_STATUS.CANCELLED
  ),
});
