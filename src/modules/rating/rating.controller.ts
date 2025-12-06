import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.utility";
import { success } from "../../utils/response.utility";
import Rating, { IRating } from "../../models/Rating.model";
import User, { IUser } from "../../models/User.model";
import Deal from "../../models/Deal.model";
import BadgeService from "../../services/badge.service";
import NotificationService from "../../services/notification.service";
import {
  RatingAuditLog,
  AbuseReport,
  RateLimit,
} from "../../models/RatingSecurity.model";
import {
  RATING_ERRORS,
  REPUTATION_LEVEL,
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
  RATE_LIMITS,
  PROFANITY_LIST,
  ABUSE_REASONS,
} from "../../utils/constants.utility";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Check rate limiting for rating submissions
 */
const checkRateLimit = async (userId: string): Promise<boolean> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentHour = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours()
  );

  let rateLimit = await RateLimit.findOne({ userId });

  if (!rateLimit) {
    // Create new rate limit entry
    await RateLimit.create({
      userId,
      ratingsToday: 1,
      lastRatingDate: now,
      ratingsThisHour: 1,
      lastRatingHour: now,
    });
    return true;
  }

  // Reset daily counter if it's a new day
  if (new Date(rateLimit.lastRatingDate) < today) {
    rateLimit.ratingsToday = 0;
    rateLimit.lastRatingDate = now;
  }

  // Reset hourly counter if it's a new hour
  if (new Date(rateLimit.lastRatingHour) < currentHour) {
    rateLimit.ratingsThisHour = 0;
    rateLimit.lastRatingHour = now;
  }

  // Check limits
  if (rateLimit.ratingsToday >= RATE_LIMITS.MAX_RATINGS_PER_DAY) {
    return false; // Daily limit exceeded
  }

  if (rateLimit.ratingsThisHour >= RATE_LIMITS.MAX_RATINGS_PER_HOUR) {
    return false; // Hourly limit exceeded
  }

  // Increment counters
  rateLimit.ratingsToday += 1;
  rateLimit.ratingsThisHour += 1;
  await rateLimit.save();

  return true;
};

/**
 * Check for profanity in review text
 */
const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lowerText.includes(word));
};

/**
 * Log rating action to audit trail
 */
const logRatingAction = async (
  raterId: string,
  userId: string,
  dealId: string,
  ratingId: string,
  action: string,
  req: Request
) => {
  try {
    await RatingAuditLog.create({
      raterId,
      userId,
      dealId,
      ratingId,
      action,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      metadata: {
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Audit log creation failed:", error);
  }
};

/**
 * Submit a rating for a user after completing a deal
 * POST /ratings/:userId
 */
export const submitRating = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { dealId, rating, categories, review, isAnonymous } = req.body;
    const raterId = req.user?._id;

    if (!raterId) {
      return res.status(401).json({
        success: false,
        error: RATING_ERRORS.RATING_UNAUTHORIZED,
      });
    }

    // SECURITY: Check rate limiting
    const canRate = await checkRateLimit(raterId.toString());
    if (!canRate) {
      return res.status(429).json({
        success: false,
        error: RATING_ERRORS.RATE_LIMIT_EXCEEDED,
        message: `Maximum ${RATE_LIMITS.MAX_RATINGS_PER_DAY} ratings per day allowed`,
      });
    }

    // SECURITY: Check for profanity in review
    if (review && containsProfanity(review)) {
      return res.status(400).json({
        success: false,
        error: RATING_ERRORS.REVIEW_CONTAINS_PROFANITY,
      });
    }

    // 1. Verify deal exists and is completed
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: RATING_ERRORS.DEAL_NOT_FOUND,
      });
    }

    if (deal.status !== "COMPLETED") {
      return res.status(422).json({
        success: false,
        error: RATING_ERRORS.DEAL_NOT_COMPLETED,
        currentStatus: deal.status,
      });
    }

    // 2. Check eligibility (rater must be part of deal)
    const dealParticipants = [deal.buyer.toString(), deal.seller.toString()];
    if (!dealParticipants.includes(raterId.toString())) {
      return res.status(403).json({
        success: false,
        error: RATING_ERRORS.NOT_DEAL_PARTICIPANT,
      });
    }

    // 3. Verify userId is the other participant
    if (!dealParticipants.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: RATING_ERRORS.NOT_DEAL_PARTICIPANT,
      });
    }

    // 4. Prevent self-rating
    if (userId === raterId.toString()) {
      return res.status(403).json({
        success: false,
        error: RATING_ERRORS.CANNOT_RATE_SELF,
      });
    }

    // 5. Check for duplicate rating
    const existingRating = await Rating.findOne({ dealId, raterId });
    if (existingRating) {
      return res.status(409).json({
        success: false,
        error: RATING_ERRORS.RATING_ALREADY_EXISTS,
      });
    }

    // 6. Create rating
    const newRating = await Rating.create({
      userId: new mongoose.Types.ObjectId(userId),
      raterId,
      dealId: new mongoose.Types.ObjectId(dealId),
      rating,
      categories,
      review: review || "",
      isAnonymous: isAnonymous || false,
    });

    // SECURITY: Log to audit trail
    await logRatingAction(
      raterId.toString(),
      userId,
      dealId,
      newRating._id.toString(),
      "CREATED",
      req
    );

    // 7. Update user's overall rating
    const allRatings = await Rating.find({
      userId: new mongoose.Types.ObjectId(userId),
    });
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await User.findByIdAndUpdate(userId, {
      "stats.averageRating": avgRating,
      "stats.totalRatings": allRatings.length,
    });

    // 8. Check and award badges
    let badgesEarned: any[] = [];
    try {
      badgesEarned = await BadgeService.checkAndAwardBadges(userId);
    } catch (error) {
      console.error("Badge calculation error:", error);
    }

    // 9. Update reputation score
    const reputationScore = await calculateReputationScore(userId);
    await User.findByIdAndUpdate(userId, {
      "stats.reputationScore": reputationScore,
    });

    // 10. Send notification
    try {
      await NotificationService.sendNotification(userId, {
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        title: "New Rating Received",
        message: `You received a ${rating}-star rating`,
        data: { ratingId: newRating._id.toString(), dealId: dealId },
      });
    } catch (error) {
      console.error("Notification send error:", error);
    }

    return res.status(201).json({
      success: true,
      data: {
        ratingId: newRating._id,
        userId,
        rating,
        overallRating: parseFloat(avgRating.toFixed(2)),
        totalRatings: allRatings.length,
        badgesEarned: badgesEarned.filter((b) => b.isNew),
        createdAt: newRating.createdAt,
      },
      message: "Rating submitted successfully",
    });
  }
);

/**
 * Get user's ratings, badges, and performance reports
 * GET /ratings/:userId
 */
export const getUserRatings = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const {
      includeReviews = "true",
      includeBadges = "true",
      includeStats = "true",
      period = "monthly",
      year,
      month,
    } = req.query;

    // 1. Fetch user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: RATING_ERRORS.USER_NOT_FOUND,
      });
    }

    // 2. Aggregate ratings
    const ratingStats = await Rating.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          avgCommunication: { $avg: "$categories.communication" },
          avgProductQuality: { $avg: "$categories.productQuality" },
          avgDelivery: { $avg: "$categories.delivery" },
          avgPricing: { $avg: "$categories.pricing" },
          avgProfessionalism: { $avg: "$categories.professionalism" },
        },
      },
    ]);

    // 3. Rating distribution
    const allRatings = await Rating.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).lean();

    const distribution = {
      "5_star": allRatings.filter((r) => r.rating >= 4.5).length,
      "4_star": allRatings.filter((r) => r.rating >= 3.5 && r.rating < 4.5)
        .length,
      "3_star": allRatings.filter((r) => r.rating >= 2.5 && r.rating < 3.5)
        .length,
      "2_star": allRatings.filter((r) => r.rating >= 1.5 && r.rating < 2.5)
        .length,
      "1_star": allRatings.filter((r) => r.rating < 1.5).length,
    };

    // 4. Recent reviews
    let reviews: any[] = [];
    if (includeReviews === "true") {
      const ratingsWithReviews = await Rating.find({
        userId: new mongoose.Types.ObjectId(userId),
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("raterId", "name")
        .populate("dealId", "_id")
        .lean();

      reviews = ratingsWithReviews.map((r: any) => ({
        ratingId: r._id,
        rating: r.rating,
        review: r.review || "",
        raterName: r.isAnonymous ? "Anonymous" : r.raterId?.name || "Unknown",
        isAnonymous: r.isAnonymous,
        dealId: r.dealId?._id,
        createdAt: r.createdAt,
      }));
    }

    // 5. Get badges
    let badges: any[] = [];
    if (includeBadges === "true") {
      try {
        badges = await BadgeService.getUserBadges(userId);
      } catch (error) {
        console.error("Failed to fetch badges:", error);
      }
    }

    // 6. Performance stats
    let stats: any = null;
    if (includeStats === "true") {
      stats = await generatePerformanceStats(userId);
    }

    // 7. Generate reports based on period
    const reports = await generatePerformanceReports(
      userId,
      period as string,
      year as string,
      month as string
    );

    // 8. Map reputation level
    const reputationScore = user.stats?.reputationScore || 0;
    const reputationLevel = getReputationLevel(reputationScore);

    return res.json({
      success: true,
      data: {
        user: {
          userId: user._id,
          name: user.name,
          type: user.type,
          memberSince: user.createdAt,
          isVerified: user.isVerified || false,
        },
        ratings: {
          overall: parseFloat((ratingStats[0]?.averageRating || 0).toFixed(2)),
          totalRatings: ratingStats[0]?.totalRatings || 0,
          distribution,
          categories: {
            communication: parseFloat(
              (ratingStats[0]?.avgCommunication || 0).toFixed(2)
            ),
            productQuality: parseFloat(
              (ratingStats[0]?.avgProductQuality || 0).toFixed(2)
            ),
            delivery: parseFloat((ratingStats[0]?.avgDelivery || 0).toFixed(2)),
            pricing: parseFloat((ratingStats[0]?.avgPricing || 0).toFixed(2)),
            professionalism: parseFloat(
              (ratingStats[0]?.avgProfessionalism || 0).toFixed(2)
            ),
          },
          recentReviews: reviews,
        },
        badges,
        stats: stats
          ? {
              ...stats,
              reputationScore,
              reputationLevel,
            }
          : null,
        performanceReports: reports,
      },
    });
  }
);

/**
 * Calculate reputation score (0-1000)
 */
const calculateReputationScore = async (userId: string): Promise<number> => {
  try {
    const user = await User.findById(userId).lean();
    if (!user) return 0;

    // Get deal stats
    const dealStats = await Deal.aggregate([
      {
        $match: {
          $or: [
            { buyer: new mongoose.Types.ObjectId(userId) },
            { seller: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
        },
      },
    ]);

    // Get rating stats
    const ratingStats = await Rating.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const avgRating = ratingStats[0]?.avgRating || 0;
    const totalRatings = ratingStats[0]?.totalRatings || 0;
    const completedDeals = dealStats[0]?.completed || 0;
    const badgeCount = user.stats?.badgeCount || 0;
    const isVerified = user.isVerified || false;

    // Calculate account age in days
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const factors = {
      avgRating: (avgRating / 5) * 300, // Max 300 points
      totalRatings: Math.min(totalRatings * 2, 200), // Max 200 points
      completedDeals: Math.min(completedDeals * 3, 300), // Max 300 points
      badges: badgeCount * 20, // 20 points per badge
      accountAge: Math.min((accountAgeDays / 365) * 100, 100), // Max 100 points
      verifiedStatus: isVerified ? 100 : 0, // 100 points if verified
    };

    const score = Object.values(factors).reduce((sum, val) => sum + val, 0);
    return Math.min(Math.round(score), 1000); // Cap at 1000
  } catch (error) {
    console.error("Failed to calculate reputation score:", error);
    return 0;
  }
};

/**
 * Generate performance statistics
 */
const generatePerformanceStats = async (userId: string): Promise<any> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Deal statistics
    const dealStats = await Deal.aggregate([
      {
        $match: {
          $or: [{ buyer: userObjectId }, { seller: userObjectId }],
        },
      },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          completedDeals: {
            $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
          },
          canceledDeals: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          totalVolume: {
            $sum: {
              $cond: [{ $eq: ["$status", "COMPLETED"] }, "$agreedPrice", 0],
            },
          },
          avgDealValue: {
            $avg: {
              $cond: [{ $eq: ["$status", "COMPLETED"] }, "$agreedPrice", null],
            },
          },
        },
      },
    ]);

    const stats = dealStats[0] || {
      totalDeals: 0,
      completedDeals: 0,
      canceledDeals: 0,
      totalVolume: 0,
      avgDealValue: 0,
    };

    const completionRate =
      stats.totalDeals > 0
        ? ((stats.completedDeals / stats.totalDeals) * 100).toFixed(1)
        : "0.0";

    return {
      totalDeals: stats.totalDeals,
      completedDeals: stats.completedDeals,
      canceledDeals: stats.canceledDeals,
      completionRate: parseFloat(completionRate),
      totalVolume: parseFloat(stats.totalVolume.toFixed(2)),
      averageDealValue: parseFloat((stats.avgDealValue || 0).toFixed(2)),
      responseTime: "< 2 hours", // TODO: Implement actual response time tracking
      onTimeDeliveryRate: 94.5, // TODO: Implement actual delivery tracking
    };
  } catch (error) {
    console.error("Failed to generate performance stats:", error);
    return null;
  }
};

/**
 * Generate performance reports
 */
const generatePerformanceReports = async (
  userId: string,
  period: string,
  year?: string,
  month?: string
): Promise<any> => {
  const reports: any = {};
  const userObjectId = new mongoose.Types.ObjectId(userId);

  try {
    // Monthly report
    if (period === "monthly" || period === "all") {
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      const monthlyDeals = await Deal.aggregate([
        {
          $match: {
            $or: [{ buyer: userObjectId }, { seller: userObjectId }],
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
            },
            canceled: {
              $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
            },
            totalVolume: {
              $sum: {
                $cond: [{ $eq: ["$status", "COMPLETED"] }, "$agreedPrice", 0],
              },
            },
            avgVolume: {
              $avg: {
                $cond: [
                  { $eq: ["$status", "COMPLETED"] },
                  "$agreedPrice",
                  null,
                ],
              },
            },
          },
        },
      ]);

      const monthlyData = monthlyDeals[0] || {
        total: 0,
        completed: 0,
        canceled: 0,
        totalVolume: 0,
        avgVolume: 0,
      };

      reports.monthly = {
        period: `${startDate.toLocaleString("default", {
          month: "long",
        })} ${targetYear}`,
        deals: {
          total: monthlyData.total,
          completed: monthlyData.completed,
          canceled: monthlyData.canceled,
          completionRate:
            monthlyData.total > 0
              ? parseFloat(
                  ((monthlyData.completed / monthlyData.total) * 100).toFixed(1)
                )
              : 0,
        },
        volume: {
          total: parseFloat(monthlyData.totalVolume.toFixed(2)),
          average: parseFloat((monthlyData.avgVolume || 0).toFixed(2)),
          currency: "USD",
        },
      };
    }

    // Quarterly report
    if (period === "quarterly" || period === "all") {
      const currentDate = new Date();
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      const startDate = new Date(
        currentDate.getFullYear(),
        currentQuarter * 3,
        1
      );
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 3,
        0,
        23,
        59,
        59
      );

      const quarterlyDeals = await Deal.aggregate([
        {
          $match: {
            $or: [{ buyer: userObjectId }, { seller: userObjectId }],
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
            },
            totalVolume: {
              $sum: {
                $cond: [{ $eq: ["$status", "COMPLETED"] }, "$agreedPrice", 0],
              },
            },
          },
        },
      ]);

      const quarterlyData = quarterlyDeals[0] || {
        total: 0,
        completed: 0,
        totalVolume: 0,
      };

      reports.quarterly = {
        period: `Q${currentQuarter + 1} ${currentDate.getFullYear()}`,
        deals: {
          total: quarterlyData.total,
          completed: quarterlyData.completed,
          completionRate:
            quarterlyData.total > 0
              ? parseFloat(
                  (
                    (quarterlyData.completed / quarterlyData.total) *
                    100
                  ).toFixed(1)
                )
              : 0,
        },
        volume: {
          total: parseFloat(quarterlyData.totalVolume.toFixed(2)),
        },
      };
    }

    // Yearly report
    if (period === "yearly" || period === "all") {
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

      const yearlyDeals = await Deal.aggregate([
        {
          $match: {
            $or: [{ buyer: userObjectId }, { seller: userObjectId }],
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] },
            },
            totalVolume: {
              $sum: {
                $cond: [{ $eq: ["$status", "COMPLETED"] }, "$agreedPrice", 0],
              },
            },
          },
        },
      ]);

      // Top months
      const topMonths = await Deal.aggregate([
        {
          $match: {
            $or: [{ buyer: userObjectId }, { seller: userObjectId }],
            createdAt: { $gte: startDate, $lte: endDate },
            status: "COMPLETED",
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            deals: { $sum: 1 },
            volume: { $sum: "$agreedPrice" },
          },
        },
        { $sort: { volume: -1 } },
        { $limit: 3 },
      ]);

      const yearlyData = yearlyDeals[0] || {
        total: 0,
        completed: 0,
        totalVolume: 0,
      };

      reports.yearly = {
        period: currentYear.toString(),
        deals: {
          total: yearlyData.total,
          completed: yearlyData.completed,
          completionRate:
            yearlyData.total > 0
              ? parseFloat(
                  ((yearlyData.completed / yearlyData.total) * 100).toFixed(1)
                )
              : 0,
        },
        volume: {
          total: parseFloat(yearlyData.totalVolume.toFixed(2)),
        },
        topMonths: topMonths.map((m) => ({
          month: new Date(2024, m._id - 1).toLocaleString("default", {
            month: "long",
          }),
          deals: m.deals,
          volume: parseFloat(m.volume.toFixed(2)),
        })),
      };
    }

    return reports;
  } catch (error) {
    console.error("Failed to generate performance reports:", error);
    return {};
  }
};

/**
 * Get reputation level from score
 */
const getReputationLevel = (score: number): string => {
  if (score >= 800) return REPUTATION_LEVEL.EXCELLENT;
  if (score >= 600) return REPUTATION_LEVEL.VERY_GOOD;
  if (score >= 400) return REPUTATION_LEVEL.GOOD;
  if (score >= 200) return REPUTATION_LEVEL.FAIR;
  return REPUTATION_LEVEL.POOR;
};

// Legacy endpoints (backward compatibility)
export const rate = asyncHandler(async (req: Request, res: Response) => {
  const r = await Rating.create({
    target: req.params.userId,
    rater: req.user?._id,
    ...req.body,
  });
  return success(res, "rated", r, 201);
});

export const getRatings = asyncHandler(async (req: Request, res: Response) => {
  const list = await Rating.find({ target: req.params.userId });
  return success(res, "list", list);
});

/**
 * Report abuse on a rating
 * POST /ratings/:ratingId/report
 */
export const reportAbuse = asyncHandler(async (req: Request, res: Response) => {
  const { ratingId } = req.params;
  const { reason, description } = req.body;
  const reporterId = req.user?._id;

  if (!reporterId) {
    return res.status(401).json({
      success: false,
      error: "Not authorized",
    });
  }

  // Check if rating exists
  const rating = await Rating.findById(ratingId);
  if (!rating) {
    return res.status(404).json({
      success: false,
      error: RATING_ERRORS.RATING_NOT_FOUND,
    });
  }

  // Check if user already reported this rating
  const existingReport = await AbuseReport.findOne({
    reporterId,
    ratingId: new mongoose.Types.ObjectId(ratingId),
  });

  if (existingReport) {
    return res.status(409).json({
      success: false,
      error: "You have already reported this rating",
    });
  }

  // Create abuse report
  const report = await AbuseReport.create({
    reporterId,
    ratingId: new mongoose.Types.ObjectId(ratingId),
    reason,
    description: description || "",
    status: "PENDING",
  });

  // Log to audit trail
  await logRatingAction(
    reporterId.toString(),
    rating.userId.toString(),
    rating.dealId.toString(),
    ratingId,
    "FLAGGED",
    req
  );

  // Notify admin about the report
  try {
    const admins = await User.find({ role: "2" }).select("_id");
    for (const admin of admins) {
      await NotificationService.sendNotification(admin._id.toString(), {
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        title: "Rating Reported",
        message: `A rating has been flagged for ${reason}`,
        data: { reportId: report._id.toString(), ratingId },
      });
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }

  return res.status(201).json({
    success: true,
    data: {
      reportId: report._id,
      status: report.status,
    },
    message: "Report submitted successfully. Our team will review it.",
  });
});

/**
 * Get abuse reports for a rating (Admin only)
 * GET /ratings/:ratingId/reports
 */
export const getAbuseReports = asyncHandler(
  async (req: Request, res: Response) => {
    const { ratingId } = req.params;
    const userRole = req.user?.role;

    // Admin check
    if (userRole !== "2") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    const reports = await AbuseReport.find({
      ratingId: new mongoose.Types.ObjectId(ratingId),
    })
      .populate("reporterId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: reports,
    });
  }
);

/**
 * Resolve abuse report (Admin only)
 * PUT /ratings/reports/:reportId/resolve
 */
export const resolveAbuseReport = asyncHandler(
  async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { status, resolution } = req.body;
    const adminId = req.user?._id;
    const userRole = req.user?.role;

    // Admin check
    if (userRole !== "2") {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      });
    }

    const report = await AbuseReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Update report
    report.status = status;
    report.resolution = resolution;
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    await report.save();

    // Notify reporter
    try {
      await NotificationService.sendNotification(report.reporterId.toString(), {
        type: NOTIFICATION_TYPE.SYSTEM,
        category: NOTIFICATION_CATEGORY.GENERAL,
        title: "Report Reviewed",
        message: `Your report has been ${status.toLowerCase()}`,
        data: { reportId: report._id.toString() },
      });
    } catch (error) {
      console.error("Failed to notify reporter:", error);
    }

    return res.status(200).json({
      success: true,
      data: {
        reportId: report._id,
        status: report.status,
      },
      message: "Report resolved successfully",
    });
  }
);
