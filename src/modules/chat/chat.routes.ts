import { Router } from "express";
import * as C from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
} from "../../middlewares/validation.middleware";
import { conversationIdSchema } from "./chat.validation";
const r = Router();

//users list
r.get("/", authMiddleware, C.listConversations);

//conversation messages
r.get(
  "/:user1/:user2",
  authMiddleware,
  validateParams(conversationIdSchema),
  C.getMessages
);

export default r;
