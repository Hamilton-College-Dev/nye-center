import { supabase, supabaseConfigMessage } from '../lib/supabaseClient.js';

export function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigMessage || 'Supabase is not configured for the admin dashboard.');
  }

  return supabase;
}

export function getSupabaseConfigError() {
  return new Error(supabaseConfigMessage || 'Supabase is not configured for the admin dashboard.');
}
