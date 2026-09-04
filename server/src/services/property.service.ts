import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';

export class PropertyService {
  public getAllProperties() {
    return db.properties.find();
  }

  public getPropertyByIdOrSlug(idOrSlug: string) {
    const property = db.properties.findOne(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const roomTypes = db.roomTypes.find(rt => rt.propertyId === property.id);
    const ratePlans = db.ratePlans.find(rp => rp.propertyId === property.id);

    return {
      ...property,
      roomTypes,
      ratePlans,
    };
  }
}

export const propertyService = new PropertyService();
