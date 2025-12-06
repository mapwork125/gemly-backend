import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import service from "./bid.service";

export const placeBid = asyncHandler(async (req, res) => {
  const result = await service.place(
    req.params.requirementId,
    req.user,
    req.body
  );

  // Format response according to specification
  return res.status(201).json({
    success: true,
    message: "Bid placed successfully",
    data: {
      id: result.bid._id,
      requirementId: req.params.requirementId,
      sellerId: result.bid.bidder,
      bidAmount: result.bid.bidAmount,
      currency: result.bid.currency,
      negotiable: result.bid.negotiable,
      deliveryDays: result.bid.deliveryDays,
      diamondType: result.bid.diamondType,
      caratWeight: result.bid.caratWeight,
      shape: result.bid.shape,
      cutGrade: result.bid.cutGrade,
      colorGrade: result.bid.colorGrade,
      clarityGrade: result.bid.clarityGrade,
      certificateLab: result.bid.certificateLab,
      certificateNumber: result.bid.certificateNumber,
      companyName: result.bid.companyName,
      contactPerson: result.bid.contactPerson,
      stockStatus: result.bid.stockStatus,
      status: result.bid.status || "PENDING",
      createdAt: result.bid.createdAt,
      updatedAt: result.bid.updatedAt,
    },
    meta: {
      notificationSent: result.meta.notificationSent,
      requirementBidsCount: result.meta.requirementBidsCount,
    },
  });
});

export const getBids = asyncHandler(async (req, res) => {
  const result = await service.list(
    req.params.requirementId,
    req.user,
    req.query
  );

  return res.status(200).json({
    success: true,
    isOwner: result.isOwner,
    data: result.bids,
    meta: result.meta,
  });
});

export const getBid = asyncHandler(async (req, res) => {
  const result = await service.get(
    req.params.bidId,
    req.user,
    req.params.requirementId
  );

  return res.status(200).json({
    success: true,
    isOwner: result.isOwner,
    isBidder: result.isBidder,
    data: result.data,
  });
});

export const updateBid = asyncHandler(async (req, res) => {
  const result = await service.update(
    req.params.bidId,
    req.user,
    req.body,
    req.params.requirementId
  );

  if (!result.bid) {
    throw new Error("Bid not found");
  }

  return res.status(200).json({
    success: true,
    message: "Bid updated successfully",
    data: {
      id: result.bid._id,
      requirementId: result.requirement.id,
      sellerId: result.bid.bidder._id,
      bidAmount: result.bid.bidAmount,
      currency: result.bid.currency,
      negotiable: result.bid.negotiable,
      deliveryDays: result.bid.deliveryDays,
      diamondType: result.bid.diamondType,
      caratWeight: result.bid.caratWeight,
      shape: result.bid.shape,
      cutGrade: result.bid.cutGrade,
      colorGrade: result.bid.colorGrade,
      clarityGrade: result.bid.clarityGrade,
      certificateLab: result.bid.certificateLab,
      certificateNumber: result.bid.certificateNumber,
      companyName: result.bid.companyName,
      contactPerson: result.bid.contactPerson,
      stockStatus: result.bid.stockStatus,
      status: result.bid.status,
      createdAt: result.bid.createdAt,
      updatedAt: result.bid.updatedAt,
    },
    meta: {
      requirementStatus: result.requirement.status,
      requirementTitle: result.requirement.title,
    },
  });
});

export const deleteBid = asyncHandler(async (req, res) => {
  const result = await service.remove(
    req.params.bidId,
    req.user,
    req.params.requirementId
  );

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const acceptBid = asyncHandler(async (req, res) => {
  const result = await service.accept(
    req.params.bidId,
    req.user,
    req.params.requirementId
  );

  return res.status(200).json({
    success: true,
    message: "Bid accepted successfully",
    data: {
      bidId: result.bidId,
      status: result.status,
      requirement: result.requirement,
    },
  });
});

export const rejectBid = asyncHandler(async (req, res) => {
  const result = await service.reject(
    req.params.bidId,
    req.user,
    req.body.rejectionReason,
    req.params.requirementId
  );

  return res.status(200).json({
    success: true,
    message: "Bid rejected successfully",
    data: {
      bidId: result.bidId,
      status: result.status,
      rejectionReason: result.rejectionReason,
      requirement: result.requirement,
    },
  });
});
