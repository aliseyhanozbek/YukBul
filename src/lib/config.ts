/**
 * Application Configuration
 * 
 * Centralized configuration management for environment variables.
 * This ensures secure and consistent access to configuration values.
 */

/**
 * Validates and returns Supabase URL from environment variables
 * @throws {Error} If VITE_SUPABASE_URL is missing or invalid
 */
export const getSupabaseUrl = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  
  if (!url) {
    throw new Error(
      'Missing VITE_SUPABASE_URL environment variable. ' +
      'Please check your .env.local file in the project root directory.'
    );
  }

  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(
      'Invalid Supabase URL format. ' +
      'URL should be: https://your-project.supabase.co'
    );
  }

  return url;
};

/**
 * Validates and returns Supabase anonymous key from environment variables
 * @throws {Error} If VITE_SUPABASE_ANON_KEY is missing or invalid
 */
export const getSupabaseAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!key) {
    throw new Error(
      'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
      'Please check your .env.local file in the project root directory.'
    );
  }

  if (key.length < 100) {
    console.warn(
      '⚠️ Supabase Anon Key seems too short. ' +
      'Typical anon keys are 200+ characters.'
    );
  }

  return key;
};

/**
 * Application configuration object
 */
export const config = {
  supabase: {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  },
} as const;

