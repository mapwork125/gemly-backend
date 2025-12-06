import { Router } from "express";
import * as Ctrl from "./requirement.controller";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  requirementSchema,
  updateRequirementSchema,
  requirementIdSchema,
  filterRequirementsSchema,
} from "./requirement.validation";
const r = Router();

r.post("/", authMiddleware, validate(requirementSchema), Ctrl.create);
r.get("/", validate(filterRequirementsSchema), Ctrl.index);
r.get(
  "/:id",
  optionalAuthMiddleware,
  validateParams(requirementIdSchema),
  Ctrl.get
);
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
r.patch(
  "/:id/close",
  authMiddleware,
  validateParams(requirementIdSchema),
  Ctrl.close
);

export default r;
