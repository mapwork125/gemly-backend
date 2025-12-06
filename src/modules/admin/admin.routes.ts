import { Router } from "express";
import * as C from "./admin.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/role.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  approveUserSchema,
  approveSchema,
  usersListSchema,
} from "./admin.validation";
import { adminGetAdsQuerySchema } from "../ads/ads.validation";
import { USER_ROLE } from "../../utils/constants.utility";
import { requireAdmin } from "../../middlewares/admin.middleware";

const r = Router();

// User management endpoints
r.get(
  "/users",
  authMiddleware,
  requireAdmin,
  role([USER_ROLE.ADMIN]),
  validateQuery(usersListSchema),
  C.listUsers
);

r.put(
  "/users/:id",
  authMiddleware,
  requireAdmin,
  role([USER_ROLE.ADMIN]),
  validateParams(approveSchema),
  validate(approveUserSchema),
  C.actionUser
);

// Advertisement management endpoints
r.get(
  "/ads",
  authMiddleware,
  requireAdmin,
  role([USER_ROLE.ADMIN]),
  validateQuery(adminGetAdsQuerySchema),
  C.listAds
);

export default r;
