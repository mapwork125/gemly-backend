import mongoose from "mongoose";
import Notification from "../../models/Notification.model";
class NService {
  async index(userId, q) {
    return Notification.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
  }

  async markRead(userId, id) {
    return Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { read: true },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { userId: userId, read: false },
      { read: true }
    );
  }

  async remove(userId, id) {
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    console.log("notification", notification, userId, id);

    if (!notification) {
      return null;
    }
    return Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }
}
export default new NService();
