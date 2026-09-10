import type { Request, Response } from 'express';
import { channexService } from '../services/channex.service.js';
import { dynamicPricingService } from '../services/dynamicPricing.service.js';
import { sendSuccess } from '../utils/response.util.js';
import { asyncHandler } from '../middlewares/asyncHandler.middleware.js';
import { ApiError } from '../types/api.types.js';

export const handleChannexWebhook = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;

  // Immediately respond with 200 OK as mandated by Channex
  sendSuccess(res, { status: 'received' }, 'Channex webhook received and queued for processing', 200);

  // Background asynchronous processing
  (async () => {
    try {
      if (!payload) return;
      const revisionId = payload.booking_revision_id || payload.id || payload.revision_id;

      // If full booking payload is attached, process directly
      if (payload.propertyId && payload.event) {
        await channexService.processWebhook(payload);
      } else {
        // Option 2 fallback: Pull feed to get the revision
        await channexService.pullBookingRevisionsFeed();
      }

      // Send mandatory Acknowledgment
      if (revisionId) {
        await channexService.acknowledgeRevision(revisionId);
      }
    } catch (err) {
      console.error('[Channex Webhook Background Handler Error]', err);
    }
  })();
});

export const pullBookingRevisions = asyncHandler(async (req: Request, res: Response) => {
  const result = await channexService.pullBookingRevisionsFeed();
  return sendSuccess(res, result, `Processed ${result.processedCount} revision(s) and acknowledged ${result.acknowledgedCount} to Channex`);
});

export const getChannelStatus = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string | undefined;
  const statuses = await channexService.getChannelStatus(propertyId);
  return sendSuccess(res, statuses, 'Channel synchronization status retrieved');
});

export const syncPropertyChannels = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.propertyId as string;
  const roomTypeId = req.query.roomTypeId as string | undefined;

  const result = await channexService.syncAvailability(propertyId, roomTypeId);
  return sendSuccess(res, result, result.message, 200);
});

export const simulateOtaBooking = asyncHandler(async (req: Request, res: Response) => {
  const {
    propertyId = 'prop_copperline',
    channel = 'expedia',
    roomTypeCode = 'DELUXE_KING',
    checkInDate,
    checkOutDate,
    guestName = 'Emily Chen',
    guestEmail = 'emily.chen@example.com',
    guestPhone = '(303) 555-4921',
    totalAmount = 760.0,
  } = req.body;

  const nameParts = guestName.split(' ');
  const firstName = nameParts[0] || 'Guest';
  const lastName = nameParts.slice(1).join(' ') || 'Traveler';

  // Default dates: tomorrow to +3 days if not provided
  const now = new Date();
  const defCheckIn = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0];
  const defCheckOut = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0];

  const payload = {
    event: 'booking_created' as const,
    propertyId,
    channel,
    channelReservationId: `${channel.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    roomTypeCode,
    checkInDate: checkInDate || defCheckIn,
    checkOutDate: checkOutDate || defCheckOut,
    adultCount: 2,
    childCount: 0,
    guest: {
      firstName,
      lastName,
      email: guestEmail,
      phone: guestPhone,
    },
    totalAmount: Number(totalAmount),
  };

  const result = await channexService.processWebhook(payload);
  return sendSuccess(res, result, `Simulated ${channel.toUpperCase()} reservation processed successfully`, 201);
});

export const getPricingRules = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.query.propertyId as string | undefined;
  const rules = dynamicPricingService.getRules(propertyId);
  return sendSuccess(res, rules, 'Dynamic pricing rules fetched');
});

export const updatePricingRule = asyncHandler(async (req: Request, res: Response) => {
  const ruleId = req.params.ruleId as string;
  const updated = dynamicPricingService.updateRule(ruleId, req.body);
  if (!updated) {
    throw new ApiError(404, `Pricing rule "${ruleId}" not found`);
  }
  return sendSuccess(res, updated, 'Dynamic pricing rule updated');
});

export const setRateOverride = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, roomTypeId, price, setBy } = req.body;
  if (!propertyId || !roomTypeId || typeof price !== 'number') {
    throw new ApiError(400, 'propertyId, roomTypeId, and numeric price are required');
  }

  dynamicPricingService.setManualOverride(propertyId, roomTypeId, price, setBy);
  return sendSuccess(res, { propertyId, roomTypeId, price }, 'Manual rate override applied and pushed to channels');
});

export const evaluateDynamicRate = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, roomTypeId, checkInDate, checkOutDate } = req.query;
  if (!propertyId || !roomTypeId) {
    throw new ApiError(400, 'propertyId and roomTypeId are required query parameters');
  }

  const defCheckIn = new Date().toISOString().split('T')[0];
  const defCheckOut = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0];

  const rate = await dynamicPricingService.calculateDynamicRate(
    propertyId as string,
    roomTypeId as string,
    (checkInDate as string) || defCheckIn,
    (checkOutDate as string) || defCheckOut
  );

  return sendSuccess(res, rate, 'Dynamic rate calculated successfully');
});
