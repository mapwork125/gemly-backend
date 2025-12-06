import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import service from "./deal.service";

export const createDeal = asyncHandler(async (req, res) => {
  const result = await service.create(req.params.bidId, req.user);

  return res.status(201).json({
    success: true,
    message: "Deal created successfully",
    data: {
      dealId: result.dealId,
      status: result.status,
      createdAt: result.createdAt,
    },
  });
});

export const getDeal = asyncHandler(async (req, res) => {
  const result = await service.get(req.params.id, req.user);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

export const listDeals = asyncHandler(async (req, res) => {
  const result = await service.list(req.user._id, req.query);

  return res.status(200).json({
    success: true,
    data: result.deals,
    meta: result.meta,
  });
});

export const downloadPDF = asyncHandler(async (req, res) => {
  const pdfBuffer = await service.downloadPDF(req.params.id, req.user);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="deal-${req.params.id}.pdf"`
  );
  res.send(pdfBuffer);
});
