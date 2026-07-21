import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  OnboardingData,
  UserProfile,
  Trip,
  Booking,
  Notification,
  Expense,
  LoyaltyProgram,
  Reward,
  EmergencyContact,
  BucketListItem,
  Destination,
} from '@/types';
import { trips as mockTrips } from '@/mocks/trips';
import { mockBookings, mockNotifications, mockRewards } from '@/mocks/appData';

const ONBOARDING_KEY = 'w4nder_onboarding';
const USER_KEY = 'w4nder_user';
const TRIPS_KEY = 'w4nder_trips';
const BOOKINGS_KEY = 'w4nder_bookings';
const NOTIFICATIONS_KEY = 'w4nder_notifications';
const BUCKET_LIST_KEY = 'w4nder_bucket_list';

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

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export const [AppProvider, useApp] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [bucketList, setBucketList] = useState<BucketListItem[]>([]);

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

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(TRIPS_KEY);
      return stored ? JSON.parse(stored) : mockTrips;
    },
  });

  const bucketListQuery = useQuery({
    queryKey: ['bucketList'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BUCKET_LIST_KEY);
      return stored ? JSON.parse(stored) : [];
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

  useEffect(() => {
    if (tripsQuery.data) {
      setTrips(tripsQuery.data);
    }
  }, [tripsQuery.data]);

  useEffect(() => {
    if (bucketListQuery.data) {
      setBucketList(bucketListQuery.data);
    }
  }, [bucketListQuery.data]);

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

  const updateUserMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const saveTripsMutation = useMutation({
    mutationFn: async (updatedTrips: Trip[]) => {
      await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(updatedTrips));
      return updatedTrips;
    },
    onSuccess: (updatedTrips) => {
      setTrips(updatedTrips);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  const saveBucketListMutation = useMutation({
    mutationFn: async (updatedList: BucketListItem[]) => {
      await AsyncStorage.setItem(BUCKET_LIST_KEY, JSON.stringify(updatedList));
      return updatedList;
    },
    onSuccess: (updatedList) => {
      setBucketList(updatedList);
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
    },
  });

  const { mutate: saveOnboarding } = saveOnboardingMutation;
  const { mutate: updateUserData } = updateUserMutation;
  const { mutate: saveTripsData } = saveTripsMutation;
  const { mutate: saveBucketListData } = saveBucketListMutation;

  const completeOnboarding = useCallback(
    (data: OnboardingData) => {
      saveOnboarding(data);
    },
    [saveOnboarding]
  );

  const updateUser = useCallback(
    (updates: Partial<UserProfile>) => {
      updateUserData(updates);
    },
    [updateUserData]
  );

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setIsOnboarded(false);
    queryClient.invalidateQueries({ queryKey: ['onboarding'] });
  }, [queryClient]);

  const addTrip = useCallback(
    (trip: Trip) => {
      const updatedTrips = [trip, ...trips];
      setTrips(updatedTrips);
      saveTripsData(updatedTrips);
    },
    [trips, saveTripsData]
  );

  const updateTrip = useCallback(
    (tripId: string, updates: Partial<Trip>) => {
      const updatedTrips = trips.map((t) => (t.id === tripId ? { ...t, ...updates } : t));
      setTrips(updatedTrips);
      saveTripsData(updatedTrips);
    },
    [trips, saveTripsData]
  );

  const deleteTrip = useCallback(
    (tripId: string) => {
      const updatedTrips = trips.filter((t) => t.id !== tripId);
      setTrips(updatedTrips);
      saveTripsData(updatedTrips);
    },
    [trips, saveTripsData]
  );

  const addBooking = useCallback((booking: Booking) => {
    setBookings((prev) => [booking, ...prev]);
  }, []);

  const updateBooking = useCallback((bookingId: string, updates: Partial<Booking>) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b)));
  }, []);

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
    );
  }, []);

  const addExpense = useCallback(
    (tripId: string, expense: Expense) => {
      const trip = trips.find((t) => t.id === tripId);
      if (trip) {
        const updatedExpenses = [...(trip.expenses || []), expense];
        const totalSpent = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
        updateTrip(tripId, { expenses: updatedExpenses, spentBudget: totalSpent });
      }
    },
    [trips, updateTrip]
  );

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addRewardPoints = useCallback(
    (points: number) => {
      const newTotal = user.rewardPoints + points;
      updateUser({ rewardPoints: newTotal });
    },
    [user.rewardPoints, updateUser]
  );

  const redeemReward = useCallback(
    (rewardId: string) => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (reward && user.rewardPoints >= reward.pointsCost) {
        updateUser({ rewardPoints: user.rewardPoints - reward.pointsCost });
        setRewards((prev) => prev.map((r) => (r.id === rewardId ? { ...r, isRedeemed: true } : r)));
        return true;
      }
      return false;
    },
    [rewards, user.rewardPoints, updateUser]
  );

  const addLoyaltyProgram = useCallback(
    (program: LoyaltyProgram) => {
      const updatedPrograms = [...(user.loyaltyPrograms || []), program];
      updateUser({ loyaltyPrograms: updatedPrograms });
    },
    [user.loyaltyPrograms, updateUser]
  );

  const updateLoyaltyProgram = useCallback(
    (programId: string, updates: Partial<LoyaltyProgram>) => {
      const updatedPrograms = (user.loyaltyPrograms || []).map((p) =>
        p.id === programId ? { ...p, ...updates } : p
      );
      updateUser({ loyaltyPrograms: updatedPrograms });
    },
    [user.loyaltyPrograms, updateUser]
  );

  const removeLoyaltyProgram = useCallback(
    (programId: string) => {
      const updatedPrograms = (user.loyaltyPrograms || []).filter((p) => p.id !== programId);
      updateUser({ loyaltyPrograms: updatedPrograms });
    },
    [user.loyaltyPrograms, updateUser]
  );

  const addEmergencyContact = useCallback(
    (contact: EmergencyContact) => {
      const updatedContacts = [...(user.emergencyContacts || []), contact];
      updateUser({ emergencyContacts: updatedContacts });
    },
    [user.emergencyContacts, updateUser]
  );

  const removeEmergencyContact = useCallback(
    (contactId: string) => {
      const updatedContacts = (user.emergencyContacts || []).filter((c) => c.id !== contactId);
      updateUser({ emergencyContacts: updatedContacts });
    },
    [user.emergencyContacts, updateUser]
  );

  const upgradeSubscription = useCallback(
    (tier: UserProfile['subscriptionTier']) => {
      updateUser({ subscriptionTier: tier });
    },
    [updateUser]
  );

  const toggleCarbonOffset = useCallback(() => {
    updateUser({ carbonOffsetEnabled: !user.carbonOffsetEnabled });
  }, [user.carbonOffsetEnabled, updateUser]);

  const addToBucketList = useCallback(
    (destination: Destination, options?: Partial<BucketListItem>) => {
      const existingItem = bucketList.find((item) => item.destinationId === destination.id);
      if (existingItem) {
        console.log('Destination already in bucket list');
        return false;
      }
      const newItem: BucketListItem = {
        id: Date.now().toString(),
        destinationId: destination.id,
        destination,
        addedAt: new Date().toISOString(),
        priority: 'medium',
        isVisited: false,
        ...options,
      };
      const updatedList = [newItem, ...bucketList];
      setBucketList(updatedList);
      saveBucketListData(updatedList);
      return true;
    },
    [bucketList, saveBucketListData]
  );

  const removeFromBucketList = useCallback(
    (itemId: string) => {
      const updatedList = bucketList.filter((item) => item.id !== itemId);
      setBucketList(updatedList);
      saveBucketListData(updatedList);
    },
    [bucketList, saveBucketListData]
  );

  const updateBucketListItem = useCallback(
    (itemId: string, updates: Partial<BucketListItem>) => {
      const updatedList = bucketList.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      setBucketList(updatedList);
      saveBucketListData(updatedList);
    },
    [bucketList, saveBucketListData]
  );

  const markAsVisited = useCallback(
    (itemId: string) => {
      updateBucketListItem(itemId, {
        isVisited: true,
        visitedDate: new Date().toISOString(),
      });
    },
    [updateBucketListItem]
  );

  const updateSavings = useCallback(
    (itemId: string, amount: number) => {
      const item = bucketList.find((i) => i.id === itemId);
      if (item) {
        const newSavings = (item.currentSavings || 0) + amount;
        updateBucketListItem(itemId, { currentSavings: Math.max(0, newSavings) });
      }
    },
    [bucketList, updateBucketListItem]
  );

  const isInBucketList = useCallback(
    (destinationId: string) => {
      return bucketList.some((item) => item.destinationId === destinationId);
    },
    [bucketList]
  );

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const upcomingBookings = bookings.filter((b) => b.status === 'confirmed');
  const activeTrips = trips.filter((t) => t.status === 'upcoming' || t.status === 'ongoing');
  const bucketListCount = bucketList.length;
  const visitedCount = bucketList.filter((item) => item.isVisited).length;

  return {
    isOnboarded,
    isLoading: onboardingQuery.isLoading || userQuery.isLoading,
    user,
    trips,
    bookings,
    notifications,
    rewards,
    bucketList,
    unreadNotificationsCount,
    upcomingBookings,
    activeTrips,
    bucketListCount,
    visitedCount,
    completeOnboarding,
    updateUser,
    resetOnboarding,
    addTrip,
    updateTrip,
    deleteTrip,
    addBooking,
    updateBooking,
    cancelBooking,
    addExpense,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    addRewardPoints,
    redeemReward,
    addLoyaltyProgram,
    updateLoyaltyProgram,
    removeLoyaltyProgram,
    addEmergencyContact,
    removeEmergencyContact,
    upgradeSubscription,
    toggleCarbonOffset,
    addToBucketList,
    removeFromBucketList,
    updateBucketListItem,
    markAsVisited,
    updateSavings,
    isInBucketList,
  };
});
