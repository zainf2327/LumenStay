import { Router } from 'express';
import {
  handleStripeWebhook,
  createPaymentIntent,
  createPreAuth,
  capturePreAuth,
  refundPayment,
  getPaymentStatus,
} from '../../controllers/payment.controller.js';

const router = Router();

// Inbound webhook from Stripe (cryptographically verified)
router.post('/webhook', handleStripeWebhook);

// Payment Operations
router.post('/create-intent', createPaymentIntent);
router.post('/authorize', createPreAuth);
router.post('/capture', capturePreAuth);
router.post('/refund', refundPayment);
router.get('/:paymentIntentId/status', getPaymentStatus);

export default router;
