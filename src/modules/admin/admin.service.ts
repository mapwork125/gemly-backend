import User from "../../models/User.model";
import Ad from "../../models/Ads.model";
import notificationService from "../../services/notification.service";

class AdminService {
  async listUsers() {
    return User.find();
  }

  async approveUser(userId: string) {
    const user: any = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );
    if (user) {
      await notificationService.sendNotification(
        user._id,
        "Account Verified",
        "Your account has been verified by the admin.",
        user.toObject()
      );
    }
    return user;
  }

  async listAds() {
    return Ad.find();
  }

  async approveAd(adId: string) {
    const ad: any = await Ad.findByIdAndUpdate(
      adId,
      { status: "approved" },
      { new: true }
    );
    if (ad) {
      await notificationService.sendNotification(
        ad.requester,
        "Ad Approved",
        `Your ad "${ad.title}" has been approved by the admin.`,
        ad.toObject()
      );
    }
    return ad;
  }
}

export default new AdminService();
