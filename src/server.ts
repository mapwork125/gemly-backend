import dotenv from "dotenv";
import app from "./app";
import { mongooseConnection } from "./config/connection";
import { httpServer } from "./socket";
import bcrypt from "bcryptjs";
import User from "./models/User.model";
import { USER_TYPE } from "./utils/constants.utility";
dotenv.config();

app.use(mongooseConnection);

const PORT = process.env.PORT || 5000;

const ensureAdminExists = async () => {
  const adminEmail = process.env.ADMIN_EMAIL || "admin.diamond@gmail.com";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "diamondAdmin@123",
      10
    );
    await User.create({
      email: adminEmail,
      password: hashed,
      name: "Admin",
      role: USER_TYPE.ADMIN,
      isVerified: true,
      notificationsEnabled: true,
    });
    console.log("Admin user created successfully.");
  } else {
    console.log("Admin user already exists.");
  }
};

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  ensureAdminExists();
});
