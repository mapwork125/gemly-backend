import Bid from "../../models/Bid.model";
import Requirement from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";

class BidService {
  async place(requirementId, user, body) {
    const reqDoc: any = await Requirement.findById(requirementId);
    if (!reqDoc || !reqDoc.isActive) throw new Error("Requirement not active");
    const bid = await Bid.create({
      bidder: user._id,
      ...body,
    });
    const requirement: any = await Requirement.findById(requirementId);
    requirement.bids.push(bid._id);
    await requirement.save();

    await notificationService.sendNotification(
      reqDoc.requirementAdmin,
      "New Bid by " + user.name,
      `You have a new bid on your requirement "${reqDoc.title}".`,
      requirement.toObject()
    );
    return bid;
  }
  async list(requirementId, user) {
    const requirement: any = await Requirement.findById(requirementId);
    const bids = await Bid.find({ _id: { $in: requirement.bids } }).populate(
      "bidder"
    );
    // if user is requirementAdmin, return full, else limited
    if (requirement.requirementAdmin.toString() === user._id.toString())
      return bids;
    return bids.map((b: any) => ({ price: b.price, bidder: b.bidder.name }));
  }
}
export default new BidService();
