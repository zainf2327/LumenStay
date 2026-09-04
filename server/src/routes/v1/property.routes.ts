import { Router } from 'express';
import { getAllProperties, getPropertyById } from '../../controllers/property.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { getPropertyValidator } from '../../validators/property.validators.js';

const router = Router();

router.get('/', getAllProperties);
router.get('/:id', validate(getPropertyValidator), getPropertyById);

export default router;
