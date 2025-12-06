import { Router } from "express";
import * as C from "./escrow.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  httpsOnly,
  rateLimiter,
  auditLogger,
  idempotencyMiddleware,
} from "../../middlewares/security.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  initiateEscrowSchema,
  releaseEscrowSchema,
  refundEscrowSchema,
  dealIdSchema,
} from "./escrow.validation";

const r = Router();

// Apply HTTPS enforcement and rate limiting to all routes
r.use(httpsOnly);
r.use(rateLimiter);

// Initiate escrow and create payment intent
r.post(
  "/initiate",
  authMiddleware,
  validate(initiateEscrowSchema),
  idempotencyMiddleware,
  auditLogger("ESCROW_INITIATE"),
  C.initiate
);

// Release payment to seller
r.post(
  "/release",
  authMiddleware,
  validate(releaseEscrowSchema),
  idempotencyMiddleware,
  auditLogger("ESCROW_RELEASE"),
  C.release
);

// Refund payment to buyer
r.post(
  "/refund",
  authMiddleware,
  validate(refundEscrowSchema),
  idempotencyMiddleware,
  auditLogger("ESCROW_REFUND"),
  C.refund
);

// Get escrow status
r.get(
  "/:dealId",
  authMiddleware,
  validateParams(dealIdSchema),
  auditLogger("ESCROW_STATUS"),
  C.getStatus
);

// Stripe webhook (no auth, but signature verified in controller)
r.post("/webhook", auditLogger("ESCROW_WEBHOOK"), C.handleWebhook);

export default r;
