import { ensureSupabase } from './supabaseService.js';

export async function importLatestLitsEvents() {
  try {
    const { data, error } = await ensureSupabase().functions.invoke('import-lits-events', {
      body: {},
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function listUnreviewedEventImportChanges() {
  try {
    const { data, error } = await ensureSupabase()
      .from('event_import_changes')
      .select('*')
      .is('reviewed_at', null)
      .order('detected_at', { ascending: false });
    return { data: data ?? [], error };
  } catch (error) {
    return { data: [], error };
  }
}

export async function reviewEventImportChanges(ids) {
  const reviewedIds = [...new Set((ids ?? []).filter(Boolean))];
  if (!reviewedIds.length) return { data: [], error: null };

  try {
    const { data, error } = await ensureSupabase()
      .from('event_import_changes')
      .update({ reviewed_at: new Date().toISOString() })
      .in('id', reviewedIds)
      .select('id');
    return { data: data ?? [], error };
  } catch (error) {
    return { data: [], error };
  }
}
