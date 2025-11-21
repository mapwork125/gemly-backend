import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import Ad from "../../models/Ads.model";

export const requestAd = asyncHandler(async (req, res) => {
  const a = await Ad.create({ requester: req.user._id, ...req.body });
  return success(res, "requested", a, 201);
});
export const list = asyncHandler(async (req, res) =>
  success(res, "ads", await Ad.find({ status: "approved" }))
);
//@ts-ignore
export const approve = asyncHandler(async (req, res) =>
  success(
    res,
    "approved",
    await Ad.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    )
  )
);
