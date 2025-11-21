import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success, fail } from "../../utils/response.utility";
import authService from "./auth.service";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return success(res, "User registered", { user });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return success(res, "Login success", data);
});

export const verifyIdentity = asyncHandler(async (req, res) => {
  const data: any = await authService.verifyIdentity(req.user._id, req.body);
  return success(res, "Identity verified", data);
});

export const getProfile = asyncHandler(async (req, res) => {
  return success(res, "Profile", req.user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updated: any = await authService.updateProfile(req.user._id, req.body);
  return success(res, "Profile updated", updated);
});

export const logout = asyncHandler(async (req, res) => {
  // token invalidation can be handled via blacklist or short expiry
  return success(res, "Logged out", {});
});
