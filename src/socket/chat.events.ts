// utils/socket/chat.events.ts
import { Server, Socket } from "socket.io";
import ChatService from "./chat.service";

export default function chatEvents(
  socket: Socket,
  io: Server,
  onlineUsers: Map<string, string>
) {
  // send message
  socket.on("send-message", async (payload) => {
    console.log("payload-->>", payload);
    const { from = "", to = "", text = "", meta = {} } = payload;
    if (
      typeof from !== "string" ||
      typeof to !== "string" ||
      typeof text !== "string" ||
      !Boolean(from || to || text.trim())
    )
      return;
    console.log("payload-->>", from);

    const message = await ChatService.storeMessage({ from, to, text, meta });

    // send to receiver live
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("new-message", message);
    }

    // send back to sender for confirmation
    socket.emit("message-sent", message);
  });

  // typing status
  socket.on("typing", ({ from, to }) => {
    const receiverSocket = onlineUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", { from });
    }
  });

  // read message
  socket.on("read-message", async ({ conversationId, userId }) => {
    await ChatService.markRead(conversationId, userId);
  });
}
