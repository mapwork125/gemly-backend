import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
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
export const remove = asyncHandler(async (req, res) =>
  success(
    res,
    "removed",
    (await service.remove(req.user._id, req.params.id)) || {}
  )
);
