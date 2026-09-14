import { Router } from 'express';
import {
  createRequest,
  getRequestsByProperty,
  getRequestsByReservation,
  updateStatus,
} from '../../controllers/serviceRequest.controller.js';

const router = Router();

// Guest submissions
router.post('/', createRequest);

// Staff retrieval by property
router.get('/property/:propertyId', getRequestsByProperty);

// Guest retrieval by reservation
router.get('/reservation/:reservationId', getRequestsByReservation);

// Staff status updates (acknowledge, complete, decline)
router.patch('/:id/status', updateStatus);

export default router;
