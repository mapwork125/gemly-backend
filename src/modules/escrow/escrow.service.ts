import Escrow from "../../models/Escrow.model";
import Deal from "../../models/Deal.model";
import User from "../../models/User.model";
import {
  createPaymentIntentForEscrow,
  refundPayment,
  createTransfer,
} from "../../utils/stripe.utility";
import notificationService from "../../services/notification.service";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_TYPE,
  RESPONSE_MESSAGES,
  DEAL_STATUS,
  ESCROW_STATUS,
  ESCROW_REFUND_REASON,
  ESCROW_CONFIRMATION_TYPE,
  ESCROW_EVENT,
} from "../../utils/constants.utility";

class EscrowService {
  async initiate(
    body: {
      dealId: string;
      amount: number;
      currency: string;
      idempotencyKey?: string;
    },
    user: any
  ) {
    // 1. Validate deal exists
    const deal: any = await Deal.findById(body.dealId)
      .populate("buyer", "_id name email")
      .populate("seller", "_id name email")
      .populate("requirement", "title");

    if (!deal) {
      const error: any = new Error(RESPONSE_MESSAGES.DEAL_NOT_FOUND);
      error.code = "DEAL_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify user is the buyer
    if (deal.buyer._id.toString() !== user._id.toString()) {
      const error: any = new Error(
        RESPONSE_MESSAGES.UNAUTHORIZED_ESCROW_ACTION
      );
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 3. Check if escrow already exists
    const existingEscrow = await Escrow.findOne({ deal: body.dealId });
    if (existingEscrow) {
      const error: any = new Error(RESPONSE_MESSAGES.ESCROW_ALREADY_EXISTS);
      error.code = "ESCROW_ALREADY_EXISTS";
      error.statusCode = 409;
      error.existingEscrowId = existingEscrow._id; // Return existing escrow ID
      throw error;
    }

    // 4. Validate amount matches deal agreed price
    const amountInCents = Math.round(deal.agreedPrice * 100);
    if (body.amount !== amountInCents) {
      const error: any = new Error(
        `Amount mismatch: expected ${amountInCents} cents, got ${body.amount} cents`
      );
      error.code = "AMOUNT_MISMATCH";
      error.statusCode = 400;
      throw error;
    }

    // 5. Create Stripe PaymentIntent (unconfirmed - frontend will confirm)
    let paymentIntent;
    try {
      paymentIntent = await createPaymentIntentForEscrow(
        body.amount,
        body.currency.toLowerCase(),
        {
          dealId: body.dealId,
          buyerId: deal.buyer._id.toString(),
          sellerId: deal.seller._id.toString(),
        },
        body.idempotencyKey // Pass idempotency key to Stripe
      );
    } catch (stripeError: any) {
      console.error("Stripe payment intent creation failed:", stripeError);

      // Handle specific Stripe errors
      if (
        stripeError.statusCode === 402 ||
        stripeError.code === "card_declined"
      ) {
        const error: any = new Error(
          "Card declined. Please use a different payment method."
        );
        error.code = "CARD_DECLINED";
        error.statusCode = 402;
        throw error;
      }

      const error: any = new Error(RESPONSE_MESSAGES.PAYMENT_FAILED);
      error.code = "PAYMENT_FAILED";
      error.statusCode = stripeError.statusCode || 500;
      error.stripeError = stripeError.message;
      throw error;
    }

    // 6. Create escrow record
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const escrow = await Escrow.create({
      deal: body.dealId,
      buyer: deal.buyer._id,
      seller: deal.seller._id,
      amount: body.amount,
      currency: body.currency,
      status: ESCROW_STATUS.PENDING,
      paymentIntentId: paymentIntent.id,
      platformFeePercentage: 3,
      expiresAt,
      timeline: [
        {
          event: ESCROW_EVENT.ESCROW_CREATED,
          timestamp: new Date(),
          userId: user._id,
        },
      ],
    });

    // 7. Update deal status to IN_PROGRESS
    await Deal.findByIdAndUpdate(body.dealId, {
      status: DEAL_STATUS.IN_PROGRESS,
    });

    // 8. Notify buyer
    try {
      await notificationService.sendNotification(deal.buyer._id.toString(), {
        title: "Escrow Created",
        message: `Escrow created for $${(body.amount / 100).toFixed(
          2
        )}. Please complete payment for "${deal.requirement.title}".`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
          amount: body.amount,
          currency: body.currency,
          clientSecret: paymentIntent.client_secret,
        },
        actionUrl: `/deals/${deal._id}/escrow`,
      });
    } catch (notifError) {
      console.error("Failed to notify buyer:", notifError);
    }

    // 9. Notify seller
    try {
      await notificationService.sendNotification(deal.seller._id.toString(), {
        title: "Escrow Initiated",
        message: `Escrow initiated for "${deal.requirement.title}". Awaiting buyer payment.`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
          amount: body.amount,
          currency: body.currency,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to notify seller:", notifError);
    }

    return {
      escrowId: escrow._id,
      status: escrow.status,
      amount: escrow.amount,
      currency: escrow.currency,
      stripePaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      expiresAt: escrow.expiresAt,
    };
  }

  async release(
    body: {
      dealId: string;
      confirmationType: "BUYER_CONFIRMATION" | "SELLER_CONFIRMATION";
      notes?: string;
      idempotencyKey?: string;
    },
    user: any
  ) {
    // 1. Find escrow
    const escrow: any = await Escrow.findOne({ deal: body.dealId })
      .populate("deal")
      .populate("buyer", "_id name email stripeConnectedAccountId")
      .populate("seller", "_id name email stripeConnectedAccountId");

    if (!escrow) {
      const error: any = new Error(RESPONSE_MESSAGES.ESCROW_NOT_FOUND);
      error.code = "ESCROW_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify escrow is in HELD status
    if (escrow.status !== ESCROW_STATUS.HELD) {
      const error: any = new Error(
        `Cannot release payment. Escrow status is ${escrow.status}, expected HELD`
      );
      error.code = "ESCROW_INVALID_STATUS";
      error.statusCode = 400;
      error.currentStatus = escrow.status;
      error.expectedStatus = ESCROW_STATUS.HELD;
      throw error;
    }

    // 3. Verify user authorization
    const isBuyer = escrow.buyer._id.toString() === user._id.toString();
    const isSeller = escrow.seller._id.toString() === user._id.toString();
    const isAdmin = user.role === "2";

    if (!isBuyer && !isSeller && !isAdmin) {
      const error: any = new Error(
        RESPONSE_MESSAGES.UNAUTHORIZED_ESCROW_ACTION
      );
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 4. Verify confirmation matches user role
    if (
      body.confirmationType === ESCROW_CONFIRMATION_TYPE.BUYER_CONFIRMATION &&
      !isBuyer &&
      !isAdmin
    ) {
      const error: any = new Error("Only buyer can provide buyer confirmation");
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    if (
      body.confirmationType === ESCROW_CONFIRMATION_TYPE.SELLER_CONFIRMATION &&
      !isSeller &&
      !isAdmin
    ) {
      const error: any = new Error(
        "Only seller can provide seller confirmation"
      );
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 5. Record confirmation
    const now = new Date();
    if (body.confirmationType === ESCROW_CONFIRMATION_TYPE.BUYER_CONFIRMATION) {
      escrow.buyerConfirmedAt = now;
      escrow.buyerConfirmationNotes = body.notes || "";
      escrow.timeline.push({
        event: ESCROW_EVENT.BUYER_CONFIRMED,
        timestamp: now,
        userId: user._id,
        notes: body.notes,
      });
    } else {
      escrow.sellerConfirmedAt = now;
      escrow.sellerConfirmationNotes = body.notes || "";
      escrow.timeline.push({
        event: ESCROW_EVENT.SELLER_CONFIRMED,
        timestamp: now,
        userId: user._id,
        notes: body.notes,
      });
    }

    await escrow.save();

    // 6. Check if both parties confirmed (or admin override)
    const bothConfirmed =
      escrow.buyerConfirmedAt &&
      escrow.sellerConfirmedAt &&
      escrow.buyerConfirmedAt <= now &&
      escrow.sellerConfirmedAt <= now;

    if (!bothConfirmed && !isAdmin) {
      // Confirmation recorded, but not ready to release yet
      return {
        escrowId: escrow._id,
        status: escrow.status,
        confirmations: {
          buyer: !!escrow.buyerConfirmedAt,
          seller: !!escrow.sellerConfirmedAt,
        },
        message:
          "Confirmation recorded. Awaiting confirmation from other party.",
      };
    }

    // 7. Calculate Stripe fees, platform fee, and seller amount
    // Stripe fee: 2.9% + $0.30
    const stripeFee = Math.floor(escrow.amount * 0.029 + 30);
    const amountAfterStripeFee = escrow.amount - stripeFee;

    // Platform fee: 3% of amount after Stripe fee
    const platformFee = Math.floor(
      amountAfterStripeFee * (escrow.platformFeePercentage / 100)
    );
    const sellerAmount = amountAfterStripeFee - platformFee;

    // 8. Transfer to seller's Stripe connected account
    let transfer;
    try {
      // Check if seller has connected account
      if (!escrow.seller.stripeConnectedAccountId) {
        const error: any = new Error(
          "Seller has not connected their Stripe account"
        );
        error.code = "SELLER_ACCOUNT_NOT_CONNECTED";
        error.statusCode = 400;
        throw error;
      }

      transfer = await createTransfer(
        sellerAmount,
        escrow.currency,
        escrow.seller.stripeConnectedAccountId,
        {
          escrowId: escrow._id.toString(),
          dealId: body.dealId,
          platformFee,
        },
        body.idempotencyKey // Pass idempotency key to Stripe
      );
    } catch (stripeError: any) {
      console.error("Stripe transfer failed:", stripeError);

      const error: any = new Error(RESPONSE_MESSAGES.TRANSFER_FAILED);
      error.code = "TRANSFER_FAILED";
      error.statusCode = 500;
      throw error;
    }

    // 9. Update escrow status
    escrow.status = ESCROW_STATUS.RELEASED;
    escrow.releasedAt = new Date();
    escrow.stripeFee = stripeFee;
    escrow.platformFee = platformFee;
    escrow.releasedAmount = sellerAmount;
    escrow.stripeTransferId = transfer.id;
    escrow.timeline.push({
      event: ESCROW_EVENT.PAYMENT_RELEASED,
      timestamp: new Date(),
      userId: user._id,
    });
    await escrow.save();

    // 10. Update deal status to COMPLETED
    const deal: any = await Deal.findByIdAndUpdate(
      escrow.deal._id,
      { status: DEAL_STATUS.COMPLETED },
      { new: true }
    ).populate("requirement", "title");

    // 11. Notify seller
    try {
      await notificationService.sendNotification(escrow.seller._id.toString(), {
        title: "Payment Released",
        message: `Payment of $${(sellerAmount / 100).toFixed(
          2
        )} released for "${deal.requirement.title}". Original: $${(
          escrow.amount / 100
        ).toFixed(2)} - Stripe fee: $${(stripeFee / 100).toFixed(
          2
        )} - Platform fee: $${(platformFee / 100).toFixed(2)}.`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.ACTIONABLE,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
          originalAmount: escrow.amount,
          stripeFee,
          platformFee,
          releasedAmount: sellerAmount,
          transferId: transfer.id,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to notify seller:", notifError);
    }

    // 12. Notify buyer
    try {
      await notificationService.sendNotification(escrow.buyer._id.toString(), {
        title: "Deal Completed",
        message: `Payment released to seller. Deal "${deal.requirement.title}" is now complete.`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to notify buyer:", notifError);
    }

    return {
      escrowId: escrow._id,
      status: escrow.status,
      originalAmount: escrow.amount,
      stripeFee,
      platformFee,
      releasedAmount: sellerAmount,
      transferId: transfer.id,
      releasedAt: escrow.releasedAt,
      feeBreakdown: {
        total: escrow.amount,
        stripeFee,
        platformFee,
        sellerReceives: sellerAmount,
      },
    };
  }

  async refund(
    body: {
      dealId: string;
      reason:
        | "DEAL_CANCELED"
        | "FRAUD_DETECTED"
        | "MUTUAL_AGREEMENT"
        | "ITEM_NOT_AS_DESCRIBED"
        | "OTHER";
      refundAmount?: number;
      notes?: string;
      idempotencyKey?: string;
    },
    user: any
  ) {
    // 1. Find escrow
    const escrow: any = await Escrow.findOne({ deal: body.dealId })
      .populate("deal")
      .populate("buyer", "_id name email")
      .populate("seller", "_id name email");

    if (!escrow) {
      const error: any = new Error(RESPONSE_MESSAGES.ESCROW_NOT_FOUND);
      error.code = "ESCROW_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify user is buyer or seller or admin
    const isBuyer = escrow.buyer._id.toString() === user._id.toString();
    const isSeller = escrow.seller._id.toString() === user._id.toString();
    const isAdmin = user.role === "2";

    if (!isBuyer && !isSeller && !isAdmin) {
      const error: any = new Error(
        RESPONSE_MESSAGES.UNAUTHORIZED_ESCROW_ACTION
      );
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // 3. Check if escrow is in HELD status (cannot refund RELEASED)
    if (escrow.status !== ESCROW_STATUS.HELD) {
      const message =
        escrow.status === "RELEASED"
          ? `Cannot refund payment. Escrow status is ${escrow.status}. Payment already released to seller.`
          : `Cannot refund payment. Escrow status is ${escrow.status}, expected HELD`;
      const error: any = new Error(message);
      error.code = "ESCROW_INVALID_STATUS";
      error.statusCode = 400;
      error.currentStatus = escrow.status;
      error.expectedStatus = ESCROW_STATUS.HELD;
      throw error;
    }

    // 4. Determine refund amount
    const refundAmount = body.refundAmount || escrow.amount;

    if (refundAmount > escrow.amount) {
      const error: any = new Error(RESPONSE_MESSAGES.REFUND_INVALID_AMOUNT);
      error.code = "REFUND_INVALID_AMOUNT";
      error.statusCode = 400;
      throw error;
    }

    // 5. Process Stripe refund
    let refund;
    try {
      refund = await refundPayment(
        escrow.paymentIntentId,
        refundAmount,
        body.idempotencyKey // Pass idempotency key to Stripe
      );
    } catch (stripeError) {
      console.error("Stripe refund failed:", stripeError);
      const error: any = new Error("Refund processing failed");
      error.code = "REFUND_FAILED";
      error.statusCode = 500;
      throw error;
    }

    // 6. Update escrow status
    escrow.status = ESCROW_STATUS.REFUNDED;
    escrow.refundedAt = new Date();
    escrow.refundReason = body.reason;
    escrow.refundAmount = refundAmount;
    escrow.stripeRefundId = refund.id;
    escrow.refundNotes = body.notes || "";
    escrow.timeline.push({
      event: ESCROW_EVENT.PAYMENT_REFUNDED,
      timestamp: new Date(),
      userId: user._id,
      notes: `Reason: ${body.reason}. ${body.notes || ""}`,
    });
    await escrow.save();

    // 7. Update deal status to CANCELLED
    const deal: any = await Deal.findByIdAndUpdate(
      escrow.deal._id,
      { status: DEAL_STATUS.CANCELLED },
      { new: true }
    ).populate("requirement", "title");

    // 8. Notify buyer
    try {
      await notificationService.sendNotification(escrow.buyer._id.toString(), {
        title: "Payment Refunded",
        message: `Your payment of $${(refundAmount / 100).toFixed(
          2
        )} has been refunded for "${deal.requirement.title}". Reason: ${
          body.reason
        }`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
          refundAmount,
          refundReason: body.reason,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to notify buyer:", notifError);
    }

    // 9. Notify seller
    try {
      await notificationService.sendNotification(escrow.seller._id.toString(), {
        title: "Deal Cancelled - Payment Refunded",
        message: `Deal "${deal.requirement.title}" has been cancelled and payment refunded. Reason: ${body.reason}`,
        type: NOTIFICATION_TYPE.DEAL,
        category: NOTIFICATION_CATEGORY.GENERAL,
        data: {
          escrowId: escrow._id,
          dealId: deal._id,
          refundReason: body.reason,
        },
        actionUrl: `/deals/${deal._id}`,
      });
    } catch (notifError) {
      console.error("Failed to notify seller:", notifError);
    }

    return {
      escrowId: escrow._id,
      status: escrow.status,
      refundAmount,
      refundId: refund.id,
      estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5-7 business days
      refundedAt: escrow.refundedAt,
    };
  }

  async status(dealId: string, user: any) {
    const escrow: any = await Escrow.findOne({ deal: dealId })
      .populate("buyer", "_id name email")
      .populate("seller", "_id name email")
      .populate("deal", "status agreedPrice");

    if (!escrow) {
      const error: any = new Error(RESPONSE_MESSAGES.ESCROW_NOT_FOUND);
      error.code = "ESCROW_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }

    // Verify user is buyer or seller or admin
    const isBuyer = escrow.buyer._id.toString() === user._id.toString();
    const isSeller = escrow.seller._id.toString() === user._id.toString();
    const isAdmin = user.role === "2";

    if (!isBuyer && !isSeller && !isAdmin) {
      const error: any = new Error(RESPONSE_MESSAGES.UNAUTHORIZED);
      error.code = "UNAUTHORIZED";
      error.statusCode = 403;
      throw error;
    }

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = escrow.expiresAt
      ? Math.ceil(
          (escrow.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return {
      escrowId: escrow._id,
      dealId: escrow.deal._id,
      status: escrow.status,
      amount: escrow.amount,
      currency: escrow.currency,
      buyerId: escrow.buyer._id,
      sellerId: escrow.seller._id,
      confirmations: {
        buyer: !!escrow.buyerConfirmedAt,
        seller: !!escrow.sellerConfirmedAt,
      },
      stripeFee: escrow.stripeFee,
      platformFee: escrow.platformFee,
      releasedAmount: escrow.releasedAmount,
      refundAmount: escrow.refundAmount,
      refundReason: escrow.refundReason,
      createdAt: escrow.createdAt,
      expiresAt: escrow.expiresAt,
      daysRemaining,
      releasedAt: escrow.releasedAt,
      refundedAt: escrow.refundedAt,
      timeline: escrow.timeline,
      isBuyer,
      isSeller,
    };
  }

  async handleWebhook(event: any) {
    const { type, data } = event;
    const paymentIntent = data.object;
    const dealId = paymentIntent.metadata.dealId;

    const escrow: any = await Escrow.findOne({ deal: dealId });
    if (!escrow) {
      console.log(`Escrow not found for deal ${dealId}`);
      return;
    }

    switch (type) {
      case "payment_intent.succeeded":
        if (escrow.status === ESCROW_STATUS.PENDING) {
          escrow.status = ESCROW_STATUS.HELD;
          escrow.timeline.push({
            event: ESCROW_EVENT.PAYMENT_CAPTURED,
            timestamp: new Date(),
          });
          await escrow.save();
          console.log(`Payment succeeded for escrow ${escrow._id}`);

          // Notify both parties
          try {
            const deal: any = await Deal.findById(dealId).populate(
              "requirement",
              "title"
            );

            await notificationService.sendNotification(
              escrow.buyer.toString(),
              {
                title: "Payment Held in Escrow",
                message: `Your payment of $${(escrow.amount / 100).toFixed(
                  2
                )} is securely held in escrow for "${deal.requirement.title}".`,
                type: NOTIFICATION_TYPE.DEAL,
                category: NOTIFICATION_CATEGORY.GENERAL,
                data: { escrowId: escrow._id, dealId },
                actionUrl: `/deals/${dealId}`,
              }
            );

            await notificationService.sendNotification(
              escrow.seller.toString(),
              {
                title: "Payment Secured",
                message: `Payment of $${(escrow.amount / 100).toFixed(
                  2
                )} has been secured in escrow for "${deal.requirement.title}".`,
                type: NOTIFICATION_TYPE.DEAL,
                category: NOTIFICATION_CATEGORY.ACTIONABLE,
                data: { escrowId: escrow._id, dealId },
                actionUrl: `/deals/${dealId}`,
              }
            );
          } catch (notifError) {
            console.error("Failed to send notifications:", notifError);
          }
        }
        break;

      case "payment_intent.payment_failed":
        escrow.status = ESCROW_STATUS.FAILED;
        escrow.timeline.push({
          event: "PAYMENT_FAILED",
          timestamp: new Date(),
        });
        await escrow.save();
        console.log(`Payment failed for escrow ${escrow._id}`);

        // Notify buyer
        try {
          await notificationService.sendNotification(escrow.buyer.toString(), {
            title: "Payment Failed",
            message:
              "Your payment failed. Please try again with a different payment method.",
            type: NOTIFICATION_TYPE.DEAL,
            category: NOTIFICATION_CATEGORY.ACTIONABLE,
            data: { escrowId: escrow._id, dealId },
            actionUrl: `/deals/${dealId}/escrow`,
          });
        } catch (notifError) {
          console.error("Failed to notify buyer:", notifError);
        }
        break;

      case "payment_intent.canceled":
        escrow.status = ESCROW_STATUS.CANCELLED;
        escrow.timeline.push({
          event: "PAYMENT_CANCELED",
          timestamp: new Date(),
        });
        await escrow.save();
        console.log(`Payment cancelled for escrow ${escrow._id}`);
        break;

      case "transfer.paid":
        if (paymentIntent.metadata.escrowId) {
          const transferEscrow: any = await Escrow.findById(
            paymentIntent.metadata.escrowId
          );
          if (transferEscrow) {
            transferEscrow.timeline.push({
              event: ESCROW_EVENT.TRANSFER_COMPLETED,
              timestamp: new Date(),
            });
            await transferEscrow.save();
            console.log(`Transfer completed for escrow ${transferEscrow._id}`);
          }
        }
        break;

      case "charge.refunded":
        // Already handled in refund() method
        console.log(`Refund confirmed for escrow ${escrow._id}`);
        break;

      default:
        console.log(`Unhandled event type ${type}`);
    }

    return escrow;
  }
}

export default new EscrowService();
