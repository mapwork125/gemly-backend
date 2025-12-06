// utils/socket/chat.events.ts
import { Server, Socket } from "socket.io";
import ChatService from "./chat.service";

export default function chatEvents(
  socket: Socket,
  io: Server,
  onlineUsers: Map<string, string>
) {
  // Send message via WebSocket
  socket.on("send-message", async (payload) => {
    console.log("send-message payload:", payload);

    const { conversationId, text, attachments, replyToMessageId, senderId } =
      payload;

    // Validation
    if (!conversationId || !text || !senderId || !text.trim()) {
      socket.emit("message-error", {
        error: "Invalid message data",
      });
      return;
    }

    try {
      // Store message
      const message = await ChatService.sendMessage({
        conversationId,
        senderId,
        text,
        attachments: attachments || [],
        replyToMessageId,
      });

      // Emit to all participants in the conversation
      io.to(`conv_${conversationId}`).emit("new-message", {
        messageId: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId._id,
        senderName: (message.senderId as any).name,
        text: message.text,
        attachments: message.attachments,
        sentAt: message.sentAt,
        status: message.status,
      });

      // Send confirmation to sender
      socket.emit("message-sent", {
        messageId: message._id,
        conversationId: message.conversationId,
        status: "SENT",
        sentAt: message.sentAt,
      });

      // Emit unread increment to other participants
      const participants = await ChatService.getConversationMessages(
        conversationId,
        senderId,
        { limit: 1 }
      );

      if (participants.participants) {
        participants.participants.forEach((participant: any) => {
          if (participant.userId.toString() !== senderId) {
            const participantSocketId = onlineUsers.get(
              participant.userId.toString()
            );
            if (participantSocketId) {
              io.to(participantSocketId).emit("unread-increment", {
                conversationId,
                messageId: message._id,
              });
            }
          }
        });
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      socket.emit("message-error", {
        error: error.message || "Failed to send message",
      });
    }
  });

  // User connected - mark undelivered messages as delivered
  socket.on("user-connected", async ({ userId }) => {
    try {
      const undeliveredMessages = await ChatService.getUndeliveredMessages(
        userId
      );

      for (const msg of undeliveredMessages) {
        // Mark as delivered
        await ChatService.markAsDelivered(msg._id.toString());

        // Notify sender
        const senderSocketId = onlineUsers.get(msg.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-delivered", {
            messageId: msg._id,
            deliveredAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error processing user connection:", error);
    }
  });

  // Message delivered event
  socket.on("message-delivered", async ({ messageId, userId }) => {
    try {
      const message = await ChatService.markAsDelivered(messageId);

      if (message) {
        // Notify sender
        const senderSocketId = onlineUsers.get(message.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-status-update", {
            messageId: message._id,
            status: "DELIVERED",
            deliveredAt: message.deliveredAt,
            userId,
          });
        }
      }
    } catch (error) {
      console.error("Error marking message as delivered:", error);
    }
  });

  // Message read event
  socket.on("message-read", async ({ messageId, userId }) => {
    try {
      const message = await ChatService.markAsRead(messageId);

      if (message) {
        // Notify sender
        const senderSocketId = onlineUsers.get(message.senderId.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("message-status-update", {
            messageId: message._id,
            status: "READ",
            readAt: message.readAt,
            userId,
          });
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Alternative mark_as_read event (snake_case)
  socket.on("mark_as_read", async ({ conversationId, messageId }) => {
    try {
      if (messageId) {
        // Mark single message as read
        const message = await ChatService.markAsRead(messageId);

        if (message) {
          const senderSocketId = onlineUsers.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit("message_read", {
              messageId: message._id,
              readBy: (socket as any).userId,
              readAt: message.readAt,
            });
          }
        }
      } else if (conversationId) {
        // Mark all messages in conversation as read
        await ChatService.markConversationAsRead(
          conversationId,
          (socket as any).userId
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  });

  // Typing indicator
  socket.on("typing-start", ({ conversationId, userId }) => {
    // Broadcast to all participants except sender
    socket.to(`conv_${conversationId}`).emit("user-typing", {
      conversationId,
      userId,
      isTyping: true,
    });
  });

  socket.on("typing-stop", ({ conversationId, userId }) => {
    socket.to(`conv_${conversationId}`).emit("user-typing", {
      conversationId,
      userId,
      isTyping: false,
    });

    // Also emit user_stopped_typing for compatibility
    socket.to(`conv_${conversationId}`).emit("user_stopped_typing", {
      conversationId,
      userId,
    });
  });

  // Alternative typing events (snake_case)
  socket.on("typing_start", ({ conversationId }) => {
    socket.to(`conv_${conversationId}`).emit("user_typing", {
      userId: (socket as any).userId,
      conversationId,
    });
  });

  socket.on("typing_stop", ({ conversationId }) => {
    socket.to(`conv_${conversationId}`).emit("user_stopped_typing", {
      userId: (socket as any).userId,
      conversationId,
    });
  });

  // Join conversation room
  socket.on("join-conversation", async ({ conversationId, userId }) => {
    console.log(`User ${userId} joining conversation ${conversationId}`);
    socket.join(`conv_${conversationId}`);

    // Notify other participants
    socket.to(`conv_${conversationId}`).emit("user-joined-conversation", {
      conversationId,
      userId,
    });
  });

  // Leave conversation room
  socket.on("leave-conversation", ({ conversationId, userId }) => {
    console.log(`User ${userId} leaving conversation ${conversationId}`);
    socket.leave(`conv_${conversationId}`);

    socket.to(`conv_${conversationId}`).emit("user-left-conversation", {
      conversationId,
      userId,
    });
  });

  // Mark conversation as read
  socket.on("mark-conversation-read", async ({ conversationId, userId }) => {
    try {
      await ChatService.markRead(conversationId, userId);

      socket.emit("conversation-read", {
        conversationId,
        userId,
      });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  });

  // Delete conversation
  socket.on("delete-conversation", async ({ conversationId, userId }) => {
    try {
      await ChatService.deleteConversation(conversationId, userId);

      // Emit to all participants
      io.to(`conv_${conversationId}`).emit("conversation_deleted", {
        conversationId,
        deletedBy: userId,
      });

      socket.emit("conversation-deleted", {
        conversationId,
        success: true,
      });
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      socket.emit("conversation-delete-error", {
        conversationId,
        error: error.message,
      });
    }
  });

  // ===== Legacy event handlers for backward compatibility =====

  socket.on("send-message-legacy", async (payload) => {
    const { from = "", to = "", text = "", meta = {} } = payload;
    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      typeof text !== "string" ||
      !Boolean(from || to || text.trim())
    )
      return;

    const message = await ChatService.storeMessage({ from, to, text, meta });

    // send to receiver live
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("new-message", message);
    }

    // send back to sender for confirmation
    socket.emit("message-sent", message);
  });

  socket.on("typing", ({ from, to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { from });
    }
  });

  socket.on("read-message", async ({ conversationId, userId }) => {
    await ChatService.markRead(conversationId, userId);
  });
}
