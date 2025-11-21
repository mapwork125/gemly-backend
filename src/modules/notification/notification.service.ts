import Notification from '../../models/Notification.model';
class NService {
  async index(userId, q) { return Notification.find({ user: userId }); }
  async markRead(userId, id) { return Notification.findOneAndUpdate({ _id:id, user:userId }, { read: true }, { new: true }); }
  async remove(userId, id) { return Notification.findOneAndDelete({ _id:id, user:userId }); }
}
export default new NService();
