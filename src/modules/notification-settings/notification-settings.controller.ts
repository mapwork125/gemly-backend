import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";

export const get = asyncHandler(async (req, res) => {
  const settings = req.user.notificationSettings || {};
  return success(res, "settings", settings);
});
export const update = asyncHandler(async (req, res) => {
  const user = req.user;
  user.notificationSettings = req.body;
  await user.save();
  return success(res, "updated", user.notificationSettings);
});
