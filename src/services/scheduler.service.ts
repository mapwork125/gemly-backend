import cron from "node-cron";
import Requirement from "../models/Requirement.model";
import notificationService from "./notification.service";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  STATUS,
} from "../utils/constants.utility";
import {
  cleanupExpiredPDFs,
  cleanupOrphanedPDFs,
} from "../utils/pdfCleanup.utility";

class SchedulerService {
  /**
   * Auto-expire requirements that have passed their deadline
   * Runs every hour
   */
  startAutoExpiry() {
    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
    cron.schedule("0 * * * *", async () => {
      console.log("[CRON] Running auto-expiry check...");
      try {
        const now = new Date();

        // Find all active requirements past deadline
        const expiredRequirements = await Requirement.find({
          status: STATUS.ACTIVE,
          endDate: { $lt: now },
        }).populate("userId", "_id name email");

        if (expiredRequirements.length === 0) {
          console.log("[CRON] No requirements to expire");
          return;
        }

        console.log(
          `[CRON] Found ${expiredRequirements.length} requirements to expire`
        );

        // Update status to EXPIRED
        const requirementIds = expiredRequirements.map((r) => r._id);
        await Requirement.updateMany(
          { _id: { $in: requirementIds } },
          { status: STATUS.EXPIRED }
        );

        // Send notifications to requirement owners
        for (const requirement of expiredRequirements) {
          try {
            await notificationService.sendNotification(
              requirement.userId._id.toString(),
              {
                title: "Requirement Expired",
                message: `Your requirement "${requirement.title}" has expired. You can close it or extend the deadline.`,
                data: { requirementId: requirement._id.toString() },
                type: NOTIFICATION_TYPE.REQUIREMENT,
                category: NOTIFICATION_CATEGORY.GENERAL,
                actionUrl: `/requirements/${requirement._id}`,
              }
            );
          } catch (error) {
            console.error(
              `[CRON] Failed to notify user ${requirement.userId._id}:`,
              error
            );
          }
        }

        console.log(
          `[CRON] Successfully expired ${expiredRequirements.length} requirements`
        );
      } catch (error) {
        console.error("[CRON] Auto-expiry failed:", error);
      }
    });

    console.log("[SCHEDULER] Auto-expiry cron job started (runs hourly)");
  }

  /**
   * Auto-cleanup expired PDF files
   * Runs daily at 2:00 AM
   */
  startPDFCleanup() {
    // Run daily at 2:00 AM
    cron.schedule("0 2 * * *", async () => {
      console.log("[CRON] Running PDF cleanup...");
      try {
        // Clean up expired PDFs tracked in database
        const expiredResult = await cleanupExpiredPDFs();
        console.log(
          `[CRON] Expired PDFs cleanup: ${expiredResult.deleted} deleted, ${expiredResult.failed} failed`
        );

        // Clean up orphaned PDFs older than 7 days
        const orphanedResult = await cleanupOrphanedPDFs(7);
        console.log(
          `[CRON] Orphaned PDFs cleanup: ${orphanedResult.deleted} deleted`
        );
      } catch (error) {
        console.error("[CRON] PDF cleanup failed:", error);
      }
    });

    console.log(
      "[SCHEDULER] PDF cleanup cron job started (runs daily at 2:00 AM)"
    );
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    this.startAutoExpiry();
    this.startPDFCleanup();
    console.log("[SCHEDULER] All scheduler cron jobs initialized");
  }
}

export default new SchedulerService();
