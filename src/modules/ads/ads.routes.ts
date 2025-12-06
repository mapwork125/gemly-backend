import { Router } from "express";
import * as C from "./ads.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/role.middleware";
import { adRequestRateLimiter } from "../../middlewares/security.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  submitAdRequestSchema,
  getAdsQuerySchema,
  adIdSchema,
  approveAdSchema,
  adminGetAdsQuerySchema,
} from "./ads.validation";
import { USER_ROLE } from "../../utils/constants.utility";

const r = Router();

// Public/User endpoints
r.post(
  "/request",
  authMiddleware,
  adRequestRateLimiter,
  validate(submitAdRequestSchema),
  C.submitAdRequest
);

r.get("/", validateQuery(getAdsQuerySchema), C.getActiveAds);

r.post("/:id/click", validateParams(adIdSchema), C.trackAdClick);

// Admin endpoints
r.put(
  "/:id/approve",
  authMiddleware,
  role([USER_ROLE.ADMIN]),
  validateParams(adIdSchema),
  validate(approveAdSchema),
  C.approveAd
);

r.get(
  "/admin/list",
  authMiddleware,
  role([USER_ROLE.ADMIN]),
  validateQuery(adminGetAdsQuerySchema),
  C.getAdminAds
);

export default r;
