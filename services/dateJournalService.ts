/**
 * Date Journal Service
 *
 * One journal entry per plan: a 1-5 rating, an optional note, and photos
 * stored in the date-photos bucket under the user's own folder.
 */

import { supabase } from '@/lib/supabase';
import { Json } from '@/lib/database.types';

export interface JournalEntry {
  id: string;
  planId: string;
  rating: number;
  note: string | null;
  photoUrls: string[];
  entryDate: string | null;
  createdAt: string;
}

/** A journal entry joined with the plan it belongs to, for the timeline. */
export interface JournalTimelineItem extends JournalEntry {
  planTitle: string;
  planCity: string;
  planVibe: string | null;
}

interface JournalRow {
  id: string;
  plan_id: string;
  rating: number;
  note: string | null;
  photo_urls: Json;
  entry_date: string | null;
  created_at: string;
}

function rowToEntry(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    planId: row.plan_id,
    rating: row.rating,
    note: row.note,
    photoUrls: Array.isArray(row.photo_urls) ? (row.photo_urls as string[]) : [],
    entryDate: row.entry_date,
    createdAt: row.created_at,
  };
}

export async function getEntryForPlan(planId: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('date_journal_entries')
    .select('*')
    .eq('plan_id', planId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load journal entry: ${error.message}`);
  return data ? rowToEntry(data as JournalRow) : null;
}

export async function saveEntry(params: {
  planId: string;
  rating: number;
  note: string | null;
  photoUrls: string[];
  entryDate: string | null;
}): Promise<JournalEntry> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('date_journal_entries')
    .upsert(
      {
        user_id: user.id,
        plan_id: params.planId,
        rating: params.rating,
        note: params.note,
        photo_urls: params.photoUrls as unknown as Json,
        entry_date: params.entryDate,
      },
      { onConflict: 'plan_id' }
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save journal entry: ${error.message}`);
  return rowToEntry(data as JournalRow);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('date_journal_entries').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete journal entry: ${error.message}`);
}

/** Timeline of past dates, newest first. */
export async function listJournal(): Promise<JournalTimelineItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('date_journal_entries')
    .select('*, date_plans(title, city, vibe)')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load journal: ${error.message}`);
  return (data ?? []).map((row) => {
    const plan = row.date_plans as { title: string; city: string; vibe: string | null } | null;
    return {
      ...rowToEntry(row as unknown as JournalRow),
      planTitle: plan?.title ?? 'A date',
      planCity: plan?.city ?? '',
      planVibe: plan?.vibe ?? null,
    };
  });
}

/** Upload one photo and return its public URL. */
export async function uploadJournalPhoto(planId: string, localUri: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const response = await fetch(localUri);
  const fileBody = await response.arrayBuffer();
  const path = `${user.id}/${planId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.jpg`;
  const { error } = await supabase.storage
    .from('date-photos')
    .upload(path, fileBody, { contentType: 'image/jpeg' });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from('date-photos').getPublicUrl(path).data.publicUrl;
}
