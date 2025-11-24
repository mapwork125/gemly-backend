import { Router } from "express";
import * as C from "./rating.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import { ratingSchema, userIdSchema } from "./rating.validation";
const r = Router();

r.post(
  "/:userId",
  authMiddleware,
  validateParams(userIdSchema),
  validate(ratingSchema),
  C.rate
);
r.get("/:userId", authMiddleware, validateParams(userIdSchema), C.getRatings);

export default r;
