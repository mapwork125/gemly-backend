import Requirement from "../../models/Requirement.model";
import RequirementView from "../../models/RequirementView.model";
import notificationService from "../../services/notification.service";
import matchingService from "../../services/matching.service";
import User from "../../models/User.model";
import {
  MODULES,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  RESPONSE_MESSAGES,
  STATUS,
} from "../../utils/constants.utility";

class ReqService {
  async index(req) {
    const {
      page = 1,
      limit = 20,
      status,
      diamondType,
      shapes,
      caratMin,
      caratMax,
      budgetMin,
      budgetMax,
      colorType,
      certified,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (status) query["status"] = status;
    if (diamondType) query["details.diamondType"] = diamondType;
    if (shapes) query["details.shapes"] = { $in: shapes.split(",") };
    if (caratMin || caratMax) {
      query["details.caratMin"] = { $gte: caratMin || 0 };
      if (caratMax) query["details.caratMax"] = { $lte: caratMax };
    }
    if (budgetMin || budgetMax) {
      query["details.budgetMin"] = { $gte: budgetMin || 0 };
      if (budgetMax) query["details.budgetMax"] = { $lte: budgetMax };
    }
    if (colorType) query["details.colorType"] = colorType;
    if (certified !== undefined) query["details.certified"] = certified;
    console.log("query", query);

    // Auto-disable expired requirements
    await Requirement.updateMany(
      { endDate: { $lt: new Date() }, status: STATUS.ACTIVE },
      { status: STATUS.EXPIRED }
    );

    const requirements = await Requirement.find(query)
      .populate({
        path: "userId",
        select: "_id name email",
      })
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Requirement.countDocuments(query);

    return { requirements, total, page, limit };
  }

  async get(id, userId?: string, ipAddress?: string, userAgent?: string) {
    const requirement = await Requirement.findById(id).populate({
      path: "userId",
      select: "_id name email",
    });

    if (!requirement) {
      throw new Error(RESPONSE_MESSAGES.notFound(MODULES.REQUIREMENT));
    }

    // Track view if:
    // 1. User is not the requirement owner
    // 2. This is a unique view (first time this user/IP views this requirement)
    const isOwner = userId && requirement.userId._id.toString() === userId;

    if (!isOwner) {
      await this.trackView(id, userId, ipAddress, userAgent);
    }

    return requirement;
  }

  /**
   * Track a unique view for a requirement
   * Increments view counter only once per user/IP
   */
  private async trackView(
    requirementId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // For authenticated users, track by userId
      if (userId) {
        const existingView = await RequirementView.findOne({
          requirementId,
          userId,
        });

        if (!existingView) {
          await RequirementView.create({
            requirementId,
            userId,
            ipAddress,
            userAgent,
          });

          // Increment view counter
          await Requirement.findByIdAndUpdate(requirementId, {
            $inc: { views: 1 },
          });
        }
      }
      // For anonymous users, track by IP address
      else if (ipAddress) {
        const existingView = await RequirementView.findOne({
          requirementId,
          ipAddress,
          userId: null,
        });

        if (!existingView) {
          await RequirementView.create({
            requirementId,
            ipAddress,
            userAgent,
          });

          // Increment view counter
          await Requirement.findByIdAndUpdate(requirementId, {
            $inc: { views: 1 },
          });
        }
      }
    } catch (error) {
      // Don't fail the request if view tracking fails
      console.error("View tracking error:", error);
    }
  }

  async create(body, req) {
    body.userId = req.user._id;

    // Generate warnings (non-blocking)
    const warnings = this.generateWarnings(body);

    const requirement = await Requirement.create(body);

    // Trigger intelligent matching algorithm
    console.log(
      "[REQUIREMENT] Triggering intelligent matching for requirement:",
      requirement._id
    );

    try {
      const matchedUsersCount = await matchingService.matchRequirementToUsers(
        requirement
      );
      console.log(
        `[REQUIREMENT] Successfully notified ${matchedUsersCount} matched users`
      );
    } catch (error) {
      console.error("[REQUIREMENT] Matching service error:", error);
      // Don't fail requirement creation if matching fails
    }

    // Return requirement with warnings
    return {
      requirement,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Generate non-blocking warning messages
   */
  private generateWarnings(body: any): string[] {
    const warnings: string[] = [];
    const details = body.details || {};

    // EYECLEAN_LOW_CLARITY_WARNING
    if (details.eyeClean && details.clarityGrades) {
      const lowClarityGrades = ["SI2", "SI3", "I1", "I2", "I3"];
      const hasLowClarity = details.clarityGrades.some((grade: string) =>
        lowClarityGrades.includes(grade)
      );
      if (hasLowClarity) {
        warnings.push(
          "EYECLEAN_LOW_CLARITY_WARNING: Eye-clean requirement with SI2 or lower clarity may be difficult to fulfill"
        );
      }
    }

    // LOW_BUDGET_WARNING
    if (details.budgetMax && details.caratMax) {
      const budgetPerCarat = details.budgetMax / details.caratMax;
      // Rough threshold: $2000/carat for natural diamonds
      if (budgetPerCarat < 2000 && details.diamondType === "NATURAL") {
        warnings.push(
          "LOW_BUDGET_WARNING: Budget may be too low for specified carat weight"
        );
      }
    }

    // NON_CERTIFIED_WARNING
    if (details.certified === false) {
      warnings.push(
        "NON_CERTIFIED_WARNING: Non-certified diamonds may be harder to verify and resell"
      );
    }

    // LONG_DEADLINE_WARNING
    if (details.deliveryTimeline) {
      const daysUntilDelivery = Math.floor(
        (new Date(details.deliveryTimeline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntilDelivery > 365) {
        warnings.push(
          "LONG_DEADLINE_WARNING: Deadline is more than 1 year in the future"
        );
      }
    }

    return warnings;
  }
  async update(id, body, userid) {
    const requirement = await Requirement.findOne({
      _id: id,
      userId: userid,
    }).populate({
      path: "bids",
      populate: { path: "bidder", select: "_id name email" },
    });

    if (!requirement) {
      throw new Error(RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND);
    }

    // Cannot edit if not ACTIVE
    if (requirement.status !== STATUS.ACTIVE) {
      throw new Error(RESPONSE_MESSAGES.EDIT_NOT_ALLOWED);
    }

    // Cannot edit if deadline has passed
    if (requirement.endDate < new Date()) {
      throw new Error(RESPONSE_MESSAGES.EDIT_NOT_ALLOWED);
    }

    // If bids exist, notify all bidders about the update
    const hasBids = requirement.bids.length > 0;
    if (hasBids) {
      const bidders: any = requirement.bids;
      const bidderIds = bidders.map((bid) => bid.bidder._id.toString());

      // Notify bidders
      await notificationService.sendBulkNotification(bidderIds, {
        title: "Requirement Updated",
        message: `The requirement "${requirement.title}" you bid on has been updated. Please review the changes.`,
        data: { requirementId: requirement._id.toString() },
        type: NOTIFICATION_TYPE.REQUIREMENT,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        actionUrl: `/requirements/${requirement._id}`,
      });
    }

    Object.assign(requirement, body);
    await requirement.save();

    return requirement;
  }
  async remove(id, userid) {
    const requirement = await Requirement.findOne({
      _id: id,
      userId: userid,
    });

    if (!requirement) {
      throw new Error(RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND);
    }

    // Cannot delete FULFILLED requirements
    if (requirement.status === STATUS.FULFILLED) {
      throw new Error(
        "Cannot delete fulfilled requirement. Contact support if needed."
      );
    }

    // Cannot delete ACTIVE requirements with bids
    if (requirement.status === STATUS.ACTIVE && requirement.bids.length > 0) {
      throw new Error(RESPONSE_MESSAGES.DELETE_NOT_ALLOWED);
    }

    // Soft delete - set status to CANCELLED
    requirement.status = STATUS.CANCELLED;
    await requirement.save();

    return requirement;
  }

  /**
   * Manually close a requirement
   * Valid transitions: ACTIVE → CLOSED, EXPIRED → CLOSED
   */
  async close(id, userid) {
    const requirement = await Requirement.findOne({ _id: id, userId: userid });

    if (!requirement) {
      throw new Error(RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND);
    }

    // Only ACTIVE and EXPIRED requirements can be closed
    if (![STATUS.ACTIVE, STATUS.EXPIRED].includes(requirement.status)) {
      throw new Error(
        `Cannot close requirement with status ${requirement.status}`
      );
    }

    requirement.status = STATUS.CLOSED;
    await requirement.save();

    return requirement;
  }

  /**
   * Update requirement status (for internal use - e.g., marking FULFILLED after deal)
   */
  async updateStatus(id, newStatus: STATUS) {
    const requirement = await Requirement.findById(id);

    if (!requirement) {
      throw new Error(RESPONSE_MESSAGES.REQUIREMENT_NOT_FOUND);
    }

    // Validate status transitions
    const validTransitions: Record<STATUS, STATUS[]> = {
      [STATUS.ACTIVE]: [
        STATUS.EXPIRED,
        STATUS.CLOSED,
        STATUS.FULFILLED,
        STATUS.CANCELLED,
      ],
      [STATUS.EXPIRED]: [STATUS.CLOSED],
      [STATUS.CLOSED]: [], // No transitions from CLOSED
      [STATUS.FULFILLED]: [], // No transitions from FULFILLED
      [STATUS.CANCELLED]: [], // No transitions from CANCELLED
    };

    if (!validTransitions[requirement.status]?.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${requirement.status} to ${newStatus}`
      );
    }

    requirement.status = newStatus;
    await requirement.save();

    return requirement;
  }
}
export default new ReqService();
