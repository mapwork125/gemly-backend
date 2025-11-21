import User from "../../models/User.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.utility";

class AuthService {
  async register(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    const user = await User.create(data);
    return user;
  }
  async login({ email, password }) {
    const user: any = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error("Invalid credentials");
    const token = generateToken({ id: user._id, role: user.role });
    return { user, token };
  }
  async verifyIdentity(userId, body) {
    return User.findByIdAndUpdate(
      userId,
      { kyc: body, isVerified: true },
      { new: true }
    );
  }
  async updateProfile(id, body) {
    return User.findByIdAndUpdate(id, body, { new: true });
  }
}
export default new AuthService();
