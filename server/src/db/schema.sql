-- LumenStay Relational SQLite Database Schema
-- Standard lowercase snake_case plural table names per AGENTS.md §2 & §6

PRAGMA foreign_keys = ON;

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
  lock_type TEXT NOT NULL DEFAULT 'salto',
  brand_theme TEXT NOT NULL,
  amenities TEXT NOT NULL DEFAULT '[]',
  total_rooms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room_types (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  base_price REAL NOT NULL,
  capacity_adults INTEGER NOT NULL DEFAULT 2,
  capacity_children INTEGER NOT NULL DEFAULT 1,
  bed_configuration TEXT NOT NULL,
  size_sq_ft INTEGER NOT NULL,
  description TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',
  amenities TEXT NOT NULL DEFAULT '[]',
  total_inventory INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id TEXT NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  building TEXT NOT NULL DEFAULT 'Main Lodge',
  status TEXT NOT NULL DEFAULT 'clean',
  quirks TEXT,
  is_occupied INTEGER NOT NULL DEFAULT 0,
  features TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS rate_plans (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  price_modifier REAL NOT NULL DEFAULT 1.0,
  cancellation_policy TEXT NOT NULL,
  includes_breakfast INTEGER NOT NULL DEFAULT 0,
  requires_loyalty INTEGER NOT NULL DEFAULT 0,
  min_loyalty_tier TEXT,
  is_promo INTEGER NOT NULL DEFAULT 0,
  promo_code TEXT
);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  loyalty_tier TEXT NOT NULL DEFAULT 'member',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  id_document_type TEXT,
  id_document_number TEXT,
  special_preferences TEXT,
  notes TEXT,
  vip_status INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  confirmation_code TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES properties(id),
  guest_id TEXT NOT NULL REFERENCES guests(id),
  room_type_id TEXT NOT NULL REFERENCES room_types(id),
  assigned_room_id TEXT REFERENCES rooms(id),
  rate_plan_id TEXT NOT NULL REFERENCES rate_plans(id),
  status TEXT NOT NULL DEFAULT 'confirmed',
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  adult_count INTEGER NOT NULL DEFAULT 2,
  child_count INTEGER NOT NULL DEFAULT 0,
  total_nights INTEGER NOT NULL DEFAULT 1,
  nightly_rate REAL NOT NULL,
  tax_amount REAL NOT NULL DEFAULT 0,
  resort_fee REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'authorized',
  special_requests TEXT,
  estimated_arrival TEXT DEFAULT '15:00',
  checked_in_at TEXT,
  checked_out_at TEXT,
  digital_key_issued INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'direct',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folio_charges (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted',
  posted_by TEXT NOT NULL DEFAULT 'System',
  payment_method TEXT,
  payment_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  property_id TEXT REFERENCES properties(id),
  avatar TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  invitation_token TEXT,
  invitation_expires_at TEXT,
  invited_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL
);

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
  resolved_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  assigned_to TEXT REFERENCES users(id),
  task_type TEXT NOT NULL DEFAULT 'checkout_clean',
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations (property_id, room_type_id, status, check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms (property_id, room_type_id, status);
CREATE INDEX IF NOT EXISTS idx_folio_res ON folio_charges (reservation_id);
