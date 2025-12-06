import { Router } from "express";
import multer from "multer";
import path from "path";
import * as C from "./chat.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../middlewares/validation.middleware";
import {
  initiateConversationSchema,
  sendMessageSchema,
  conversationIdParamSchema,
  conversationMessagesQuerySchema,
  listConversationsQuerySchema,
  conversationIdSchema,
} from "./chat.validation";

const r = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/uploads/chat-attachments/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// New conversation-based endpoints
r.post(
  "/initiate",
  authMiddleware,
  validate(initiateConversationSchema),
  C.initiateConversation
);

r.post(
  "/send-message",
  authMiddleware,
  validate(sendMessageSchema),
  C.sendMessage
);

r.get(
  "/:conversationId",
  authMiddleware,
  validateParams(conversationIdParamSchema),
  validateQuery(conversationMessagesQuerySchema),
  C.getConversationMessages
);

// Get list of conversations (moved to root before param routes)
r.get(
  "/",
  authMiddleware,
  validateQuery(listConversationsQuerySchema),
  C.listConversations
);

// Upload attachment endpoint
r.post("/upload", authMiddleware, upload.single("file"), C.uploadAttachment);

// Search messages endpoint
r.get("/search", authMiddleware, C.searchMessages);

// Legacy endpoint for backward compatibility
r.get(
  "/legacy/:user1/:user2",
  authMiddleware,
  validateParams(conversationIdSchema),
  C.getMessages
);

export default r;
