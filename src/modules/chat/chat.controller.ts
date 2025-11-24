import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import chatService from "../../socket/chat.service";

export const getMessages = asyncHandler(async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await chatService.getMessages(user1, user2);
  return success(res, "messages", messages);
});

export const listConversations = asyncHandler(async (req, res) => {
  const msgs = await chatService.getUserChatList(req.user._id);
  return success(res, "conversation users", msgs);
});
