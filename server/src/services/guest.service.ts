import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';

export class GuestService {
  public getAllGuests() {
    const allGuests = db.guests.find();
    return allGuests.map((g) => {
      const stays = db.reservations.find(r => r.guestId === g.id);
      const totalSpend = stays.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      return {
        ...g,
        totalStays: stays.length,
        totalSpend: Math.round(totalSpend * 100) / 100,
      };
    });
  }

  public getGuestById(id: string) {
    const guest = db.guests.findById(id);
    if (!guest) {
      throw new ApiError(404, 'Guest profile not found');
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

    return {
      ...guest,
      stays,
    };
  }

  public updateGuest(id: string, updates: any) {
    const updated = db.guests.update(id, updates);
    if (!updated) {
      throw new ApiError(404, 'Guest profile not found');
    }
    return updated;
  }
}

export const guestService = new GuestService();
