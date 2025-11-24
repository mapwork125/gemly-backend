// utils/socket/chat.service.ts
import Message from "../models/Chat.model";
import mongoose from "mongoose";

class ChatService {
  async getUserChatList(userId: string) {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ from: userId }, { to: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$from", userId] }, "$to", "$from"],
          },
          lastMessage: { $first: "$text" },
          lastMessageAt: { $first: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          user: {
            _id: "$user._id",
            name: "$user.name",
            email: "$user.email",
          },
          lastMessage: 1,
          lastMessageAt: 1,
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    return messages;
  }
  generateConversationId(user1: string, user2: string) {
    const sorted = [user1, user2].sort();
    return `${sorted[0]}_${sorted[1]}`;
  }

  async storeMessage({ from, to, text, meta }: any) {
    const conversationId = this.generateConversationId(from, to);

    const msg = await Message.create({
      conversationId,
      from,
      to,
      text,
      meta,
    });

    return await msg.populate("from to");
  }

  async getMessages(user1: string, user2: string) {
    const conversationId = this.generateConversationId(user1, user2);
    return Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async markRead(conversationId: string, userId: string) {
    return Message.updateMany(
      { conversationId, to: new mongoose.Types.ObjectId(userId) },
      { $set: { read: true } }
    );
  }
}

export default new ChatService();
