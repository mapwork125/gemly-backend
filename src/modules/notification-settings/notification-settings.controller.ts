import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import { RESPONSE_MESSAGES } from "../../utils/constants.utility";

export const get = asyncHandler(async (req, res) => {
  const settings = req.user.notificationSettings;
  return success(res, "settings", settings);
});

export const update = asyncHandler(async (req, res) => {
  const user = req.user;
  const updatedSettings = req.body;

  // Validate caratRanges and budgetRanges
  if (updatedSettings.caratRanges) {
    updatedSettings.caratRanges.forEach((range) => {
      if (range.min >= range.max) {
        throw new Error(RESPONSE_MESSAGES.INVALID_RANGE);
      }
    });
  }

  if (updatedSettings.budgetRanges) {
    updatedSettings.budgetRanges.forEach((range) => {
      if (range.min >= range.max) {
        throw new Error(RESPONSE_MESSAGES.INVALID_RANGE);
      }
    });
  }

  // Validate quiet hours
  if (
    updatedSettings.quietHours &&
    updatedSettings.quietHours.startTime === updatedSettings.quietHours.endTime
  ) {
    throw new Error(RESPONSE_MESSAGES.INVALID_VALUE);
  }

  user.notificationSettings = {
    ...user.notificationSettings,
    ...updatedSettings,
    updatedAt: new Date(),
  };

  await user.save();
  return success(res, "updated", user.notificationSettings);
});
