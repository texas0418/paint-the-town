import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { OnboardingData, UserProfile } from '@/types';

const ONBOARDING_KEY = 'w4nder_onboarding';
const USER_KEY = 'w4nder_user';

const defaultUser: UserProfile = {
  id: '1',
  name: 'Traveler',
  email: 'traveler@email.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  travelStyle: '',
  budgetRange: '',
  preferences: [],
  tripsCompleted: 1,
  countriesVisited: 3,
  memberSince: '2024',
  rewardPoints: 2500,
  subscriptionTier: 'free',
  loyaltyPrograms: [],
  dietaryRestrictions: [],
  accessibilityNeeds: [],
  emergencyContacts: [],
  languagePreference: 'en',
  carbonOffsetEnabled: false,
};

export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile>(defaultUser);

  const onboardingQuery = useQuery({
    queryKey: ['onboarding'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      return stored ? JSON.parse(stored) : null;
    },
  });

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : defaultUser;
    },
  });

  useEffect(() => {
    if (onboardingQuery.data !== undefined) {
      setIsOnboarded(onboardingQuery.data !== null);
    }
  }, [onboardingQuery.data]);

  useEffect(() => {
    if (userQuery.data) {
      setUser(userQuery.data);
    }
  }, [userQuery.data]);

  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
      const updatedUser = {
        ...user,
        travelStyle: data.travelStyle || '',
        budgetRange: data.budgetRange || '',
        preferences: data.preferences,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { onboarding: data, user: updatedUser };
    },
    onSuccess: ({ user: updatedUser }) => {
      setIsOnboarded(true);
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const { mutate: saveOnboarding } = saveOnboardingMutation;

  const completeOnboarding = useCallback(
    (data: OnboardingData) => {
      saveOnboarding(data);
    },
    [saveOnboarding]
  );

  return {
    isOnboarded,
    isLoading: onboardingQuery.isLoading || userQuery.isLoading,
    user,
    completeOnboarding,
  };
});
