import { Router } from 'express';
import { getAvailability } from '../../controllers/availability.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getAvailabilityValidator } from '../../validators/availability.validators.js';

const router = Router();

router.get('/', validate(getAvailabilityValidator), getAvailability);

export default router;
