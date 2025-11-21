import { Router } from "express";
import * as C from "./admin.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/role.middleware";
import { validateParams } from "../../middlewares/validation.middleware";
import { approveSchema } from "./admin.validation";
import { USER_TYPE } from "../../utils/constants.utility";
const r = Router();

r.get("/users", authMiddleware, role([USER_TYPE.ADMIN]), C.listUsers);
r.put(
  "/users/:id/approve",
  authMiddleware,
  role([USER_TYPE.ADMIN]),
  validateParams(approveSchema),
  C.approveUser
);
r.get("/ads", authMiddleware, role([USER_TYPE.ADMIN]), C.listAds);
r.put(
  "/ads/:id/approve",
  authMiddleware,
  role([USER_TYPE.ADMIN]),
  validateParams(approveSchema),
  C.approveAd
);

export default r;
