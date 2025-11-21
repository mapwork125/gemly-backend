import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import Message from "../../models/Chat.model";

export const initiate = asyncHandler(async (req, res) => {
  // create conversation id client-side or server combine ids
  return success(res, "initiated", {
    conversationId: `${req.user._id}_${req.body.other}`,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const msg = await Message.create({
    conversationId: req.body.conversationId,
    from: req.user._id,
    to: req.body.to,
    text: req.body.text,
  });
  return success(res, "sent", msg, 201);
});

export const getMessages = asyncHandler(async (req, res) => {
  const msgs = await Message.find({
    conversationId: req.params.conversationId,
  });
  return success(res, "messages", msgs);
});

export const listConversations = asyncHandler(async (req, res) => {
  const msgs = await Message.find({
    $or: [{ from: req.user._id }, { to: req.user._id }],
  }).limit(100);
  return success(res, "conversations", msgs);
});
