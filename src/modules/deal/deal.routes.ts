import { Router } from "express";
import * as C from "./deal.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import { dealIdSchema, bidIdSchema, dealQuerySchema } from "./deal.validation";
const r = Router();

// Create deal from accepted bid
r.post("/:bidId", authMiddleware, validateParams(bidIdSchema), C.createDeal);

// List user's deals (must be before /:id to avoid route conflict)
r.get("/", authMiddleware, validateQuery(dealQuerySchema), C.listDeals);

// Get single deal
r.get("/:id", authMiddleware, validateParams(dealIdSchema), C.getDeal);

// Download deal PDF
r.get("/:id/pdf", authMiddleware, validateParams(dealIdSchema), C.downloadPDF);

export default r;
