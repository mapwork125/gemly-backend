import { sendPush } from "../utils/firebase.utility";
import User from "../models/User.model";
import Notification from "../models/Notification.model";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CATEGORY,
} from "../utils/constants.utility";

class NotificationService {
  async sendNotification(
    userId: string,
    body: {
      title: string;
      message: string;
      actionUrl?: string;
      data?: any;
      type: NOTIFICATION_TYPE;
      category: NOTIFICATION_CATEGORY;
    }
  ) {
    const { title, message, data = {}, actionUrl, type, category } = body;
    const user = await User.findById(userId);
    if (!user?.notificationsEnabled) return;
    if (user && user.fcmToken) {
      await sendPush([user.fcmToken], {
        notification: {
          title,
          message,
          actionUrl,
          type,
          category,
        },
        data,
      });
    }
    await Notification.create({
      userId: userId,
      title,
      message,
      data,
      actionUrl,
      type,
      category,
    });
  }

  async sendBulkNotification(
    userIds: string[],
    body: {
      title: string;
      message: string;
      actionUrl?: string;
      data?: any;
      type: NOTIFICATION_TYPE;
      category: NOTIFICATION_CATEGORY;
    }
  ) {
    const { title, message, data = {}, actionUrl, type, category } = body;
    // Get all users with their FCM tokens
    let users = await User.find({
      _id: { $in: userIds },
      fcmToken: { $exists: true, $ne: null },
    }).select("fcmToken notificationsEnabled");

    // Filter users who have notifications enabled
    users = users.filter(
      (user) =>
        user?.notificationsEnabled ||
        typeof user?.notificationsEnabled === "undefined"
    );

    // Extract FCM tokens
    const fcmTokens = users
      .map((user) => user?.fcmToken)
      .filter((token) => token) as string[];

    // Send push notifications in bulk
    if (fcmTokens.length > 0) {
      await sendPush(fcmTokens, {
        notification: {
          title,
          message,
          actionUrl,
          type,
          category,
        },
        data,
      });
    }

    // Create notification records in bulk
    const notifications = userIds.map((userId) => ({
      userId: userId,
      title,
      message,
      data,
      actionUrl,
      type,
      category,
    }));

    await Notification.insertMany(notifications);
  }

  async sendToAllUsers(body: {
    title: string;
    message: string;
    actionUrl?: string;
    data?: any;
    type: NOTIFICATION_TYPE;
    category: NOTIFICATION_CATEGORY;
  }) {
    const { title, message, data = {}, actionUrl, type, category } = body;
    // Get all users with FCM tokens
    let users = await User.find({
      fcmToken: { $exists: true, $ne: null },
    }).select("_id fcmToken");

    // Filter users who have notifications enabled
    users = users.filter(
      (user) =>
        user?.notificationsEnabled ||
        typeof user?.notificationsEnabled === "undefined"
    );

    // Extract user IDs and FCM tokens

    const userIds = users.map((user) => user._id.toString());
    const fcmTokens = users
      .map((user) => user.fcmToken)
      .filter((token) => token) as string[];

    // Send push notifications
    if (fcmTokens.length > 0) {
      await sendPush(fcmTokens, {
        notification: {
          title,
          message,
          actionUrl,
          type,
          category,
        },
        data,
      });
    }

    // Create notification records
    const notifications = userIds.map((userId) => ({
      userId: userId,
      title,
      message,
      data,
      actionUrl,
      type,
      category,
    }));

    await Notification.insertMany(notifications);
  }
}

export default new NotificationService();
