import { db } from './db.js';
import { format, addDays, subDays } from 'date-fns';
import type {
  Property,
  RoomType,
  Room,
  RatePlan,
  Guest,
  Reservation,
  FolioCharge,
  User,
  MaintenanceTicket,
  HousekeepingTask,
} from './types/domain.types.js';

export function seedDatabase() {
  if (db.properties.count() > 0) {
    console.log('Database already contains properties, skipping initial seed.');
    return;
  }

  console.log('Seeding LumenStay 6 boutique hotel properties, 197 rooms, rate plans & folios...');

  const now = new Date().toISOString();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const in3Days = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const in5Days = format(addDays(new Date(), 5), 'yyyy-MM-dd');

  // 1. Properties
  const seededProperties: Property[] = [
    {
      id: 'prop_birchwood',
      name: 'The Birchwood',
      slug: 'the-birchwood',
      tagline: 'Historic 1920s Alpine Lodge & Fireside Luxury',
      address: '410 East Hopkins Ave',
      city: 'Aspen',
      state: 'CO',
      postalCode: '81611',
      phone: '(970) 925-8800',
      email: 'concierge@thebirchwoodaspen.com',
      heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
      description: 'Built in 1926 and artfully restored, The Birchwood blends historic Gilded Age charm with ski-in mountain elegance, stone fireplaces, and an acclaimed summer courtyard for weddings.',
      checkInTime: '16:00',
      checkOutTime: '11:00',
      lockType: 'salto',
      brandTheme: {
        primary: '#18382b',
        primaryLight: '#2c5e4a',
        primaryDark: '#0e241b',
        accent: '#c5a059',
        accentHover: '#b38e45',
        surface: '#17221c',
        surfaceSubtle: '#213128',
        surfaceDark: '#0d1511',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        mood: 'Historic Alpine Heritage',
        tagline: 'Aspen, Colorado • Est. 1926',
        heroBadge: 'Ski-in / Ski-out & Historic Courtyard',
      },
      amenities: ['Ski Valet & Storage', 'Heated Outdoor Pool & Spa', 'Fireside Library Lounge', 'Courtyard Wedding Venue', 'Complimentary Apres-Ski Tasting', 'Tesla Destination Charging'],
      totalRooms: 42,
      createdAt: now,
    },
    {
      id: 'prop_copperline',
      name: 'Copperline Inn',
      slug: 'copperline-inn',
      tagline: 'Artisanal Mountain Sanctuary & Trailside Basecamp',
      address: '208 North Main Street',
      city: 'Breckenridge',
      state: 'CO',
      postalCode: '80424',
      phone: '(970) 453-2210',
      email: 'stay@copperlineinn.com',
      heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
      description: 'A cozy timber and slate haven just steps from Breckenridge Gondola. Designed for winter powder hounds and summer singletrack mountain bikers.',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      lockType: 'salto',
      brandTheme: {
        primary: '#8c4820',
        primaryLight: '#b26132',
        primaryDark: '#5e2e12',
        accent: '#e69a57',
        accentHover: '#d4833c',
        surface: '#241b17',
        surfaceSubtle: '#332721',
        surfaceDark: '#17110e',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        mood: 'Rustic Trailside Elegance',
        tagline: 'Breckenridge, Colorado',
        heroBadge: 'Steps to Gondola & Singletrack',
      },
      amenities: ['Bike & Ski Tuning Workshop', 'Cedar Barrel Saunas', 'Artisanal Coffee Bar', 'Craft Beer & Whiskey Cellar', 'Pet Friendly Suites', 'Heated Boot Warmers'],
      totalRooms: 28,
      createdAt: now,
    },
    {
      id: 'prop_wrenhouse',
      name: 'The Wren House',
      slug: 'the-wren-house',
      tagline: 'Intimate Quiet-Luxury Hideaway in Box Canyon',
      address: '320 West Colorado Ave',
      city: 'Telluride',
      state: 'CO',
      postalCode: '81435',
      phone: '(970) 728-6640',
      email: 'butler@thewrenhousetelluride.com',
      heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
      description: 'Nineteen individually curated suites offering bespoke butler service, panoramic box canyon views, deep soaking tubs, and unmatched exclusivity.',
      checkInTime: '15:00',
      checkOutTime: '12:00',
      lockType: 'salto',
      brandTheme: {
        primary: '#24252a',
        primaryLight: '#393b42',
        primaryDark: '#121316',
        accent: '#dfb76c',
        accentHover: '#cfa251',
        surface: '#1a1b1f',
        surfaceSubtle: '#282a30',
        surfaceDark: '#0e0f12',
        headingFont: 'Cormorant Garamond',
        bodyFont: 'Inter',
        mood: 'Quiet High-ADR Luxury',
        tagline: 'Telluride, Colorado',
        heroBadge: 'Bespoke Butler Service & 19 Suites',
      },
      amenities: ['Dedicated Private Butler', 'In-Suite Deep Soaking Tubs', 'Champagne & Caviar Parlor', 'Custom Pillow & Scent Menu', 'Chauffeured Range Rover Transfers', 'Private Heliski Coordination'],
      totalRooms: 19,
      createdAt: now,
    },
    {
      id: 'prop_sundowner',
      name: 'Sundowner Lodge',
      slug: 'sundowner-lodge',
      tagline: 'Park City Premier Alpine Resort & Gathering Place',
      address: '1850 Sidewinder Drive',
      city: 'Park City',
      state: 'UT',
      postalCode: '84060',
      phone: '(435) 649-7000',
      email: 'reservations@sundownerparkcity.com',
      heroImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80',
      description: 'Lumen’s largest property features 51 rooms, expansive conference halls, farm-to-table dining at the on-site Hearth Restaurant, and effortless access to Deer Valley and Park City Mountain.',
      checkInTime: '16:00',
      checkOutTime: '11:00',
      lockType: 'assa_abloy',
      brandTheme: {
        primary: '#a24628',
        primaryLight: '#c95b36',
        primaryDark: '#6f2d18',
        accent: '#f2a65a',
        accentHover: '#df8e3e',
        surface: '#241a17',
        surfaceSubtle: '#332521',
        surfaceDark: '#160f0d',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        mood: 'Resort & Executive Mountain Gathering',
        tagline: 'Park City, Utah',
        heroBadge: '51 Rooms • Hearth Restaurant & Spa',
      },
      amenities: ['Hearth On-Site Restaurant (Toast POS)', 'Full-Service Alpine Spa', 'Executive Boardrooms & Conference Space', 'Resort Shuttle to Deer Valley', 'Year-Round Heated Hydro Pool', 'Valet Parking'],
      totalRooms: 51,
      createdAt: now,
    },
    {
      id: 'prop_cedarsalt',
      name: 'Cedar & Salt',
      slug: 'cedar-and-salt',
      tagline: 'Desert Modern Haven Between Red Rocks & Canyons',
      address: '580 South Main St',
      city: 'Moab',
      state: 'UT',
      postalCode: '84532',
      phone: '(435) 259-4500',
      email: 'concierge@cedarsaltmoab.com',
      heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
      description: 'A striking minimalist desert sanctuary framed by Moab’s red rock cliffs. Offering stargazing terraces, plunge pools, and tailored private expeditions into Arches and Canyonlands.',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      lockType: 'assa_abloy',
      brandTheme: {
        primary: '#9a4732',
        primaryLight: '#bc5b42',
        primaryDark: '#6b2e1f',
        accent: '#5a7865',
        accentHover: '#466150',
        surface: '#251c19',
        surfaceSubtle: '#352824',
        surfaceDark: '#160f0d',
        headingFont: 'Cormorant Garamond',
        bodyFont: 'Inter',
        mood: 'Desert Modern Red Rock Oasis',
        tagline: 'Moab, Utah',
        heroBadge: 'Stargazing Terraces & Canyon Expeditions',
      },
      amenities: ['Private Stargazing Roof Decks', 'Desert Plunge Pools', 'Morning Yoga & Sound Baths', 'Private Jeep & Canyoneering Outfitter', 'Cold Brew & Mezcal Bar', 'EV Superchargers'],
      totalRooms: 24,
      createdAt: now,
    },
    {
      id: 'prop_theledger',
      name: 'The Ledger',
      slug: 'the-ledger',
      tagline: 'Modern Architectural Boutique in Downtown SLC',
      address: '175 South West Temple',
      city: 'Salt Lake City',
      state: 'UT',
      postalCode: '84101',
      phone: '(801) 531-1000',
      email: 'stay@theledgerslc.com',
      heroImage: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80',
      description: 'Sophisticated downtown urban atelier combining mid-century brass aesthetic with high-speed digital amenities, rooftop cocktail lounge, and seamless airport connectivity.',
      checkInTime: '15:00',
      checkOutTime: '12:00',
      lockType: 'assa_abloy',
      brandTheme: {
        primary: '#192638',
        primaryLight: '#283c57',
        primaryDark: '#0e1724',
        accent: '#d4af37',
        accentHover: '#be9928',
        surface: '#151d28',
        surfaceSubtle: '#202b3b',
        surfaceDark: '#0c1219',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        mood: 'Urban Atelier & Business Sanctuary',
        tagline: 'Salt Lake City, Utah',
        heroBadge: 'Downtown Atelier & Rooftop Lounge',
      },
      amenities: ['The Vault Rooftop Cocktail Lounge', 'Acoustic Sound-Proofed Work Pods', 'Direct Airport Trax Link', '24/7 Wellness Gym & Peloton Studio', 'Complimentary Fiber Wi-Fi 6', 'Curated Art Gallery'],
      totalRooms: 33,
      createdAt: now,
    },
  ];

  db.properties.insertMany(seededProperties);

  // 2. Room Types
  const seededRoomTypes: RoomType[] = [
    // Birchwood
    {
      id: 'rt_birch_std',
      propertyId: 'prop_birchwood',
      name: 'Deluxe Heritage King',
      code: 'DHK',
      basePrice: 380,
      capacityAdults: 2,
      capacityChildren: 1,
      bedConfiguration: '1 Plush King Bed',
      sizeSqFt: 380,
      description: 'Handcrafted timber furnishings, gas fireplace, and plush velvet seating with serene courtyard garden views.',
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Gas Fireplace', 'Courtyard View', 'Nespresso Atelier', 'Frette Linens', 'Rain Shower'],
      totalInventory: 20,
    },
    {
      id: 'rt_birch_mtn',
      propertyId: 'prop_birchwood',
      name: 'Mountain View King Suite',
      code: 'MKS',
      basePrice: 580,
      capacityAdults: 3,
      capacityChildren: 2,
      bedConfiguration: '1 King Bed + Sleeper Sofa',
      sizeSqFt: 560,
      description: 'Expansive private balcony facing Ajax Mountain, separate living parlor, deep clawfoot soaking tub, and dual fireplaces.',
      images: [
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Private Balcony with Ajax Views', 'Clawfoot Soaking Tub', 'Dual Fireplaces', 'Bespoke Bar Cabinet', 'Complimentary Wine Hour'],
      totalInventory: 14,
    },
    {
      id: 'rt_birch_penthouse',
      propertyId: 'prop_birchwood',
      name: 'The 1926 Presidential Penthouse',
      code: 'PNT',
      basePrice: 1250,
      capacityAdults: 4,
      capacityChildren: 2,
      bedConfiguration: '2 King Bedrooms',
      sizeSqFt: 1100,
      description: 'The crowning jewel of The Birchwood. Private elevator access, vaulted beam ceilings, chef’s pantry, and private rooftop cedar hot tub.',
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Private Rooftop Cedar Hot Tub', 'Dedicated Butler', 'Private Elevator Key', 'Full Dining Room & Wet Bar', 'Bang & Olufsen Sound System'],
      totalInventory: 8,
    },

    // Copperline Inn
    {
      id: 'rt_cop_queen',
      propertyId: 'prop_copperline',
      name: 'Alpine Double Queen',
      code: 'ADQ',
      basePrice: 260,
      capacityAdults: 4,
      capacityChildren: 2,
      bedConfiguration: '2 Queen Beds',
      sizeSqFt: 420,
      description: 'Ideal for ski groups and mountain bikers. Custom ski racks in room, heated slate bathroom floors, and gear drying closet.',
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['In-Room Gear Drying Locker', 'Heated Slate Floors', 'Trail Map Station', 'Pour-Over Coffee Setup'],
      totalInventory: 16,
    },
    {
      id: 'rt_cop_loft',
      propertyId: 'prop_copperline',
      name: 'Copperline Timber Loft',
      code: 'CTL',
      basePrice: 390,
      capacityAdults: 3,
      capacityChildren: 1,
      bedConfiguration: '1 King Bed + Loft Daybed',
      sizeSqFt: 540,
      description: 'Two-story loft with spiral staircase, wood-burning stove, and forest canopy terrace.',
      images: [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Wood-Burning Stove', 'Forest Canopy Terrace', 'Custom Wool Blankets', 'Craft Beer Growler Re-fill'],
      totalInventory: 12,
    },

    // The Wren House
    {
      id: 'rt_wren_estate',
      propertyId: 'prop_wrenhouse',
      name: 'San Juan Sanctuary Suite',
      code: 'SJS',
      basePrice: 850,
      capacityAdults: 2,
      capacityChildren: 0,
      bedConfiguration: '1 Custom Hand-Stitched King Bed',
      sizeSqFt: 620,
      description: 'Ultra-exclusive sanctuary. Hand-carved stone fireplace, cashmere throws, daily in-suite French breakfast, and direct canyon views.',
      images: [
        'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Full White-Glove Butler', 'Daily Champagne Breakfast', 'Dyson Airwrap & Le Labo Amenities', 'Private Range Rover Chauffeur'],
      totalInventory: 12,
    },
    {
      id: 'rt_wren_chalet',
      propertyId: 'prop_wrenhouse',
      name: 'Telluride Box Canyon Chalet',
      code: 'TBC',
      basePrice: 1600,
      capacityAdults: 4,
      capacityChildren: 2,
      bedConfiguration: '2 King Suites + Salon',
      sizeSqFt: 1350,
      description: 'A private residential chalet with floor-to-ceiling glass framing Bridal Veil Falls, private chef service on demand, and private wine cellar.',
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Private Sommelier Service', 'Private Chef Dining Option', 'Bridal Veil Falls Views', 'Exclusive Heliskiing Pad Access'],
      totalInventory: 7,
    },

    // Sundowner Lodge
    {
      id: 'rt_sun_classic',
      propertyId: 'prop_sundowner',
      name: 'Sundowner Mountain King',
      code: 'SMK',
      basePrice: 320,
      capacityAdults: 2,
      capacityChildren: 1,
      bedConfiguration: '1 King Bed',
      sizeSqFt: 390,
      description: 'Warm terracotta accents, luxury bedding, work desk with mountain views, and direct elevator to the Hearth restaurant.',
      images: [
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Ergonomic Executive Desk', 'Private Balcony', 'Hearth Priority Reservations', 'High-Speed Wi-Fi 6'],
      totalInventory: 30,
    },
    {
      id: 'rt_sun_exec',
      propertyId: 'prop_sundowner',
      name: 'Deer Valley Executive Suite',
      code: 'DVE',
      basePrice: 520,
      capacityAdults: 4,
      capacityChildren: 2,
      bedConfiguration: '1 King Bed + Parlor Queen Murphy',
      sizeSqFt: 680,
      description: 'Designed for corporate retreats and family vacations with conference-ready dining table and dual bathrooms.',
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Conference Dining Table', 'Dual Full Bathrooms', 'Mountain Valley Views', 'Spa Access Included'],
      totalInventory: 21,
    },

    // Cedar & Salt
    {
      id: 'rt_cedar_patio',
      propertyId: 'prop_cedarsalt',
      name: 'Red Rock Patio King',
      code: 'RPK',
      basePrice: 290,
      capacityAdults: 2,
      capacityChildren: 0,
      bedConfiguration: '1 King Bed',
      sizeSqFt: 360,
      description: 'Floor-to-ceiling glass opening onto a private sandstone terrace with firepit and panoramic views of the red cliff face.',
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Private Sandstone Patio & Firepit', 'Outdoor Stargazing Shower', 'Artisanal Mezcal Bar', 'Botanical Aromatherapy'],
      totalInventory: 16,
    },
    {
      id: 'rt_cedar_stargazer',
      propertyId: 'prop_cedarsalt',
      name: 'The Canyons Stargazer Suite',
      code: 'CSS',
      basePrice: 480,
      capacityAdults: 3,
      capacityChildren: 1,
      bedConfiguration: '1 King Bed + Sky Daybed',
      sizeSqFt: 580,
      description: 'Features a private rooftop deck equipped with Celestron telescope and outdoor soak tub under the dark sky preserve.',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Private Rooftop Deck & Telescope', 'Outdoor Cedar Soaking Tub', 'Complimentary Jeep Trail Day Pass', 'Solar Stargazing Lamp'],
      totalInventory: 8,
    },

    // The Ledger
    {
      id: 'rt_ledg_studio',
      propertyId: 'prop_theledger',
      name: 'Urban Atelier Studio',
      code: 'UAS',
      basePrice: 220,
      capacityAdults: 2,
      capacityChildren: 0,
      bedConfiguration: '1 King Bed',
      sizeSqFt: 340,
      description: 'Mid-century brass and midnight navy styling, acoustic sound dampening, workstation, and Tivoli audio system.',
      images: [
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Acoustic Soundproofing', 'Tivoli Audio System', 'Work Desk & Fast USB-C Hub', 'The Vault Cocktail Credit'],
      totalInventory: 22,
    },
    {
      id: 'rt_ledg_exec',
      propertyId: 'prop_theledger',
      name: 'Wasatch Corner Suite',
      code: 'WCS',
      basePrice: 370,
      capacityAdults: 3,
      capacityChildren: 1,
      bedConfiguration: '1 King Bed + Executive Daybed',
      sizeSqFt: 520,
      description: 'Panoramic downtown and Wasatch mountain corner views with soaking tub and private meeting salon.',
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      ],
      amenities: ['Wasatch Corner Views', 'Meeting Salon Table', 'Marble Deep Soaking Tub', 'Complimentary Dry Cleaning (2 garments)'],
      totalInventory: 11,
    },
  ];

  db.roomTypes.insertMany(seededRoomTypes);

  // 3. Physical Rooms (197 rooms)
  const seededRooms: Room[] = [];

  // Birchwood: 42 rooms
  for (let i = 1; i <= 42; i++) {
    const floor = Math.ceil(i / 14);
    const roomNum = `${floor}${String(i % 14 === 0 ? 14 : i % 14).padStart(2, '0')}`;
    const rtId = i <= 20 ? 'rt_birch_std' : (i <= 34 ? 'rt_birch_mtn' : 'rt_birch_penthouse');
    let quirk = null;
    if (roomNum === '214') quirk = 'Historic radiator requires valve bleed every 3 weeks in winter. Do not overtighten brass knob.';
    if (roomNum === '105') quirk = 'Antique window latch needs gentle upward pull before sliding.';

    const status = i === 3 ? 'dirty' : (i === 7 ? 'inspected' : (i === 12 ? 'dirty' : 'clean'));
    seededRooms.push({
      id: `rm_birch_${roomNum}`,
      propertyId: 'prop_birchwood',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Historic Lodge',
      status,
      quirks: quirk,
      isOccupied: false,
      features: ['Historic Timber', 'Courtyard Access'],
    });
  }

  // Copperline: 28 rooms
  for (let i = 1; i <= 28; i++) {
    const floor = i <= 10 ? 1 : (i <= 20 ? 2 : 3);
    const num = i <= 10 ? i : (i <= 20 ? i - 10 : i - 20);
    const roomNum = `${floor}${String(num).padStart(2, '0')}`;
    const rtId = i <= 16 ? 'rt_cop_queen' : 'rt_cop_loft';
    let quirk = null;
    if (roomNum === '204') quirk = 'Lock deadbolt needs slight handle lift when turning key.';
    const status = i % 5 === 0 ? 'dirty' : 'clean';
    seededRooms.push({
      id: `rm_cop_${roomNum}`,
      propertyId: 'prop_copperline',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Main Basecamp',
      status,
      quirks: quirk,
      isOccupied: false,
      features: ['Ski Lockers', 'Heated Slate'],
    });
  }

  // The Wren House: 19 rooms
  for (let i = 1; i <= 19; i++) {
    const floor = i <= 6 ? 1 : (i <= 13 ? 2 : 3);
    const num = i <= 6 ? i : (i <= 13 ? i - 6 : i - 13);
    const roomNum = `${floor}${String(num).padStart(2, '0')}`;
    const rtId = i <= 12 ? 'rt_wren_estate' : 'rt_wren_chalet';
    const status = i === 4 ? 'dirty' : (i === 8 ? 'inspected' : 'clean');
    seededRooms.push({
      id: `rm_wren_${roomNum}`,
      propertyId: 'prop_wrenhouse',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Private Estate',
      status,
      quirks: null,
      isOccupied: false,
      features: ['Butler Access', 'Soaking Tub'],
    });
  }

  // Sundowner Lodge: 51 rooms
  for (let i = 1; i <= 51; i++) {
    const floor = Math.ceil(i / 17);
    const num = i % 17 === 0 ? 17 : i % 17;
    const roomNum = `${floor}${String(num).padStart(2, '0')}`;
    const rtId = i <= 30 ? 'rt_sun_classic' : 'rt_sun_exec';
    let quirk = null;
    if (roomNum === '312') quirk = 'HVAC sensor is on east wall, adjust by 1° higher for true temperature.';
    const status = i % 4 === 0 ? 'dirty' : (i % 7 === 0 ? 'inspected' : 'clean');
    seededRooms.push({
      id: `rm_sun_${roomNum}`,
      propertyId: 'prop_sundowner',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Alpine Lodge',
      status,
      quirks: quirk,
      isOccupied: false,
      features: ['Balcony', 'High Speed Wi-Fi'],
    });
  }

  // Cedar & Salt: 24 rooms
  for (let i = 1; i <= 24; i++) {
    const floor = i <= 12 ? 1 : 2;
    const num = i <= 12 ? i : i - 12;
    const roomNum = `${floor}${String(num).padStart(2, '0')}`;
    const rtId = i <= 16 ? 'rt_cedar_patio' : 'rt_cedar_stargazer';
    const status = i === 2 ? 'dirty' : 'clean';
    seededRooms.push({
      id: `rm_cedar_${roomNum}`,
      propertyId: 'prop_cedarsalt',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Desert Pavilions',
      status,
      quirks: null,
      isOccupied: false,
      features: ['Private Patio', 'Stargazer Deck'],
    });
  }

  // The Ledger: 33 rooms
  for (let i = 1; i <= 33; i++) {
    const floor = Math.ceil(i / 11);
    const num = i % 11 === 0 ? 11 : i % 11;
    const roomNum = `${floor}${String(num).padStart(2, '0')}`;
    const rtId = i <= 22 ? 'rt_ledg_studio' : 'rt_ledg_exec';
    let quirk = null;
    if (roomNum === '108') quirk = 'Near service elevator; keep sound-dampening door seals firmly seated.';
    const status = i % 6 === 0 ? 'dirty' : 'clean';
    seededRooms.push({
      id: `rm_ledg_${roomNum}`,
      propertyId: 'prop_theledger',
      roomTypeId: rtId,
      roomNumber: roomNum,
      floor,
      building: 'Urban Atelier',
      status,
      quirks: quirk,
      isOccupied: false,
      features: ['Acoustic Soundproofing', 'Workstation'],
    });
  }

  db.rooms.insertMany(seededRooms);

  // 4. Rate Plans
  const seededRatePlans: RatePlan[] = [];
  for (const prop of seededProperties) {
    seededRatePlans.push(
      {
        id: `rp_${prop.id}_std`,
        propertyId: prop.id,
        name: 'Standard Flexible Rate',
        code: 'BAR',
        description: 'Best available flexible rate. Free cancellation up to 48 hours prior to 4:00 PM check-in.',
        priceModifier: 1.0,
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
        includesBreakfast: false,
        requiresLoyalty: false,
        minLoyaltyTier: null,
        isPromo: false,
        promoCode: null,
      },
      {
        id: `rp_${prop.id}_nonref`,
        propertyId: prop.id,
        name: 'Advance Saver (Non-Refundable)',
        code: 'ADV15',
        description: 'Save 15% when paying in advance. Non-refundable and non-changeable once booked.',
        priceModifier: 0.85,
        cancellationPolicy: 'Non-refundable upon booking',
        includesBreakfast: false,
        requiresLoyalty: false,
        minLoyaltyTier: null,
        isPromo: false,
        promoCode: null,
      },
      {
        id: `rp_${prop.id}_member`,
        propertyId: prop.id,
        name: 'Lumen Elite Member Rate',
        code: 'MEMBER',
        description: 'Exclusive member perk: 10% discount plus complimentary daily artisanal breakfast & late checkout priority.',
        priceModifier: 0.90,
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
        includesBreakfast: true,
        requiresLoyalty: true,
        minLoyaltyTier: 'member',
        isPromo: false,
        promoCode: null,
      },
      {
        id: `rp_${prop.id}_promo`,
        propertyId: prop.id,
        name: 'Early Mountain & Desert Escape',
        code: 'EARLYBIRD',
        description: 'Special promotional rate with $50 property experience credit and welcome beverage amenity.',
        priceModifier: 0.80,
        cancellationPolicy: 'Free cancellation up to 7 days before check-in',
        includesBreakfast: true,
        requiresLoyalty: false,
        minLoyaltyTier: null,
        isPromo: true,
        promoCode: 'LUMEN2026',
      }
    );
  }
  db.ratePlans.insertMany(seededRatePlans);

  // 5. Guests
  const seededGuests: Guest[] = [
    {
      id: 'gst_alexandra_vance',
      firstName: 'Alexandra',
      lastName: 'Vance',
      email: 'alexandra.vance@techventures.io',
      phone: '+1 (415) 890-4421',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      loyaltyTier: 'platinum',
      loyaltyPoints: 48500,
      idDocumentType: 'Passport',
      idDocumentNumber: 'USA-P9812401',
      specialPreferences: 'Prefers top floor away from elevator. Feather-free hypoallergenic pillows. Sparkling mineral water in room.',
      notes: 'Repeat VIP across Aspen and Telluride. Frequently books wedding party blocks. CEO of Vance Capital.',
      vipStatus: true,
      createdAt: now,
    },
    {
      id: 'gst_marcus_sterling',
      firstName: 'Marcus',
      lastName: 'Sterling',
      email: 'm.sterling@sterlingarch.com',
      phone: '+1 (312) 459-0012',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      loyaltyTier: 'gold',
      loyaltyPoints: 24200,
      idDocumentType: 'Drivers License',
      idDocumentNumber: 'IL-S490-192-30',
      specialPreferences: 'Loves corner rooms with natural lighting. Requests extra bath sheets and room humidifier.',
      notes: 'Architect enthusiast; loves The Birchwood historic restoration. Books 4-night ski trips annually.',
      vipStatus: true,
      createdAt: now,
    },
    {
      id: 'gst_elena_rostova',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'elena.rostova@montrealdesign.ca',
      phone: '+1 (514) 732-8891',
      city: 'Montreal',
      state: 'QC',
      country: 'Canada',
      loyaltyTier: 'silver',
      loyaltyPoints: 12100,
      idDocumentType: 'Passport',
      idDocumentNumber: 'CAN-KC492019',
      specialPreferences: 'Late checkout requests whenever available. Oat milk for in-room Nespresso.',
      notes: 'Canadian frequent traveler at Utah properties (Moab & Park City).',
      vipStatus: false,
      createdAt: now,
    },
    {
      id: 'gst_david_chen',
      firstName: 'David',
      lastName: 'Chen',
      email: 'dchen@summitadvisors.com',
      phone: '+1 (206) 555-0199',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      loyaltyTier: 'member',
      loyaltyPoints: 3500,
      idDocumentType: 'Drivers License',
      idDocumentNumber: 'WA-WDL98234B',
      specialPreferences: 'Fast Wi-Fi priority for executive Zoom calls. Prefers quiet building wings.',
      notes: 'First time guest booking directly via Squarespace widget.',
      vipStatus: false,
      createdAt: now,
    },
  ];
  db.guests.insertMany(seededGuests);

  // 6. Reservations & Folio
  const seededReservations: Reservation[] = [
    // In-House Birchwood VIP
    {
      id: 'res_birch_inhouse_1',
      confirmationCode: 'LMN-BW-8921',
      propertyId: 'prop_birchwood',
      guestId: 'gst_alexandra_vance',
      roomTypeId: 'rt_birch_mtn',
      assignedRoomId: 'rm_birch_201',
      ratePlanId: 'rp_prop_birchwood_member',
      status: 'checked_in',
      checkInDate: yesterday,
      checkOutDate: in3Days,
      adultCount: 2,
      childCount: 0,
      totalNights: 4,
      nightlyRate: 522.0,
      taxAmount: 250.56,
      resortFee: 140.0,
      totalAmount: 2478.56,
      paidAmount: 2478.56,
      paymentStatus: 'paid',
      specialRequests: 'Celebration bottle of vintage champagne on ice at arrival. Extra feather-free pillows.',
      estimatedArrival: '15:30',
      checkedInAt: `${yesterday}T15:45:00Z`,
      checkedOutAt: null,
      digitalKeyIssued: true,
      source: 'direct',
      createdAt: yesterday,
      updatedAt: now,
    },
    // Today's Arrival at Birchwood
    {
      id: 'res_birch_arrival_1',
      confirmationCode: 'LMN-BW-9402',
      propertyId: 'prop_birchwood',
      guestId: 'gst_marcus_sterling',
      roomTypeId: 'rt_birch_std',
      assignedRoomId: 'rm_birch_102',
      ratePlanId: 'rp_prop_birchwood_std',
      status: 'confirmed',
      checkInDate: today,
      checkOutDate: tomorrow,
      adultCount: 2,
      childCount: 0,
      totalNights: 1,
      nightlyRate: 380.0,
      taxAmount: 45.60,
      resortFee: 35.0,
      totalAmount: 460.60,
      paidAmount: 460.60,
      paymentStatus: 'authorized',
      specialRequests: 'High floor if possible, early ski equipment drop-off.',
      estimatedArrival: '16:00',
      checkedInAt: null,
      checkedOutAt: null,
      digitalKeyIssued: false,
      source: 'direct',
      createdAt: yesterday,
      updatedAt: now,
    },
    // Today's Departure at Birchwood
    {
      id: 'res_birch_depart_1',
      confirmationCode: 'LMN-BW-7731',
      propertyId: 'prop_birchwood',
      guestId: 'gst_david_chen',
      roomTypeId: 'rt_birch_std',
      assignedRoomId: 'rm_birch_104',
      ratePlanId: 'rp_prop_birchwood_nonref',
      status: 'checked_in',
      checkInDate: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      checkOutDate: today,
      adultCount: 1,
      childCount: 0,
      totalNights: 3,
      nightlyRate: 323.0,
      taxAmount: 116.28,
      resortFee: 105.0,
      totalAmount: 1190.28,
      paidAmount: 1190.28,
      paymentStatus: 'paid',
      specialRequests: 'Quiet room for business calls.',
      estimatedArrival: '14:00',
      checkedInAt: `${format(subDays(new Date(), 3), 'yyyy-MM-dd')}T14:15:00Z`,
      checkedOutAt: null,
      digitalKeyIssued: true,
      source: 'direct',
      createdAt: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
      updatedAt: now,
    },
    // Upcoming Ski Season Booking at Copperline Inn
    {
      id: 'res_cop_future_1',
      confirmationCode: 'LMN-CP-5520',
      propertyId: 'prop_copperline',
      guestId: 'gst_elena_rostova',
      roomTypeId: 'rt_cop_loft',
      assignedRoomId: 'rm_cop_201',
      ratePlanId: 'rp_prop_copperline_member',
      status: 'confirmed',
      checkInDate: in3Days,
      checkOutDate: in5Days,
      adultCount: 2,
      childCount: 0,
      totalNights: 2,
      nightlyRate: 351.0,
      taxAmount: 84.24,
      resortFee: 60.0,
      totalAmount: 846.24,
      paidAmount: 846.24,
      paymentStatus: 'authorized',
      specialRequests: 'Interested in fat-tire bike rentals on check-in day.',
      estimatedArrival: '15:00',
      checkedInAt: null,
      checkedOutAt: null,
      digitalKeyIssued: false,
      source: 'direct',
      createdAt: now,
      updatedAt: now,
    },
  ];

  db.reservations.insertMany(seededReservations);

  // Update room occupancy for checked-in rooms
  db.rooms.update('rm_birch_201', { isOccupied: true });
  db.rooms.update('rm_birch_104', { isOccupied: true });

  // 7. Folio Charges
  const seededFolioCharges: FolioCharge[] = [
    {
      id: 'fol_1',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'room_rate',
      description: 'Nightly Room Charge - Mountain View Suite (4 Nights)',
      amount: 2088.0,
      status: 'posted',
      postedBy: 'System Night Audit',
      createdAt: yesterday,
    },
    {
      id: 'fol_2',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'tax',
      description: 'State & Lodging Taxes (12%)',
      amount: 250.56,
      status: 'posted',
      postedBy: 'System Night Audit',
      createdAt: yesterday,
    },
    {
      id: 'fol_3',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'resort_fee',
      description: 'Historic Aspen Ski & Resort Fee',
      amount: 140.0,
      status: 'posted',
      postedBy: 'System Night Audit',
      createdAt: yesterday,
    },
    {
      id: 'fol_4',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'minibar',
      description: 'Domaine Serene Pinot Noir & Artisanal Truffles',
      amount: 115.0,
      status: 'posted',
      postedBy: 'Minibar Restock Staff',
      createdAt: `${yesterday}T20:30:00Z`,
    },
    {
      id: 'fol_5',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'dining',
      description: 'Courtyard Fireside Dining & Cocktails',
      amount: 184.50,
      status: 'posted',
      postedBy: 'Fireside POS Bridge',
      createdAt: `${yesterday}T21:45:00Z`,
    },
    {
      id: 'fol_6',
      reservationId: 'res_birch_inhouse_1',
      propertyId: 'prop_birchwood',
      category: 'payment',
      description: 'Initial Deposit Authorized (Square Token)',
      amount: -2478.56,
      status: 'paid',
      postedBy: 'Front Desk',
      paymentMethod: 'Credit Card (Square Token)',
      paymentRef: 'sq_auth_98129031',
      createdAt: yesterday,
    },
  ];
  db.folioCharges.insertMany(seededFolioCharges);

  // 8. Staff / Users
  const seededUsers: User[] = [
    {
      id: 'usr_marcus',
      email: 'marcus@lumenhospitality.co',
      name: 'Marcus Weil',
      role: 'owner',
      propertyId: null,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'en',
      createdAt: now,
    },
    {
      id: 'usr_gm_birchwood',
      email: 'gm.birchwood@lumenhospitality.co',
      name: 'Sarah Jenkins (GM)',
      role: 'gm',
      propertyId: 'prop_birchwood',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'en',
      createdAt: now,
    },
    {
      id: 'usr_fd_birchwood',
      email: 'frontdesk.birchwood@lumenhospitality.co',
      name: 'Liam Callahan (Front Desk)',
      role: 'front_desk',
      propertyId: 'prop_birchwood',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'en',
      createdAt: now,
    },
    {
      id: 'usr_hk_rosa',
      email: 'rosa.mendez@lumenhospitality.co',
      name: 'Rosa Mendez (Housekeeping Supervisor)',
      role: 'housekeeping',
      propertyId: 'prop_birchwood',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'es',
      createdAt: now,
    },
    {
      id: 'usr_maint_pete',
      email: 'pete.kovacs@lumenhospitality.co',
      name: 'Pete Kovacs (Lead Engineer)',
      role: 'maintenance',
      propertyId: 'prop_birchwood',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'en',
      createdAt: now,
    },
    {
      id: 'usr_rev_claire',
      email: 'claire.dubois@lumenhospitality.co',
      name: 'Claire Dubois (Revenue Manager)',
      role: 'revenue_manager',
      propertyId: null,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      preferredLanguage: 'en',
      createdAt: now,
    },
  ];
  db.users.insertMany(seededUsers);

  // 9. Maintenance Tickets (Capturing tribal knowledge from RFQ §3.3a)
  const seededTickets: MaintenanceTicket[] = [
    {
      id: 'tkt_1',
      propertyId: 'prop_birchwood',
      roomId: 'rm_birch_214',
      title: 'Radiator Valve Scheduled Bleeding (Room 214 Quirk)',
      description: 'Room 214 historic cast-iron radiator requires periodic bleeding to prevent whistling before weekend guest check-in.',
      priority: 'medium',
      status: 'open',
      category: 'HVAC / Heating',
      photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      reportedBy: 'Sarah Jenkins (GM)',
      assignedTo: 'Pete Kovacs (Lead Engineer)',
      notes: 'Use standard 1/8" brass bleeder key in engineer box. Bleed until steady heat stream.',
      resolvedAt: null,
      createdAt: now,
    },
    {
      id: 'tkt_2',
      propertyId: 'prop_birchwood',
      roomId: 'rm_birch_105',
      title: 'Antique Window Sash Inspection',
      description: 'Courtyard-facing antique window latch needs tightening before high-wind forecast.',
      priority: 'low',
      status: 'in_progress',
      category: 'Carpentry / Fixtures',
      photoUrl: null,
      reportedBy: 'Liam Callahan (Front Desk)',
      assignedTo: 'Pete Kovacs (Lead Engineer)',
      notes: null,
      resolvedAt: null,
      createdAt: yesterday,
    },
  ];
  db.maintenanceTickets.insertMany(seededTickets);

  // 10. Housekeeping Tasks
  const seededTasks: HousekeepingTask[] = [
    {
      id: 'tsk_1',
      propertyId: 'prop_birchwood',
      roomId: 'rm_birch_104',
      assignedTo: 'usr_hk_rosa',
      taskType: 'checkout_clean',
      status: 'pending',
      priority: 'vip',
      notes: 'Guest departing today at 11:00 AM. Next guest arriving 16:00.',
      completedAt: null,
      createdAt: now,
    },
    {
      id: 'tsk_2',
      propertyId: 'prop_birchwood',
      roomId: 'rm_birch_201',
      assignedTo: 'usr_hk_rosa',
      taskType: 'stayover',
      status: 'in_progress',
      priority: 'vip',
      notes: 'Alexandra Vance in-house VIP. Replenish sparkling water and fresh linens.',
      completedAt: null,
      createdAt: now,
    },
    {
      id: 'tsk_3',
      propertyId: 'prop_birchwood',
      roomId: 'rm_birch_102',
      assignedTo: 'usr_hk_rosa',
      taskType: 'touchup',
      status: 'completed',
      priority: 'normal',
      notes: 'Inspected for today 16:00 arrival Marcus Sterling.',
      completedAt: `${today}T10:30:00Z`,
      createdAt: yesterday,
    },
  ];
  db.housekeepingTasks.insertMany(seededTasks);

  console.log('Seeding completed successfully!');
}
