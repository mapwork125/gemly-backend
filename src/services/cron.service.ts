import cron from "node-cron";
import mongoose from "mongoose";
import User from "../models/User.model";
import Rating from "../models/Rating.model";
import Deal from "../models/Deal.model";
import BadgeService from "./badge.service";
import notificationService from "./notification.service";
import notificationQueueService from "./notificationQueue.service";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
  DEAL_STATUS,
} from "../utils/constants.utility";

/**
 * Calculate reputation score (0-1000)
 */
const calculateReputationScore = async (userId: string): Promise<number> => {
  const user = await User.findById(userId).lean();
  if (!user) return 0;

  let score = 0;

  // 1. Average rating (300 points max)
  const avgRating = user.stats?.averageRating || 0;
  score += (avgRating / 5) * 300;

  // 2. Total ratings count (200 points max)
  const totalRatings = user.stats?.totalRatings || 0;
  score += Math.min(totalRatings * 2, 200);

  // 3. Completed deals (300 points max)
  const completedDeals = user.stats?.completedDeals || 0;
  score += Math.min(completedDeals * 3, 300);

  // 4. Badges earned (20 points each, 100 max)
  const badgeCount = user.badges?.length || 0;
  score += Math.min(badgeCount * 20, 100);

  // 5. Account age (100 points max - 1 year = 100 points)
  const accountAge =
    (Date.now() - new Date(user.createdAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365);
  score += Math.min(accountAge * 100, 100);

  // 6. Verified account bonus
  if (user.isVerified) {
    score += 100;
  }

  // 7. Penalty for canceled deals
  const canceledDeals = user.stats?.canceledDeals || 0;
  score -= canceledDeals * 10;

  // 8. Bonus for high on-time delivery rate
  const onTimeRate = user.stats?.onTimeDeliveryRate || 0;
  if (onTimeRate >= 95) {
    score += 50;
  } else if (onTimeRate >= 90) {
    score += 25;
  }

  // 9. Bonus for fast response time
  const avgResponseTime = user.stats?.avgResponseTime || 0;
  if (avgResponseTime > 0 && avgResponseTime < 3600) {
    // Less than 1 hour
    score += 50;
  }

  return Math.max(0, Math.min(Math.round(score), 1000));
};

/**
 * Generate monthly report for a user
 */
const generateMonthlyReport = async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const user = await User.findById(userId).lean();
  if (!user) return null;

  // Get deals for the month
  const deals = await Deal.find({
    $or: [{ buyer: userId }, { seller: userId }],
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();

  // Get ratings for the month
  const ratings = await Rating.find({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  }).lean();

  // Calculate stats
  const completedDeals = deals.filter(
    (d) => d.status === DEAL_STATUS.COMPLETED
  ).length;
  const totalVolume = deals
    .filter((d) => d.status === DEAL_STATUS.COMPLETED)
    .reduce((sum, d) => sum + (d.agreedPrice || 0), 0);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  return {
    userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    completedDeals,
    totalVolume,
    currency: deals[0]?.currency || "USD",
    ratingsReceived: ratings.length,
    averageRating: parseFloat(avgRating.toFixed(2)),
    totalDeals: deals.length,
    reputationScore: user.stats?.reputationScore || 0,
    badges: user.badges || [],
  };
};

/**
 * Send monthly report email (placeholder - implement with actual email service)
 */
const sendMonthlyReportEmail = async (email: string, report: any) => {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[CRON] Would send monthly report to ${email}:`, report);
};

export class CronService {
  /**
   * Run badge check daily at midnight
   */
  static initializeBadgeCheck() {
    cron.schedule("0 0 * * *", async () => {
      console.log("[CRON] Running daily badge check...");

      try {
        const users = await User.find({
          status: "APPROVED",
          deletedAt: null,
        }).select("_id");

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            await BadgeService.checkAndAwardBadges(user._id.toString());
            successCount++;
          } catch (error) {
            console.error(
              `[CRON] Badge check failed for user ${user._id}:`,
              error
            );
            errorCount++;
          }
        }

        console.log(
          `[CRON] Badge check completed: ${successCount} successful, ${errorCount} failed`
        );
      } catch (error) {
        console.error("[CRON] Badge check job failed:", error);
      }
    });

    console.log("[CRON] Badge check cron job started (runs daily at midnight)");
  }

  /**
   * Generate monthly reports on 1st of each month at 1:00 AM
   */
  static initializeMonthlyReports() {
    cron.schedule("0 1 1 * *", async () => {
      console.log("[CRON] Generating monthly reports...");

      try {
        const users = await User.find({
          type: "COMPANY",
          status: "APPROVED",
          deletedAt: null,
        }).select("_id name email");

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            const report = await generateMonthlyReport(user._id.toString());

            if (report) {
              // Send notification
              await notificationService.sendNotification(user._id.toString(), {
                title: "Monthly Report Available",
                message: `Your monthly report for ${new Date().toLocaleDateString(
                  "en-US",
                  { month: "long", year: "numeric" }
                )} is ready.`,
                data: { report },
                type: NOTIFICATION_TYPE.SYSTEM,
                category: NOTIFICATION_CATEGORY.GENERAL,
              });

              // Send email (placeholder)
              await sendMonthlyReportEmail(user.email, report);

              successCount++;
            }
          } catch (error) {
            console.error(
              `[CRON] Monthly report failed for user ${user._id}:`,
              error
            );
            errorCount++;
          }
        }

        console.log(
          `[CRON] Monthly reports completed: ${successCount} successful, ${errorCount} failed`
        );
      } catch (error) {
        console.error("[CRON] Monthly reports job failed:", error);
      }
    });

    console.log(
      "[CRON] Monthly reports cron job started (runs on 1st of each month at 1:00 AM)"
    );
  }

  /**
   * Update reputation scores weekly on Sunday at 3:00 AM
   */
  static initializeReputationUpdate() {
    cron.schedule("0 3 * * 0", async () => {
      console.log("[CRON] Updating reputation scores...");

      try {
        const users = await User.find({
          status: "APPROVED",
          deletedAt: null,
        }).select("_id");

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
          try {
            const score = await calculateReputationScore(user._id.toString());
            await User.findByIdAndUpdate(user._id, {
              "stats.reputationScore": score,
            });
            successCount++;
          } catch (error) {
            console.error(
              `[CRON] Reputation update failed for user ${user._id}:`,
              error
            );
            errorCount++;
          }
        }

        console.log(
          `[CRON] Reputation scores updated: ${successCount} successful, ${errorCount} failed`
        );
      } catch (error) {
        console.error("[CRON] Reputation update job failed:", error);
      }
    });

    console.log(
      "[CRON] Reputation update cron job started (runs every Sunday at 3:00 AM)"
    );
  }

  /**
   * Start all cron jobs
   */
  static start() {
    this.initializeBadgeCheck();
    this.initializeMonthlyReports();
    this.initializeReputationUpdate();
    this.initializeNotificationQueue();
    this.initializeQueueCleanup();
    console.log("[CRON] All cron jobs initialized successfully");
  }

  /**
   * Process queued notifications every 5 minutes
   */
  static initializeNotificationQueue() {
    cron.schedule("*/5 * * * *", async () => {
      console.log("[CRON] Processing queued notifications...");

      try {
        const count =
          await notificationQueueService.processPendingNotifications();
        console.log(`[CRON] Processed ${count} queued notifications`);
      } catch (error) {
        console.error("[CRON] Notification queue processing failed:", error);
      }
    });

    console.log(
      "[CRON] Notification queue processor started (runs every 5 minutes)"
    );
  }

  /**
   * Cleanup old notification queues daily at 2:00 AM
   */
  static initializeQueueCleanup() {
    cron.schedule("0 2 * * *", async () => {
      console.log("[CRON] Cleaning up old notification queues...");

      try {
        const count = await notificationQueueService.cleanupOldQueues();
        console.log(`[CRON] Cleaned up ${count} old queue entries`);
      } catch (error) {
        console.error("[CRON] Queue cleanup failed:", error);
      }
    });

    console.log(
      "[CRON] Queue cleanup cron job started (runs daily at 2:00 AM)"
    );
  }
}

export default CronService;
