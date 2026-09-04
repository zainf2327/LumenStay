import { Router } from 'express';
import {
  getFolio,
  addCharge,
  settlePayment,
} from '../../controllers/folio.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  getFolioValidator,
  addChargeValidator,
  settlePaymentValidator,
} from '../../validators/folio.validators.js';

const router = Router();

router.get('/:reservationId', validate(getFolioValidator), getFolio);
router.post('/:reservationId/charges', validate(addChargeValidator), addCharge);
router.post('/:reservationId/payments', validate(settlePaymentValidator), settlePayment);

export default router;
