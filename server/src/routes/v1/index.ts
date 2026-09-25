import { Router } from 'express';
import authRoutes from './auth.routes.js';
import propertyRoutes from './property.routes.js';
import availabilityRoutes from './availability.routes.js';
import bookingRoutes from './booking.routes.js';
import roomRoutes from './room.routes.js';
import folioRoutes from './folio.routes.js';
import guestRoutes from './guest.routes.js';
import userRoutes from './user.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import channelRoutes from './channel.routes.js';
import serviceRequestRoutes from './serviceRequest.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertyRoutes);
router.use('/availability', availabilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/rooms', roomRoutes);
router.use('/folios', folioRoutes);
router.use('/guests', guestRoutes);
router.use('/users', userRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/channels', channelRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/payments', paymentRoutes);
router.use('/stripe', paymentRoutes);

export default router;

