import { Request, Response, NextFunction } from "express";
import { USER_ROLE } from "../utils/constants.utility";

/**
 * Admin authentication middleware
 * Verifies that the authenticated user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "You must be logged in to access this resource",
    });
  }

  if (req.user.role !== USER_ROLE.ADMIN) {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
      message: "You do not have permission to access this resource",
    });
  }

  next();
};
