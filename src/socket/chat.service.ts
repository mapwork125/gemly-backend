// utils/socket/chat.service.ts
import Message from "../models/Chat.model";
import Conversation from "../models/Conversation.model";
import UserOnlineStatus from "../models/UserOnlineStatus.model";
import User from "../models/User.model";
import Requirement from "../models/Requirement.model";
import Deal from "../models/Deal.model";
import mongoose from "mongoose";
import notificationService from "../services/notification.service";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  RESPONSE_MESSAGES,
} from "../utils/constants.utility";

class ChatService {
  /**
   * Initiate a new conversation
   */
  async initiateConversation(data: {
    participantIds: string[];
    contextType: "REQUIREMENT" | "DEAL";
    contextId: string;
    initialMessage?: string;
    initiatorId: string;
  }) {
    const {
      participantIds,
      contextType,
      contextId,
      initialMessage,
      initiatorId,
    } = data;

    // Sort participant IDs for consistent lookup
    const sortedParticipants = participantIds
      .map((id) => new mongoose.Types.ObjectId(id))
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    // Check for existing conversation
    const existingConversation = await Conversation.findOne({
      participantIds: {
        $all: sortedParticipants,
        $size: sortedParticipants.length,
      },
      contextType,
      contextId: new mongoose.Types.ObjectId(contextId),
    })
      .populate("participantIds", "name email role")
      .populate({
        path: "contextId",
        select: "title agreedPrice status",
      });

    if (existingConversation) {
      // Return existing conversation with last message
      const lastMessage = await Message.findOne({
        conversationId: existingConversation._id,
      })
        .sort({ sentAt: -1 })
        .limit(1);

      return {
        conversation: existingConversation,
        lastMessage,
        isNew: false,
      };
    }

    // Validate participants exist
    const participants = await User.find({
      _id: { $in: sortedParticipants },
    }).select("name email role");

    if (participants.length !== 2) {
      const error: any = new Error("Both participants must exist");
      error.statusCode = 400;
      throw error;
    }

    // Validate context exists
    const contextModel = contextType === "REQUIREMENT" ? Requirement : Deal;
    const context = await (contextModel as any).findById(contextId);

    if (!context) {
      const error: any = new Error(`${contextType} not found`);
      error.statusCode = 404;
      throw error;
    }

    // Create conversation
    const conversation = await Conversation.create({
      participantIds: sortedParticipants,
      contextType,
      contextId: new mongoose.Types.ObjectId(contextId),
      contextType_ref: contextType === "REQUIREMENT" ? "Requirement" : "Deal",
      userSettings: sortedParticipants.map((userId) => ({
        userId,
        unreadCount: 0,
        isMuted: false,
        isPinned: false,
        isArchived: false,
      })),
    });

    await conversation.populate("participantIds", "name email role");
    await conversation.populate({
      path: "contextId",
      select: "title agreedPrice status",
    });

    // Send initial message if provided
    let firstMessage: any = null;
    if (initialMessage && initialMessage.trim()) {
      firstMessage = await this.sendMessage({
        conversationId: conversation._id.toString(),
        senderId: initiatorId,
        text: initialMessage,
      });
    }

    return {
      conversation,
      lastMessage: firstMessage,
      isNew: true,
    };
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    text: string;
    attachments?: Array<{
      type: "image" | "pdf" | "document";
      url: string;
      fileName: string;
      size: number;
    }>;
    replyToMessageId?: string;
  }) {
    const { conversationId, senderId, text, attachments, replyToMessageId } =
      data;

    // Validate conversation exists and user is participant
    const conversation: any = await Conversation.findById(conversationId);
    if (!conversation) {
      const error: any = new Error(
        RESPONSE_MESSAGES.CONVERSATION_NOT_FOUND || "Conversation not found"
      );
      error.statusCode = 404;
      throw error;
    }

    const isParticipant = conversation.participantIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === senderId
    );

    if (!isParticipant) {
      const error: any = new Error(
        "User is not a participant of this conversation"
      );
      error.statusCode = 403;
      throw error;
    }

    // Create message
    const message = await Message.create({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: new mongoose.Types.ObjectId(senderId),
      text,
      attachments: attachments || [],
      replyToMessageId: replyToMessageId
        ? new mongoose.Types.ObjectId(replyToMessageId)
        : undefined,
      status: "SENT",
      sentAt: new Date(),
    });

    await message.populate("senderId", "name email");

    // Update conversation
    conversation.lastMessageText = text.substring(0, 100);
    conversation.lastMessageAt = message.sentAt;

    // Increment unread count for other participants
    conversation.userSettings = conversation.userSettings.map(
      (setting: any) => {
        if (setting.userId.toString() !== senderId) {
          setting.unreadCount = (setting.unreadCount || 0) + 1;
        }
        return setting;
      }
    );

    await conversation.save();

    // Send push notification to offline participants
    const otherParticipants = conversation.participantIds.filter(
      (id: mongoose.Types.ObjectId) => id.toString() !== senderId
    );

    for (const participantId of otherParticipants) {
      const onlineStatus = await UserOnlineStatus.findOne({
        userId: participantId,
      });

      if (!onlineStatus || !onlineStatus.isOnline) {
        const sender: any = await User.findById(senderId).select("name");
        await notificationService.sendNotification(participantId.toString(), {
          title: sender?.name || "New Message",
          message: text.length > 100 ? text.substring(0, 100) + "..." : text,
          type: NOTIFICATION_TYPE.CHAT,
          category: NOTIFICATION_CATEGORY.ACTIONABLE,
          data: { conversationId, messageId: message._id },
          actionUrl: `/chat/${conversationId}`,
        });
      }
    }

    return message;
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      before?: string;
    } = {}
  ) {
    const { page = 1, limit = 50, before } = options;

    // Validate conversation and authorization
    const conversation: any = await Conversation.findById(conversationId)
      .populate("participantIds", "name email role")
      .populate({
        path: "contextId",
        select: "title agreedPrice status",
      });

    if (!conversation) {
      const error: any = new Error(
        RESPONSE_MESSAGES.CONVERSATION_NOT_FOUND || "Conversation not found"
      );
      error.statusCode = 404;
      throw error;
    }

    const isParticipant = conversation.participantIds.some(
      (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
      const error: any = new Error("Unauthorized to view this conversation");
      error.statusCode = 403;
      throw error;
    }

    // Build query
    const query: any = {
      conversationId: new mongoose.Types.ObjectId(conversationId),
    };
    if (before) {
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .populate("senderId", "name email")
      .populate("replyToMessageId");

    const total = await Message.countDocuments({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });

    // Mark unread messages as read
    const unreadMessages = await Message.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      readAt: null,
    });

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: unreadMessages.map((m) => m._id) },
        },
        {
          $set: {
            readAt: new Date(),
            status: "READ",
          },
        }
      );

      // Update conversation user settings
      const userSetting = conversation.userSettings.find(
        (s: any) => s.userId.toString() === userId
      );
      if (userSetting) {
        userSetting.unreadCount = 0;
        userSetting.lastReadAt = new Date();
        await conversation.save();
      }
    }

    // Get online status for participants
    const participantIds = conversation.participantIds.map((p: any) =>
      p._id.toString()
    );
    const onlineStatuses = await UserOnlineStatus.find({
      userId: { $in: participantIds },
    });

    const participantsWithStatus = conversation.participantIds.map((p: any) => {
      const status = onlineStatuses.find(
        (s) => s.userId.toString() === p._id.toString()
      );
      return {
        userId: p._id,
        name: p.name,
        email: p.email,
        role: p.role,
        isOnline: status?.isOnline || false,
        lastSeen: status?.lastSeen,
      };
    });

    // Get unread count for current user
    const userSetting = conversation.userSettings.find(
      (s: any) => s.userId.toString() === userId
    );

    return {
      conversationId: conversation._id,
      participants: participantsWithStatus,
      context: {
        type: conversation.contextType,
        id: conversation.contextId._id,
        details: conversation.contextId,
      },
      messages: messages.reverse(), // Oldest first for display
      pagination: {
        hasMore: messages.length === limit && messages.length < total,
        nextCursor: messages.length > 0 ? messages[0]._id : null,
        total,
      },
      unreadCount: userSetting?.unreadCount || 0,
    };
  }

  /**
   * Get list of user's conversations
   */
  async getUserConversations(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      filter?: "all" | "unread" | "archived";
    } = {}
  ) {
    const { page = 1, limit = 20, filter = "all" } = options;

    const query: any = {
      participantIds: new mongoose.Types.ObjectId(userId),
    };

    // Apply filters
    if (filter === "unread") {
      query["userSettings"] = {
        $elemMatch: {
          userId: new mongoose.Types.ObjectId(userId),
          unreadCount: { $gt: 0 },
        },
      };
    } else if (filter === "archived") {
      query["userSettings"] = {
        $elemMatch: {
          userId: new mongoose.Types.ObjectId(userId),
          isArchived: true,
        },
      };
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("participantIds", "name email role")
      .populate({
        path: "contextId",
        select: "title agreedPrice status",
      });

    const total = await Conversation.countDocuments(query);

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv: any) => {
        const lastMessage = await Message.findOne({
          conversationId: conv._id,
        })
          .sort({ sentAt: -1 })
          .limit(1)
          .populate("senderId", "name");

        // Get online status for other participants
        const otherParticipants = conv.participantIds.filter(
          (p: any) => p._id.toString() !== userId
        );

        const onlineStatuses = await UserOnlineStatus.find({
          userId: { $in: otherParticipants.map((p: any) => p._id) },
        });

        const participantsWithStatus = otherParticipants.map((p: any) => {
          const status = onlineStatuses.find(
            (s) => s.userId.toString() === p._id.toString()
          );
          return {
            userId: p._id,
            name: p.name,
            email: p.email,
            isOnline: status?.isOnline || false,
            lastSeen: status?.lastSeen,
          };
        });

        // Get user settings
        const userSetting = conv.userSettings.find(
          (s: any) => s.userId.toString() === userId
        );

        return {
          conversationId: conv._id,
          participants: participantsWithStatus,
          context: {
            type: conv.contextType,
            id: conv.contextId?._id,
            title: conv.contextId?.title,
          },
          lastMessage: lastMessage
            ? {
                text: lastMessage.text,
                sentAt: lastMessage.sentAt,
                senderId: lastMessage.senderId._id,
                senderName: (lastMessage.senderId as any).name,
              }
            : null,
          unreadCount: userSetting?.unreadCount || 0,
          isPinned: userSetting?.isPinned || false,
          isMuted: userSetting?.isMuted || false,
          isArchived: userSetting?.isArchived || false,
          updatedAt: conv.updatedAt,
        };
      })
    );

    // Calculate total unread count
    const totalUnread = await Conversation.aggregate([
      {
        $match: {
          participantIds: new mongoose.Types.ObjectId(userId),
        },
      },
      { $unwind: "$userSettings" },
      {
        $match: {
          "userSettings.userId": new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$userSettings.unreadCount" },
        },
      },
    ]);

    return {
      conversations: conversationsWithMessages,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
      totalUnread: totalUnread.length > 0 ? totalUnread[0].total : 0,
    };
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(
    userId: string,
    isOnline: boolean,
    socketId?: string
  ) {
    return UserOnlineStatus.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      {
        userId: new mongoose.Types.ObjectId(userId),
        isOnline,
        lastSeen: new Date(),
        socketId: isOnline ? socketId : undefined,
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Mark message as delivered
   */
  async markAsDelivered(messageId: string) {
    return Message.findByIdAndUpdate(
      messageId,
      {
        deliveredAt: new Date(),
        status: "DELIVERED",
      },
      { new: true }
    );
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    return Message.findByIdAndUpdate(
      messageId,
      {
        readAt: new Date(),
        status: "READ",
      },
      { new: true }
    );
  }

  /**
   * Get undelivered messages for a user
   */
  async getUndeliveredMessages(userId: string) {
    return Message.find({
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      deliveredAt: null,
      $or: [
        // Find messages in conversations where user is a participant
        {
          conversationId: {
            $in: await Conversation.find({
              participantIds: new mongoose.Types.ObjectId(userId),
            }).distinct("_id"),
          },
        },
        // Legacy: Direct messages to this user
        { to: new mongoose.Types.ObjectId(userId) },
      ],
    }).populate("senderId", "name");
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string) {
    // Update all unread messages
    await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readAt: null,
      },
      {
        $set: {
          readAt: new Date(),
          status: "READ",
        },
      }
    );

    // Update conversation user settings
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      const userSetting = conversation.userSettings.find(
        (s: any) => s.userId.toString() === userId
      );
      if (userSetting) {
        userSetting.unreadCount = 0;
        userSetting.lastReadAt = new Date();
        await conversation.save();
      }
    }

    return true;
  }

  /**
   * Delete conversation (soft delete)
   */
  async deleteConversation(conversationId: string, userId: string) {
    const conversation: any = await Conversation.findById(conversationId);

    if (!conversation) {
      const error: any = new Error(
        RESPONSE_MESSAGES.CONVERSATION_NOT_FOUND || "Conversation not found"
      );
      error.statusCode = 404;
      throw error;
    }

    // Check if user is a participant
    const isParticipant = conversation.participantIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === userId
    );

    if (!isParticipant) {
      const error: any = new Error(
        "Not authorized to delete this conversation"
      );
      error.statusCode = 403;
      throw error;
    }

    // Mark conversation as archived for this user
    const userSetting = conversation.userSettings.find(
      (s: any) => s.userId.toString() === userId
    );

    if (userSetting) {
      userSetting.isArchived = true;
      await conversation.save();
    }

    return true;
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    searchQuery: string,
    userId: string
  ): Promise<{ messages: any[]; total: number }> {
    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      const error: any = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    const isParticipant = conversation.participantIds.some(
      (id: mongoose.Types.ObjectId) => id.toString() === userId
    );

    if (!isParticipant) {
      const error: any = new Error(
        "Not authorized to search this conversation"
      );
      error.statusCode = 403;
      throw error;
    }

    // Search messages using text index for better performance
    const messages = await Message.find({
      conversationId,
      $text: { $search: searchQuery },
      deletedAt: null,
    })
      .sort({ score: { $meta: "textScore" }, sentAt: -1 })
      .limit(50)
      .populate("senderId", "firstName lastName profileImage")
      .lean();

    const total = await Message.countDocuments({
      conversationId,
      $text: { $search: searchQuery },
      deletedAt: null,
    });

    return {
      messages,
      total,
    };
  }

  // ===== Legacy methods for backward compatibility =====

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

    await notificationService.sendNotification(to, {
      title: "New Message",
      message: `You have received a new message from ${from}.`,
      type: NOTIFICATION_TYPE.CHAT,
      category: NOTIFICATION_CATEGORY.ACTIONABLE,
      data: msg.toObject(),
      actionUrl: `/chat/${from}`,
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
