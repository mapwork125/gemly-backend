import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import Inventory from "../../models/Inventory.model";
import { generateBarcode } from "../../utils/barcode.utility";

export const create = asyncHandler(async (req, res) => {
  const item = await Inventory.create({
    ...req.body,
    createdBy: req.user._id,
  });
  const b: string = await generateBarcode();
  const itemNew = await Inventory.findByIdAndUpdate(
    item._id,
    {
      barcode: b,
    },
    {
      new: true,
    }
  );
  return success(res, "created", itemNew, 201);
});
export const index = asyncHandler(async (req, res) =>
  success(res, "list", await Inventory.find({ createdBy: req.user._id }))
);
// @ts-ignore
export const update = asyncHandler(async (req, res) =>
  success(
    res,
    "updated",
    await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true })
  )
);
export const remove = asyncHandler(async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  return success(res, "deleted", {});
});
