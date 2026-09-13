import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if real Supabase cloud credentials are configured
export const isLiveSupabaseConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('mock-supabase') && 
  !supabaseAnonKey.includes('mock-anon-key');

export const supabase = createClient(
  supabaseUrl || 'https://mock-supabase.watchearn.internal',
  supabaseAnonKey || 'mock-anon-key-watchearn-local-2026',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
