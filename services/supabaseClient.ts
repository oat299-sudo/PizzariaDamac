
import { createClient } from '@supabase/supabase-js';

// These environment variables must be set in your .env file or Netlify settings
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Key is missing! Database features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
