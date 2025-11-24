import Deal from "../../models/Deal.model";
import Bid from "../../models/Bid.model";
import { savePDF } from "../../utils/pdfGenerator.utility";
import RequirementModel from "../../models/Requirement.model";

class DealService {
  async create(body, user) {
    const requirement = await RequirementModel.findOne({
      _id: body.requirementId,
      requirementAdmin: user._id,
      bids: body.bidId,
    });
    if (!requirement) throw new Error("Requirement not found or unauthorized");
    const bid: any = await Bid.findById(body.bidId).populate("requirement");
    if (!bid) throw new Error("Bid not found");
    const deal = await Deal.create({
      bid: bid._id,
      requirement: bid.requirement._id,
      buyer: user._id,
      seller: bid.bidder,
      price: bid.price,
    });
    // generate pdf
    const pdf = await savePDF(deal);
    deal.pdf = pdf;
    await deal.save();
    requirement.endDate = new Date(Date.now());
    requirement.isActive = false;
    await requirement.save();
    return deal;
  }
  async get(id) {
    return await Deal.findById(id).populate("bid requirement buyer seller");
  }
  async list(userId) {
    return Deal.find({ $or: [{ buyer: userId }, { seller: userId }] });
  }
}
export default new DealService();
