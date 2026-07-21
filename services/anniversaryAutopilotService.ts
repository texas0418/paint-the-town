/**
 * Anniversary autopilot (v1 — on-device)
 *
 * Anniversaries live in Supabase (durable, and ready for the future
 * server-side version), but the nudges are yearly local notifications —
 * same zero-infrastructure approach as the date night reminder:
 *  - 14 days before: time to plan something special
 *  - 2 days before: gentle nudge if they haven't yet
 * Both deep-link into the planner with the Anniversary vibe preselected.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Anniversary {
  id: string;
  title: string;
  /** ISO date of the original occasion, e.g. "2019-08-14" */
  anniversaryDate: string;
}

/** Maps anniversary id → scheduled local notification ids (device-local). */
const SCHEDULE_KEY = 'w4nder:anniversaryNotifications';

export async function listAnniversaries(): Promise<Anniversary[]> {
  const { data, error } = await supabase
    .from('anniversaries')
    .select('id, title, anniversary_date')
    .order('anniversary_date');
  if (error) throw new Error(`Could not load anniversaries: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    anniversaryDate: r.anniversary_date,
  }));
}

export async function addAnniversary(title: string, anniversaryDate: string): Promise<Anniversary> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('anniversaries')
    .insert({ user_id: user.id, title, anniversary_date: anniversaryDate })
    .select('id, title, anniversary_date')
    .single();
  if (error || !data) throw new Error(`Could not save: ${error?.message}`);
  const saved = { id: data.id, title: data.title, anniversaryDate: data.anniversary_date };
  await scheduleAnniversaryNudges(saved).catch(() => {}); // permission may be denied — row still saved
  return saved;
}

export async function deleteAnniversary(id: string): Promise<void> {
  const { error } = await supabase.from('anniversaries').delete().eq('id', id);
  if (error) throw new Error(`Could not delete: ${error.message}`);
  await cancelAnniversaryNudges(id).catch(() => {});
}

/** month/day of the nudge that fires N days before the given month/day, yearly. */
function nudgeDay(month: number, day: number, daysBefore: number): { month: number; day: number } {
  // Anchor on a non-leap year so Feb 29 anniversaries nudge from Feb 28/27.
  const d = new Date(Date.UTC(2027, month - 1, day));
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

async function readSchedules(): Promise<Record<string, string[]>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(SCHEDULE_KEY)) ?? '{}');
  } catch {
    return {};
  }
}

export async function cancelAnniversaryNudges(anniversaryId: string): Promise<void> {
  const schedules = await readSchedules();
  for (const notifId of schedules[anniversaryId] ?? []) {
    await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  }
  delete schedules[anniversaryId];
  await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}

export async function scheduleAnniversaryNudges(anniversary: Anniversary): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') {
    throw new Error(
      'Notifications are turned off for W4nder. Enable them in Settings → Notifications to get anniversary nudges.'
    );
  }

  await cancelAnniversaryNudges(anniversary.id);

  const [, m, d] = anniversary.anniversaryDate.split('-').map(Number);
  const dateLabel = new Date(Date.UTC(2027, m - 1, d)).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });

  const nudges = [
    {
      daysBefore: 14,
      title: `${anniversary.title} is two weeks out`,
      body: `${dateLabel} is coming up. Want me to plan something special? The good tables go fast.`,
    },
    {
      daysBefore: 2,
      title: `${anniversary.title} is in two days`,
      body: `If nothing's planned yet for ${dateLabel}, there's still time — one tap and it's handled.`,
    },
  ];

  const ids: string[] = [];
  for (const nudge of nudges) {
    const when = nudgeDay(m, d, nudge.daysBefore);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: nudge.title,
          body: nudge.body,
          data: { url: '/plan-date?vibe=Anniversary' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          month: when.month,
          day: when.day,
          hour: 10,
          minute: 0,
          repeats: true,
        },
      })
    );
  }

  const schedules = await readSchedules();
  schedules[anniversary.id] = ids;
  await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}
