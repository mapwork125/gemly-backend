import User from "../../models/User.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.utility";
import { RESPONSE_MESSAGES, USER_STATUS } from "../../utils/constants.utility";

class AuthService {
  async register(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    let user: any = await User.findOne({ email: data.email });
    if (user) throw new Error(RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS);
    user = await User.create(data);
    return { status: USER_STATUS.PENDING_KYC };
  }
  async login({ email, password }) {
    // user check
    let user: any = await User.findOne({ email });
    if (!user) throw new Error(RESPONSE_MESSAGES.EMAIL_NOT_MATCH);

    // password check
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error(RESPONSE_MESSAGES.PASSWORD_NOT_MATCH);

    // status validation
    if (user.status === USER_STATUS.REJECTED) {
      throw new Error(RESPONSE_MESSAGES.REJECTED);
    }
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new Error(RESPONSE_MESSAGES.SUSPENDED);
    }

    // token
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
      userType: user.userType,
      tokenVersion: user.tokenVersion,
    });
    return { user, token };
  }
  async verifyIdentity(userId, body) {
    return User.findByIdAndUpdate(
      userId,
      { kyc: body, status: USER_STATUS.PENDING_ADMIN_APPROVAL },
      { new: true }
    );
  }
  async updateProfile(id, body) {
    let user = await User.findById(id);
    if (!user) throw new Error(RESPONSE_MESSAGES.USER_NOT_FOUND);

    //@ts-ignore
    if (body?.phoneNumber) user?.kyc["phoneNumber"] = body.phoneNumber;
    if (body?.companyAddress)
      //@ts-ignore
      user?.kyc["companyDetails"]["companyAddress"] = body?.companyAddress;
    if (body?.diamondIndustryActivity)
      //@ts-ignore
      user?.kyc["diamondIndustryActivity"] = body.diamondIndustryActivity;

    return user;
  }
  async logout(id) {
    return User.findByIdAndUpdate(id, { tokenVersion: 1 }, { new: true });
  }
}
export default new AuthService();
