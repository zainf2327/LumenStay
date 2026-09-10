import { Router } from 'express';
import {
  handleChannexWebhook,
  pullBookingRevisions,
  getChannelStatus,
  syncPropertyChannels,
  simulateOtaBooking,
  getPricingRules,
  updatePricingRule,
  setRateOverride,
  evaluateDynamicRate,
} from '../../controllers/channel.controller.js';

const router = Router();

// Inbound webhook from Channex / OTAs (Option 2: Push)
router.post('/channex/webhook', handleChannexWebhook);

// Option 1: Pull Revisions Feed on-demand or backup
router.post('/pull-feed', pullBookingRevisions);

// Status and reporting
router.get('/status', getChannelStatus);

// Outbound sync triggers
router.post('/sync/:propertyId', syncPropertyChannels);

// Interactive test simulation
router.post('/simulate-booking', simulateOtaBooking);

// Dynamic Pricing & Yield Rules
router.get('/pricing-rules', getPricingRules);
router.patch('/pricing-rules/:ruleId', updatePricingRule);
router.post('/rate-override', setRateOverride);
router.get('/evaluate-rate', evaluateDynamicRate);

export default router;
