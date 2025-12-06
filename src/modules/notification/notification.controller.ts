import { asyncHandler } from "../../utils/asyncHandler.utility";
import { MODULES, RESPONSE_MESSAGES } from "../../utils/constants.utility";
import { fail, success } from "../../utils/response.utility";
import service from "./notification.service";

export const index = asyncHandler(async (req, res) =>
  success(
    res,
    RESPONSE_MESSAGES.get(MODULES.NOTIFICATION),
    await service.index(req.user._id, req.query)
  )
);
//@ts-ignore
export const markRead = asyncHandler(async (req, res) => {
  await service.markRead(req.user._id, req.params.id);
  success(res, RESPONSE_MESSAGES.marked(MODULES.NOTIFICATION), {});
});

//@ts-ignore
export const markAllRead = asyncHandler(async (req, res) => {
  const result = await service.markAllRead(req.user._id);
  success(res, "All notifications marked as read", result);
});

export const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.user._id, req.params.id);
  if (!data) {
    return fail(res, RESPONSE_MESSAGES.notFound(MODULES.NOTIFICATION), 404);
  } else {
    return success(res, RESPONSE_MESSAGES.deleted(MODULES.NOTIFICATION), {});
  }
});
