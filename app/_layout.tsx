import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { DateNightProvider } from '@/contexts/DateNightContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

SplashScreen.preventAutoHideAsync();

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

      {/* ===== Dynamic Routes ===== */}
      <Stack.Screen name="trip/[id]" options={defaultCardOptions} />
      <Stack.Screen name="destination/[id]" options={defaultCardOptions} />
      <Stack.Screen name="booking/[id]" options={defaultCardOptions} />

      {/* ===== Core Date Planning ===== */}
      <Stack.Screen name="plan-date" options={defaultModalOptions} />
      <Stack.Screen name="saved-plan" options={defaultCardOptions} />
      <Stack.Screen name="taste-profile" options={defaultCardOptions} />

      {/* ===== Modal Flows (creation/planning) ===== */}
      <Stack.Screen name="plan-trip" options={defaultModalOptions} />
      <Stack.Screen name="date-plan" options={defaultModalOptions} />
      <Stack.Screen name="group-trip" options={defaultModalOptions} />
      <Stack.Screen name="surprise-trip" options={defaultModalOptions} />
      <Stack.Screen name="subscription" options={defaultModalOptions} />

      {/* ===== Travel Planning ===== */}
      <Stack.Screen name="flight-search" options={defaultCardOptions} />
      <Stack.Screen name="lodging" options={defaultCardOptions} />
      <Stack.Screen name="car-rental" options={defaultCardOptions} />
      <Stack.Screen name="ride-services" options={defaultCardOptions} />
      <Stack.Screen name="public-transit" options={defaultCardOptions} />
      <Stack.Screen name="parking-finder" options={defaultCardOptions} />
      <Stack.Screen name="trip-templates" options={defaultCardOptions} />
      <Stack.Screen name="local-experiences" options={defaultCardOptions} />
      <Stack.Screen name="weather-itinerary" options={defaultCardOptions} />
      <Stack.Screen name="nearby-services" options={defaultCardOptions} />

      {/* ===== AI & Smart Features ===== */}
      <Stack.Screen name="ai-assistant" options={defaultCardOptions} />
      <Stack.Screen name="ar-city-guide" options={defaultCardOptions} />

      {/* ===== Money & Budget ===== */}
      <Stack.Screen name="budget-tracker" options={defaultCardOptions} />
      <Stack.Screen name="currency-converter" options={defaultCardOptions} />
      <Stack.Screen name="savings-goals" options={defaultCardOptions} />
      <Stack.Screen name="price-alerts" options={defaultCardOptions} />
      <Stack.Screen name="price-comparison" options={defaultCardOptions} />
      <Stack.Screen name="insurance" options={defaultCardOptions} />

      {/* ===== Date Night ===== */}
      <Stack.Screen name="date-night" options={{ headerShown: false }} />
      <Stack.Screen name="anniversaries" options={defaultCardOptions} />

      {/* ===== Social & Sharing ===== */}
      <Stack.Screen name="live-sharing" options={defaultCardOptions} />
      <Stack.Screen name="travel-feed" options={defaultCardOptions} />
      <Stack.Screen name="photo-journal" options={defaultCardOptions} />
      <Stack.Screen name="blog-export" options={defaultCardOptions} />

      {/* ===== Safety & Info ===== */}
      <Stack.Screen name="safety-alerts" options={defaultCardOptions} />
      <Stack.Screen name="emergency" options={defaultCardOptions} />
      <Stack.Screen name="health-requirements" options={defaultCardOptions} />
      <Stack.Screen name="visa-requirements" options={defaultCardOptions} />
      <Stack.Screen name="translation" options={defaultCardOptions} />
      <Stack.Screen name="time-zone-manager" options={defaultCardOptions} />

      {/* ===== Documents & Wallet ===== */}
      <Stack.Screen name="document-wallet" options={defaultCardOptions} />
      <Stack.Screen name="packing-list" options={defaultCardOptions} />
      <Stack.Screen name="wallet" options={defaultCardOptions} />

      {/* ===== Dining ===== */}
      <Stack.Screen name="restaurants" options={defaultCardOptions} />

      {/* ===== Rewards & Loyalty ===== */}
      <Stack.Screen name="rewards" options={defaultCardOptions} />
      <Stack.Screen name="loyalty-programs" options={defaultCardOptions} />
      <Stack.Screen name="achievements" options={defaultCardOptions} />

      {/* ===== Settings ===== */}
      <Stack.Screen name="settings" options={defaultCardOptions} />
      <Stack.Screen name="accessibility" options={defaultCardOptions} />
      <Stack.Screen name="offline-mode" options={defaultCardOptions} />
      <Stack.Screen name="bucket-list" options={defaultCardOptions} />

      {/* ===== Weather ===== */}
      <Stack.Screen name="weather-activities" options={defaultCardOptions} />
      <Stack.Screen name="weather-forecast" options={defaultCardOptions} />

      {/* ===== Route & Activity Management ===== */}
      <Stack.Screen name="route-optimizer" options={defaultCardOptions} />
      <Stack.Screen name="route-settings" options={defaultCardOptions} />
      <Stack.Screen name="activity-adjustment" options={defaultCardOptions} />
      <Stack.Screen name="change-approval" options={defaultCardOptions} />
      <Stack.Screen name="suggestions-screen" options={defaultCardOptions} />
      <Stack.Screen name="suggestion-settings" options={defaultCardOptions} />

      {/* ===== Anniversary & Celebrations ===== */}
      <Stack.Screen name="add-anniversary" options={defaultCardOptions} />
      <Stack.Screen name="anniversary-detail" options={defaultCardOptions} />
      <Stack.Screen name="anniversary-list" options={defaultCardOptions} />
      <Stack.Screen name="celebration-planner" options={defaultCardOptions} />
      <Stack.Screen name="milestone-detail" options={defaultCardOptions} />

      {/* ===== Companion & Preferences ===== */}
      <Stack.Screen name="companion-merge" options={defaultCardOptions} />
      <Stack.Screen name="preference-editor" options={defaultCardOptions} />
      <Stack.Screen name="preference-sync" options={defaultCardOptions} />

      {/* ===== Expenses & Receipts ===== */}
      <Stack.Screen name="expense-tracker" options={defaultCardOptions} />
      <Stack.Screen name="expense-edit" options={defaultCardOptions} />
      <Stack.Screen name="category-budget" options={defaultCardOptions} />
      <Stack.Screen name="receipt-capture" options={defaultCardOptions} />
      <Stack.Screen name="receipt-list" options={defaultCardOptions} />
      <Stack.Screen name="receipt-review" options={defaultCardOptions} />

      {/* ===== Currency ===== */}
      <Stack.Screen name="currency-converter-detail" options={defaultCardOptions} />
      <Stack.Screen name="currency-settings" options={defaultCardOptions} />

      {/* ===== Wallet & Cash ===== */}
      <Stack.Screen name="cash-wallet" options={defaultCardOptions} />

      {/* ===== Places ===== */}
      <Stack.Screen name="favorite-places" options={defaultCardOptions} />
      <Stack.Screen name="add-place" options={defaultCardOptions} />
      <Stack.Screen name="place-detail" options={defaultCardOptions} />

      {/* ===== Packing ===== */}
      <Stack.Screen name="packing-list-detail" options={defaultCardOptions} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppProvider>
            <DateNightProvider>
              <RootLayoutNav />
            </DateNightProvider>
          </AppProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
