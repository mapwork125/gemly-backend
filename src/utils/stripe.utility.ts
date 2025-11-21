import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripeSecretKey);

export const createPaymentIntent = async (
  amount: number,
  currency: string,
  metadata: any
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });
  return paymentIntent;
};

export const capturePayment = async (paymentIntentId: string) => {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
};

export const refundPayment = async (paymentIntentId: string) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
  return refund;
};

export default stripe;
