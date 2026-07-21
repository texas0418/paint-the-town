// Restaurant Booking Hooks for Paint the Town

import { useState, useEffect, useCallback } from 'react';
import {
  RestaurantWithAvailability,
  RestaurantSearchParams,
  TimeSlot,
  TimeSlotGroup,
  Reservation,
  ReservationRequest,
  DiningPreferences,
} from '@/types/restaurant';
import { restaurantBookingService } from '@/services/restaurantBookingService';

// ============================================================================
// useRestaurantSearch - Search for restaurants with availability
// ============================================================================

interface UseRestaurantSearchOptions {
  initialParams?: Partial<RestaurantSearchParams>;
  autoSearch?: boolean;
}

export function useRestaurantSearch(options: UseRestaurantSearchOptions = {}) {
  const [restaurants, setRestaurants] = useState<RestaurantWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [params, setParams] = useState<RestaurantSearchParams>({
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    partySize: 2,
    ...options.initialParams,
  });

  const search = useCallback(async (searchParams?: Partial<RestaurantSearchParams>, resetPage = true) => {
    setIsLoading(true);
    setError(null);

    const newParams = { ...params, ...searchParams };
    if (resetPage) {
      newParams.page = 1;
      setPage(1);
    }

    try {
      const result = await restaurantBookingService.searchRestaurants(newParams);
      
      if (resetPage || newParams.page === 1) {
        setRestaurants(result.restaurants);
      } else {
        setRestaurants(prev => [...prev, ...result.restaurants]);
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

  const updateParams = useCallback((newParams: Partial<RestaurantSearchParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  // Auto-search on mount if enabled
  useEffect(() => {
    if (options.autoSearch !== false) {
      search();
    }
  }, []);

  return {
    restaurants,
    isLoading,
    error,
    hasMore,
    totalCount,
    params,
    search,
    loadMore,
    updateParams,
    refresh: () => search(undefined, true),
  };
}

// ============================================================================
// useRestaurantAvailability - Get availability for a specific restaurant
// ============================================================================

interface UseRestaurantAvailabilityOptions {
  restaurantId: string;
  date: string;
  partySize: number;
  autoFetch?: boolean;
}

export function useRestaurantAvailability({
  restaurantId,
  date,
  partySize,
  autoFetch = true,
}: UseRestaurantAvailabilityOptions) {
  const [availability, setAvailability] = useState<TimeSlotGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async (newDate?: string, newPartySize?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await restaurantBookingService.getRestaurantAvailability(
        restaurantId,
        newDate || date,
        newPartySize || partySize
      );
      setAvailability(result);
    } catch (err: any) {
      setError(err.message || 'Failed to get availability');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, date, partySize]);

  useEffect(() => {
    if (autoFetch) {
      fetchAvailability();
    }
  }, [restaurantId, date, partySize, autoFetch]);

  // Get all slots flattened
  const allSlots = availability.flatMap(group => group.slots);
  
  // Get available slots only
  const availableSlots = allSlots.filter(slot => slot.isAvailable);

  return {
    availability,
    allSlots,
    availableSlots,
    isLoading,
    error,
    refresh: fetchAvailability,
  };
}

// ============================================================================
// useReservation - Make and manage a single reservation
// ============================================================================

export function useReservation() {
  const [isBooking, setIsBooking] = useState(false);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(async (request: ReservationRequest): Promise<Reservation | null> => {
    setIsBooking(true);
    setError(null);

    try {
      const result = await restaurantBookingService.makeReservation(request);
      setReservation(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Booking failed');
      return null;
    } finally {
      setIsBooking(false);
    }
  }, []);

  const cancel = useCallback(async (): Promise<boolean> => {
    if (!reservation) return false;

    try {
      await restaurantBookingService.cancelReservation(reservation.id);
      setReservation(prev => prev ? { ...prev, status: 'cancelled' } : null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Cancellation failed');
      return false;
    }
  }, [reservation]);

  const modify = useCallback(async (
    updates: { date?: string; time?: string; partySize?: number }
  ): Promise<Reservation | null> => {
    if (!reservation) return null;

    try {
      const result = await restaurantBookingService.modifyReservation(reservation.id, updates);
      setReservation(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Modification failed');
      return null;
    }
  }, [reservation]);

  return {
    isBooking,
    reservation,
    error,
    book,
    cancel,
    modify,
    clearError: () => setError(null),
  };
}

// ============================================================================
// useReservations - Manage all user reservations
// ============================================================================

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await restaurantBookingService.getReservations();
      setReservations(result);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();

    // Subscribe to updates
    const unsubscribe = restaurantBookingService.subscribe(
      'useReservations',
      (updatedReservations) => setReservations(updatedReservations)
    );

    return unsubscribe;
  }, []);

  // Filter helpers
  const upcomingReservations = reservations.filter(
    r => r.status === 'confirmed' && r.dateTime > new Date()
  );

  const pastReservations = reservations.filter(
    r => r.status === 'completed' || r.dateTime < new Date()
  );

  const cancelledReservations = reservations.filter(
    r => r.status === 'cancelled'
  );

  return {
    reservations,
    upcomingReservations,
    pastReservations,
    cancelledReservations,
    isLoading,
    refresh: fetch,
  };
}

// ============================================================================
// useRestaurantBooking - All-in-one hook for search and booking flow
// ============================================================================

interface UseRestaurantBookingOptions {
  date?: string;
  time?: string;
  partySize?: number;
  onBookingComplete?: (reservation: Reservation) => void;
}

export function useRestaurantBooking(options: UseRestaurantBookingOptions = {}) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const search = useRestaurantSearch({
    initialParams: {
      date: options.date,
      time: options.time,
      partySize: options.partySize,
    },
  });

  const { book, isBooking, error: bookingError } = useReservation();

  const selectSlot = useCallback((restaurant: RestaurantWithAvailability, slot: TimeSlot) => {
    setSelectedRestaurant(restaurant);
    setSelectedSlot(slot);
    setShowBookingModal(true);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRestaurant(null);
    setSelectedSlot(null);
    setShowBookingModal(false);
  }, []);

  const confirmBooking = useCallback(async (
    guestInfo: { firstName: string; lastName: string; email: string; phone: string },
    preferences?: { specialRequests?: string; occasion?: string; seatingPreference?: string }
  ) => {
    if (!selectedRestaurant || !selectedSlot) return null;

    const request: ReservationRequest = {
      timeSlot: selectedSlot,
      restaurantId: selectedRestaurant.id,
      partySize: selectedSlot.partySize,
      primaryGuest: guestInfo,
      phone: guestInfo.phone,
      email: guestInfo.email,
      specialRequests: preferences?.specialRequests,
      occasion: preferences?.occasion as any,
      seatingPreference: preferences?.seatingPreference as any,
      receiveUpdates: true,
      receiveMarketing: false,
    };

    const reservation = await book(request);
    
    if (reservation) {
      clearSelection();
      options.onBookingComplete?.(reservation);
    }

    return reservation;
  }, [selectedRestaurant, selectedSlot, book, clearSelection, options.onBookingComplete]);

  return {
    // Search
    ...search,
    
    // Selection
    selectedRestaurant,
    selectedSlot,
    showBookingModal,
    selectSlot,
    clearSelection,
    
    // Booking
    isBooking,
    bookingError,
    confirmBooking,
  };
}
