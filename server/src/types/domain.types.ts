export type RoomStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';
export type ReservationStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type UserRole = 'owner' | 'gm' | 'front_desk' | 'housekeeping' | 'housekeeping_supervisor' | 'maintenance' | 'revenue_manager' | 'guest';
export type LoyaltyTier = 'member' | 'silver' | 'gold' | 'platinum';
export type LockType = 'salto' | 'assa_abloy';

export interface PropertyBrandTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentHover: string;
  surface: string;
  surfaceSubtle: string;
  surfaceDark: string;
  headingFont: string;
  bodyFont: string;
  mood: string;
  tagline: string;
  heroBadge: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  heroImage: string;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  lockType: LockType;
  brandTheme: PropertyBrandTheme;
  amenities: string[];
  totalRooms: number;
  createdAt: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  basePrice: number;
  capacityAdults: number;
  capacityChildren: number;
  bedConfiguration: string;
  sizeSqFt: number;
  description: string;
  images: string[];
  amenities: string[];
  totalInventory: number;
}

export interface Room {
  id: string;
  propertyId: string;
  roomTypeId: string;
  roomNumber: string;
  floor: number;
  building: string;
  status: RoomStatus;
  quirks?: string | null;
  isOccupied: boolean;
  features: string[];
}

export interface RatePlan {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  description: string;
  priceModifier: number;
  cancellationPolicy: string;
  includesBreakfast: boolean;
  requiresLoyalty: boolean;
  minLoyaltyTier?: LoyaltyTier | null;
  isPromo: boolean;
  promoCode?: string | null;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  loyaltyTier: LoyaltyTier;
  loyaltyPoints: number;
  totalStays?: number;
  totalSpend?: number;
  idDocumentType?: string | null;
  idDocumentNumber?: string | null;
  specialPreferences?: string | null;
  notes?: string | null;
  vipStatus: boolean;
  createdAt: string;
}

export interface Reservation {
  id: string;
  confirmationCode: string;
  propertyId: string;
  guestId: string;
  roomTypeId: string;
  assignedRoomId?: string | null;
  ratePlanId: string;
  status: ReservationStatus;
  checkInDate: string;
  checkOutDate: string;
  adultCount: number;
  childCount: number;
  totalNights: number;
  nightlyRate: number;
  taxAmount: number;
  resortFee: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'refunded';
  specialRequests?: string | null;
  estimatedArrival: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  digitalKeyIssued: boolean;
  source: 'direct' | 'expedia' | 'booking_com' | 'airbnb' | 'google_hotel';
  createdAt: string;
  updatedAt: string;
}

export interface FolioCharge {
  id: string;
  reservationId: string;
  propertyId: string;
  category: 'room_rate' | 'tax' | 'resort_fee' | 'dining' | 'minibar' | 'parking' | 'spa' | 'late_checkout' | 'adjustment' | 'payment';
  description: string;
  amount: number;
  status: 'posted' | 'void' | 'paid';
  postedBy: string;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  createdAt: string;
}

export type UserStatus = 'active' | 'invited' | 'suspended';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  propertyId?: string | null;
  avatar?: string | null;
  preferredLanguage: 'en' | 'es';
  invitationToken?: string | null;
  invitationExpiresAt?: string | null;
  invitedBy?: string | null;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  propertyId: string;
  roomId?: string | null;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  photoUrl?: string | null;
  reportedBy: string;
  assignedTo?: string | null;
  notes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface HousekeepingTask {
  id: string;
  propertyId: string;
  roomId: string;
  assignedTo?: string | null;
  taskType: 'stayover' | 'checkout_clean' | 'deep_clean' | 'turndown' | 'touchup';
  status: 'pending' | 'in_progress' | 'completed' | 'inspected';
  priority: 'normal' | 'vip' | 'rush';
  notes?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface BookingSearchQuery {
  propertyId?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  promoCode?: string;
}

export interface RoomAvailabilityResult {
  roomType: RoomType;
  availableCount: number;
  totalInventory: number;
  nightlyRates: {
    ratePlan: RatePlan;
    calculatedNightlyPrice: number;
    calculatedTotalPrice: number;
    taxAmount: number;
    resortFee: number;
    grandTotal: number;
  }[];
}

export interface FolioSummary {
  reservationId: string;
  confirmationCode: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  propertyName?: string;
  propertyAddress?: string;
  propertyPhone?: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  charges: FolioCharge[];
  totalCharges: number;
  totalPayments: number;
  balanceDue: number;
  status: 'open' | 'settled' | 'overdue';
}
