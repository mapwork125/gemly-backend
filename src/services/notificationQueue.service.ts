import NotificationQueue from "../models/NotificationQueue.model";
import notificationService from "./notification.service";
import User from "../models/User.model";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
} from "../utils/constants.utility";

class NotificationQueueService {
  /**
   * Queue notification for later delivery based on frequency setting
   */
  async queueNotification(
    userId: string,
    frequency: "Instant" | "Hourly" | "Daily" | "Weekly",
    notification: {
      title: string;
      message: string;
      actionUrl?: string;
      type: NOTIFICATION_TYPE;
      category: NOTIFICATION_CATEGORY;
      data?: any;
    },
    userTimezone: string = "UTC"
  ): Promise<void> {
    const scheduledFor = this.calculateScheduledTime(frequency, userTimezone);

    // Find or create queue entry for this user and frequency
    let queueEntry = await NotificationQueue.findOne({
      userId,
      frequency,
      sent: false,
      scheduledFor: { $gte: new Date() },
    });

    if (!queueEntry) {
      // Create new queue entry
      queueEntry = await NotificationQueue.create({
        userId,
        frequency,
        notifications: [
          {
            ...notification,
            queuedAt: new Date(),
          },
        ],
        scheduledFor,
        sent: false,
      });

      console.log(
        `[QUEUE] Created new queue entry for user ${userId} (${frequency}), scheduled for ${scheduledFor}`
      );
    } else {
      // Add to existing queue
      queueEntry.notifications.push({
        ...notification,
        queuedAt: new Date(),
      } as any);
      await queueEntry.save();

      console.log(
        `[QUEUE] Added notification to existing queue for user ${userId} (${frequency}), total: ${queueEntry.notifications.length}`
      );
    }
  }

  /**
   * Calculate when notification should be sent based on frequency
   */
  private calculateScheduledTime(frequency: string, timezone: string): Date {
    const now = new Date();

    switch (frequency) {
      case "Instant":
        return now; // Send immediately

      case "Hourly":
        // Next hour on the hour
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        return nextHour;

      case "Daily":
        // Next day at 9 AM user's timezone
        const nextDay = new Date(
          now.toLocaleString("en-US", { timeZone: timezone })
        );
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(9, 0, 0, 0);
        return new Date(nextDay.toLocaleString("en-US", { timeZone: "UTC" }));

      case "Weekly":
        // Next Monday at 9 AM user's timezone
        const nextMonday = new Date(
          now.toLocaleString("en-US", { timeZone: timezone })
        );
        const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        return new Date(
          nextMonday.toLocaleString("en-US", { timeZone: "UTC" })
        );

      default:
        return now;
    }
  }

  /**
   * Process all pending notifications that are due
   * Should be called by cron job
   */
  async processPendingNotifications(): Promise<number> {
    console.log("[QUEUE] Processing pending notifications...");

    const pendingQueues = await NotificationQueue.find({
      sent: false,
      scheduledFor: { $lte: new Date() },
    }).populate("userId");

    let totalSent = 0;

    for (const queue of pendingQueues) {
      try {
        await this.sendQueuedNotifications(queue);
        totalSent += queue.notifications.length;

        // Mark as sent
        queue.sent = true;
        queue.sentAt = new Date();
        await queue.save();

        console.log(
          `[QUEUE] Sent ${queue.notifications.length} notifications to user ${queue.userId}`
        );
      } catch (error) {
        console.error(
          `[QUEUE] Failed to send queued notifications for user ${queue.userId}:`,
          error
        );
      }
    }

    console.log(
      `[QUEUE] Processed ${totalSent} notifications from ${pendingQueues.length} queues`
    );
    return totalSent;
  }

  /**
   * Send all notifications in a queue as digest
   */
  private async sendQueuedNotifications(queue: any): Promise<void> {
    const user: any = queue.userId;

    if (queue.frequency === "Instant") {
      // Send each notification individually
      for (const notif of queue.notifications) {
        await notificationService.sendNotification(user._id.toString(), {
          title: notif.title,
          message: notif.message,
          actionUrl: notif.actionUrl,
          type: notif.type,
          category: notif.category,
          data: notif.data,
        });
      }
    } else {
      // Send as digest
      const digestTitle =
        queue.frequency === "Hourly"
          ? "Hourly Requirements Digest"
          : queue.frequency === "Daily"
          ? "Daily Requirements Digest"
          : "Weekly Requirements Digest";

      const digestMessage = `You have ${
        queue.notifications.length
      } new requirement${
        queue.notifications.length > 1 ? "s" : ""
      } matching your preferences.`;

      // Create digest notification
      await notificationService.sendNotification(user._id.toString(), {
        title: digestTitle,
        message: digestMessage,
        actionUrl: "/requirements",
        type: NOTIFICATION_TYPE.REQUIREMENT,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          digest: true,
          count: queue.notifications.length,
          notifications: queue.notifications,
        },
      });

      // If email digest is enabled, send email
      if (
        user.notificationSettings?.channels?.email &&
        user.notificationSettings?.channels?.emailDigest
      ) {
        console.log(
          `[QUEUE] Sending digest email to ${
            user.notificationSettings.channels.emailAddress || user.email
          }`
        );
        // TODO: Send actual email with digest
        // await emailService.sendDigest(user, queue.notifications);
      }
    }
  }

  /**
   * Get queued notification count for a user
   */
  async getQueuedCount(userId: string): Promise<number> {
    const queues = await NotificationQueue.find({
      userId,
      sent: false,
    });

    return queues.reduce(
      (total, queue) => total + queue.notifications.length,
      0
    );
  }

  /**
   * Clean up old sent queues (older than 30 days)
   */
  async cleanupOldQueues(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await NotificationQueue.deleteMany({
      sent: true,
      sentAt: { $lt: thirtyDaysAgo },
    });

    console.log(`[QUEUE] Cleaned up ${result.deletedCount} old queue entries`);
    return result.deletedCount || 0;
  }
}

export default new NotificationQueueService();
