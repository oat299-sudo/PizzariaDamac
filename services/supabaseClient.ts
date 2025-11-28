
import { createClient } from '@supabase/supabase-js';

// =================================================================
// 🔐 DATABASE KEYS
// =================================================================

// Keys are loaded from environment variables for security.
// Local: Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// Netlify: Add these in Site configuration > Environment variables

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// =================================================================

// Check if keys are configured
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn("⚠️ SUPABASE KEYS MISSING: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables (.env file or Netlify settings).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
