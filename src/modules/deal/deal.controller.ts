import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import service from "./deal.service";

export const createDeal = asyncHandler(async (req, res) =>
  success(
    res,
    "deal created",
    await service.create(req.params.bidId, req.user),
    201
  )
);
//@ts-ignore
export const getDeal = asyncHandler(async (req, res) =>
  success(res, "deal", await service.get(req.params.id))
);
export const listDeals = asyncHandler(async (req, res) =>
  success(res, "deals", await service.list(req.user._id))
);
