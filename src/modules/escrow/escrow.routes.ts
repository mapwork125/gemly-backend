import { Router } from "express";
import * as C from "./escrow.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import { escrowSchema, dealIdSchema } from "./escrow.validation";
const r = Router();

r.post("/initiate", authMiddleware, validate(escrowSchema), C.initiate);
r.post("/release", authMiddleware, validate(escrowSchema), C.release);
r.post("/refund", authMiddleware, validate(escrowSchema), C.refund);
r.get("/:dealId", authMiddleware, validateParams(dealIdSchema), C.getStatus);
r.post("/webhook", C.handleWebhook);

export default r;
