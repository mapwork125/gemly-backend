import Deal from "../../models/Deal.model";
import Bid from "../../models/Bid.model";
import RequirementModel from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";
import {
  STATUS,
  RESPONSE_MESSAGES,
  DEAL_STATUS,
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
  BID_STATUS,
} from "../../utils/constants.utility";
import { generateDealPDF, formatDealForPDF } from "../../utils/dealPdf.utility";
import fs from "fs";
import path from "path";

class DealService {
  async create(bidId: string, user: any) {
    // 1. Find bid and populate required data
    const bid: any = await Bid.findById(bidId)
      .populate({
        path: "bidder",
        select: "_id name email",
      })
      .lean();

    if (!bid) {
      const error: any = new Error(RESPONSE_MESSAGES.BID_NOT_FOUND);
      error.code = "BID_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify bid status is ACCEPTED
    if (bid.status !== BID_STATUS.ACCEPTED) {
      const error: any = new Error(RESPONSE_MESSAGES.BID_NOT_ACCEPTED);
      error.code = "BID_NOT_ACCEPTED";
      error.statusCode = 409;
      throw error;
    }

    // 3. Find associated requirement
    const requirement: any = await RequirementModel.findOne({
      bids: bidId,
    })
      .populate({
        path: "userId",
        select: "_id name email",
      })
      .lean();

    if (!requirement) {
      const error: any = new Error(RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND);
      error.code = "REQUIREMENT_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 4. Verify user is the requirement owner (buyer)
    if (requirement.userId._id.toString() !== user._id.toString()) {
      const error: any = new Error(RESPONSE_MESSAGES.UNAUTHORIZED);
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 5. Check if deal already exists for this bid
    const existingDeal = await Deal.findOne({ bid: bidId });
    if (existingDeal) {
      const error: any = new Error(RESPONSE_MESSAGES.DEAL_ALREADY_EXISTS);
      error.code = "DEAL_ALREADY_EXISTS";
      error.statusCode = 409;
      throw error;
    }

    // 6. Create immutable snapshots
    const diamondSnapshot = {
      diamondType: bid.diamondType,
      caratWeight: bid.caratWeight,
      shape: bid.shape,
      cutGrade: bid.cutGrade,
      colorGrade: bid.colorGrade,
      clarityGrade: bid.clarityGrade,
      certificateLab: bid.certificateLab,
      certificateNumber: bid.certificateNumber,
      polish: bid.polish,
      symmetry: bid.symmetry,
      fluorescence: bid.fluorescence,
      measurements: bid.measurements,
    };

    const requirementSnapshot = {
      title: requirement.title,
      description: requirement.description,
      details: requirement.details,
      startDate: requirement.startDate,
      endDate: requirement.endDate,
    };

    const bidSnapshot = {
      bidAmount: bid.bidAmount,
      currency: bid.currency,
      deliveryDays: bid.deliveryDays,
      paymentTerms: bid.paymentTerms,
      acceptedPaymentMethods: bid.acceptedPaymentMethods,
      companyName: bid.companyName,
      contactPerson: bid.contactPerson,
      contactEmail: bid.contactEmail,
      contactPhone: bid.contactPhone,
      businessAddress: bid.businessAddress,
      returnPolicy: bid.returnPolicy,
      warranty: bid.warranty,
      stockStatus: bid.stockStatus,
    };

    // 7. Create deal record
    const deal = await Deal.create({
      bid: bidId,
      requirement: requirement._id,
      buyer: requirement.userId._id,
      seller: bid.bidder._id,
      agreedPrice: bid.bidAmount,
      currency: bid.currency,
      diamondSnapshot,
      requirementSnapshot,
      bidSnapshot,
      status: DEAL_STATUS.DEAL_CREATED,
      price: bid.bidAmount, // Legacy field
    });

    // 8. Lock requirement permanently (mark as FULFILLED)
    await RequirementModel.findByIdAndUpdate(requirement._id, {
      status: STATUS.FULFILLED,
    });

    // 9. Notify seller (bidder) about deal creation
    try {
      await notificationService.sendNotification(bid.bidder._id.toString(), {
        title: "Deal Created",
        message: `Your bid has been converted into a deal for "${requirement.title}".`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          dealId: deal._id,
          requirementTitle: requirement.title,
          agreedPrice: deal.agreedPrice,
          currency: deal.currency,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to send notification to seller:", notifError);
    }

    // 10. Notify buyer about deal confirmation
    try {
      await notificationService.sendNotification(user._id.toString(), {
        title: "Deal Confirmed",
        message: `Deal created successfully for "${requirement.title}".`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          dealId: deal._id,
          requirementTitle: requirement.title,
          agreedPrice: deal.agreedPrice,
          currency: deal.currency,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to send notification to buyer:", notifError);
    }

    // 11. Generate PDF agreement and save to filesystem
    try {
      // Fetch the populated deal for PDF generation
      const populatedDeal = await Deal.findById(deal._id)
        .populate({
          path: "buyer",
          select: "_id name email verified rating",
        })
        .populate({
          path: "seller",
          select: "_id name email verified rating",
        })
        .populate({
          path: "requirement",
          select: "_id title description status",
        })
        .populate({
          path: "bid",
          select: "_id status createdAt",
        })
        .lean();

      if (populatedDeal) {
        const dealPDFData = formatDealForPDF(populatedDeal);
        const pdfBuffer = await generateDealPDF(dealPDFData);

        // Create uploads/pdfs directory if it doesn't exist
        const pdfDir = path.join(process.cwd(), "src", "uploads", "pdfs");
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }

        // Save PDF to filesystem with timestamp
        const timestamp = Date.now();
        const filename = `deal-${deal._id}-${timestamp}.pdf`;
        const filePath = path.join(pdfDir, filename);
        fs.writeFileSync(filePath, pdfBuffer);

        // Generate URL for PDF access
        const pdfUrl = `/api/v1/deals/${deal._id}/pdf`;

        // Store PDF URL and deletion timestamp in database
        const pdfExpiryTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        await Deal.findByIdAndUpdate(deal._id, {
          pdfUrl,
          pdfFilePath: filePath,
          pdfExpiryTime,
        });

        console.log(
          `PDF saved successfully for deal ${deal._id} at ${filePath}`
        );
        console.log(`PDF will be deleted on ${pdfExpiryTime.toISOString()}`);
      }
    } catch (pdfError) {
      console.error("Failed to generate PDF:", pdfError);
      // Don't fail the deal creation if PDF generation fails
    }

    // 12. Return deal data
    return {
      dealId: deal._id,
      status: deal.status,
      agreedPrice: deal.agreedPrice,
      currency: deal.currency,
      buyer: {
        id: requirement.userId._id,
        name: requirement.userId.name,
      },
      seller: {
        id: bid.bidder._id,
        name: bid.bidder.name,
      },
      requirement: {
        id: requirement._id,
        title: requirement.title,
      },
      createdAt: deal.createdAt,
    };
  }

  async get(id: string, user: any) {
    // 1. Find deal with populated references
    const deal: any = await Deal.findById(id)
      .populate({
        path: "buyer",
        select: "_id name email verified rating",
      })
      .populate({
        path: "seller",
        select: "_id name email verified rating",
      })
      .populate({
        path: "requirement",
        select: "_id title description status",
      })
      .populate({
        path: "bid",
        select: "_id status createdAt",
      })
      .lean();

    if (!deal) {
      const error: any = new Error(RESPONSE_MESSAGES.DEAL_NOT_FOUND);
      error.code = "DEAL_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Check access permissions (only buyer, seller, or admin)
    const isBuyer = deal.buyer._id.toString() === user._id.toString();
    const isSeller = deal.seller._id.toString() === user._id.toString();
    const isAdmin = user.role === "2"; // Admin role

    if (!isBuyer && !isSeller && !isAdmin) {
      const error: any = new Error(RESPONSE_MESSAGES.UNAUTHORIZED);
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 3. Return comprehensive deal information
    return {
      id: deal._id,
      status: deal.status,

      // Agreed terms
      agreedPrice: deal.agreedPrice,
      currency: deal.currency,

      // Parties involved
      buyer: {
        id: deal.buyer._id,
        name: deal.buyer.name,
        email: deal.buyer.email,
        verified: deal.buyer.verified,
        rating: deal.buyer.rating,
      },
      seller: {
        id: deal.seller._id,
        name: deal.seller.name,
        email: deal.seller.email,
        verified: deal.seller.verified,
        rating: deal.seller.rating,
      },

      // Frozen diamond details from snapshot
      diamondDetails: deal.diamondSnapshot || {},

      // Requirement snapshot
      requirementDetails: deal.requirementSnapshot || {},

      // Bid snapshot (terms agreed upon)
      bidDetails: deal.bidSnapshot || {},

      // References
      requirement: {
        id: deal.requirement._id,
        title: deal.requirement.title,
        description: deal.requirement.description,
        status: deal.requirement.status,
      },
      bid: {
        id: deal.bid._id,
        status: deal.bid.status,
        createdAt: deal.bid.createdAt,
      },

      // PDF agreement
      pdfUrl: deal.pdfUrl || null,

      // Timestamps
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,

      // Access info
      isBuyer,
      isSeller,
      isAdmin,
    };
  }

  async list(userId: string, queryParams: any = {}) {
    // Build query to find deals where user is buyer or seller
    const query: any = { $or: [{ buyer: userId }, { seller: userId }] };

    // Filter by status if provided
    if (queryParams.status) {
      query.status = queryParams.status;
    }

    // Fetch deals with populated references
    const deals = await Deal.find(query)
      .populate({
        path: "buyer",
        select: "_id name email verified rating",
      })
      .populate({
        path: "seller",
        select: "_id name email verified rating",
      })
      .populate({
        path: "requirement",
        select: "_id title description status",
      })
      .populate({
        path: "bid",
        select: "_id status createdAt",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Format response
    const formattedDeals = deals.map((deal: any) => ({
      id: deal._id,
      status: deal.status,
      agreedPrice: deal.agreedPrice,
      currency: deal.currency,
      buyer: {
        id: deal.buyer._id,
        name: deal.buyer.name,
        email: deal.buyer.email,
        verified: deal.buyer.verified,
        rating: deal.buyer.rating,
      },
      seller: {
        id: deal.seller._id,
        name: deal.seller.name,
        email: deal.seller.email,
        verified: deal.seller.verified,
        rating: deal.seller.rating,
      },
      requirement: {
        id: deal.requirement._id,
        title: deal.requirement.title,
        description: deal.requirement.description,
        status: deal.requirement.status,
      },
      bid: {
        id: deal.bid._id,
        status: deal.bid.status,
        createdAt: deal.bid.createdAt,
      },
      pdfUrl: deal.pdfUrl || null,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      isBuyer: deal.buyer._id.toString() === userId.toString(),
      isSeller: deal.seller._id.toString() === userId.toString(),
    }));

    // Calculate metadata
    const totalDeals = formattedDeals.length;
    const dealsByStatus = {
      dealCreated: formattedDeals.filter(
        (d: any) => d.status === DEAL_STATUS.DEAL_CREATED
      ).length,
      inProgress: formattedDeals.filter(
        (d: any) => d.status === DEAL_STATUS.IN_PROGRESS
      ).length,
      completed: formattedDeals.filter(
        (d: any) => d.status === DEAL_STATUS.COMPLETED
      ).length,
      cancelled: formattedDeals.filter(
        (d: any) => d.status === DEAL_STATUS.CANCELLED
      ).length,
    };

    const asBuyer = formattedDeals.filter((d: any) => d.isBuyer).length;
    const asSeller = formattedDeals.filter((d: any) => d.isSeller).length;

    return {
      deals: formattedDeals,
      meta: {
        totalDeals,
        dealsByStatus,
        asBuyer,
        asSeller,
      },
    };
  }

  async downloadPDF(id: string, user: any) {
    // Find deal
    const deal: any = await Deal.findById(id)
      .select("buyer seller pdfUrl pdfFilePath pdfExpiryTime")
      .lean();

    if (!deal) {
      const error: any = new Error(RESPONSE_MESSAGES.DEAL_NOT_FOUND);
      error.code = "DEAL_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // Check access permissions (only buyer, seller, or admin)
    const isBuyer = deal.buyer.toString() === user._id.toString();
    const isSeller = deal.seller.toString() === user._id.toString();
    const isAdmin = user.role === "2";

    if (!isBuyer && !isSeller && !isAdmin) {
      const error: any = new Error(RESPONSE_MESSAGES.UNAUTHORIZED);
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // Check if PDF URL exists
    if (!deal.pdfUrl || !deal.pdfFilePath) {
      const error: any = new Error("PDF not yet generated");
      error.code = "PDF_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // Check if PDF has expired
    if (deal.pdfExpiryTime && new Date() > new Date(deal.pdfExpiryTime)) {
      const error: any = new Error("PDF has expired and been deleted");
      error.code = "PDF_EXPIRED";
      error.statusCode = 410; // Gone
      throw error;
    }

    // Check if file exists on filesystem
    if (!fs.existsSync(deal.pdfFilePath)) {
      const error: any = new Error("PDF file not found on server");
      error.code = "PDF_FILE_MISSING";
      error.statusCode = 404;
      throw error;
    }

    // Read and return PDF file
    return fs.readFileSync(deal.pdfFilePath);
  }
}

export default new DealService();
