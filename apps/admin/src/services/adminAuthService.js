import { isSupabaseConfigured } from '../lib/supabaseClient.js';
import { ensureSupabase, getSupabaseConfigError } from './supabaseService.js';

export async function signInAdmin(email, password) {
  if (!isSupabaseConfigured) {
    return { data: null, error: getSupabaseConfigError() };
  }
  return ensureSupabase().auth.signInWithPassword({ email, password });
}

export async function signOutAdmin() {
  if (!isSupabaseConfigured) return { error: null };
  return ensureSupabase().auth.signOut();
}

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await ensureSupabase().auth.getSession();
  return data.session ?? null;
}

export async function getAdminProfile() {
  if (!isSupabaseConfigured) return { profile: null, error: getSupabaseConfigError() };
  const client = ensureSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return { profile: null, error: userError };

  const { data, error } = await client
    .from('admin_profiles')
    .select('id,email,role,created_at,updated_at')
    .eq('id', userData.user.id)
    .eq('role', 'admin')
    .single();

  return { profile: data ?? null, error };
}
