import Requirement from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";
import User from "../../models/User.model";

class ReqService {
  async index(req) {
    // auto-disable expired
    await Requirement.updateMany(
      { endDate: { $lt: new Date() } },
      { isActive: false }
    );
    return Requirement.find({
      isActive: true,
      startDate: { $lt: new Date() },
      endDate: { $gt: new Date() },
    });
  }
  async get(id) {
    return Requirement.findById(id) || {};
  }
  async create(body, req) {
    body.requirementAdmin = req.user._id;
    const requirement = await Requirement.create(body);
    const users: any = await User.find({ _id: { $ne: req.user._id } });
    for (const user of users) {
    }
    await notificationService.sendBulkNotification(
      users.map((u) => u._id.toString()),
      "New Requirement",
      `A new requirement "${requirement.title}" has been posted.`,
      requirement.toObject()
    );
    return requirement;
  }
  async update(id, body) {
    return Requirement.findByIdAndUpdate(id, body, { new: true });
  }
  async remove(id) {
    return Requirement.findByIdAndDelete(id);
  }
}
export default new ReqService();
