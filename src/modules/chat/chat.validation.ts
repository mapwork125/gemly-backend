import Joi from "joi";

// POST /chat/initiate
export const initiateConversationSchema = Joi.object({
  participantIds: Joi.array()
    .items(Joi.string().hex().length(24))
    .length(2)
    .required()
    .messages({
      "array.length": "Exactly 2 participants required",
      "any.required": "Participant IDs are required",
    }),
  contextType: Joi.string().valid("REQUIREMENT", "DEAL").required().messages({
    "any.only": "Context type must be REQUIREMENT or DEAL",
    "any.required": "Context type is required",
  }),
  contextId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid context ID format",
    "string.length": "Context ID must be 24 characters",
    "any.required": "Context ID is required",
  }),
  initialMessage: Joi.string().max(5000).optional().allow("").messages({
    "string.max": "Initial message cannot exceed 5000 characters",
  }),
});

// POST /chat/send-message
export const sendMessageSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid conversation ID format",
    "string.length": "Conversation ID must be 24 characters",
    "any.required": "Conversation ID is required",
  }),
  text: Joi.string().min(1).max(5000).required().messages({
    "string.empty": "Message text cannot be empty",
    "string.max": "Message cannot exceed 5000 characters",
    "any.required": "Message text is required",
  }),
  attachments: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid("image", "pdf", "document").required(),
        url: Joi.string().uri().required(),
        fileName: Joi.string().required(),
        size: Joi.number().max(10485760).required(), // 10MB max
      })
    )
    .max(5)
    .optional()
    .messages({
      "array.max": "Maximum 5 attachments allowed",
      "number.max": "Attachment size cannot exceed 10MB",
    }),
  replyToMessageId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Invalid reply message ID format",
  }),
});

// GET /chat/:conversationId
export const conversationIdParamSchema = Joi.object({
  conversationId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid conversation ID format",
    "string.length": "Conversation ID must be 24 characters",
  }),
});

export const conversationMessagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.string().hex().length(24).optional(),
});

// GET /chat (list conversations)
export const listConversationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  filter: Joi.string().valid("all", "unread", "archived").default("all"),
});

// Legacy schemas for backward compatibility
export const initiateSchema = Joi.object({
  other: Joi.string().hex().length(24).required(),
});

export const conversationIdSchema = Joi.object({
  user1: Joi.string().hex().length(24).required(),
  user2: Joi.string().hex().length(24).required(),
});

