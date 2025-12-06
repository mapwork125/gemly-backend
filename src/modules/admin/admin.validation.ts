import Joi from "joi";
import { USER_STATUS, USER_TYPE } from "../../utils/constants.utility";

export const approveSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

export const approveUserSchema = Joi.object({
  action: Joi.string().valid("APPROVE", "REJECT", "SUSPEND").required(),
  rejectionReason: Joi.string().max(500).when("action", {
    is: "REJECT",
    then: Joi.required(),
  }),
  suspensionReason: Joi.string().max(500).when("action", {
    is: "SUSPEND",
    then: Joi.required(),
  }),
});

// Legacy alias
export const approveBodySchema = approveUserSchema;

export const usersListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
  status: Joi.string()
    .valid(
      USER_STATUS.PENDING_KYC,
      USER_STATUS.PENDING_ADMIN_APPROVAL,
      USER_STATUS.REJECTED,
      USER_STATUS.SUSPENDED,
      USER_STATUS.APPROVED
    )
    .optional(),
  userType: Joi.string().valid(USER_TYPE.BUYER, USER_TYPE.SELLER).optional(),
  search: Joi.string().min(2).optional(),
  sortBy: Joi.string()
    .valid("createdAt", "name", "userType", "status")
    .default("createdAt")
    .optional(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc").optional(),
});
