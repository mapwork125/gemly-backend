import Notification from "../../models/Notification.model";
class NService {
  async index(userId, q) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
  }

  async markRead(userId, id) {
    return Notification.findOneAndUpdate(
      { _id: id, userId: userId },
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
      _id: id,
      userId: userId,
    });
    if (!notification) {
      return null;
    }
    return Notification.findOneAndDelete({ _id: id, userId: userId });
  }
}
export default new NService();
