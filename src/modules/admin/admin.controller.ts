import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import adminService from "./admin.service";

export const listUsers = asyncHandler(async (req, res) =>
  success(res, "users", await adminService.listUsers())
);

export const approveUser = asyncHandler(async (req, res) =>
  success(res, "approved", await adminService.approveUser(req.params.id))
);

export const listAds = asyncHandler(async (req, res) =>
  success(res, "ads", await adminService.listAds())
);

export const approveAd = asyncHandler(async (req, res) =>
  success(res, "approved", await adminService.approveAd(req.params.id))
);
