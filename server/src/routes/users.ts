import { Router } from 'express';
import { db } from '../db.js';

export const usersRouter = Router();

// GET all users (used by the QuickSwitcher)
usersRouter.get('/', (req, res) => {
  try {
    const allUsers = db.users.find();
    res.json({ success: true, data: allUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
