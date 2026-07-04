
import { createClient } from '@supabase/supabase-js';

// =================================================================
// 🔐 DATABASE KEYS
// =================================================================

// Ideally, these are in a .env file, but for quick setup, we can use them here.
// It is SAFE to use the ANON key in the client-side code.
const MANUAL_URL = "";
const MANUAL_KEY = "";

let supabaseUrl = MANUAL_URL;
let supabaseAnonKey = MANUAL_KEY;

try {
  // Safely attempt to read Vite environment variables if they exist
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Only override manual keys if env vars are actually set and not empty
    if (envUrl) supabaseUrl = envUrl;
    if (envKey) supabaseAnonKey = envKey;
  }
} catch (e) {
  console.warn("Environment variables check failed. Using manual keys.", e);
}

// =================================================================

// Check if keys are configured
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn("⚠️ SUPABASE KEYS MISSING: App running in OFFLINE/MOCK mode.");
}

// Initialize Supabase
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : {} as any;
