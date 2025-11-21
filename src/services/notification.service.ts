import { sendPush } from "../utils/firebase.utility";
import User from "../models/User.model";
import Notification from "../models/Notification.model";

class NotificationService {
  async sendNotification(userId: string, title: string, body: string) {
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      await sendPush([user.fcmToken], {
        notification: {
          title,
          body,
        },
      });
    }
    await Notification.create({
      user: userId,
      title,
      body,
    });
  }
}

export default new NotificationService();
