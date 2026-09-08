import { Router } from 'express';
import {
  getStaff,
  inviteStaff,
  resendInvite,
  deactivateStaff,
} from '../../controllers/user.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  inviteStaffValidator,
  resendInviteValidator,
} from '../../validators/user.validators.js';

const router = Router();

// Staff roster
router.get('/', authenticate, getStaff);

// Invite a new staff member
router.post('/invite', authenticate, validate(inviteStaffValidator), inviteStaff);

// Resend an invitation
router.post('/:id/resend-invite', authenticate, validate(resendInviteValidator), resendInvite);

// Deactivate or remove staff member
router.delete('/:id', authenticate, deactivateStaff);

export default router;
