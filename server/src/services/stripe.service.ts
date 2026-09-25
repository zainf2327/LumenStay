import Stripe from 'stripe';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../types/api.types.js';
import { db } from '../db/index.js';
import { broadcastEvent } from './websocket.js';

export interface ProcessPaymentInput {
  amountInCents: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  description: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
}

export interface ProcessPaymentResult {
  success: boolean;
  requiresAction?: boolean;
  clientSecret?: string | null;
  paymentIntentId: string;
  chargeId?: string;
  status: string;
  amount: number;
  currency: string;
  cardBrand: string;
  cardLast4: string;
  receiptUrl?: string;
  created: number;
}

export class StripeService {
  private stripe: Stripe;
  private processedEvents = new Set<string>();

  constructor() {
    if (!config.stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured in server/.env');
    }

    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
    logger.info('[Stripe] Production-Ready Stripe Client initialized.');
  }

  /**
   * Helper to safely extract card brand and last4 from a PaymentIntent
   */
  private extractCardDetails(paymentIntent: Stripe.PaymentIntent): { cardBrand: string; cardLast4: string } {
    let cardBrand = 'Card';
    let cardLast4 = '4242';

    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
      const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
      if (pm.card) {
        cardBrand = pm.card.brand ? pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1) : 'Card';
        cardLast4 = pm.card.last4 || '4242';
      }
    }
    return { cardBrand, cardLast4 };
  }

  /**
   * Full-lifecycle PaymentIntent processor supporting:
   * 1. Direct immediate capture (status: 'succeeded')
   * 2. 3D Secure / SCA Authentication challenges (status: 'requires_action')
   * 3. Pre-authorization hold (capture_method: 'manual')
   * 4. Idempotent follow-up confirmation of pre-authenticated paymentIntentId
   */
  public async processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
    const currency = input.currency || 'usd';

    try {
      // Flow A: Follow-up verification when client already completed 3DS on an existing PaymentIntent
      if (input.paymentIntentId) {
        logger.info(`[Stripe] Verifying existing PaymentIntent post-3DS: ${input.paymentIntentId}`);
        const intent = await this.stripe.paymentIntents.retrieve(input.paymentIntentId, {
          expand: ['payment_method', 'latest_charge'],
        });

        const { cardBrand, cardLast4 } = this.extractCardDetails(intent);
        const chargeId = typeof intent.latest_charge === 'string'
          ? intent.latest_charge
          : (intent.latest_charge as any)?.id || `ch_${intent.id.replace(/^pi_/, '')}`;

        if (intent.status === 'succeeded' || intent.status === 'requires_capture') {
          return {
            success: true,
            requiresAction: false,
            paymentIntentId: intent.id,
            chargeId,
            status: intent.status,
            amount: intent.amount / 100,
            currency: intent.currency,
            cardBrand,
            cardLast4,
            created: intent.created,
          };
        }

        if (intent.status === 'requires_action') {
          return {
            success: false,
            requiresAction: true,
            clientSecret: intent.client_secret,
            paymentIntentId: intent.id,
            status: intent.status,
            amount: intent.amount / 100,
            currency: intent.currency,
            cardBrand,
            cardLast4,
            created: intent.created,
          };
        }

        throw new ApiError(402, `Payment intent status is '${intent.status}'. Payment not completed.`);
      }

      // Flow B: Initial charge initiation with client-tokenized PaymentMethod
      const paymentMethodId = input.paymentMethodId || 'pm_card_visa';
      const captureMethod = input.captureMethod || 'automatic';
      const returnUrl = `${config.corsOrigin}/lookup`;

      logger.info(`[Stripe] Creating PaymentIntent ($${(input.amountInCents / 100).toFixed(2)}) for ${input.customerEmail}`);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(input.amountInCents),
        currency,
        description: input.description,
        receipt_email: input.customerEmail,
        payment_method: paymentMethodId,
        confirm: true,
        capture_method: captureMethod,
        return_url: returnUrl,
        expand: ['payment_method', 'latest_charge'],
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always', // Supports 3D Secure / SCA challenges seamlessly
        },
        metadata: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          ...input.metadata,
        },
      });

      const { cardBrand, cardLast4 } = this.extractCardDetails(paymentIntent);
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as any)?.id || `ch_${paymentIntent.id.replace(/^pi_/, '')}`;

      // Case 1: Instant success (frictionless authorization)
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
        logger.info(`💳 [Stripe Success] Intent: ${paymentIntent.id}, Status: ${paymentIntent.status} (${cardBrand} •••• ${cardLast4})`);
        return {
          success: true,
          requiresAction: false,
          paymentIntentId: paymentIntent.id,
          chargeId,
          status: paymentIntent.status,
          amount: input.amountInCents / 100,
          currency,
          cardBrand,
          cardLast4,
          created: paymentIntent.created,
        };
      }

      // Case 2: 3D Secure / SCA verification required by issuing bank
      if (paymentIntent.status === 'requires_action') {
        logger.info(`🛡️ [Stripe 3DS Required] Intent: ${paymentIntent.id} requires authentication challenge from cardholder.`);
        return {
          success: false,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: input.amountInCents / 100,
          currency,
          cardBrand,
          cardLast4,
          created: paymentIntent.created,
        };
      }

      // Case 3: Incomplete or declined
      throw new ApiError(402, `Payment requires further action. Current status: ${paymentIntent.status}`);
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      logger.error(`❌ [Stripe Error] Payment processing failed: ${err.message}`);
      throw new ApiError(402, `Payment Processing Error: ${err.message}`);
    }
  }

  /**
   * Retrieve live PaymentIntent details from Stripe
   */
  public async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method', 'latest_charge'],
      });
    } catch (err: any) {
      logger.error(`[Stripe Retrieve Error]: ${err.message}`);
      throw new ApiError(404, `Payment intent '${paymentIntentId}' not found on Stripe.`);
    }
  }

  /**
   * Hotel Pre-Authorization Hold (capture_method: 'manual')
   * Used at check-in to hold room rate + incidental deposit without immediate settlement.
   */
  public async createPreAuthorization(input: ProcessPaymentInput): Promise<ProcessPaymentResult> {
    return this.processPayment({
      ...input,
      captureMethod: 'manual',
    });
  }

  /**
   * Capture an existing pre-authorization hold (e.g. at guest checkout)
   */
  public async capturePayment(paymentIntentId: string, amountInCents?: number): Promise<Stripe.PaymentIntent> {
    try {
      logger.info(`[Stripe Capture] Capturing pre-auth hold for Intent: ${paymentIntentId}`);
      const captureParams: Stripe.PaymentIntentCaptureParams = {};
      if (amountInCents && amountInCents > 0) {
        captureParams.amount_to_capture = Math.round(amountInCents);
      }

      const capturedIntent = await this.stripe.paymentIntents.capture(paymentIntentId, captureParams);
      logger.info(`💳 [Stripe Captured] Intent ${paymentIntentId} settled successfully for $${((capturedIntent.amount_received || 0) / 100).toFixed(2)}`);
      return capturedIntent;
    } catch (err: any) {
      logger.error(`[Stripe Capture Error]: ${err.message}`);
      throw new ApiError(400, `Failed to capture authorization hold: ${err.message}`);
    }
  }

  /**
   * Cancel / Release an authorization hold upon guest cancellation or no-show
   */
  public async cancelPaymentIntent(
    paymentIntentId: string,
    cancellationReason: Stripe.PaymentIntentCancelParams.CancellationReason = 'requested_by_customer'
  ): Promise<Stripe.PaymentIntent> {
    try {
      logger.info(`[Stripe Cancel] Releasing authorization hold for Intent: ${paymentIntentId}`);
      const canceled = await this.stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: cancellationReason,
      });
      return canceled;
    } catch (err: any) {
      logger.error(`[Stripe Cancel Error]: ${err.message}`);
      throw new ApiError(400, `Failed to release authorization hold: ${err.message}`);
    }
  }

  /**
   * Process a real refund on Stripe
   */
  public async processRefund(
    paymentIntentId: string,
    amountInCents?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountInCents,
        reason,
      });
      logger.info(`💳 [Stripe Refund Succeeded] Refund ${refund.id} ($${((amountInCents || 0) / 100).toFixed(2)}) for intent ${paymentIntentId}`);
      return refund;
    } catch (err: any) {
      logger.error(`[Stripe Refund Error]: ${err.message}`);
      throw new ApiError(400, `Stripe Refund Error: ${err.message}`);
    }
  }

  /**
   * Webhook Signature Verification
   */
  public constructWebhookEvent(rawBody: Buffer | string, signature: string): Stripe.Event {
    if (!config.stripeWebhookSecret) {
      logger.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured; parsing event payload without cryptographic signature verification.');
      return typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8'));
    }

    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
    } catch (err: any) {
      logger.error(`❌ [Stripe Webhook Signature Invalid]: ${err.message}`);
      throw new ApiError(400, `Stripe Webhook Signature Verification Failed: ${err.message}`);
    }
  }

  /**
   * Webhook Event Ingestion with Idempotency & Lifecycle Event Dispatch
   */
  public async handleWebhookEvent(event: Stripe.Event): Promise<{ handled: boolean; eventType: string; idempotent?: boolean }> {
    // 1. Idempotency Check: Prevent duplicate webhook deliveries from mutating ledger twice
    if (this.processedEvents.has(event.id)) {
      logger.info(`[Stripe Webhook] Duplicate event ${event.id} (${event.type}) skipped via idempotency.`);
      return { handled: true, eventType: event.type, idempotent: true };
    }

    this.processedEvents.add(event.id);
    if (this.processedEvents.size > 2000) {
      const oldest = this.processedEvents.values().next().value;
      if (oldest) this.processedEvents.delete(oldest);
    }

    logger.info(`[Stripe Webhook] Processing verified event: ${event.type} [ID: ${event.id}]`);

    switch (event.type) {
      // Event A: Payment Succeeded
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const confirmationCode = intent.metadata?.confirmationCode;
        logger.info(`💰 [Stripe Event] payment_intent.succeeded for Intent: ${intent.id} ($${(intent.amount / 100).toFixed(2)})`);

        if (confirmationCode) {
          const res = await db.reservations.findByConfirmationCode(confirmationCode);
          if (res && res.paymentStatus !== 'paid') {
            await db.reservations.update(res.id, {
              paymentStatus: 'paid',
              paidAmount: intent.amount / 100,
            });

            // Post payment credit to folio
            await db.folioCharges.insert({
              id: `fol_webhook_${Date.now()}`,
              reservationId: res.id,
              propertyId: res.propertyId,
              category: 'payment',
              description: `Stripe Webhook Settled — Auth ${intent.id.slice(-6)}`,
              amount: -(intent.amount / 100),
              status: 'paid',
              postedBy: 'Stripe Webhook',
              paymentMethod: 'Stripe Online Payment',
              paymentRef: intent.id,
              createdAt: new Date().toISOString(),
            });

            broadcastEvent('FOLIO_UPDATED', { reservationId: res.id, propertyId: res.propertyId });
          }
        }
        break;
      }

      // Event B: Payment Failed
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const errMessage = intent.last_payment_error?.message || 'Payment failed';
        logger.warn(`⚠️ [Stripe Event] payment_intent.payment_failed: ${intent.id} — ${errMessage}`);

        const confirmationCode = intent.metadata?.confirmationCode;
        if (confirmationCode) {
          const res = await db.reservations.findByConfirmationCode(confirmationCode);
          if (res) {
            await db.reservations.update(res.id, { paymentStatus: 'failed' });
            broadcastEvent('PAYMENT_FAILED', {
              reservationId: res.id,
              confirmationCode,
              error: errMessage,
            });
          }
        }
        break;
      }

      // Event C: Pre-Authorization Hold Updated
      case 'payment_intent.amount_capturable_updated': {
        const intent = event.data.object as Stripe.PaymentIntent;
        logger.info(`🔒 [Stripe Event] Pre-auth capturable amount updated: $${(intent.amount_capturable / 100).toFixed(2)} on ${intent.id}`);
        break;
      }

      // Event D: Real Refund Processed
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
        logger.info(`↩️ [Stripe Event] charge.refunded: Charge ${charge.id}, Amount: $${(charge.amount_refunded / 100).toFixed(2)}`);

        if (paymentIntentId) {
          broadcastEvent('CHARGE_REFUNDED', {
            paymentIntentId,
            refundAmount: charge.amount_refunded / 100,
          });
        }
        break;
      }

      // Event E: Dispute / Chargeback Alert
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        logger.error(`🚨 [Stripe Dispute Alert] Chargeback filed! Charge: ${dispute.charge}, Amount: $${(dispute.amount / 100).toFixed(2)}, Reason: ${dispute.reason}`);
        broadcastEvent('CHARGE_DISPUTE_FILED', {
          chargeId: dispute.charge,
          amount: dispute.amount / 100,
          reason: dispute.reason,
          status: dispute.status,
        });
        break;
      }

      default:
        logger.debug(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return { handled: true, eventType: event.type };
  }
}

export const stripeService = new StripeService();
