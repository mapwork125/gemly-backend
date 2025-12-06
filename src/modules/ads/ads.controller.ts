import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.utility";
import adsService from "./ads.service";

/**
 * Submit advertisement request
 * POST /ads/request
 */
export const submitAdRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    try {
      const result = await adsService.submitAdRequest(userId, req.body);

      return res.status(201).json({
        success: true,
        data: result,
        message: "Advertisement request submitted. Awaiting admin approval.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to submit advertisement request",
      });
    }
  }
);

/**
 * Get active approved advertisements
 * GET /ads
 */
export const getActiveAds = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await adsService.getActiveAds(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
);

/**
 * Track ad click
 * POST /ads/:id/click
 */
export const trackAdClick = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await adsService.trackAdClick(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        error: error.message || "Advertisement not found",
      });
    }
  }
);

/**
 * Approve or reject advertisement (Admin only)
 * PUT /ads/:id/approve
 */
export const approveAd = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?._id.toString();

  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const result = await adsService.approveAd(id, adminId, req.body);

    return res.status(200).json({
      success: true,
      data: result,
      message: `Advertisement ${req.body.action.toLowerCase()}d successfully`,
    });
  } catch (error: any) {
    const statusCode = error.message.includes("not found") ? 404 : 409;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to process advertisement",
    });
  }
});

/**
 * Get all ads for admin panel
 * GET /admin/ads
 */
export const getAdminAds = asyncHandler(async (req: Request, res: Response) => {
  const result = await adsService.getAdminAds(req.query);

  return res.status(200).json({
    success: true,
    data: result,
  });
});
