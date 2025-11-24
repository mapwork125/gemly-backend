import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";

export const get = asyncHandler(async (req, res) => {
  const settings = {
    notificationsEnabled: req.user.notificationsEnabled,
  };
  return success(res, "settings", settings);
});
export const update = asyncHandler(async (req, res) => {
  const user = req.user;
  user.notificationsEnabled = req.body.notificationsEnabled;
  await user.save();
  return success(res, "updated", {
    notificationsEnabled: user?.notificationsEnabled,
  });
});
