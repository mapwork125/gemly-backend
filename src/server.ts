import dotenv from "dotenv";
import app from "./app";
import { mongooseConnection } from "./config/connection";
import { httpServer } from "./socket";
dotenv.config();

app.use(mongooseConnection);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
