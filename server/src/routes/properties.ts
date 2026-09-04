import { Router } from 'express';
import { db } from '../db.js';

export const propertiesRouter = Router();

// GET all properties
propertiesRouter.get('/', (req, res) => {
  try {
    const props = db.properties.find();
    res.json({ success: true, data: props });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single property with room types and rate plans
propertiesRouter.get('/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const property = db.properties.findOne(p => p.id === idOrSlug || p.slug === idOrSlug);

    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    const roomTypeList = db.roomTypes.find(rt => rt.propertyId === property.id);
    const ratePlanList = db.ratePlans.find(rp => rp.propertyId === property.id);

    const formattedProperty = {
      ...property,
      roomTypes: roomTypeList,
      ratePlans: ratePlanList,
    };

    res.json({ success: true, data: formattedProperty });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
