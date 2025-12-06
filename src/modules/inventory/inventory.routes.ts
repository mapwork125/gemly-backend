import { Router } from "express";
import * as C from "./inventory.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  inventorySchema,
  updateInventorySchema,
  inventoryIdSchema,
  deleteInventorySchema,
  quickStatusUpdateSchema,
  inventoryQuerySchema,
} from "./inventory.validation";

const r = Router();

// Create new inventory item
r.post("/", authMiddleware, validate(inventorySchema), C.create);

// List inventory with filtering and pagination
r.get("/", authMiddleware, validate(inventoryQuerySchema), C.index);

// Quick status update (for mobile barcode scanning)
r.patch(
  "/:id/quick-status",
  authMiddleware,
  validateParams(inventoryIdSchema),
  validate(quickStatusUpdateSchema),
  C.quickStatusUpdate
);

// Update inventory item (full update)
r.put(
  "/:id",
  authMiddleware,
  validateParams(inventoryIdSchema),
  validate(updateInventorySchema),
  C.update
);

// Soft delete inventory item
r.delete(
  "/:id",
  authMiddleware,
  validateParams(inventoryIdSchema),
  validate(deleteInventorySchema),
  C.remove
);

export default r;
