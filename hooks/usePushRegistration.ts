import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** The EAS projectId needed to mint an Expo push token, or null when not configured. */
function resolveExpoProjectId(): string | null {
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId || projectId === 'your-project-id-here') return null;
  return projectId;
}

/** Writes the push token to the signed-in user's profile. No-op when signed out. */
async function persistPushToken(token: string): Promise<void> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return;
  await supabase.from('profiles').update({ push_token: token }).eq('id', authUser.id);
}

/** Requests permission, mints an Expo push token, and stores it. Returns early on any gate. */
async function registerPushToken(isCancelled: () => boolean): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted' || isCancelled()) return;

  const projectId = resolveExpoProjectId();
  if (!projectId) {
    console.log('Push: no EAS projectId configured yet — skipping token registration.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (isCancelled() || !token) return;

  await persistPushToken(token);
}

/**
 * Registers the device's Expo push token in the user's profile so the plan
 * generator can notify them when their plans are ready.
 *
 * Silently no-ops when unavailable (simulator, no EAS project configured yet,
 * or permission declined).
 */
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    registerPushToken(() => cancelled).catch((e) => {
      // Expected on simulators / before EAS setup — never block the app on push.
      console.log('Push registration skipped:', e instanceof Error ? e.message : e);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }, []);
}
