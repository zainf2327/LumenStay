import { Router } from 'express';
import {
  getAllProperties,
  getPropertyById,
  getPropertyBroadcast,
  setPropertyBroadcast,
  clearPropertyBroadcast,
  getPropertyChecklists,
  updatePropertyChecklists,
} from '../../controllers/property.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getPropertyValidator, setBroadcastValidator } from '../../validators/property.validators.js';

const router = Router();

router.get('/', getAllProperties);
router.get('/:id', validate(getPropertyValidator), getPropertyById);

// Broadcast announcements
router.get('/:id/broadcast', validate(getPropertyValidator), getPropertyBroadcast);
router.post('/:id/broadcast', validate(setBroadcastValidator), setPropertyBroadcast);
router.delete('/:id/broadcast', validate(getPropertyValidator), clearPropertyBroadcast);

// Shift checklists & manager handover
router.get('/:id/checklists', validate(getPropertyValidator), getPropertyChecklists);
router.patch('/:id/checklists', validate(getPropertyValidator), updatePropertyChecklists);

export default router;

