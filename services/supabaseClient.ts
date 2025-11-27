
import { createClient } from '@supabase/supabase-js';

// =================================================================
// 🔐 DATABASE KEYS
// =================================================================

const supabaseUrl = 'https://oblfdztwgjtsygbvigkk.supabase.co'; 

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibGZkenR3Z2p0c3lnYnZpZ2trIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzIyMTQsImV4cCI6MjA3OTc0ODIxNH0.YO5W9W67mCb6ow2HCM6n_vyvoZQdIsEC8artXy4Xsic';

// =================================================================

// Check if keys are configured
const isPlaceholder = supabaseUrl.includes('PASTE_YOUR') || supabaseAnonKey.includes('PASTE_YOUR');
export const isSupabaseConfigured = !isPlaceholder && supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn("⚠️ SUPABASE KEYS MISSING: Please edit services/supabaseClient.ts and paste your real keys inside the quotes.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
