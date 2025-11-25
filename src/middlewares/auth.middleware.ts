import { verifyToken } from "../utils/jwt.utility";
import User from "../models/User.model";
import { USER_TYPE } from "../utils/constants.utility";

export const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth)
      return res.status(401).json({ status: false, message: "No token" });
    const token = auth.split(" ")[1];
    const decoded: any = verifyToken(token);
    console.log(decoded);

    const user = await User.findById(decoded.id);
    if (!user || user?.tokenVersion !== decoded?.tokenVersion)
      return res.status(401).json({ status: false, message: "Invalid token" });
    req.user = user;

    if (
      req.method !== "GET" &&
      !user.isVerified &&
      user.role !== USER_TYPE.ADMIN
    ) {
      return res
        .status(403)
        .json({ status: false, message: "User not verified" });
    }

    next();
  } catch (err) {
    next(err);
  }
};
