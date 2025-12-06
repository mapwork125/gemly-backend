import { verifyToken } from "../utils/jwt.utility";
import User from "../models/User.model";
import {
  USER_STATUS,
  USER_ROLE,
  RESPONSE_MESSAGES,
} from "../utils/constants.utility";

export const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth)
      return res
        .status(401)
        .json({ status: false, message: RESPONSE_MESSAGES.AUTH_TOKEN_MISSING });
    const token = auth.split(" ")[1];
    const decoded: any = verifyToken(token);
    console.log(decoded);

    const user = await User.findById(decoded.id);
    if (!user || user?.tokenVersion !== decoded?.tokenVersion)
      return res
        .status(401)
        .json({ status: false, message: RESPONSE_MESSAGES.AUTH_TOKEN_INVALID });
    req.user = user;

    if (req.method !== "GET" && user.role !== USER_ROLE.ADMIN) {
      if (user?.status === USER_STATUS.PENDING_KYC) {
        return res
          .status(403)
          .json({ status: false, message: "registered but no KYC submitted" });
      } else if (user?.status === USER_STATUS.PENDING_ADMIN_APPROVAL) {
        return res.status(403).json({
          status: false,
          message: "KYC submitted, waiting for admin review",
        });
      } else if (user?.status === USER_STATUS.REJECTED) {
        return res.status(403).json({
          status: false,
          message: "registration/KYC rejected by admin",
        });
      } else if (user?.status === USER_STATUS.SUSPENDED) {
        return res.status(403).json({
          status: false,
          message: "suspended by admin",
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth middleware - extracts user if token exists but doesn't require it
 * Used for endpoints that work with or without authentication
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    const token = auth.split(" ")[1];
    const decoded: any = verifyToken(token);

    const user = await User.findById(decoded.id);
    if (user && user?.tokenVersion === decoded?.tokenVersion) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (err) {
    // If token is invalid, continue without user instead of throwing error
    req.user = null;
    next();
  }
};
