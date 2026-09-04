import { Router } from 'express';
import {
  getAllGuests,
  getGuestById,
  updateGuest,
} from '../../controllers/guest.controller.js';

const router = Router();

router.get('/', getAllGuests);
router.get('/:id', getGuestById);
router.patch('/:id', updateGuest);

export default router;
