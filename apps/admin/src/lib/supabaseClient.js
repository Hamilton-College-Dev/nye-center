import { createClient } from '@supabase/supabase-js';

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);
export const supabaseConfigMessage = getSupabaseConfigMessage();

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabasePublicKey) : null;

function normalizeSupabaseUrl(url) {
  if (!url) return '';
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/$/, '');
}

function getSupabaseConfigMessage() {
  const missing = [
    supabaseUrl ? null : 'VITE_SUPABASE_URL',
    supabasePublicKey ? null : 'VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean);

  if (!missing.length) return '';
  return `Supabase is not configured. Missing ${missing.join(' and ')} in apps/admin/.env.local.`;
}
