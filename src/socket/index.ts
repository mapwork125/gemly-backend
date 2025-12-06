import { Server, Socket } from "socket.io";
import { createServer } from "http";
import app from "../app";
import chatEvents from "./chat.events";
import ChatService from "./chat.service";

// Create the HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with proper CORS config
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ⚠️ Use specific domains in production
  },
});

const onlineUsers = new Map<string, string>(); // userId → socketId

/**
 * Handle new socket connections
 */
io.on("connection", (socket: Socket) => {
  console.log("✅ New socket connection:", socket.id);

  /**
   * Register user to a personal room for private messaging or notifications
   */
  socket.on("register", async (userId: string) => {
    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    
    // Store online user mapping
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    // Update online status in database
    try {
      await ChatService.updateOnlineStatus(userId, true, socket.id);
      
      // Broadcast online status to relevant users
      io.emit("user-online", {
        userId,
        isOnline: true,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  });

  /**
   * Join specific conversation room
   */
  socket.on("join-conversations", (conversationIds: string[]) => {
    conversationIds.forEach((convId) => {
      socket.join(`conv_${convId}`);
      console.log(`User joined conversation room: conv_${convId}`);
    });
  });

  // Attach chat event handlers
  chatEvents(socket, io, onlineUsers);

  /**
   * Handle disconnection
   */
  socket.on("disconnect", async () => {
    // Find and remove user from online users
    let disconnectedUserId: string | null = null;
    
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        disconnectedUserId = uid;
        onlineUsers.delete(uid);
        break;
      }
    }

    if (disconnectedUserId) {
      console.log(`❌ User ${disconnectedUserId} disconnected`);
      
      // Update online status in database
      try {
        await ChatService.updateOnlineStatus(disconnectedUserId, false);
        
        // Broadcast offline status
        io.emit("user-offline", {
          userId: disconnectedUserId,
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (error) {
        console.error("Error updating offline status:", error);
      }
    }
    
    console.log("❌ Client disconnected:", socket.id);
  });
});

/**
 * Helper: Send notification to specific users by ID
 */
export const sendNotification = (userIds: string[], message: string) => {
  userIds.forEach((userId) => {
    io.to(userId).emit("notification", { message });
  });
};

/**
 * Helper: Emit new message event to conversation participants
 */
export const emitNewMessage = (conversationId: string, message: any) => {
  io.to(`conv_${conversationId}`).emit("new-message", message);
};

/**
 * Helper: Emit new conversation event to participants
 */
export const emitNewConversation = (userIds: string[], conversation: any) => {
  userIds.forEach((userId) => {
    io.to(userId).emit("new-conversation", conversation);
  });
};

/**
 * Get online users count
 */
export const getOnlineUsersCount = () => onlineUsers.size;

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string) => onlineUsers.has(userId);

// Export initialized server and socket instance
export { io, httpServer };
