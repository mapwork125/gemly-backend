import { Router } from "express";
import * as C from "./deal.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateParams } from "../../middlewares/validation.middleware";
import { dealIdSchema, bidIdSchema } from "./deal.validation";
const r = Router();

r.post("/:bidId", authMiddleware, validateParams(bidIdSchema), C.createDeal);
r.get("/:id", authMiddleware, validateParams(dealIdSchema), C.getDeal);
r.get("/", authMiddleware, C.listDeals);

export default r;
