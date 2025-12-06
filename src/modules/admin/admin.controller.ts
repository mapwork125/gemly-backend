import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utility";
import adminService from "./admin.service";
import adsService from "../ads/ads.service";

/**
 * List users with pagination and filtering
 * GET /admin/users
 */
export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminService.listUsers(req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Approve, reject, or suspend user
 * PUT /admin/users/:id
 */
export const actionUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?._id.toString();

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const user = await adminService.actionUser(id, req.body, adminId);

    return res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
      message: `User account ${req.body.action.toLowerCase()}d successfully`,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      error: error.message || "User not found",
    });
  }
});

/**
 * Get all ads for admin
 * GET /admin/ads
 */
export const listAds = asyncHandler(async (req: Request, res: Response) => {
  const result = await adsService.getAdminAds(req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});
