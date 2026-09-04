-- ==============================================================================
-- LumenStay PostgreSQL Database Schema for Supabase (Native PostgreSQL ENUMs)
-- Run this script in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PostgreSQL ENUM Definitions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'owner',
      'gm',
      'front_desk',
      'housekeeping',
      'housekeeping_supervisor',
      'maintenance',
      'revenue_manager',
      'guest'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE room_status AS ENUM (
      'clean',
      'dirty',
      'inspected',
      'out_of_order'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reservation_status') THEN
    CREATE TYPE reservation_status AS ENUM (
      'confirmed',
      'checked_in',
      'checked_out',
      'cancelled',
      'no_show'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tier') THEN
    CREATE TYPE loyalty_tier AS ENUM (
      'member',
      'silver',
      'gold',
      'platinum'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lock_type') THEN
    CREATE TYPE lock_type AS ENUM (
      'salto',
      'assa_abloy'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM (
      'authorized',
      'paid',
      'refunded',
      'void'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'folio_category') THEN
    CREATE TYPE folio_category AS ENUM (
      'room_rate',
      'tax',
      'resort_fee',
      'minibar',
      'dining',
      'spa',
      'parking',
      'late_checkout',
      'adjustment',
      'payment'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'folio_status') THEN
    CREATE TYPE folio_status AS ENUM (
      'posted',
      'void',
      'paid'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'preferred_language') THEN
    CREATE TYPE preferred_language AS ENUM (
      'en',
      'es'
    );
  END IF;
END $$;

-- 3. Properties Table
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  hero_image TEXT NOT NULL,
  description TEXT NOT NULL,
  check_in_time TEXT NOT NULL DEFAULT '15:00',
  check_out_time TEXT NOT NULL DEFAULT '11:00',
  lock_type lock_type NOT NULL DEFAULT 'salto',
  brand_theme JSONB NOT NULL,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_rooms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Room Types Table
CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  capacity_adults INTEGER NOT NULL DEFAULT 2,
  capacity_children INTEGER NOT NULL DEFAULT 1,
  bed_configuration TEXT NOT NULL,
  size_sq_ft INTEGER NOT NULL,
  description TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_inventory INTEGER NOT NULL DEFAULT 1
);

-- 5. Rooms Table (Physical Rooms)
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  building TEXT NOT NULL DEFAULT 'Main Lodge',
  status room_status NOT NULL DEFAULT 'clean',
  quirks TEXT,
  is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB DEFAULT '[]'::jsonb
);

-- 6. Rate Plans Table
CREATE TABLE IF NOT EXISTS rate_plans (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  price_modifier NUMERIC(5, 3) NOT NULL DEFAULT 1.000,
  cancellation_policy TEXT NOT NULL,
  includes_breakfast BOOLEAN NOT NULL DEFAULT FALSE,
  requires_loyalty BOOLEAN NOT NULL DEFAULT FALSE,
  min_loyalty_tier loyalty_tier,
  is_promo BOOLEAN NOT NULL DEFAULT FALSE,
  promo_code TEXT
);

-- 7. Guests CRM Table
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  loyalty_tier loyalty_tier NOT NULL DEFAULT 'member',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  id_document_type TEXT,
  id_document_number TEXT,
  special_preferences JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  vip_status BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Staff & Guest Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  property_id TEXT REFERENCES properties(id),
  avatar TEXT,
  preferred_language preferred_language NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  confirmation_code TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES properties(id),
  guest_id TEXT NOT NULL REFERENCES guests(id),
  room_type_id TEXT NOT NULL REFERENCES room_types(id),
  assigned_room_id TEXT REFERENCES rooms(id),
  rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id),
  status reservation_status NOT NULL DEFAULT 'confirmed',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 1,
  child_count INTEGER NOT NULL DEFAULT 0,
  total_nights INTEGER NOT NULL DEFAULT 1,
  nightly_rate NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) NOT NULL,
  resort_fee NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'authorized',
  special_requests TEXT,
  estimated_arrival TEXT DEFAULT '15:00',
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  digital_key_issued BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'direct',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Folio Charges & Payments Table
CREATE TABLE IF NOT EXISTS folio_charges (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id),
  category folio_category NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status folio_status NOT NULL DEFAULT 'posted',
  posted_by TEXT NOT NULL DEFAULT 'System',
  payment_method TEXT,
  payment_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Maintenance Tickets Table
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  room_id TEXT REFERENCES rooms(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'General',
  photo_url TEXT,
  reported_by TEXT NOT NULL,
  assigned_to TEXT,
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Housekeeping Tasks Table
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  assigned_to TEXT REFERENCES users(id),
  task_type TEXT NOT NULL DEFAULT 'checkout_clean',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Indexes for High Performance Querying
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_supa_res_dates ON reservations (property_id, room_type_id, status, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_supa_rooms_prop ON rooms (property_id, room_type_id, status);
CREATE INDEX IF NOT EXISTS idx_supa_folio_res ON folio_charges (reservation_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;

-- Service Role Full Access
CREATE POLICY "Service Role Properties" ON properties USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Room Types" ON room_types USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Rooms" ON rooms USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Rate Plans" ON rate_plans USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Guests" ON guests USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Users" ON users USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Reservations" ON reservations USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Folio Charges" ON folio_charges USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Maintenance" ON maintenance_tickets USING (true) WITH CHECK (true);
CREATE POLICY "Service Role Housekeeping" ON housekeeping_tasks USING (true) WITH CHECK (true);
