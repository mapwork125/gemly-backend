import { Router } from "express";
import * as C from "./ads.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/role.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import { adSchema, approveAdSchema } from "./ads.validation";
import { USER_TYPE } from "../../utils/constants.utility";
const r = Router();

r.post("/request", authMiddleware, validate(adSchema), C.requestAd);
r.get("/", authMiddleware, C.list);
r.put(
  "/:id/approve",
  authMiddleware,
  role([USER_TYPE.ADMIN]),
  validateParams(approveAdSchema),
  C.approve
);

export default r;
