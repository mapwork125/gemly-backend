import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import service from "./escrow.service";

export const initiate = asyncHandler(async (req, res) => {
  const escrow = await service.initiate(req.body);
  return success(
    res,
    "initiated",
    { client_secret: escrow.paymentIntentId },
    201
  );
});
//@ts-ignore
export const release = asyncHandler(async (req, res) =>
  success(res, "released", await service.release(req.body))
);
//@ts-ignore
export const refund = asyncHandler(async (req, res) =>
  success(res, "refunded", await service.refund(req.body))
);
//@ts-ignore
export const getStatus = asyncHandler(async (req, res) =>
  success(res, "status", await service.status(req.params.dealId))
);

export const handleWebhook = asyncHandler(async (req, res) => {
  const event = req.body;
  await service.handleWebhook(event);
  return success(res, "webhook received", {});
});
