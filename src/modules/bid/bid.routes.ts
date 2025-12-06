import { Router } from "express";
import * as C from "./bid.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  bidSchema,
  bidUpdateSchema,
  requirementIdSchema,
} from "./bid.validation";
import Joi from "joi";
import { BID_STATUS } from "../../utils/constants.utility";

const r = Router();

const bidIdSchema = Joi.object({
  bidId: Joi.string().hex().length(24).required(),
});

const requirementBidSchema = Joi.object({
  requirementId: Joi.string().hex().length(24).required(),
  bidId: Joi.string().hex().length(24).required(),
});
const requirementBidActionSchema = Joi.object({
  requirementId: Joi.string().hex().length(24).required(),
  action: Joi.string().valid("accept", "reject").required(),
  bidId: Joi.string().hex().length(24).required(),
});

const bidQuerySchema = Joi.object({
  sortBy: Joi.string().valid(
    "bidAmount",
    "deliveryDays",
    "createdAt",
    "rating"
  ),
  sortOrder: Joi.string().valid("asc", "desc"),
  status: Joi.string().valid(
    BID_STATUS.ACCEPTED,
    BID_STATUS.PENDING,
    BID_STATUS.REJECTED,
    BID_STATUS.WITHDRAWN
  ),
});

// Place a bid on a requirement
r.post(
  "/:requirementId",
  authMiddleware,
  validateParams(requirementIdSchema),
  validate(bidSchema),
  C.placeBid
);

// Get all bids for a requirement
r.get(
  "/:requirementId",
  authMiddleware,
  validateParams(requirementIdSchema),
  validateQuery(bidQuerySchema),
  C.getBids
);

// Get a specific bid by ID with requirement context
r.get(
  "/:requirementId/:bidId",
  authMiddleware,
  validateParams(requirementBidSchema),
  C.getBid
);

// Update a bid (only by bidder) - legacy without requirement context
r.put(
  "/:requirementId/:bidId",
  authMiddleware,
  validateParams(bidIdSchema),
  validate(bidUpdateSchema),
  C.updateBid
);

// Accept a bid (only by requirement owner) - with requirement context
r.put(
  "/:requirementId/:bidId/:action(accept)",
  authMiddleware,
  validateParams(requirementBidActionSchema),
  C.acceptBid
);

// Reject a bid (only by requirement owner) - with requirement context
r.put(
  "/:requirementId/:bidId/:action(reject)",
  authMiddleware,
  validateParams(requirementBidActionSchema),
  C.rejectBid
);

// Delete a bid (only by bidder) - legacy without requirement context
r.delete(
  "/:requirementId/:bidId",
  authMiddleware,
  validateParams(requirementBidSchema),
  C.deleteBid
);

export default r;
