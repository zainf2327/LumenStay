import type { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { logger } from '../utils/logger.js';

/**
 * Handle inbound Stripe Webhooks with cryptographic signature verification
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const rawBody = (req as any).rawBody || req.body;

  if (!rawBody) {
    return sendError(res, 'No webhook payload received', 400);
  }

  try {
    const event = stripeService.constructWebhookEvent(rawBody, signature);
    const result = await stripeService.handleWebhookEvent(event);
    return res.status(200).json({ received: true, ...result });
  } catch (err: any) {
    logger.error(`[Stripe Webhook Error]: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

/**
 * Create a PaymentIntent or Pre-Authorization Hold
 */
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { amountInCents, customerEmail, customerName, description, paymentMethodId, captureMethod, metadata } = req.body;

  const result = await stripeService.processPayment({
    amountInCents,
    customerEmail,
    customerName,
    description: description || 'LumenStay Hotel Services',
    paymentMethodId,
    captureMethod: captureMethod || 'automatic',
    metadata,
  });

  return sendSuccess(res, result, result.requiresAction ? '3D Secure authentication required' : 'Payment processed successfully', 200);
});

/**
 * Hotel Pre-Authorization Hold (capture_method: 'manual')
 */
export const createPreAuth = asyncHandler(async (req: Request, res: Response) => {
  const { amountInCents, customerEmail, customerName, description, paymentMethodId, metadata } = req.body;

  const result = await stripeService.createPreAuthorization({
    amountInCents,
    customerEmail,
    customerName,
    description: description || 'Hotel Room & Incidental Authorization Hold',
    paymentMethodId,
    metadata,
  });

  return sendSuccess(res, result, 'Pre-authorization hold established successfully', 200);
});

/**
 * Capture an existing pre-authorization hold (e.g. at checkout)
 */
export const capturePreAuth = asyncHandler(async (req: Request, res: Response) => {
  const { paymentIntentId, amountInCents } = req.body;

  if (!paymentIntentId) {
    return sendError(res, 'paymentIntentId is required', 400);
  }

  const captured = await stripeService.capturePayment(paymentIntentId, amountInCents);
  return sendSuccess(res, captured, 'Authorization hold captured successfully', 200);
});

/**
 * Refund a PaymentIntent
 */
export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const { paymentIntentId, amountInCents, reason } = req.body;

  if (!paymentIntentId) {
    return sendError(res, 'paymentIntentId is required', 400);
  }

  const refund = await stripeService.processRefund(paymentIntentId, amountInCents, reason);
  return sendSuccess(res, refund, 'Refund issued successfully', 200);
});

/**
 * Retrieve status of a PaymentIntent
 */
export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const paymentIntentId = req.params.paymentIntentId as string;
  const intent = await stripeService.retrievePaymentIntent(paymentIntentId);
  return sendSuccess(res, intent, 'Payment status retrieved', 200);
});
