import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (config.isSupabaseConfigured) {
    try {
      supabaseClient = createClient(config.supabaseUrl, config.supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseClient;
    } catch (err) {
      logger.warn(`[Database] Failed to initialize client: ${err}`);
      return null;
    }
  }

  return null;
}

export const supabase = getSupabaseClient();
