import { Router } from 'express';
import {
  getTickets,
  createTicket,
  resolveTicket,
} from '../../controllers/maintenance.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createMaintenanceTicketValidator,
  resolveMaintenanceTicketValidator,
} from '../../validators/maintenance.validators.js';

const router = Router();

router.get('/', getTickets);
router.post('/', validate(createMaintenanceTicketValidator), createTicket);
router.patch('/:id/resolve', validate(resolveMaintenanceTicketValidator), resolveTicket);

export default router;
