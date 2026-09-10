import { getSupabaseClient } from './supabase.js';
import type {
  Property,
  RoomType,
  Room,
  RatePlan,
  Guest,
  Reservation,
  FolioCharge,
  User,
  UserStatus,
  MaintenanceTicket,
  HousekeepingTask,
  RoomStatus,
} from '../types/domain.types.js';

function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_KEY.');
  }
  return client;
}

// -----------------------------------------------------------------------------
// Mappers (PostgreSQL snake_case <-> TypeScript camelCase)
// -----------------------------------------------------------------------------
export function mapProperty(row: any): Property {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    phone: row.phone,
    email: row.email,
    heroImage: row.hero_image,
    description: row.description,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    lockType: row.lock_type,
    brandTheme: row.brand_theme,
    amenities: row.amenities || [],
    totalRooms: row.total_rooms || 0,
    createdAt: row.created_at,
  };
}

export function mapRoomType(row: any): RoomType {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    code: row.code,
    basePrice: typeof row.base_price === 'number' ? row.base_price : parseFloat(row.base_price || '0'),
    capacityAdults: row.capacity_adults,
    capacityChildren: row.capacity_children,
    bedConfiguration: row.bed_configuration,
    sizeSqFt: row.size_sq_ft,
    description: row.description,
    images: row.images || [],
    amenities: row.amenities || [],
    totalInventory: row.total_inventory,
  };
}

export function mapRoom(row: any): Room {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomTypeId: row.room_type_id,
    roomNumber: row.room_number,
    floor: row.floor,
    building: row.building,
    status: row.status,
    quirks: row.quirks,
    isOccupied: Boolean(row.is_occupied),
    features: row.features || [],
  };
}

export function mapRatePlan(row: any): RatePlan {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    code: row.code,
    description: row.description,
    priceModifier: typeof row.price_modifier === 'number' ? row.price_modifier : parseFloat(row.price_modifier || '1'),
    cancellationPolicy: row.cancellation_policy,
    includesBreakfast: Boolean(row.includes_breakfast),
    requiresLoyalty: Boolean(row.requires_loyalty),
    minLoyaltyTier: row.min_loyalty_tier,
    isPromo: Boolean(row.is_promo),
    promoCode: row.promo_code,
  };
}

export function mapGuest(row: any): Guest {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    state: row.state,
    country: row.country,
    loyaltyTier: row.loyalty_tier,
    loyaltyPoints: row.loyalty_points || 0,
    vipStatus: Boolean(row.vip_status),
    idDocumentType: row.id_document_type,
    idDocumentNumber: row.id_document_number,
    specialPreferences: row.special_preferences,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapUser(row: any): User {
  let status: UserStatus = row.status || 'active';
  let invitationToken = row.invitation_token || null;
  let invitationExpiresAt = row.invitation_expires_at || null;
  let invitedBy = row.invited_by || null;
  const passwordHash = row.password_hash || row.passwordHash || '';

  // Decode fallback encoding if columns aren't present in remote DB
  if (passwordHash && typeof passwordHash === 'string') {
    if (passwordHash.startsWith('INVITED:')) {
      status = 'invited';
      const parts = passwordHash.split(':');
      invitationToken = parts[1] || null;
      invitationExpiresAt = parts[2] || null;
      invitedBy = parts[3] || null;
    } else if (passwordHash.startsWith('SUSPENDED:')) {
      status = 'suspended';
    }
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash,
    name: row.name,
    role: row.role,
    status,
    propertyId: row.property_id || null,
    avatar: row.avatar,
    preferredLanguage: row.preferred_language || 'en',
    invitationToken,
    invitationExpiresAt,
    invitedBy,
    createdAt: row.created_at,
  };
}

export function mapReservation(row: any): Reservation {
  return {
    id: row.id,
    confirmationCode: row.confirmation_code,
    propertyId: row.property_id,
    guestId: row.guest_id,
    roomTypeId: row.room_type_id,
    assignedRoomId: row.assigned_room_id,
    ratePlanId: row.rate_plan_id,
    status: row.status,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    adultCount: row.adult_count ?? 1,
    childCount: row.child_count ?? 0,
    totalNights: row.total_nights ?? 1,
    nightlyRate: typeof row.nightly_rate === 'number' ? row.nightly_rate : parseFloat(row.nightly_rate || '0'),
    taxAmount: typeof row.tax_amount === 'number' ? row.tax_amount : parseFloat(row.tax_amount || '0'),
    resortFee: typeof row.resort_fee === 'number' ? row.resort_fee : parseFloat(row.resort_fee || '0'),
    totalAmount: typeof row.total_amount === 'number' ? row.total_amount : parseFloat(row.total_amount || '0'),
    paidAmount: typeof row.paid_amount === 'number' ? row.paid_amount : parseFloat(row.paid_amount || '0'),
    paymentStatus: row.payment_status,
    specialRequests: row.special_requests,
    estimatedArrival: row.estimated_arrival || '15:00',
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    digitalKeyIssued: Boolean(row.digital_key_issued),
    source: row.source || 'direct',
    channelCommissionRate: row.channel_commission_rate ?? row.channelCommissionRate ?? null,
    commissionAmount: row.commission_amount ?? row.commissionAmount ?? null,
    netReceivable: row.net_receivable ?? row.netReceivable ?? null,
    channelReservationId: row.channel_reservation_id ?? row.channelReservationId ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
  };
}

export function mapFolioCharge(row: any): FolioCharge {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    propertyId: row.property_id,
    category: row.category,
    description: row.description,
    amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount || '0'),
    status: row.status,
    postedBy: row.posted_by,
    paymentMethod: row.payment_method,
    paymentRef: row.payment_ref,
    createdAt: row.created_at,
  };
}

export function mapMaintenanceTicket(row: any): MaintenanceTicket {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    reportedBy: row.reported_by,
    assignedTo: row.assigned_to,
    notes: row.notes,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function mapHousekeepingTask(row: any): HousekeepingTask {
  return {
    id: row.id,
    propertyId: row.property_id,
    roomId: row.room_id,
    taskType: row.task_type,
    status: row.status,
    priority: row.priority,
    assignedTo: row.assigned_to,
    notes: row.notes,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

// -----------------------------------------------------------------------------
// Direct Supabase Database Service API
// -----------------------------------------------------------------------------
export const supabaseDb = {
  // Properties
  properties: {
    async find(): Promise<Property[]> {
      const { data, error } = await getClient().from('properties').select('*').order('name');
      if (error) throw error;
      return (data || []).map(mapProperty);
    },
    async findById(id: string): Promise<Property | null> {
      const { data, error } = await getClient().from('properties').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapProperty(data) : null;
    },
    async findBySlug(slug: string): Promise<Property | null> {
      const { data, error } = await getClient().from('properties').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data ? mapProperty(data) : null;
    },
  },

  // Room Types
  roomTypes: {
    async findByPropertyId(propertyId: string): Promise<RoomType[]> {
      const { data, error } = await getClient().from('room_types').select('*').eq('property_id', propertyId).order('base_price');
      if (error) throw error;
      return (data || []).map(mapRoomType);
    },
    async findById(id: string): Promise<RoomType | null> {
      const { data, error } = await getClient().from('room_types').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapRoomType(data) : null;
    },
  },

  // Rooms
  rooms: {
    async findByPropertyId(propertyId: string): Promise<Room[]> {
      const { data, error } = await getClient().from('rooms').select('*').eq('property_id', propertyId).order('room_number');
      if (error) throw error;
      return (data || []).map(mapRoom);
    },
    async findById(id: string): Promise<Room | null> {
      const { data, error } = await getClient().from('rooms').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapRoom(data) : null;
    },
    async update(id: string, updates: Partial<{ status: RoomStatus; quirks: string | null; isOccupied: boolean }>): Promise<Room | null> {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.quirks !== undefined) payload.quirks = updates.quirks;
      if (updates.isOccupied !== undefined) payload.is_occupied = updates.isOccupied;

      const { data, error } = await getClient().from('rooms').update(payload).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return data ? mapRoom(data) : null;
    },
  },

  // Rate Plans
  ratePlans: {
    async findByPropertyId(propertyId: string): Promise<RatePlan[]> {
      const { data, error } = await getClient().from('rate_plans').select('*').eq('property_id', propertyId);
      if (error) throw error;
      return (data || []).map(mapRatePlan);
    },
    async findById(id: string): Promise<RatePlan | null> {
      const { data, error } = await getClient().from('rate_plans').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapRatePlan(data) : null;
    },
  },

  // Users
  users: {
    async find(): Promise<User[]> {
      const { data, error } = await getClient().from('users').select('*').order('created_at');
      if (error) throw error;
      return (data || []).map(mapUser);
    },
    async findByEmail(email: string): Promise<User | null> {
      const { data, error } = await getClient()
        .from('users')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();
      if (error) throw error;
      return data ? mapUser(data) : null;
    },
    async findById(id: string): Promise<User | null> {
      const { data, error } = await getClient().from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapUser(data) : null;
    },
    async findByInvitationToken(token: string): Promise<User | null> {
      const cleanToken = token.trim();
      // 1. Try querying explicit invitation_token column
      try {
        const { data, error } = await getClient()
          .from('users')
          .select('*')
          .eq('invitation_token', cleanToken)
          .maybeSingle();
        if (!error && data) {
          return mapUser(data);
        }
      } catch {
        // column may not exist
      }

      // 2. Query encoded password_hash
      try {
        const { data, error } = await getClient()
          .from('users')
          .select('*')
          .like('password_hash', `INVITED:${cleanToken}:%`)
          .maybeSingle();
        if (!error && data) {
          return mapUser(data);
        }
      } catch {
        // fallback
      }

      // 3. Fallback to in-memory check across users
      const all = await this.find();
      return all.find((u) => u.invitationToken === cleanToken) || null;
    },
    async count(): Promise<number> {
      const { count, error } = await getClient().from('users').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    async insert(user: User): Promise<User> {
      const encodedPasswordHash =
        user.status === 'invited' && user.invitationToken
          ? `INVITED:${user.invitationToken}:${user.invitationExpiresAt || ''}:${user.invitedBy || ''}`
          : user.passwordHash || null;

      const payload: Record<string, any> = {
        id: user.id,
        email: user.email.toLowerCase(),
        password_hash: encodedPasswordHash,
        name: user.name,
        role: user.role,
        status: user.status || 'active',
        property_id: user.propertyId || null,
        avatar: user.avatar || null,
        preferred_language: user.preferredLanguage || 'en',
        created_at: user.createdAt || new Date().toISOString(),
      };
      if (user.invitationToken) payload.invitation_token = user.invitationToken;
      if (user.invitationExpiresAt) payload.invitation_expires_at = user.invitationExpiresAt;
      if (user.invitedBy) payload.invited_by = user.invitedBy;

      const { data, error } = await getClient().from('users').insert(payload).select('*').single();
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          const fallbackPayload = {
            id: user.id,
            email: user.email.toLowerCase(),
            password_hash: encodedPasswordHash,
            name: user.name,
            role: user.role,
            property_id: user.propertyId || null,
            avatar: user.avatar || null,
            preferred_language: user.preferredLanguage || 'en',
            created_at: user.createdAt || new Date().toISOString(),
          };
          const { data: fbData, error: fbError } = await getClient().from('users').insert(fallbackPayload).select('*').single();
          if (fbError) throw fbError;
          return mapUser(fbData);
        }
        throw error;
      }
      return mapUser(data);
    },
    async update(id: string, updates: Partial<User>): Promise<User> {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.role !== undefined) payload.role = updates.role;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.propertyId !== undefined) payload.property_id = updates.propertyId;
      if (updates.avatar !== undefined) payload.avatar = updates.avatar;
      if (updates.preferredLanguage !== undefined) payload.preferred_language = updates.preferredLanguage;
      if (updates.invitationToken !== undefined) payload.invitation_token = updates.invitationToken;
      if (updates.invitationExpiresAt !== undefined) payload.invitation_expires_at = updates.invitationExpiresAt;
      if (updates.invitedBy !== undefined) payload.invited_by = updates.invitedBy;

      if (updates.status === 'invited' && updates.invitationToken) {
        payload.password_hash = `INVITED:${updates.invitationToken}:${updates.invitationExpiresAt || ''}:${updates.invitedBy || ''}`;
      } else if (updates.status === 'suspended') {
        payload.password_hash = `SUSPENDED:${Date.now()}`;
      } else if (updates.passwordHash !== undefined) {
        payload.password_hash = updates.passwordHash;
      }

      const { data, error } = await getClient()
        .from('users')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          delete payload.status;
          delete payload.invitation_token;
          delete payload.invitation_expires_at;
          delete payload.invited_by;

          const { data: fbData, error: fbError } = await getClient()
            .from('users')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();
          if (fbError) throw fbError;
          return mapUser(fbData);
        }
        throw error;
      }
      return mapUser(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await getClient().from('users').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  },

  // Guests
  guests: {
    async find(): Promise<Guest[]> {
      const { data, error } = await getClient().from('guests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapGuest);
    },
    async findById(id: string): Promise<Guest | null> {
      const { data, error } = await getClient().from('guests').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapGuest(data) : null;
    },
    async findByEmail(email: string): Promise<Guest | null> {
      const { data, error } = await getClient()
        .from('guests')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();
      if (error) throw error;
      return data ? mapGuest(data) : null;
    },
    async insert(guest: Guest): Promise<Guest> {
      const payload = {
        id: guest.id,
        first_name: guest.firstName,
        last_name: guest.lastName,
        email: guest.email,
        phone: guest.phone,
        city: guest.city,
        state: guest.state,
        country: guest.country,
        loyalty_tier: guest.loyaltyTier,
        loyalty_points: guest.loyaltyPoints || 0,
        vip_status: Boolean(guest.vipStatus),
        id_document_type: guest.idDocumentType,
        id_document_number: guest.idDocumentNumber,
        special_preferences: guest.specialPreferences,
        notes: guest.notes,
        created_at: guest.createdAt || new Date().toISOString(),
      };
      const { data, error } = await getClient().from('guests').insert(payload).select('*').single();
      if (error) throw error;
      return mapGuest(data);
    },
    async update(id: string, updates: Partial<Guest>): Promise<Guest | null> {
      const payload: any = {};
      if (updates.firstName !== undefined) payload.first_name = updates.firstName;
      if (updates.lastName !== undefined) payload.last_name = updates.lastName;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.state !== undefined) payload.state = updates.state;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.loyaltyTier !== undefined) payload.loyalty_tier = updates.loyaltyTier;
      if (updates.loyaltyPoints !== undefined) payload.loyalty_points = updates.loyaltyPoints;
      if (updates.vipStatus !== undefined) payload.vip_status = updates.vipStatus;
      if (updates.idDocumentType !== undefined) payload.id_document_type = updates.idDocumentType;
      if (updates.idDocumentNumber !== undefined) payload.id_document_number = updates.idDocumentNumber;
      if (updates.specialPreferences !== undefined) payload.special_preferences = updates.specialPreferences;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      const { data, error } = await getClient().from('guests').update(payload).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return data ? mapGuest(data) : null;
    },
  },

  // Reservations
  reservations: {
    async findByPropertyId(propertyId: string): Promise<Reservation[]> {
      const { data, error } = await getClient()
        .from('reservations')
        .select('*')
        .eq('property_id', propertyId)
        .order('check_in_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapReservation);
    },
    async findByGuestId(guestId: string): Promise<Reservation[]> {
      const { data, error } = await getClient()
        .from('reservations')
        .select('*')
        .eq('guest_id', guestId)
        .order('check_in_date', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapReservation);
    },
    async findOverlapping(propertyId: string, roomTypeId: string, checkIn: string, checkOut: string): Promise<Reservation[]> {
      // Overlap logic: existing.check_in < requested.check_out AND existing.check_out > requested.check_in
      const { data, error } = await getClient()
        .from('reservations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('room_type_id', roomTypeId)
        .in('status', ['confirmed', 'checked_in'])
        .lt('check_in_date', checkOut)
        .gt('check_out_date', checkIn);
      if (error) throw error;
      return (data || []).map(mapReservation);
    },
    async findActiveByPropertyId(propertyId: string, dateStr: string): Promise<Reservation[]> {
      const { data, error } = await getClient()
        .from('reservations')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['confirmed', 'checked_in'])
        .lte('check_in_date', dateStr)
        .gte('check_out_date', dateStr);
      if (error) throw error;
      return (data || []).map(mapReservation);
    },
    async findById(id: string): Promise<Reservation | null> {
      const { data, error } = await getClient().from('reservations').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapReservation(data) : null;
    },
    async findByConfirmationCode(code: string): Promise<Reservation | null> {
      const { data, error } = await getClient()
        .from('reservations')
        .select('*')
        .ilike('confirmation_code', code.trim())
        .maybeSingle();
      if (error) throw error;
      return data ? mapReservation(data) : null;
    },
    async insert(res: Reservation): Promise<Reservation> {
      const payload = {
        id: res.id,
        confirmation_code: res.confirmationCode,
        property_id: res.propertyId,
        guest_id: res.guestId,
        room_type_id: res.roomTypeId,
        assigned_room_id: res.assignedRoomId || null,
        rate_plan_id: res.ratePlanId,
        status: res.status,
        check_in_date: res.checkInDate,
        check_out_date: res.checkOutDate,
        adult_count: res.adultCount,
        child_count: res.childCount,
        total_nights: res.totalNights,
        nightly_rate: res.nightlyRate,
        tax_amount: res.taxAmount,
        resort_fee: res.resortFee,
        total_amount: res.totalAmount,
        paid_amount: res.paidAmount,
        payment_status: res.paymentStatus,
        special_requests: res.specialRequests || null,
        estimated_arrival: res.estimatedArrival || '15:00',
        checked_in_at: res.checkedInAt || null,
        checked_out_at: res.checkedOutAt || null,
        digital_key_issued: Boolean(res.digitalKeyIssued),
        source: res.source || 'direct',
        channel_commission_rate: res.channelCommissionRate ?? null,
        commission_amount: res.commissionAmount ?? null,
        net_receivable: res.netReceivable ?? null,
        channel_reservation_id: res.channelReservationId ?? null,
        created_at: res.createdAt || new Date().toISOString(),
        updated_at: res.updatedAt || new Date().toISOString(),
      };
      const { data, error } = await getClient().from('reservations').insert(payload).select('*').single();
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          const fallbackPayload: any = { ...payload };
          delete fallbackPayload.channel_commission_rate;
          delete fallbackPayload.commission_amount;
          delete fallbackPayload.net_receivable;
          delete fallbackPayload.channel_reservation_id;
          const { data: fbData, error: fbError } = await getClient().from('reservations').insert(fallbackPayload).select('*').single();
          if (fbError) throw fbError;
          return mapReservation({ ...fbData, ...payload });
        }
        throw error;
      }
      return mapReservation(data);
    },
    async update(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.assignedRoomId !== undefined) payload.assigned_room_id = updates.assignedRoomId;
      if (updates.checkedInAt !== undefined) payload.checked_in_at = updates.checkedInAt;
      if (updates.checkedOutAt !== undefined) payload.checked_out_at = updates.checkedOutAt;
      if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
      if (updates.paidAmount !== undefined) payload.paid_amount = updates.paidAmount;

      const { data, error } = await getClient().from('reservations').update(payload).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return data ? mapReservation(data) : null;
    },
  },

  // Folio Charges
  folioCharges: {
    async findByReservationId(resId: string): Promise<FolioCharge[]> {
      const { data, error } = await getClient().from('folio_charges').select('*').eq('reservation_id', resId).order('created_at');
      if (error) throw error;
      return (data || []).map(mapFolioCharge);
    },
    async insert(charge: FolioCharge): Promise<FolioCharge> {
      const payload = {
        id: charge.id,
        reservation_id: charge.reservationId,
        property_id: charge.propertyId,
        category: charge.category,
        description: charge.description,
        amount: charge.amount,
        status: charge.status,
        posted_by: charge.postedBy,
        payment_method: charge.paymentMethod || null,
        payment_ref: charge.paymentRef || null,
        created_at: charge.createdAt || new Date().toISOString(),
      };
      const { data, error } = await getClient().from('folio_charges').insert(payload).select('*').single();
      if (error) throw error;
      return mapFolioCharge(data);
    },
  },

  // Maintenance Tickets
  maintenanceTickets: {
    async find(propertyId?: string): Promise<MaintenanceTicket[]> {
      let query = getClient().from('maintenance_tickets').select('*').order('created_at', { ascending: false });
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapMaintenanceTicket);
    },
    async findById(id: string): Promise<MaintenanceTicket | null> {
      const { data, error } = await getClient().from('maintenance_tickets').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapMaintenanceTicket(data) : null;
    },
    async insert(ticket: MaintenanceTicket): Promise<MaintenanceTicket> {
      const payload = {
        id: ticket.id,
        property_id: ticket.propertyId,
        room_id: ticket.roomId || null,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        reported_by: ticket.reportedBy,
        assigned_to: ticket.assignedTo || null,
        notes: ticket.notes || null,
        created_at: ticket.createdAt || new Date().toISOString(),
        resolved_at: ticket.resolvedAt || null,
      };
      const { data, error } = await getClient().from('maintenance_tickets').insert(payload).select('*').single();
      if (error) throw error;
      return mapMaintenanceTicket(data);
    },
    async update(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket | null> {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.resolvedAt !== undefined) payload.resolved_at = updates.resolvedAt;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;

      const { data, error } = await getClient().from('maintenance_tickets').update(payload).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return data ? mapMaintenanceTicket(data) : null;
    },
  },

  // Housekeeping Tasks
  housekeepingTasks: {
    async find(propertyId?: string): Promise<HousekeepingTask[]> {
      let query = getClient().from('housekeeping_tasks').select('*').order('created_at', { ascending: false });
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapHousekeepingTask);
    },
    async insert(task: HousekeepingTask): Promise<HousekeepingTask> {
      const payload = {
        id: task.id,
        property_id: task.propertyId,
        room_id: task.roomId,
        task_type: task.taskType,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assignedTo || null,
        notes: task.notes || null,
        created_at: task.createdAt || new Date().toISOString(),
        completed_at: task.completedAt || null,
      };
      const { data, error } = await getClient().from('housekeeping_tasks').insert(payload).select('*').single();
      if (error) throw error;
      return mapHousekeepingTask(data);
    },
  },
};
