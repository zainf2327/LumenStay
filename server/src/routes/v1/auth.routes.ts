import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
} from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
} from '../../validators/auth.validators.js';

const router = Router();

router.post('/login', validate(loginValidator), login);
router.post('/register', validate(registerValidator), register);
router.post('/forgot-password', validate(forgotPasswordValidator), forgotPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
