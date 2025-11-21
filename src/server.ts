import http from "http";
import dotenv from "dotenv";
import app from "./app";
import { initChatSocket } from "./sockets/chat.socket";
import { MongoUtility } from "./utils/mongo.utility";
dotenv.config();

const server = http.createServer(app);

MongoUtility.connect()
  .then(() => {
    initChatSocket(server);
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start", err);
    process.exit(1);
  });
