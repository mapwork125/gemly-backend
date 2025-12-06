import { Router } from "express";
import * as C from "./notification.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import {
  filterNotificationsSchema,
  notificationIdSchema,
} from "./notification.validation";
const r = Router();

r.get("/", authMiddleware, validate(filterNotificationsSchema), C.index);
r.put(
  "/read/:id",
  authMiddleware,
  validateParams(notificationIdSchema),
  C.markRead
);
r.put("/read-all", authMiddleware, C.markAllRead);
r.delete(
  "/:id",
  authMiddleware,
  validateParams(notificationIdSchema),
  C.remove
);

export default r;
