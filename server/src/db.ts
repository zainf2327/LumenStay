import fs from 'fs';
import path from 'path';
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

const dbDir = fs.existsSync(path.resolve(process.cwd(), 'server', 'data'))
  ? path.resolve(process.cwd(), 'server', 'data')
  : fs.existsSync(path.resolve(process.cwd(), 'data'))
  ? path.resolve(process.cwd(), 'data')
  : path.resolve(__dirname, '..', 'data');
const dbFile = path.resolve(dbDir, 'lumenstay_db.json');

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
      saveDatabase();
    } catch (e) {
      console.error('Error loading database file, initializing empty schema:', e);
    }
  }
  return inMemoryData;
}

export function saveDatabase(): void {
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
