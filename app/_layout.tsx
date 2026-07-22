import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, Text, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

// Respect the system text-size setting, but cap it so accessibility sizes
// don't balloon the layout (buttons overlapping cards, wrapped titles).
// @ts-expect-error defaultProps is legacy but still honored by RN Text
Text.defaultProps = { ...(Text.defaultProps ?? {}), maxFontSizeMultiplier: 1.1 };
// @ts-expect-error same for TextInput
TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), maxFontSizeMultiplier: 1.1 };

const queryClient = new QueryClient();

// Default screen options for consistent transitions
const defaultCardOptions = {
  headerShown: false,
  presentation: 'card' as const,
};

const defaultModalOptions = {
  headerShown: false,
  presentation: 'modal' as const,
};

function RootLayoutNav() {
  const { isOnboarded, isLoading: isAppLoading } = useApp();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  // Deep-link from notifications that carry a `url` in their data (e.g. the
  // date night reminder opens the planner). Covers both a tap while running
  // and a cold start from the notification.
  useEffect(() => {
    const openFromNotification = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) {
        // Let the auth/onboarding redirect settle first.
        setTimeout(() => router.push(url as never), 400);
      }
    };
    Notifications.getLastNotificationResponseAsync().then(openFromNotification);
    const sub = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (isAppLoading || isAuthLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inAuth = segments[0] === '(auth)';

    // First check: is user authenticated?
    if (!user && !inAuth && !inOnboarding) {
      // Not logged in, go to login
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      // Logged in but in auth screens, check onboarding
      if (!isOnboarded) {
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    } else if (user && !isOnboarded && !inOnboarding) {
      // Logged in but not onboarded
      router.replace('/onboarding');
    } else if (user && isOnboarded && inOnboarding) {
      // Logged in and onboarded but still in onboarding
      router.replace('/');
    }
  }, [user, isOnboarded, isAppLoading, isAuthLoading, segments, router]);

  if (isAppLoading || isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      {/* ===== Auth Screens ===== */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />

      {/* ===== Core Navigation ===== */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />

      {/* ===== Core Date Planning ===== */}
      <Stack.Screen name="plan-date" options={defaultModalOptions} />
      <Stack.Screen name="plans" options={defaultCardOptions} />
      <Stack.Screen name="saved-plan" options={defaultCardOptions} />
      <Stack.Screen name="receive-date" options={defaultCardOptions} />
      <Stack.Screen name="rate-date" options={defaultCardOptions} />
      <Stack.Screen name="date-journal" options={defaultCardOptions} />
      <Stack.Screen name="taste-profile" options={defaultCardOptions} />
      <Stack.Screen name="date-night-reminder" options={defaultCardOptions} />
      <Stack.Screen name="partner" options={defaultCardOptions} />
      <Stack.Screen name="membership" options={defaultCardOptions} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppProvider>
          <RootLayoutNav />
          </AppProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
