import { Router } from 'express';
import {
  getRooms,
  updateRoomStatus,
  getDashboardMetrics,
  getReservations,
  checkInGuest,
  checkOutGuest,
} from '../../controllers/room.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  updateRoomStatusValidator,
  checkInValidator,
  checkOutValidator,
} from '../../validators/room.validators.js';

const router = Router();

router.get('/', getRooms);
router.get('/dashboard', getDashboardMetrics);
router.get('/reservations', getReservations);
router.patch('/:id/status', validate(updateRoomStatusValidator), updateRoomStatus);
router.post('/reservations/:id/check-in', validate(checkInValidator), checkInGuest);
router.post('/reservations/:id/check-out', validate(checkOutValidator), checkOutGuest);

export default router;
