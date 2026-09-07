import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { supabaseDb } from './supabaseDb.js';
import { getSupabaseClient } from './supabase.js';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private initialized = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public initialize(): void {
    if (this.initialized) return;

    const supabase = getSupabaseClient();
    if (!supabase || !config.isSupabaseConfigured) {
      logger.error('[DB] Supabase is not configured. Please check SUPABASE_URL and keys.');
      throw new Error('Supabase database configuration is required.');
    }

    logger.info('[DB] Connected to DB successfully (Supabase)');
    this.initialized = true;
  }
}

export const dbConnection = DatabaseConnection.getInstance();
export { supabaseDb as db };
export { getSupabaseClient, supabase } from './supabase.js';

