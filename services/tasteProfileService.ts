/**
 * Taste Profile Service
 *
 * Reads/writes the user's taste profile (food, music, drinks, activities,
 * venue style, budget, home city) to the Supabase user_preferences table.
 */

import { supabase } from '@/lib/supabase';
import { TasteProfile, emptyTasteProfile } from '@/types/planner';

interface TasteProfileRow {
  travel_style: string | null;
  food_loves: string[] | null;
  food_dislikes: string[] | null;
  activity_loves: string[] | null;
  activity_dislikes: string[] | null;
  music_genres: string[] | null;
  drinks: string[] | null;
  venue_style: string | null;
  date_budget: number | null;
  home_city: string | null;
}

function rowToProfile(row: TasteProfileRow): TasteProfile {
  return {
    planFor: row.travel_style,
    foodLoves: row.food_loves ?? [],
    foodDislikes: row.food_dislikes ?? [],
    activityLoves: row.activity_loves ?? [],
    activityDislikes: row.activity_dislikes ?? [],
    musicGenres: row.music_genres ?? [],
    drinks: row.drinks ?? [],
    venueStyle: (row.venue_style as TasteProfile['venueStyle']) ?? 'both',
    dateBudget: row.date_budget ?? 150,
    homeCity: row.home_city ?? '',
  };
}

function profileToRow(profile: TasteProfile) {
  return {
    travel_style: profile.planFor,
    food_loves: profile.foodLoves,
    food_dislikes: profile.foodDislikes,
    activity_loves: profile.activityLoves,
    activity_dislikes: profile.activityDislikes,
    music_genres: profile.musicGenres,
    drinks: profile.drinks,
    venue_style: profile.venueStyle,
    date_budget: profile.dateBudget,
    home_city: profile.homeCity || null,
    updated_at: new Date().toISOString(),
  };
}

export async function getTasteProfile(): Promise<TasteProfile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return emptyTasteProfile;

  const { data, error } = await supabase
    .from('user_preferences')
    .select(
      'travel_style, food_loves, food_dislikes, activity_loves, activity_dislikes, music_genres, drinks, venue_style, date_budget, home_city'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load taste profile: ${error.message}`);
  return data ? rowToProfile(data as TasteProfileRow) : emptyTasteProfile;
}

export async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: user.id, ...profileToRow(profile) }, { onConflict: 'user_id' });

  if (error) throw new Error(`Failed to save taste profile: ${error.message}`);
}
