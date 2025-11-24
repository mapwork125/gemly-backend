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
    let user: any = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error("Invalid credentials");
    if (user?.tokenVersion !== 0) {
      user = await User.findOneAndUpdate(
        { email },
        { tokenVersion: 0 },
        { new: true }
      );
    }
    const token = generateToken({
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });
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
  async logout(id) {
    return User.findByIdAndUpdate(id, { tokenVersion: 1 }, { new: true });
  }
}
export default new AuthService();
