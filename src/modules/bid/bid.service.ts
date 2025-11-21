import Bid from "../../models/Bid.model";
import Requirement from "../../models/Requirement.model";
import notificationService from "../../services/notification.service";

class BidService {
  async place(requirementId, user, body) {
    const reqDoc: any = await Requirement.findById(requirementId);
    if (!reqDoc || !reqDoc.isActive) throw new Error("Requirement not active");
    const bid = await Bid.create({
      requirement: requirementId,
      bidder: user._id,
      ...body,
    });
    await notificationService.sendNotification(
      reqDoc.owner,
      "New Bid",
      `You have a new bid on your requirement "${reqDoc.title}".`
    );
    return bid;
  }
  async list(requirementId, user) {
    const bids = await Bid.find({ requirement: requirementId }).populate(
      "bidder",
      "name"
    );
    // if user is owner, return full, else limited
    const reqDoc: any = await Requirement.findById(requirementId);
    if (reqDoc.owner.toString() === user._id.toString()) return bids;
    return bids.map((b: any) => ({ price: b.price, bidder: b.bidder.name }));
  }
}
export default new BidService();
