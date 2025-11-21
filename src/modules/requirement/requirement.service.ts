import Requirement from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";
import User from "../../models/User.model";

class ReqService {
  async index(req) {
    // auto-disable expired
    await Requirement.updateMany(
      { deadline: { $lt: new Date() } },
      { isActive: false }
    );
    return Requirement.find({ isActive: true });
  }
  async get(id) {
    return Requirement.findById(id) || {};
  }
  async create(body, req) {
    body.owner = req.user._id;
    const requirement = await Requirement.create(body);
    const users: any = await User.find({ role: "seller" });
    for (const user of users) {
      await notificationService.sendNotification(
        user._id,
        "New Requirement",
        `A new requirement "${requirement.title}" has been posted.`
      );
    }
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
