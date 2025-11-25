import { asyncHandler } from "../../utils/asyncHandler.utility";
import { fail, success } from "../../utils/response.utility";
import service from "./notification.service";

export const index = asyncHandler(async (req, res) =>
  success(res, "list", await service.index(req.user._id, req.query))
);
//@ts-ignore
export const markRead = asyncHandler(async (req, res) =>
  success(
    res,
    "marked",
    (await service.markRead(
      req.user._id,
      req.params.id,
      req?.query?.allread
    )) || {}
  )
);
export const remove = asyncHandler(async (req, res) => {
  const data = await service.remove(req.user._id, req.params.id);
  if (!data) {
    return fail(res, "Notification not found", 404);
  } else {
    return success(res, "removed", {});
  }
});
