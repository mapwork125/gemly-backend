import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import Rating from "../../models/Rating.model";

export const rate = asyncHandler(async (req, res) => {
  const r = await Rating.create({
    target: req.params.userId,
    rater: req.user._id,
    ...req.body,
  });
  return success(res, "rated", r, 201);
});
export const getRatings = asyncHandler(async (req, res) => {
  const list = await Rating.find({ target: req.params.userId });
  return success(res, "list", list);
});
