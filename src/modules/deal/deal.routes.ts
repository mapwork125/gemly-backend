import { Router } from "express";
import * as C from "./deal.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import { dealIdSchema, createDealSchema } from "./deal.validation";
const r = Router();

r.post("/", authMiddleware, validate(createDealSchema), C.createDeal);
r.get("/:id", authMiddleware, validateParams(dealIdSchema), C.getDeal);
r.get("/", authMiddleware, C.listDeals);

export default r;
