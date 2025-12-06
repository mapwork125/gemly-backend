import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import chatService from "../../socket/chat.service";

// POST /chat/initiate - Start new conversation
export const initiateConversation = asyncHandler(async (req, res) => {
  const { participantIds, contextType, contextId, initialMessage } = req.body;

  // Ensure current user is one of the participants
  if (!participantIds.includes(req.user._id.toString())) {
    participantIds.push(req.user._id.toString());
  }

  const result = await chatService.initiateConversation({
    participantIds,
    contextType,
    contextId,
    initialMessage,
    initiatorId: req.user._id.toString(),
  });

  const statusCode = result.isNew ? 201 : 200;
  const message = result.isNew
    ? "Conversation initiated successfully"
    : "Conversation already exists";

  return res.status(statusCode).json({
    success: true,
    message,
    data: {
      conversationId: result.conversation._id,
      participants: result.conversation.participantIds.map((p: any) => ({
        userId: p._id,
        name: p.name,
        role: p.role,
      })),
      contextType: result.conversation.contextType,
      contextId: result.conversation.contextId._id,
      createdAt: result.conversation.createdAt,
      lastMessage: result.lastMessage
        ? {
            text: result.lastMessage.text,
            sentAt: result.lastMessage.sentAt,
          }
        : null,
    },
  });
});

// POST /chat/send-message - Send message (REST fallback)
export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, attachments, replyToMessageId } = req.body;

  const message = await chatService.sendMessage({
    conversationId,
    senderId: req.user._id.toString(),
    text,
    attachments,
    replyToMessageId,
  });

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: {
      messageId: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId._id,
      senderName: (message.senderId as any).name,
      text: message.text,
      attachments: message.attachments,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      status: message.status,
    },
  });
});

// GET /chat/:conversationId - Get message history
export const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page, limit, before } = req.query;

  const result = await chatService.getConversationMessages(
    conversationId,
    req.user._id.toString(),
    {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      before: before as string,
    }
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
});

// GET /chat - Get list of conversations
export const listConversations = asyncHandler(async (req, res) => {
  const { page, limit, filter } = req.query;

  const result = await chatService.getUserConversations(
    req.user._id.toString(),
    {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      filter: (filter as "all" | "unread" | "archived") || "all",
    }
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
});

// ===== Legacy endpoints for backward compatibility =====

export const getMessages = asyncHandler(async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await chatService.getMessages(user1, user2);
  return success(res, "messages", messages);
});

// POST /chat/upload - Upload attachment
export const uploadAttachment = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded",
    });
  }

  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: "File type not allowed. Allowed: images, PDFs, documents",
    });
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      error: "File too large. Maximum size: 10MB",
    });
  }

  // TODO: Upload to cloud storage (S3, Cloudinary, etc.)
  // For now, return local file info
  const fileUrl = `/uploads/${file.filename}`;

  return res.status(200).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      type: file.mimetype.startsWith("image")
        ? "image"
        : file.mimetype.includes("pdf")
        ? "pdf"
        : "document",
      url: fileUrl,
      fileName: file.originalname,
      size: file.size,
    },
  });
});

// GET /chat/search - Search messages
export const searchMessages = asyncHandler(async (req, res) => {
  const { query, conversationId } = req.query;

  if (!query || !conversationId) {
    return res.status(400).json({
      success: false,
      error: "Query and conversationId are required",
    });
  }

  const result = await chatService.searchMessages(
    conversationId as string,
    query as string,
    req.user._id.toString()
  );

  return res.status(200).json({
    success: true,
    data: result,
  });
});
