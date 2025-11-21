import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import service from "./bid.service";

export const placeBid = asyncHandler(async (req, res) =>
  success(
    res,
    "bid placed",
    await service.place(req.params.requirementId, req.user, req.body),
    201
  )
);
export const getBids = asyncHandler(async (req, res) =>
  success(res, "bids", await service.list(req.params.requirementId, req.user))
);
