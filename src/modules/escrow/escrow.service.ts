import Escrow from "../../models/Escrow.model";
import {
  createPaymentIntent,
  capturePayment,
  refundPayment,
} from "../../utils/stripe.utility";
import notificationService from "../../services/notification.service";
import Deal from "../../models/Deal.model";

class EscrowService {
  async initiate(body: { dealId: string; amount: number }) {
    const paymentIntent = await createPaymentIntent(body.amount * 100, "usd", {
      dealId: body.dealId,
    });
    return Escrow.create({
      deal: body.dealId,
      amount: body.amount,
      status: "held",
      paymentIntentId: paymentIntent.id,
    });
  }
  async release(body: { dealId: string }) {
    const escrow = await Escrow.findOne({ deal: body.dealId });
    if (!escrow) {
      throw new Error("Escrow not found");
    }
    await capturePayment(escrow.paymentIntentId);
    escrow.status = "released";
    await escrow.save();
    const deal: any = await Deal.findById(escrow.deal).populate("seller");
    if (deal) {
      await notificationService.sendNotification(
        deal.seller._id,
        "Payment Released",
        `The payment for your deal "${deal.title}" has been released.`
      );
    }
    return escrow;
  }
  async refund(body: { dealId: string }) {
    const escrow = await Escrow.findOne({ deal: body.dealId });
    if (!escrow) {
      throw new Error("Escrow not found");
    }
    await refundPayment(escrow.paymentIntentId);
    escrow.status = "refunded";
    await escrow.save();
    const deal: any = await Deal.findById(escrow.deal).populate("buyer");
    if (deal) {
      await notificationService.sendNotification(
        deal.buyer._id,
        "Payment Refunded",
        `The payment for your deal "${deal.title}" has been refunded.`
      );
    }
    return escrow;
  }
  async status(dealId: string) {
    return Escrow.findOne({ deal: dealId });
  }
  async handleWebhook(event: any) {
    const { type, data } = event;
    const paymentIntent = data.object;
    const dealId = paymentIntent.metadata.dealId;
    const escrow = await Escrow.findOne({ deal: dealId });
    if (!escrow) {
      throw new Error("Escrow not found");
    }
    switch (type) {
      case "payment_intent.succeeded":
        escrow.status = "released";
        break;
      case "payment_intent.payment_failed":
        escrow.status = "failed";
        break;
      case "payment_intent.canceled":
        escrow.status = "canceled";
        break;
      default:
        console.log(`Unhandled event type ${type}`);
    }
    await escrow.save();
    return escrow;
  }
}
export default new EscrowService();
