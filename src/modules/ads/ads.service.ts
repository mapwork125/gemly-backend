import mongoose from "mongoose";
import Advertisement from "../../models/Advertisement.model";
import AdminLog from "../../models/AdminLog.model";
import NotificationService from "../../services/notification.service";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
  USER_ROLE,
} from "../../utils/constants.utility";

// Placement daily rates
const DAILY_RATES: Record<string, number> = {
  HOME_BANNER: 10,
  SEARCH_SIDEBAR: 5,
  LISTING_TOP: 7,
  FOOTER: 3,
};

class AdsService {
  /**
   * Submit advertisement request
   */
  async submitAdRequest(userId: string, body: any) {
    const { title, description, imageUrl, linkUrl, duration, placement } = body;

    // Validate image size (base64)
    const imageSize = Buffer.from(
      imageUrl.split(",")[1] || imageUrl,
      "base64"
    ).length;
    if (imageSize > 2 * 1024 * 1024) {
      // 2MB
      throw new Error("Image size exceeds 2MB limit");
    }

    // Calculate estimated cost
    const estimatedCost = DAILY_RATES[placement] * duration;

    // Create ad request
    const ad = await Advertisement.create({
      userId: new mongoose.Types.ObjectId(userId),
      title,
      description,
      imageUrl,
      linkUrl: linkUrl || undefined,
      duration,
      placement,
      status: "PENDING",
      estimatedCost,
      submittedAt: new Date(),
    });

    // Notify admin about new request
    try {
      const admins = await this.getAdminUsers();
      for (const admin of admins) {
        await NotificationService.sendNotification(admin._id.toString(), {
          type: NOTIFICATION_TYPE.SYSTEM,
          category: NOTIFICATION_CATEGORY.GENERAL,
          title: "New Advertisement Request",
          message: `New ad request: "${title}" from user`,
          data: { adId: ad._id.toString(), userId },
        });
      }
    } catch (error) {
      console.error("Failed to notify admins:", error);
    }

    return {
      adId: ad._id,
      title: ad.title,
      status: ad.status,
      placement: ad.placement,
      duration: ad.duration,
      estimatedCost: ad.estimatedCost,
      submittedAt: ad.submittedAt,
    };
  }

  /**
   * Get active approved advertisements
   */
  async getActiveAds(query: any) {
    const { placement, limit = 10 } = query;

    const filter: any = {
      status: "APPROVED",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    };

    if (placement) {
      filter.placement = placement;
    }

    const ads = await Advertisement.find(filter)
      .sort({ priority: -1, startDate: -1 })
      .limit(parseInt(limit))
      .lean();

    // Increment impressions
    if (ads.length > 0) {
      const adIds = ads.map((ad) => ad._id);
      await Advertisement.updateMany(
        { _id: { $in: adIds } },
        { $inc: { impressions: 1 } }
      );
    }

    // Calculate metrics
    const adsWithMetrics = ads.map((ad) => {
      const daysRemaining = Math.ceil(
        (new Date(ad.endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const ctr =
        ad.impressions > 0
          ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2))
          : 0;

      return {
        adId: ad._id,
        title: ad.title,
        description: ad.description,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        placement: ad.placement,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr,
        startDate: ad.startDate,
        endDate: ad.endDate,
        daysRemaining,
      };
    });

    return {
      ads: adsWithMetrics,
      total: ads.length,
    };
  }

  /**
   * Track ad click
   */
  async trackAdClick(adId: string) {
    const ad = await Advertisement.findByIdAndUpdate(
      adId,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!ad) {
      throw new Error("Advertisement not found");
    }

    return {
      adId: ad._id,
      clicks: ad.clicks,
    };
  }

  /**
   * Approve or reject advertisement (Admin only)
   */
  async approveAd(adId: string, adminId: string, body: any) {
    const { action, startDate, priority = 5, rejectionReason } = body;

    const ad = await Advertisement.findById(adId);
    if (!ad) {
      throw new Error("Advertisement not found");
    }

    if (ad.status !== "PENDING") {
      throw new Error(`Advertisement already ${ad.status.toLowerCase()}`);
    }

    if (action === "APPROVE") {
      // Calculate end date
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + ad.duration);

      ad.status = "APPROVED";
      ad.startDate = start;
      ad.endDate = end;
      ad.priority = priority;
      ad.approvedBy = new mongoose.Types.ObjectId(adminId);
      ad.approvedAt = new Date();

      await ad.save();

      // Notify user
      await NotificationService.sendNotification(ad.userId.toString(), {
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        title: "Advertisement Approved",
        message: `Your ad "${
          ad.title
        }" has been approved and will start on ${start.toDateString()}`,
        data: { adId: ad._id.toString() },
      });

      // Log admin action
      await AdminLog.create({
        adminId: new mongoose.Types.ObjectId(adminId),
        action: "AD_APPROVE",
        resourceType: "ADVERTISEMENT",
        resourceId: ad._id,
        details: { startDate, endDate: end, priority },
        timestamp: new Date(),
      });

      return {
        adId: ad._id,
        status: ad.status,
        startDate: ad.startDate,
        endDate: ad.endDate,
        approvedBy: ad.approvedBy,
        approvedAt: ad.approvedAt,
      };
    } else if (action === "REJECT") {
      ad.status = "REJECTED";
      ad.rejectionReason = rejectionReason;
      ad.rejectedBy = new mongoose.Types.ObjectId(adminId);
      ad.rejectedAt = new Date();

      await ad.save();

      // Notify user
      await NotificationService.sendNotification(ad.userId.toString(), {
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        title: "Advertisement Rejected",
        message: `Your ad "${ad.title}" was rejected: ${rejectionReason}`,
        data: { adId: ad._id.toString() },
      });

      // Log admin action
      await AdminLog.create({
        adminId: new mongoose.Types.ObjectId(adminId),
        action: "AD_REJECT",
        resourceType: "ADVERTISEMENT",
        resourceId: ad._id,
        details: { rejectionReason },
        timestamp: new Date(),
      });

      return {
        adId: ad._id,
        status: ad.status,
        rejectionReason: ad.rejectionReason,
        rejectedBy: ad.rejectedBy,
        rejectedAt: ad.rejectedAt,
      };
    }

    throw new Error("Invalid action");
  }

  /**
   * Get all ads (Admin only)
   */
  async getAdminAds(query: any) {
    const {
      page = 1,
      limit = 50,
      status,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = query;

    // Build filter
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Fetch ads
    const ads = await Advertisement.find(filter)
      .populate("userId", "name email")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Mark expired
    const now = new Date();
    const adsWithStatus = ads.map((ad) => ({
      ...ad,
      status: ad.endDate && ad.endDate < now ? "EXPIRED" : ad.status,
      userName: (ad.userId as any)?.name,
      userEmail: (ad.userId as any)?.email,
    }));

    // Total count
    const total = await Advertisement.countDocuments(filter);

    // Summary
    const summary = await Advertisement.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryObj = summary.reduce(
      (acc: any, item: any) => {
        acc[item._id.toLowerCase()] = item.count;
        return acc;
      },
      { total }
    );

    return {
      ads: adsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      summary: summaryObj,
    };
  }

  /**
   * Helper: Get admin users
   */
  private async getAdminUsers(): Promise<
    Array<{ _id: mongoose.Types.ObjectId }>
  > {
    const User = mongoose.model("User");
    return User.find({ role: USER_ROLE.ADMIN }).select("_id").lean() as any;
  }
}

export default new AdsService();
