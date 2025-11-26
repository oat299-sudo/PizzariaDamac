
import { createClient } from '@supabase/supabase-js';

// SAFE INITIALIZATION
// We check if the keys exist. If not, we use "dummy" values so the app doesn't crash on boot.
// The app will open, but database requests will fail gracefully until you add the keys in Netlify.

const getEnvVar = (key: string) => {
  try {
    return (import.meta as any).env[key];
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("⚠️ SUPABASE KEYS MISSING: App is running in safe mode. Database features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
