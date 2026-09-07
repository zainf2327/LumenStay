import { Router } from 'express';
import { db } from '../../db/index.js';
import { sendSuccess } from '../../utils/response.util.js';
import { asyncHandler } from '../../middlewares/asyncHandler.middleware.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const users = await db.users.find();
  return sendSuccess(res, users, 'Users retrieved successfully');
}));

export default router;
