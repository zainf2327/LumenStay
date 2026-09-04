import { Router } from 'express';
import { db } from '../db.js';

export const guestsRouter = Router();

// GET all guests with stay counts and stats
guestsRouter.get('/', (req, res) => {
  try {
    const allGuests = db.guests.find();
    const guestList = allGuests.map((g) => {
      const stays = db.reservations.find(r => r.guestId === g.id);
      const totalSpend = stays.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      return {
        ...g,
        totalStays: stays.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        recentStays: stays.slice(-3),
      };
    });

    res.json({ success: true, data: guestList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET guest by ID with full history
guestsRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const guest = db.guests.findById(id);
    if (!guest) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    const stays = db.reservations.find(r => r.guestId === id).map((r) => {
      const prop = db.properties.findById(r.propertyId);
      const roomType = db.roomTypes.findById(r.roomTypeId);
      return {
        ...r,
        propertyName: prop?.name,
        roomTypeName: roomType?.name,
      };
    });

    res.json({
      success: true,
      data: {
        ...guest,
        stays,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH guest preferences / notes / VIP status
guestsRouter.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { specialPreferences, notes, vipStatus, loyaltyTier } = req.body;

    const updated = db.guests.update(id, {
      ...(specialPreferences !== undefined && { specialPreferences }),
      ...(notes !== undefined && { notes }),
      ...(vipStatus !== undefined && { vipStatus }),
      ...(loyaltyTier !== undefined && { loyaltyTier }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Guest not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
