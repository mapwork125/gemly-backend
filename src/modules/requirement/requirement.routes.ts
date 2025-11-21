import { Router } from "express";
import * as Ctrl from "./requirement.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  requirementSchema,
  updateRequirementSchema,
  requirementIdSchema,
} from "./requirement.validation";
const r = Router();

r.post("/", authMiddleware, validate(requirementSchema), Ctrl.create);
r.get("/", Ctrl.index);
r.get("/:id", validateParams(requirementIdSchema), Ctrl.get);
r.put(
  "/:id",
  authMiddleware,
  validateParams(requirementIdSchema),
  validate(updateRequirementSchema),
  Ctrl.update
);
r.delete(
  "/:id",
  authMiddleware,
  validateParams(requirementIdSchema),
  Ctrl.remove
);

export default r;
