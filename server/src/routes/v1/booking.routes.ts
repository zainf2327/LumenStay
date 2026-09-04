import { Router } from 'express';
import {
  createBooking,
  getBookingByIdentifier,
  cancelBooking,
} from '../../controllers/booking.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createBookingValidator,
  getBookingValidator,
  cancelBookingValidator,
} from '../../validators/booking.validators.js';

const router = Router();

router.post('/', validate(createBookingValidator), createBooking);
router.get('/lookup/:id', validate(getBookingValidator), getBookingByIdentifier);
router.get('/:id', validate(getBookingValidator), getBookingByIdentifier);
router.post('/:id/cancel', validate(cancelBookingValidator), cancelBooking);

export default router;
