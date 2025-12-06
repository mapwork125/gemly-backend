import { asyncHandler } from "../../utils/asyncHandler.utility";
import { verifyWebhookSignature } from "../../utils/stripe.utility";
import config from "../../config";
import service from "./escrow.service";

export const initiate = asyncHandler(async (req, res) => {
  try {
    const result = await service.initiate(req.body, req.user);

    return res.status(201).json({
      success: true,
      message:
        "Escrow initiated successfully. Complete payment using the client secret.",
      data: result,
    });
  } catch (error: any) {
    // Handle 409 Conflict - Escrow already exists
    if (error.statusCode === 409 && error.existingEscrowId) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: error.code,
        existingEscrowId: error.existingEscrowId,
      });
    }

    // Handle 402 Payment Required - Card declined
    if (error.statusCode === 402) {
      return res.status(402).json({
        success: false,
        error: error.message,
        code: error.code,
        action: "PROMPT_NEW_PAYMENT_METHOD",
      });
    }

    throw error; // Let asyncHandler handle other errors
  }
});

export const release = asyncHandler(async (req, res) => {
  try {
    const result = await service.release(req.body, req.user);

    return res.status(200).json({
      success: true,
      message: "Payment released to seller",
      data: result,
    });
  } catch (error: any) {
    // Handle 400 Invalid Status
    if (error.statusCode === 400 && error.code === "ESCROW_INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        currentStatus: error.currentStatus,
        expectedStatus: error.expectedStatus,
      });
    }

    throw error;
  }
});

export const refund = asyncHandler(async (req, res) => {
  try {
    const result = await service.refund(req.body, req.user);

    return res.status(200).json({
      success: true,
      message: "Payment refunded to buyer",
      data: result,
    });
  } catch (error: any) {
    // Handle 400 Invalid Status - Trying to refund released escrow
    if (error.statusCode === 400 && error.code === "ESCROW_INVALID_STATUS") {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        currentStatus: error.currentStatus,
        expectedStatus: error.expectedStatus,
      });
    }

    // Handle Stripe refund errors
    if (error.statusCode >= 500 && error.stripeError) {
      return res.status(500).json({
        success: false,
        error: "Stripe refund failed. Please retry.",
        code: error.code,
        details: error.stripeError,
        action: "RETRY_WITH_BACKOFF",
      });
    }

    throw error;
  }
});

export const getStatus = asyncHandler(async (req, res) => {
  const result = await service.status(req.params.dealId, req.user);

  return res.status(200).json({
    success: true,
    data: result,
  });
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: "Missing Stripe signature",
    });
  }

  if (!config.stripeWebhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured!");
    return res.status(500).json({
      success: false,
      error: "Webhook configuration error",
    });
  }

  let event;
  try {
    // Verify webhook signature
    event = verifyWebhookSignature(
      req.body,
      signature,
      config.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({
      success: false,
      error: "Invalid webhook signature",
      message: err.message,
    });
  }

  try {
    await service.handleWebhook(event);

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (err: any) {
    console.error("Webhook processing failed:", err);
    return res.status(500).json({
      success: false,
      error: "Webhook processing failed",
      message: err.message,
    });
  }
});
