import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';

export class GuestService {
  public async getAllGuests() {
    const allGuests = await db.guests.find();
    const results = await Promise.all(
      allGuests.map(async (g) => {
        const stays = await db.reservations.findByGuestId(g.id);
        const totalSpend = stays.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        return {
          ...g,
          totalStays: stays.length,
          totalSpend: Math.round(totalSpend * 100) / 100,
        };
      })
    );
    return results;
  }

  public async getGuestById(id: string) {
    const guest = await db.guests.findById(id);
    if (!guest) {
      throw new ApiError(404, 'Guest profile not found');
    }

    const rawStays = await db.reservations.findByGuestId(id);
    const stays = await Promise.all(
      rawStays.map(async (r) => {
        const prop = await db.properties.findById(r.propertyId);
        const roomType = await db.roomTypes.findById(r.roomTypeId);
        return {
          ...r,
          propertyName: prop?.name,
          roomTypeName: roomType?.name,
        };
      })
    );

    return {
      ...guest,
      stays,
    };
  }

  public async updateGuest(id: string, updates: any) {
    const updated = await db.guests.update(id, updates);
    if (!updated) {
      throw new ApiError(404, 'Guest profile not found');
    }
    return updated;
  }
}

export const guestService = new GuestService();
