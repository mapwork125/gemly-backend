import Bid from "../../models/Bid.model";
import Requirement from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  STATUS,
  RESPONSE_MESSAGES,
} from "../../utils/constants.utility";
import { CustomError } from "../../utils/customError.utility";

class BidService {
  async place(requirementId, user, body) {
    // 1. Verify requirement exists and is ACTIVE
    const requirement: any = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND,
        "REQUIREMENT_NOT_FOUND",
        404
      );
    }
    console.log("requirement.status ",requirement.status)
    if (requirement.status !== STATUS.ACTIVE) {
      throw new CustomError(
        RESPONSE_MESSAGES.REQUIREMENT_CLOSED,
        "BID_NOT_ALLOWED",
        403
      );
    }

    // 2. Verify user is not the requirement owner
    if (requirement.userId.toString() === user._id.toString()) {
      throw new CustomError(
        "Cannot bid on your own requirement",
        "BID_NOT_ALLOWED",
        403
      );
    }

    // 3. Check if user already has active bid on this requirement
    const existingBid = await Bid.findOne({
      _id: { $in: requirement.bids },
      bidder: user._id,
    });

    if (existingBid) {
      throw new CustomError(
        "You have already placed a bid on this requirement",
        "DUPLICATE_BID",
        409
      );
    }

    // 11. Calculate pricePerCarat if not provided
    if (!body.pricePerCarat && body.bidAmount && body.caratWeight) {
      body.pricePerCarat = body.bidAmount / body.caratWeight;
    }

    // 10. Set status = "PENDING" (handled in model default or here)
    const bidData = {
      bidder: user._id,
      status: "PENDING",
      requirementId:requirementId,
      ...body,
    };

    // 12. Save bid to database
    const bid = await Bid.create(bidData);

    // 13. Increment requirement.bidsReceived counter
    requirement.bids.push(bid._id);
    requirement.bidsReceived = (requirement.bidsReceived || 0) + 1;
    await requirement.save();

    // 14-15. Create and send notification for requirement owner
    let notificationSent = false;
    try {
      await notificationService.sendNotification(
        requirement.userId.toString(),
        {
          title: "New Bid by " + user.name,
          message: `You have a new bid on your requirement "${requirement.title}".`,
          type: NOTIFICATION_TYPE.BID,
          category: NOTIFICATION_CATEGORY.ACTIONABLE,
          data: {
            bidId: bid._id,
            bidderName: user.name,
            bidAmount: bid.bidAmount,
            currency: bid.currency,
          },
          actionUrl: `/requirements/${requirementId}`,
        }
      );
      notificationSent = true;
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
      // Don't fail the bid placement if notification fails
    }

    // 16. Return success response with meta information
    return {
      bid,
      meta: {
        notificationSent,
        requirementBidsCount: requirement.bids.length,
      },
    };
  }

  async list(requirementId, user, queryParams: any = {}) {
    // 1. Verify requirement exists
    const requirement: any = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND,
        "REQUIREMENT_NOT_FOUND",
        404
      );
    }

    // 2. Check if current user is requirement owner
    const isOwner = requirement.userId.toString() === user._id.toString();

    // Build query
    const query: any = { _id: { $in: requirement.bids } };

    // Apply status filter if provided
    if (queryParams.status) {
      query.status = queryParams.status;
    }

    // Fetch all bids with full population
    let bids = await Bid.find(query)
      .populate({
        path: "bidder",
        select: "_id name email verified rating",
      })
      .lean();

    // 5. Apply sorting
    const sortBy = queryParams.sortBy || "createdAt";
    const sortOrder =
      queryParams.sortOrder || (sortBy === "bidAmount" ? "asc" : "desc");

    bids.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // 6. Calculate metadata
    const totalBids = bids.length;
    const pendingBids = bids.filter((b: any) => b.status === "PENDING").length;
    const acceptedBids = bids.filter(
      (b: any) => b.status === "ACCEPTED"
    ).length;
    const rejectedBids = bids.filter(
      (b: any) => b.status === "REJECTED"
    ).length;

    const bidAmounts = bids.map((b: any) => b.bidAmount).filter(Boolean);
    const lowestBid = bidAmounts.length > 0 ? Math.min(...bidAmounts) : null;
    const highestBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : null;
    const averageBid =
      bidAmounts.length > 0
        ? bidAmounts.reduce((sum, amt) => sum + amt, 0) / bidAmounts.length
        : null;

    // 3. If owner: Return ALL bid fields
    if (isOwner) {
      const fullBids = bids.map((bid: any) => ({
        id: bid._id,
        requirementId,
        sellerId: bid.bidder._id,
        seller: {
          id: bid.bidder._id,
          name: bid.bidder.name,
          verified: bid.bidder.verified || false,
          rating: bid.rating || 0,
          completedSales: bid.previousSales || 0,
        },

        // FULL ACCESS - ALL FIELDS
        bidAmount: bid.bidAmount,
        currency: bid.currency,
        pricePerCarat: bid.pricePerCarat,
        negotiable: bid.negotiable,
        negotiationNote: bid.negotiationNote,

        deliveryDays: bid.deliveryDays,
        canMeetDeadline: bid.canMeetDeadline,
        shippingMethod: bid.shippingMethod,
        shippingCost: bid.shippingCost,
        shippingIncluded: bid.shippingIncluded,
        insuranceIncluded: bid.insuranceIncluded,
        insuranceCost: bid.insuranceCost,

        paymentTerms: bid.paymentTerms,
        acceptedPaymentMethods: bid.acceptedPaymentMethods,
        depositRequired: bid.depositRequired,
        depositAmount: bid.depositAmount,
        depositPercentage: bid.depositPercentage,

        diamondType: bid.diamondType,
        caratWeight: bid.caratWeight,
        shape: bid.shape,
        cutGrade: bid.cutGrade,
        colorGrade: bid.colorGrade,
        clarityGrade: bid.clarityGrade,
        certificateLab: bid.certificateLab,
        certificateNumber: bid.certificateNumber,
        certificateUrl: bid.certificateUrl,
        certificateDate: bid.certificateDate,
        hasInscription: bid.hasInscription,
        inscriptionText: bid.inscriptionText,

        polish: bid.polish,
        symmetry: bid.symmetry,
        fluorescence: bid.fluorescence,
        fluorescenceColor: bid.fluorescenceColor,
        depthPercent: bid.depthPercent,
        tablePercent: bid.tablePercent,
        measurements: bid.measurements,

        treatmentStatus: bid.treatmentStatus,
        origin: bid.origin,
        eyeClean: bid.eyeClean,
        videoUrl: bid.videoUrl,
        imagesUrls: bid.imagesUrls,

        companyName: bid.companyName,
        contactPerson: bid.contactPerson,
        contactEmail: bid.contactEmail,
        contactPhone: bid.contactPhone,
        businessAddress: bid.businessAddress,
        website: bid.website,
        yearsInBusiness: bid.yearsInBusiness,
        businessRegistration: bid.businessRegistration,

        returnPolicy: bid.returnPolicy,
        warranty: bid.warranty,
        gradeGuarantee: bid.gradeGuarantee,
        buybackPolicy: bid.buybackPolicy,

        additionalNotes: bid.additionalNotes,
        specialOffers: bid.specialOffers,

        stockStatus: bid.stockStatus,
        locationOfDiamond: bid.locationOfDiamond,
        canViewInPerson: bid.canViewInPerson,
        viewingLocations: bid.viewingLocations,

        previousSales: bid.previousSales,
        rating: bid.rating,
        references: bid.references,

        status: bid.status,
        validUntil: bid.validUntil,
        isSeen: bid.isSeen,
        createdAt: bid.createdAt,
        updatedAt: bid.updatedAt,
      }));

      return {
        isOwner: true,
        bids: fullBids,
        meta: {
          totalBids,
          pendingBids,
          acceptedBids,
          rejectedBids,
          lowestBid,
          highestBid,
          averageBid: averageBid ? Math.round(averageBid * 100) / 100 : null,
        },
      };
    }

    // 4. If NOT owner: Return LIMITED fields only
    const publicBids = bids.map((bid: any) => ({
      id: bid._id,

      // PUBLIC INFORMATION ONLY
      bidAmount: bid.bidAmount,
      currency: bid.currency,
      negotiable: bid.negotiable,

      companyName: bid.companyName,
      rating: bid.rating,
      yearsInBusiness: bid.yearsInBusiness,

      diamondType: bid.diamondType,
      caratWeight: bid.caratWeight,
      shape: bid.shape,
      cutGrade: bid.cutGrade,
      colorGrade: bid.colorGrade,
      clarityGrade: bid.clarityGrade,
      certificateLab: bid.certificateLab,

      stockStatus: bid.stockStatus,

      createdAt: bid.createdAt,
    }));

    return {
      isOwner: false,
      bids: publicBids,
      meta: {
        totalBids,
        message:
          "Limited view. Only requirement owner can see full bid details.",
      },
    };
  }

  async get(bidId, user, requirementId?: string,userType?:string) {
    const bid: any = await Bid.findById(bidId)
      .populate({
        path: "bidder",
        select: "_id name email verified rating",
      })
      .lean();

    if (!bid) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // Find the requirement this bid belongs to
    let requirement: any;
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
      if (!requirement || !requirement.bids.includes(bidId)) {
        throw new CustomError(
          RESPONSE_MESSAGES.BID_NOT_FOUND,
          "BID_NOT_FOUND",
          404
        );
      }
    } else {
      const requirements = await Requirement.find({ bids: bidId });
      requirement = requirements[0];
    }

    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // Check access levels
    const isRequirementOwner =
      requirement.userId.toString() === user._id.toString();
    const isBidOwner = bid.bidder._id.toString() === user._id.toString();
    console.log("isRequirementOwner ",isRequirementOwner)
    console.log("bid.isSeen ",bid.isSeen)
    console.log("bid.userType ",userType)


    //&& isRequirementOwner buyer hoi and bid joto hoi atle isSeen true kari devanu 
    // Mark as seen if user is the requirement owner
    if (userType == "buyer"  && !bid.isSeen) {
      await Bid.updateOne({ _id: bidId }, { isSeen: true });
      bid.isSeen = true;
    }

    // Full access for requirement owner OR bid owner
    if (isRequirementOwner || isBidOwner) {
      return {
        isOwner: isRequirementOwner,
        isBidder: isBidOwner,
        data: {
          id: bid._id,
          requirementId: requirement._id,
          sellerId: bid.bidder._id,
          seller: {
            id: bid.bidder._id,
            name: bid.bidder.name,
            verified: bid.bidder.verified || false,
            rating: bid.rating || 0,
            completedSales: bid.previousSales || 0,
          },

          // FULL ACCESS - ALL FIELDS
          bidAmount: bid.bidAmount,
          currency: bid.currency,
          pricePerCarat: bid.pricePerCarat,
          negotiable: bid.negotiable,
          negotiationNote: bid.negotiationNote,

          deliveryDays: bid.deliveryDays,
          canMeetDeadline: bid.canMeetDeadline,
          shippingMethod: bid.shippingMethod,
          shippingCost: bid.shippingCost,
          shippingIncluded: bid.shippingIncluded,
          insuranceIncluded: bid.insuranceIncluded,
          insuranceCost: bid.insuranceCost,

          paymentTerms: bid.paymentTerms,
          acceptedPaymentMethods: bid.acceptedPaymentMethods,
          depositRequired: bid.depositRequired,
          depositAmount: bid.depositAmount,
          depositPercentage: bid.depositPercentage,

          diamondType: bid.diamondType,
          caratWeight: bid.caratWeight,
          shape: bid.shape,
          cutGrade: bid.cutGrade,
          colorGrade: bid.colorGrade,
          clarityGrade: bid.clarityGrade,
          certificateLab: bid.certificateLab,
          certificateNumber: bid.certificateNumber,
          certificateUrl: bid.certificateUrl,
          certificateDate: bid.certificateDate,
          hasInscription: bid.hasInscription,
          inscriptionText: bid.inscriptionText,

          polish: bid.polish,
          symmetry: bid.symmetry,
          fluorescence: bid.fluorescence,
          fluorescenceColor: bid.fluorescenceColor,
          depthPercent: bid.depthPercent,
          tablePercent: bid.tablePercent,
          measurements: bid.measurements,

          treatmentStatus: bid.treatmentStatus,
          origin: bid.origin,
          eyeClean: bid.eyeClean,
          videoUrl: bid.videoUrl,
          imagesUrls: bid.imagesUrls,

          companyName: bid.companyName,
          contactPerson: bid.contactPerson,
          contactEmail: bid.contactEmail,
          contactPhone: bid.contactPhone,
          businessAddress: bid.businessAddress,
          website: bid.website,
          yearsInBusiness: bid.yearsInBusiness,
          businessRegistration: bid.businessRegistration,

          returnPolicy: bid.returnPolicy,
          warranty: bid.warranty,
          gradeGuarantee: bid.gradeGuarantee,
          buybackPolicy: bid.buybackPolicy,

          additionalNotes: bid.additionalNotes,
          specialOffers: bid.specialOffers,

          stockStatus: bid.stockStatus,
          locationOfDiamond: bid.locationOfDiamond,
          canViewInPerson: bid.canViewInPerson,
          viewingLocations: bid.viewingLocations,

          previousSales: bid.previousSales,
          rating: bid.rating,
          references: bid.references,

          status: bid.status,
          validUntil: bid.validUntil,
          isSeen: bid.isSeen,
          createdAt: bid.createdAt,
          updatedAt: bid.updatedAt,
        },
      };
    }

    // Limited access for other users
    return {
      isOwner: false,
      isBidder: false,
      data: {
        id: bid._id,

        // PUBLIC INFORMATION ONLY
        bidAmount: bid.bidAmount,
        currency: bid.currency,
        negotiable: bid.negotiable,

        companyName: bid.companyName,
        rating: bid.rating,
        yearsInBusiness: bid.yearsInBusiness,

        diamondType: bid.diamondType,
        caratWeight: bid.caratWeight,
        shape: bid.shape,
        cutGrade: bid.cutGrade,
        colorGrade: bid.colorGrade,
        clarityGrade: bid.clarityGrade,
        certificateLab: bid.certificateLab,

        stockStatus: bid.stockStatus,

        createdAt: bid.createdAt,
      },
    };
  }

  async update(bidId, user, body, requirementId?: string) {
    // 1. Find bid
    const bid: any = await Bid.findById(bidId);
    if (!bid) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // 2. Only bidder can update their own bid
    if (bid.bidder.toString() !== user._id.toString()) {
      throw new CustomError(
        "Only bid owner can update bid",
        "UPDATE_NOT_ALLOWED",
        403
      );
    }

    // 3. Find requirement and validate
    let requirement: any;
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
      if (!requirement || !requirement.bids.includes(bidId)) {
        throw new CustomError(
          RESPONSE_MESSAGES.BID_NOT_FOUND,
          "BID_NOT_FOUND",
          404
        );
      }
    } else {
      const requirements = await Requirement.find({ bids: bidId });
      requirement = requirements[0];
    }

    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // 4. Cannot update if status is ACCEPTED or REJECTED
    if (bid.status === "ACCEPTED" || bid.status === "REJECTED") {
      throw new CustomError(
        `Cannot update bid with status ${bid.status}`,
        "UPDATE_NOT_ALLOWED",
        403
      );
    }

    // 5. Cannot update if requirement is EXPIRED or CLOSED
    if (
      requirement.status === STATUS.EXPIRED ||
      requirement.status === STATUS.CLOSED ||
      requirement.status === STATUS.FULFILLED ||
      requirement.status === STATUS.CANCELLED
    ) {
      throw new CustomError(
        `Cannot update bid for ${requirement.status.toLowerCase()} requirement`,
        "UPDATE_NOT_ALLOWED",
        403
      );
    }

    // 6. Recalculate pricePerCarat if amount or carat changed
    if (body.bidAmount || body.caratWeight) {
      const newAmount = body.bidAmount || bid.bidAmount;
      const newCarat = body.caratWeight || bid.caratWeight;
      body.pricePerCarat = newAmount / newCarat;
    }

    // 7. Update bid
    Object.assign(bid, body);
    await bid.save();

    // 8. Notify requirement owner of bid update
    try {
      await notificationService.sendNotification(
        requirement.userId.toString(),
        {
          title: "Bid Updated",
          message: `${user.name} has updated their bid on "${requirement.title}".`,
          type: NOTIFICATION_TYPE.BID,
          category: NOTIFICATION_CATEGORY.GENERAL,
          data: {
            bidId: bid._id,
            bidderName: user.name,
            bidAmount: bid.bidAmount,
            currency: bid.currency,
          },
          actionUrl: `/requirements/${requirement._id}`,
        }
      );
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    // 9. Return updated bid with full details
    const populatedBid = await Bid.findById(bidId)
      .populate({
        path: "bidder",
        select: "_id name email",
      })
      .lean();

    return {
      bid: populatedBid,
      requirement: {
        id: requirement._id,
        title: requirement.title,
        status: requirement.status,
      },
    };
  }

  async remove(bidId, user, requirementId?: string) {
    // 1. Find bid
    console.log("user ",user)
    console.log("bidId ",bidId)
    console.log("requirementId ",requirementId)
    const bid: any = await Bid.findById(bidId);
    if (!bid) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }


    // 2. Only bidder can withdraw their own bid
    if (bid.bidder.toString() !== user._id.toString()) {
      throw new CustomError(
        RESPONSE_MESSAGES.UNAUTHORIZED,
        "UNAUTHORIZED",
        403
      );
    }

    // 3. Cannot withdraw if status is ACCEPTED
    if (bid.status === "ACCEPTED") {
      throw new CustomError(
        RESPONSE_MESSAGES.WITHDRAW_NOT_ALLOWED,
        "WITHDRAW_NOT_ALLOWED",
        403
      );
    }

    // 4. Find requirement
    let requirement: any;
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
      if (!requirement || !requirement.bids.includes(bidId)) {
        throw new CustomError(
          RESPONSE_MESSAGES.BID_NOT_FOUND,
          "BID_NOT_FOUND",
          404
        );
      }
    } else {
      const requirements = await Requirement.find({ bids: bidId });
      requirement = requirements[0];
    }

    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // 5. Set status to WITHDRAWN (soft delete)
    bid.status = "WITHDRAWN";
    await bid.save();

    // 6. Decrement requirement.bidsReceived counter
    requirement.bidsReceived = Math.max(0, (requirement.bidsReceived || 0) - 1);
    await requirement.save();

    // 7. Notify requirement owner
    try {
      await notificationService.sendNotification(
        requirement.userId.toString(),
        {
          title: "Bid Withdrawn",
          message: `${user.name} has withdrawn their bid on "${requirement.title}".`,
          type: NOTIFICATION_TYPE.BID,
          category: NOTIFICATION_CATEGORY.GENERAL,
          data: {
            bidId: bid._id,
            bidderName: user.name,
          },
          actionUrl: `/requirements/${requirement._id}`,
        }
      );
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return { message: "Bid withdrawn successfully" };
  }

  async accept(bidId: string, user: any, requirementId?: string) {
    // 1. Find bid
    const bid: any = await Bid.findById(bidId)
      .populate({
        path: "bidder",
        select: "_id name email",
      })
      .lean();

    if (!bid) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // 2. Find requirement
    let requirement: any;
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
      if (!requirement || !requirement.bids.includes(bidId)) {
        throw new CustomError(
          RESPONSE_MESSAGES.BID_NOT_FOUND,
          "BID_NOT_FOUND",
          404
        );
      }
    } else {
      const requirements = await Requirement.find({ bids: bidId });
      requirement = requirements[0];
    }

    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND,
        "REQUIREMENT_NOT_FOUND",
        404
      );
    }

    // 3. Only requirement owner can accept bids
    if (requirement.userId.toString() !== user._id.toString()) {
      throw new CustomError(
        RESPONSE_MESSAGES.UNAUTHORIZED,
        "UNAUTHORIZED",
        403
      );
    }

    // 4. Cannot accept if already accepted or rejected
    if (bid.status === "ACCEPTED") {
      throw new CustomError(
        RESPONSE_MESSAGES.ALREADY_ACCEPTED,
        "ALREADY_ACCEPTED",
        409
      );
    }

    if (bid.status === "REJECTED") {
      throw new CustomError(
        RESPONSE_MESSAGES.ALREADY_REJECTED,
        "ALREADY_REJECTED",
        409
      );
    }

    // 5. Cannot accept if requirement is not ACTIVE
    if (requirement.status !== STATUS.ACTIVE) {
      throw new CustomError(
        RESPONSE_MESSAGES.ACCEPT_NOT_ALLOWED,
        "ACCEPT_NOT_ALLOWED",
        403
      );
    }

    // 6. Update bid status to ACCEPTED
    await Bid.findByIdAndUpdate(bidId, { status: "ACCEPTED" });

    // 7. Notify bidder about acceptance
    try {
      await notificationService.sendNotification(bid.bidder._id.toString(), {
        title: "Bid Accepted!",
        message: `Your bid on "${requirement.title}" has been accepted!`,
        type: NOTIFICATION_TYPE.BID,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          bidId: bid._id,
          requirementId: requirement._id,
          requirementTitle: requirement.title,
          bidAmount: bid.bidAmount,
          currency: bid.currency,
        },
        actionUrl: `/bids/${bidId}`,
      });
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return {
      bidId: bid._id,
      status: "ACCEPTED",
      requirement: {
        id: requirement._id,
        title: requirement.title,
      },
    };
  }

  async reject(
    bidId: string,
    user: any,
    rejectionReason?: string,
    requirementId?: string
  ) {
    // 1. Find bid
    const bid: any = await Bid.findById(bidId)
      .populate({
        path: "bidder",
        select: "_id name email",
      })
      .lean();

    if (!bid) {
      throw new CustomError(
        RESPONSE_MESSAGES.BID_NOT_FOUND,
        "BID_NOT_FOUND",
        404
      );
    }

    // 2. Find requirement
    let requirement: any;
    if (requirementId) {
      requirement = await Requirement.findById(requirementId);
      if (!requirement || !requirement.bids.includes(bidId)) {
        throw new CustomError(
          RESPONSE_MESSAGES.BID_NOT_FOUND,
          "BID_NOT_FOUND",
          404
        );
      }
    } else {
      const requirements = await Requirement.find({ bids: bidId });
      requirement = requirements[0];
    }

    if (!requirement) {
      throw new CustomError(
        RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND,
        "REQUIREMENT_NOT_FOUND",
        404
      );
    }

    // 3. Only requirement owner can reject bids
    if (requirement.userId.toString() !== user._id.toString()) {
      throw new CustomError(
        RESPONSE_MESSAGES.UNAUTHORIZED,
        "UNAUTHORIZED",
        403
      );
    }

    // 4. Cannot reject if already accepted or rejected
    if (bid.status === "ACCEPTED") {
      throw new CustomError(
        RESPONSE_MESSAGES.ALREADY_ACCEPTED,
        "ALREADY_ACCEPTED",
        409
      );
    }

    if (bid.status === "REJECTED") {
      throw new CustomError(
        RESPONSE_MESSAGES.ALREADY_REJECTED,
        "ALREADY_REJECTED",
        409
      );
    }

    // 5. Update bid status to REJECTED and save rejection reason
    const updateData: any = { status: "REJECTED" };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    await Bid.findByIdAndUpdate(bidId, updateData);

    // 6. Notify bidder about rejection
    try {
      await notificationService.sendNotification(bid.bidder._id.toString(), {
        title: "Bid Rejected",
        message: `Your bid on "${requirement.title}" has been rejected.${
          rejectionReason ? ` Reason: ${rejectionReason}` : ""
        }`,
        type: NOTIFICATION_TYPE.BID,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          bidId: bid._id,
          requirementId: requirement._id,
          requirementTitle: requirement.title,
          rejectionReason: rejectionReason || null,
        },
        actionUrl: `/bids/${bidId}`,
      });
    } catch (notifError) {
      console.error("Failed to send notification:", notifError);
    }

    return {
      bidId: bid._id,
      status: "REJECTED",
      rejectionReason: rejectionReason || null,
      requirement: {
        id: requirement._id,
        title: requirement.title,
      },
    };
  }
}

export default new BidService();
