import Joi from "joi";

export const initiateSchema = Joi.object({
  other: Joi.string().hex().length(24).required(),
});

export const sendMessageSchema = Joi.object({
  conversationId: Joi.string().required(),
  to: Joi.string().hex().length(24).required(),
  text: Joi.string().required(),
});

export const conversationIdSchema = Joi.object({
  user1: Joi.string().hex().length(24).required(),
  user2: Joi.string().hex().length(24).required(),
});
