/**
 * Date Night Reminder
 *
 * A weekly, locally-scheduled notification that nudges the user to plan a
 * date — entirely on-device (expo-notifications calendar trigger), no push
 * token or server involved. Tapping the notification deep-links to the
 * plan-date screen via the `url` field in the notification data (handled in
 * app/_layout.tsx).
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'w4nder:dateNightReminder';

export interface ReminderSettings {
  enabled: boolean;
  /** 1 = Sunday … 7 = Saturday (expo-notifications calendar convention) */
  weekday: number;
  hour: number;
  minute: number;
  /** id of the currently scheduled notification, so we can replace it */
  notificationId?: string;
}

// Thursday 5pm: early enough that Saturday reservations are still gettable.
export const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  weekday: 5,
  hour: 17,
  minute: 0,
};

export const weekdayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** "Thursdays at 5:00 PM" */
export function describeReminder(s: ReminderSettings): string {
  const h12 = s.hour % 12 === 0 ? 12 : s.hour % 12;
  const ampm = s.hour < 12 ? 'AM' : 'PM';
  const min = String(s.minute).padStart(2, '0');
  return `${weekdayNames[s.weekday - 1]}s at ${h12}:${min} ${ampm}`;
}

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultReminderSettings;
    return { ...defaultReminderSettings, ...JSON.parse(raw) };
  } catch {
    return defaultReminderSettings;
  }
}

/**
 * Persist settings and (re)schedule the weekly notification to match.
 * Returns the saved settings. Throws if notifications are enabled but
 * permission is denied, so the caller can explain.
 */
export async function saveReminderSettings(
  settings: ReminderSettings
): Promise<ReminderSettings> {
  // Always clear the previous schedule first — settings changes replace it.
  const previous = await getReminderSettings();
  if (previous.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(previous.notificationId).catch(() => {});
  }

  let notificationId: string | undefined;
  if (settings.enabled) {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') {
      const disabled = { ...settings, enabled: false, notificationId: undefined };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(disabled));
      throw new Error(
        'Notifications are turned off for W4nder. Enable them in Settings → Notifications to get date night reminders.'
      );
    }

    // The date the reminder points at: "Saturday" if the reminder day is
    // Thu/Fri, otherwise just "date night".
    const target =
      settings.weekday === 5 || settings.weekday === 6
        ? 'the weekend'
        : 'date night';
    notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Date night, handled',
        body: `Still nothing planned for ${target}? One tap and W4nder will put a whole evening together.`,
        data: { url: '/plan-date' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: settings.weekday,
        hour: settings.hour,
        minute: settings.minute,
        repeats: true,
      },
    });
  }

  const saved = { ...settings, notificationId };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
  return saved;
}
