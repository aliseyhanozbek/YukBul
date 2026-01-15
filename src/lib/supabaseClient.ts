/**
 * Supabase Client
 * 
 * Centralized Supabase client instance for the application.
 * Uses configuration from lib/config.ts for secure environment variable access.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import type { Database } from '@/types/database.types';

/**
 * Supabase client instance
 * 
 * This is the main client used throughout the application for database operations.
 * It is configured with authentication persistence and automatic token refresh.
 */
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

