import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';

export class PropertyService {
  public async getAllProperties() {
    return await db.properties.find();
  }

  public async getPropertyByIdOrSlug(idOrSlug: string) {
    let property = await db.properties.findById(idOrSlug);
    if (!property) {
      property = await db.properties.findBySlug(idOrSlug);
    }
    if (!property) {
      throw new ApiError(404, 'Property not found');
    }

    const roomTypes = await db.roomTypes.findByPropertyId(property.id);
    const ratePlans = await db.ratePlans.findByPropertyId(property.id);

    return {
      ...property,
      roomTypes,
      ratePlans,
    };
  }
}

export const propertyService = new PropertyService();

