import Deal from "../../models/Deal.model";
import Bid from "../../models/Bid.model";
import { generateDealPDFBuffer } from "../../utils/pdfGenerator.utility";

class DealService {
  async create(bidId, user) {
    const bid: any = await Bid.findById(bidId).populate("requirement");
    if (!bid) throw new Error("Bid not found");
    const deal = await Deal.create({
      bid: bid._id,
      requirement: bid.requirement._id,
      buyer: user._id,
      seller: bid.bidder,
      price: bid.price,
    });
    // generate pdf
    const pdf = await generateDealPDFBuffer({ dealId: deal._id, bid });
    deal.pdf = pdf;
    await deal.save();
    return deal;
  }
  async get(id) {
    return (
      (await Deal.findById(id).populate("bid requirement buyer seller")) || {}
    );
  }
  async list(userId) {
    return Deal.find({ $or: [{ buyer: userId }, { seller: userId }] });
  }
}
export default new DealService();
