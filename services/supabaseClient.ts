import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env for environment variables
// Using type assertion to bypass "Property 'env' does not exist on type 'ImportMeta'" error
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // We log a warning but don't crash, allowing the app to load (albeit without data)
  console.warn("Supabase URL or Key is missing! Check your .env file or Netlify settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);