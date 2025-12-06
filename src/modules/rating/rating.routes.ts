import { Router } from "express";
import * as C from "./rating.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  submitRatingSchema,
  getRatingsQuerySchema,
  userIdSchema,
  ratingSchema,
  reportAbuseSchema,
  ratingIdSchema,
  reportIdSchema,
  resolveReportSchema,
} from "./rating.validation";

const r = Router();

// New rating system endpoints
r.post(
  "/:userId",
  authMiddleware,
  validateParams(userIdSchema),
  validate(submitRatingSchema),
  C.submitRating
);

r.get(
  "/:userId",
  authMiddleware,
  validateParams(userIdSchema),
  validateQuery(getRatingsQuerySchema),
  C.getUserRatings
);

// Legacy endpoints (backward compatibility)
r.post(
  "/legacy/:userId",
  authMiddleware,
  validateParams(userIdSchema),
  validate(ratingSchema),
  C.rate
);

r.get(
  "/legacy/:userId",
  authMiddleware,
  validateParams(userIdSchema),
  C.getRatings
);

// Abuse reporting endpoints
r.post(
  "/:ratingId/report",
  authMiddleware,
  validateParams(ratingIdSchema),
  validate(reportAbuseSchema),
  C.reportAbuse
);

r.get(
  "/:ratingId/reports",
  authMiddleware,
  validateParams(ratingIdSchema),
  C.getAbuseReports
);

r.put(
  "/reports/:reportId/resolve",
  authMiddleware,
  validateParams(reportIdSchema),
  validate(resolveReportSchema),
  C.resolveAbuseReport
);

export default r;
