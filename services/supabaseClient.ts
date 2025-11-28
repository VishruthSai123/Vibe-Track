
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables that works in both Node.js and Browser (Vite/Create-React-App)
const getEnv = (key: string, viteKey: string) => {
  // Check process.env (Standard Node/Next.js)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) { /* ignore */ }

  // Check import.meta.env (Vite)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
  } catch (e) { /* ignore */ }

  return null;
};

// --- CONFIGURATION ---
const PROVIDED_URL = 'https://ameajewlalyhuzzxywgm.supabase.co';
const PROVIDED_KEY = 'sb_publishable_OQEIk7bRhku148LTORu5uQ_ic7t9eov';

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL') || PROVIDED_URL;
const SUPABASE_ANON_KEY = getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'VITE_SUPABASE_ANON_KEY') || PROVIDED_KEY;

// Verify if we have a valid configuration
export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_URL.includes('supabase.co') && SUPABASE_ANON_KEY);

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
