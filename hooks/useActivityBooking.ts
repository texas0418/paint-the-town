// Activity Booking Hooks for Paint the Town

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ActivitySearchParams,
  AvailabilitySlot,
  ActivityBooking,
  ActivityBookingRequest,
  ActivityCategory,
} from '@/types/activity';
import { activityBookingService } from '@/services/activityBookingService';

// ============================================================================
// useActivitySearch - Search for activities
// ============================================================================

interface UseActivitySearchOptions {
  initialParams?: Partial<ActivitySearchParams>;
  autoSearch?: boolean;
}

export function useActivitySearch(options: UseActivitySearchOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [params, setParams] = useState<ActivitySearchParams>({
    destination: 'Atlanta',
    adults: 2,
    ...options.initialParams,
  });

  const search = useCallback(async (
    searchParams?: Partial<ActivitySearchParams>,
    resetPage = true
  ) => {
    setIsLoading(true);
    setError(null);

    const newParams = { ...params, ...searchParams };
    if (resetPage) {
      newParams.page = 1;
      setPage(1);
    }

    try {
      const result = await activityBookingService.searchActivities(newParams);

      if (resetPage || newParams.page === 1) {
        setActivities(result.activities);
      } else {
        setActivities(prev => [...prev, ...result.activities]);
      }

      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setParams(newParams);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await search({ page: nextPage }, false);
  }, [hasMore, isLoading, page, search]);

  const filterByCategory = useCallback((categories: ActivityCategory[]) => {
    search({ categories }, true);
  }, [search]);

  const filterByPrice = useCallback((min: number, max: number) => {
    search({ priceRange: { min, max } }, true);
  }, [search]);

  const sortBy = useCallback((sortBy: ActivitySearchParams['sortBy']) => {
    search({ sortBy }, true);
  }, [search]);

  // Auto-search on mount
  useEffect(() => {
    if (options.autoSearch !== false) {
      search();
    }
  }, []);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    totalCount,
    params,
    search,
    loadMore,
    filterByCategory,
    filterByPrice,
    sortBy,
    refresh: () => search(undefined, true),
  };
}

// ============================================================================
// useActivityDetails - Get activity details
// ============================================================================

interface UseActivityDetailsOptions {
  activityId: string;
  provider: Activity['provider'];
  autoFetch?: boolean;
}

export function useActivityDetails({
  activityId,
  provider,
  autoFetch = true,
}: UseActivityDetailsOptions) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await activityBookingService.getActivityDetails(activityId, provider);
      setActivity(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity');
    } finally {
      setIsLoading(false);
    }
  }, [activityId, provider]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [activityId, provider, autoFetch]);

  return {
    activity,
    isLoading,
    error,
    refresh: fetch,
  };
}

// ============================================================================
// useActivityAvailability - Get availability for an activity
// ============================================================================

interface UseActivityAvailabilityOptions {
  activityId: string;
  provider: Activity['provider'];
  date: string;
  adults: number;
  children?: number;
  autoFetch?: boolean;
}

export function useActivityAvailability({
  activityId,
  provider,
  date,
  adults,
  children,
  autoFetch = true,
}: UseActivityAvailabilityOptions) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAvailableDate, setNextAvailableDate] = useState<string | undefined>();

  const fetch = useCallback(async (newDate?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await activityBookingService.getAvailability({
        activityId,
        provider,
        date: newDate || date,
        participants: { adults, children },
      });
      setSlots(response.slots);
      setNextAvailableDate(response.nextAvailableDate);
    } catch (err: any) {
      setError(err.message || 'Failed to get availability');
    } finally {
      setIsLoading(false);
    }
  }, [activityId, provider, date, adults, children]);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [activityId, date, adults, children, autoFetch]);

  const availableSlots = slots.filter(s => s.available);

  return {
    slots,
    availableSlots,
    isLoading,
    error,
    nextAvailableDate,
    refresh: fetch,
    fetchForDate: fetch,
  };
}

// ============================================================================
// useActivityBooking - Book an activity
// ============================================================================

export function useActivityBooking() {
  const [isBooking, setIsBooking] = useState(false);
  const [booking, setBooking] = useState<ActivityBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (request: ActivityBookingRequest): Promise<ActivityBooking | null> => {
    setIsBooking(true);
    setError(null);

    try {
      const result = await activityBookingService.bookActivity(request);
      setBooking(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Booking failed');
      return null;
    } finally {
      setIsBooking(false);
    }
  }, []);

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!booking) return false;

    try {
      await activityBookingService.cancelBooking(booking.id);
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Cancellation failed');
      return false;
    }
  }, [booking]);

  return {
    isBooking,
    booking,
    error,
    book,
    cancel,
    clearError: () => setError(null),
  };
}

// ============================================================================
// useActivityBookings - Get all user bookings
// ============================================================================

export function useActivityBookings() {
  const [bookings, setBookings] = useState<ActivityBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await activityBookingService.getBookings();
      setBookings(result);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();

    const unsubscribe = activityBookingService.subscribe(
      'useActivityBookings',
      (updatedBookings) => setBookings(updatedBookings)
    );

    return unsubscribe;
  }, []);

  const upcomingBookings = bookings.filter(
    b => b.status === 'confirmed' && new Date(b.date) > new Date()
  );

  const pastBookings = bookings.filter(
    b => b.status === 'completed' || new Date(b.date) < new Date()
  );

  return {
    bookings,
    upcomingBookings,
    pastBookings,
    isLoading,
    refresh: fetch,
  };
}

// ============================================================================
// useActivityFavorites - Manage favorite activities
// ============================================================================

export function useActivityFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(activityBookingService.getFavorites());
  }, []);

  const toggleFavorite = useCallback((activityId: string) => {
    const isFavorite = activityBookingService.toggleFavorite(activityId);
    setFavorites(activityBookingService.getFavorites());
    return isFavorite;
  }, []);

  const isFavorite = useCallback((activityId: string) => {
    return activityBookingService.isFavorite(activityId);
  }, []);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
  };
}

// ============================================================================
// useExperienceBooking - All-in-one hook for activity search & booking
// ============================================================================

interface UseExperienceBookingOptions {
  destination?: string;
  date?: string;
  adults?: number;
  children?: number;
  onBookingComplete?: (booking: ActivityBooking) => void;
}

export function useExperienceBooking(options: UseExperienceBookingOptions = {}) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const search = useActivitySearch({
    initialParams: {
      destination: options.destination || 'Atlanta',
      date: options.date,
      adults: options.adults || 2,
      children: options.children,
    },
  });

  const { book, isBooking, error: bookingError } = useActivityBooking();
  const { toggleFavorite, isFavorite } = useActivityFavorites();

  const selectActivity = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setShowBookingModal(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedActivity(null);
    setShowBookingModal(false);
  }, []);

  const handleBookingComplete = useCallback((confirmationNumber: string) => {
    clearSelection();
  }, [clearSelection]);

  return {
    // Search
    ...search,

    // Selection
    selectedActivity,
    showBookingModal,
    selectActivity,
    clearSelection,

    // Booking
    isBooking,
    bookingError,
    handleBookingComplete,

    // Favorites
    toggleFavorite,
    isFavorite,
  };
}
