import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
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

export interface DatabaseSchema {
  properties: Property[];
  roomTypes: RoomType[];
  rooms: Room[];
  ratePlans: RatePlan[];
  guests: Guest[];
  reservations: Reservation[];
  folioCharges: FolioCharge[];
  users: User[];
  maintenanceTickets: MaintenanceTicket[];
  housekeepingTasks: HousekeepingTask[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateFiles = [
  path.resolve(__dirname, '..', 'data', 'lumenstay_db.json'),
  path.resolve(__dirname, 'data', 'lumenstay_db.json'),
  path.resolve(process.cwd(), 'server', 'data', 'lumenstay_db.json'),
  path.resolve(process.cwd(), 'data', 'lumenstay_db.json'),
  path.resolve(process.cwd(), 'lumenstay_db.json'),
];

let dbFile = candidateFiles.find(f => fs.existsSync(f)) || path.resolve(__dirname, '..', 'data', 'lumenstay_db.json');
const dbDir = path.dirname(dbFile);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let inMemoryData: DatabaseSchema = {
  properties: [],
  roomTypes: [],
  rooms: [],
  ratePlans: [],
  guests: [],
  reservations: [],
  folioCharges: [],
  users: [],
  maintenanceTickets: [],
  housekeepingTasks: [],
};

export function loadDatabase(): DatabaseSchema {
  if (fs.existsSync(dbFile)) {
    try {
      const raw = fs.readFileSync(dbFile, 'utf-8');
      const parsed = JSON.parse(raw);
      // Deduplicate each collection by unique id
      const dedup = <T extends { id: string }>(arr: T[] = []): T[] => {
        const seen = new Set<string>();
        return arr.filter(item => {
          if (!item?.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      };
      inMemoryData = {
        properties: dedup(parsed.properties),
        roomTypes: dedup(parsed.roomTypes),
        rooms: dedup(parsed.rooms),
        ratePlans: dedup(parsed.ratePlans),
        guests: dedup(parsed.guests),
        reservations: dedup(parsed.reservations),
        folioCharges: dedup(parsed.folioCharges),
        users: dedup(parsed.users),
        maintenanceTickets: dedup(parsed.maintenanceTickets),
        housekeepingTasks: dedup(parsed.housekeepingTasks),
      };
      console.log(`[DB] Loaded database from ${dbFile} with ${inMemoryData.users.length} users and ${inMemoryData.properties.length} properties`);
    } catch (e) {
      console.error('Error loading database file, initializing empty schema:', e);
    }
  } else {
    console.warn(`[DB] Database file not found at ${dbFile}.`);
  }

  // Self-healing fallback: If users collection is missing/empty, seed the standard demo accounts with password "123456"
  if (inMemoryData.users.length === 0) {
    console.warn('[DB] No users found in database. Auto-seeding standard accounts with password "123456"...');
    const defaultHash = bcrypt.hashSync('123456', 10);
    const now = new Date().toISOString();
    inMemoryData.users = [
      { id: 'usr_owner', email: 'owner@lumenstay.com', passwordHash: defaultHash, name: 'Marcus Weil (Owner)', role: 'owner', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_gm', email: 'gm@lumenstay.com', passwordHash: defaultHash, name: 'Sarah Jenkins (General Manager)', role: 'gm', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_frontdesk', email: 'frontdesk@lumenstay.com', passwordHash: defaultHash, name: 'Liam Callahan (Front Desk)', role: 'front_desk', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_supervisor', email: 'supervisor@lumenstay.com', passwordHash: defaultHash, name: 'Rosa Mendez (HK Supervisor)', role: 'housekeeping_supervisor', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_housekeeper', email: 'housekeeper@lumenstay.com', passwordHash: defaultHash, name: 'Elena Ramos (Room Attendant)', role: 'housekeeping', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_maintenance', email: 'maintenance@lumenstay.com', passwordHash: defaultHash, name: 'Pete Kovacs (Lead Engineer)', role: 'maintenance', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_revenue', email: 'revenue@lumenstay.com', passwordHash: defaultHash, name: 'Claire Dubois (Revenue Manager)', role: 'revenue_manager', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
      { id: 'usr_guest', email: 'guest@lumenstay.com', passwordHash: defaultHash, name: 'Alexandra Vance (Guest)', role: 'guest', propertyId: 'prop_birchwood', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', preferredLanguage: 'en', createdAt: now },
    ];
    saveDatabase();
  }

  return inMemoryData;
}

export function saveDatabase(): void {
  // Guard against overwriting an existing populated DB file with an empty schema
  if (inMemoryData.properties.length === 0 && fs.existsSync(dbFile)) {
    try {
      const existing = fs.readFileSync(dbFile, 'utf-8');
      if (existing.length > 1000) {
        console.warn('[DB] Guard prevented saving empty properties over populated database file.');
        return;
      }
    } catch {}
  }

  try {
    fs.writeFileSync(dbFile, JSON.stringify(inMemoryData, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving database to file:', e);
  }
}

// Collection helper class providing typed query methods
export class Collection<T extends { id: string }> {
  constructor(private getKey: () => keyof DatabaseSchema) {}

  private get items(): T[] {
    return inMemoryData[this.getKey()] as unknown as T[];
  }

  find(predicate?: (item: T) => boolean): T[] {
    if (!predicate) return [...this.items];
    return this.items.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  insert(item: T): T {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      this.items[idx] = item;
    } else {
      this.items.push(item);
    }
    saveDatabase();
    return item;
  }

  insertMany(newItems: T[]): T[] {
    for (const item of newItems) {
      const idx = this.items.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        this.items[idx] = item;
      } else {
        this.items.push(item);
      }
    }
    saveDatabase();
    return newItems;
  }

  update(id: string, updates: Partial<T>): T | undefined {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    this.items[idx] = { ...this.items[idx], ...updates };
    saveDatabase();
    return this.items[idx];
  }

  delete(id: string): boolean {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    saveDatabase();
    return true;
  }

  count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.items.length;
    return this.items.filter(predicate).length;
  }

  clear(): void {
    const key = this.getKey();
    (inMemoryData[key] as unknown as T[]) = [];
    saveDatabase();
  }
}

// Initialize and export typed DB collections
loadDatabase();

export const db = {
  properties: new Collection<Property>(() => 'properties'),
  roomTypes: new Collection<RoomType>(() => 'roomTypes'),
  rooms: new Collection<Room>(() => 'rooms'),
  ratePlans: new Collection<RatePlan>(() => 'ratePlans'),
  guests: new Collection<Guest>(() => 'guests'),
  reservations: new Collection<Reservation>(() => 'reservations'),
  folioCharges: new Collection<FolioCharge>(() => 'folioCharges'),
  users: new Collection<User>(() => 'users'),
  maintenanceTickets: new Collection<MaintenanceTicket>(() => 'maintenanceTickets'),
  housekeepingTasks: new Collection<HousekeepingTask>(() => 'housekeepingTasks'),
  raw: inMemoryData,
  save: saveDatabase,
  reload: loadDatabase,
};
