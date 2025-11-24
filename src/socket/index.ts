import { Server, Socket } from "socket.io";
import { createServer } from "http";
import app from "../app";
import chatEvents from "./chat.events";

// Create the HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO with proper CORS config
const io = new Server(httpServer, {
  cors: {
    origin: "*", // ⚠️ Use specific domains in production
  },
});

const onlineUsers = new Map(); // userId → socketId

/**
 * Handle new socket connections
 */
io.on("connection", (socket: Socket) => {
  console.log("A user connected");

  /**
   * Register user to a personal room for private messaging or notifications
   */
  socket.on("register", (userId: string) => {
    console.log(`User ${userId} registered`);
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
  });

  // attach chat handlers
  chatEvents(socket, io, onlineUsers);

  /**
   * Handle disconnection
   */
  socket.on("disconnect", () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
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

// Export initialized server and socket instance
export { io, httpServer };
