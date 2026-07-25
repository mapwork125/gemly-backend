import User from "../../models/User.model";
import Requirement from "../../models/Requirement.model";
import Bid from "../../models/Bid.model";

import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt.utility";
import { RESPONSE_MESSAGES, USER_STATUS } from "../../utils/constants.utility";
import { CustomError } from "../../utils/customError.utility";
import mongoose from "mongoose";
class AuthService {
  async register(data) {
    const hashed = await bcrypt.hash(data.password, 10);
    data.password = hashed;
    let user: any = await User.findOne({ email: data.email });
    if (user)
      throw new CustomError(
        RESPONSE_MESSAGES.EMAIL_ALREADY_EXISTS,
        "EMAIL_ALREADY_EXISTS",
        409
      );
    user = await User.create(data);
    const token = generateToken({
      id: user._id,
      role: user.role,
      userType: user.userType,
      tokenVersion: user.tokenVersion,
    });
    return {userInfo:{userId :user._id,userType:user.userType},user:{status: USER_STATUS.PENDING_KYC, token }};
  }
  async login({ email, password }) {
    // user check
    let user: any = await User.findOne({ email });
    if (!user)
      throw new CustomError(
        RESPONSE_MESSAGES.EMAIL_NOT_MATCH,
        "EMAIL_NOT_MATCH",
        401
      );

    // password check
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      throw new CustomError(
        RESPONSE_MESSAGES.PASSWORD_NOT_MATCH,
        "PASSWORD_NOT_MATCH",
        401
      );

    // status validation
    if (user.status === USER_STATUS.REJECTED) {
      throw new CustomError(
        RESPONSE_MESSAGES.REJECTED,
        "ACCOUNT_REJECTED",
        403
      );
    }
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new CustomError(
        RESPONSE_MESSAGES.SUSPENDED,
        "ACCOUNT_SUSPENDED",
        403
      );
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
      { kyc: body, status: USER_STATUS.APPROVED, isVerified: true },//USER_STATUS.PENDING_ADMIN_APPROVAL },
      { new: true }
    );
  }
  async updateProfile(id, body) {
    let user = await User.findById(id);
    if (!user)
      throw new CustomError(
        RESPONSE_MESSAGES.USER_NOT_FOUND,
        "USER_NOT_FOUND",
        404
      );

    //@ts-ignore
    if (body?.phoneNumber) user?.kyc["phoneNumber"] = body.phoneNumber;
    if (body?.companyAddress)
      //@ts-ignore
      user?.kyc["companyDetails"]["companyAddress"] = body?.companyAddress;
    if (body?.diamondIndustryActivity)
      //@ts-ignore
      user?.kyc["diamondIndustryActivity"] = body.diamondIndustryActivity;

    await user.save();
    return user;
  }
  async logout(id) {
    return User.findByIdAndUpdate(id, { tokenVersion: 1 }, { new: true });
  }
  async req_bids_dataservice(id){
    console.log("id ",id)
      let requirements = await Requirement.find({ userId: new mongoose.Types.ObjectId(id) });
      let bids = await Bid.find({ bidder:id.toString() });

      console.log("requirements ",requirements.length )
      console.log("bids ",bids.length )

      return { requirements, bids };

  }
}
export default new AuthService();
