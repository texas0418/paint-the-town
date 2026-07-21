// Confirmation Storage Hooks for Paint the Town

import { useState, useEffect, useCallback } from 'react';
import {
  Confirmation,
  ConfirmationType,
  ConfirmationStatus,
  ConfirmationFilter,
  ConfirmationSort,
  ConfirmationGroup,
  Ticket,
  groupConfirmationsByDate,
} from '@/types/confirmation';
import { confirmationStorage } from '@/services/confirmationStorage';

// ============================================================================
// useConfirmations - Get all confirmations with filtering
// ============================================================================

interface UseConfirmationsOptions {
  filter?: ConfirmationFilter;
  sort?: ConfirmationSort;
  autoRefresh?: boolean;
}

export function useConfirmations(options: UseConfirmationsOptions = {}) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmationStorage.getAllConfirmations(
        options.filter,
        options.sort
      );
      setConfirmations(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch confirmations');
    } finally {
      setIsLoading(false);
    }
  }, [options.filter, options.sort]);

  useEffect(() => {
    fetch();

    // Subscribe to updates
    const unsubscribe = confirmationStorage.subscribe(
      'useConfirmations',
      (updated) => setConfirmations(updated)
    );

    return unsubscribe;
  }, []);

  const groupedByDate = groupConfirmationsByDate(confirmations);

  return {
    confirmations,
    groupedByDate,
    isLoading,
    error,
    refresh: fetch,
  };
}

// ============================================================================
// useUpcomingConfirmations - Get upcoming confirmations
// ============================================================================

export function useUpcomingConfirmations() {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await confirmationStorage.getUpcomingConfirmations();
      setConfirmations(result);
    } catch (error) {
      console.error('Failed to fetch upcoming confirmations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();

    const unsubscribe = confirmationStorage.subscribe(
      'useUpcomingConfirmations',
      async () => {
        const result = await confirmationStorage.getUpcomingConfirmations();
        setConfirmations(result);
      }
    );

    return unsubscribe;
  }, []);

  const todayConfirmations = confirmations.filter(c => {
    const today = new Date().toISOString().split('T')[0];
    return c.date === today;
  });

  const tomorrowConfirmations = confirmations.filter(c => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return c.date === tomorrow;
  });

  return {
    confirmations,
    todayConfirmations,
    tomorrowConfirmations,
    isLoading,
    refresh: fetch,
  };
}

// ============================================================================
// useConfirmation - Get single confirmation
// ============================================================================

export function useConfirmation(id: string) {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await confirmationStorage.getConfirmation(id);
      setConfirmation(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch confirmation');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();

    const unsubscribe = confirmationStorage.subscribe(
      `useConfirmation-${id}`,
      async () => {
        const result = await confirmationStorage.getConfirmation(id);
        setConfirmation(result);
      }
    );

    return unsubscribe;
  }, [id]);

  const update = useCallback(async (updates: Partial<Confirmation>) => {
    const result = await confirmationStorage.updateConfirmation(id, updates);
    if (result) {
      setConfirmation(result);
    }
    return result;
  }, [id]);

  const remove = useCallback(async () => {
    return confirmationStorage.deleteConfirmation(id);
  }, [id]);

  const cancel = useCallback(async () => {
    return update({ status: 'cancelled' });
  }, [update]);

  return {
    confirmation,
    isLoading,
    error,
    refresh: fetch,
    update,
    remove,
    cancel,
  };
}

// ============================================================================
// useConfirmationsByType - Get confirmations by type
// ============================================================================

export function useConfirmationsByType(type: ConfirmationType) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await confirmationStorage.getConfirmationsByType(type);
      setConfirmations(result);
    } catch (error) {
      console.error('Failed to fetch confirmations by type:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetch();

    const unsubscribe = confirmationStorage.subscribe(
      `useConfirmationsByType-${type}`,
      async () => {
        const result = await confirmationStorage.getConfirmationsByType(type);
        setConfirmations(result);
      }
    );

    return unsubscribe;
  }, [type]);

  return {
    confirmations,
    isLoading,
    refresh: fetch,
  };
}

// ============================================================================
// useConfirmationsForDate - Get confirmations for a specific date
// ============================================================================

export function useConfirmationsForDate(date: string) {
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await confirmationStorage.getConfirmationsForDate(date);
      setConfirmations(result);
    } catch (error) {
      console.error('Failed to fetch confirmations for date:', error);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetch();

    const unsubscribe = confirmationStorage.subscribe(
      `useConfirmationsForDate-${date}`,
      async () => {
        const result = await confirmationStorage.getConfirmationsForDate(date);
        setConfirmations(result);
      }
    );

    return unsubscribe;
  }, [date]);

  return {
    confirmations,
    isLoading,
    refresh: fetch,
  };
}

// ============================================================================
// useConfirmationSearch - Search confirmations
// ============================================================================

export function useConfirmationSearch() {
  const [results, setResults] = useState<Confirmation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await confirmationStorage.searchConfirmations(searchQuery);
      setResults(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    query,
    search,
    clear,
  };
}

// ============================================================================
// useAddConfirmation - Add new confirmation
// ============================================================================

export function useAddConfirmation() {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addConfirmation = useCallback(async (
    data: Parameters<typeof confirmationStorage.addConfirmation>[0]
  ): Promise<Confirmation | null> => {
    setIsAdding(true);
    setError(null);

    try {
      const result = await confirmationStorage.addConfirmation(data);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to add confirmation');
      return null;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const addRestaurantConfirmation = useCallback(async (
    data: Parameters<typeof confirmationStorage.addRestaurantConfirmation>[0]
  ) => {
    setIsAdding(true);
    setError(null);

    try {
      return await confirmationStorage.addRestaurantConfirmation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add restaurant confirmation');
      return null;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const addActivityConfirmation = useCallback(async (
    data: Parameters<typeof confirmationStorage.addActivityConfirmation>[0]
  ) => {
    setIsAdding(true);
    setError(null);

    try {
      return await confirmationStorage.addActivityConfirmation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add activity confirmation');
      return null;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const addFlightConfirmation = useCallback(async (
    data: Parameters<typeof confirmationStorage.addFlightConfirmation>[0]
  ) => {
    setIsAdding(true);
    setError(null);

    try {
      return await confirmationStorage.addFlightConfirmation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add flight confirmation');
      return null;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const addHotelConfirmation = useCallback(async (
    data: Parameters<typeof confirmationStorage.addHotelConfirmation>[0]
  ) => {
    setIsAdding(true);
    setError(null);

    try {
      return await confirmationStorage.addHotelConfirmation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to add hotel confirmation');
      return null;
    } finally {
      setIsAdding(false);
    }
  }, []);

  return {
    isAdding,
    error,
    addConfirmation,
    addRestaurantConfirmation,
    addActivityConfirmation,
    addFlightConfirmation,
    addHotelConfirmation,
    clearError: () => setError(null),
  };
}

// ============================================================================
// useTickets - Manage tickets for a confirmation
// ============================================================================

export function useTickets(confirmationId: string) {
  const { confirmation, refresh } = useConfirmation(confirmationId);
  const [isAdding, setIsAdding] = useState(false);

  const tickets = confirmation?.tickets || [];

  const addTicket = useCallback(async (
    ticketData: Omit<Ticket, 'id' | 'createdAt' | 'isUsed'>
  ) => {
    setIsAdding(true);
    try {
      const ticket = await confirmationStorage.addTicket(confirmationId, ticketData);
      await refresh();
      return ticket;
    } finally {
      setIsAdding(false);
    }
  }, [confirmationId, refresh]);

  const updateTicket = useCallback(async (
    ticketId: string,
    updates: Partial<Ticket>
  ) => {
    const result = await confirmationStorage.updateTicket(ticketId, updates);
    await refresh();
    return result;
  }, [refresh]);

  const deleteTicket = useCallback(async (ticketId: string) => {
    const result = await confirmationStorage.deleteTicket(ticketId);
    await refresh();
    return result;
  }, [refresh]);

  const markAsUsed = useCallback(async (ticketId: string) => {
    const result = await confirmationStorage.markTicketAsUsed(ticketId);
    await refresh();
    return result;
  }, [refresh]);

  const saveTicketImage = useCallback(async (
    ticketId: string,
    imageUri: string
  ) => {
    const result = await confirmationStorage.saveTicketImage(ticketId, imageUri);
    await refresh();
    return result;
  }, [refresh]);

  const saveQRCode = useCallback(async (
    ticketId: string,
    base64Data: string
  ) => {
    const result = await confirmationStorage.saveQRCodeImage(ticketId, base64Data);
    await refresh();
    return result;
  }, [refresh]);

  return {
    tickets,
    isAdding,
    addTicket,
    updateTicket,
    deleteTicket,
    markAsUsed,
    saveTicketImage,
    saveQRCode,
  };
}

// ============================================================================
// useConfirmationWallet - All-in-one hook for wallet view
// ============================================================================

export function useConfirmationWallet() {
  const [filter, setFilter] = useState<ConfirmationFilter>({});
  const [sort, setSort] = useState<ConfirmationSort>({ field: 'date', direction: 'asc' });
  const [selectedConfirmation, setSelectedConfirmation] = useState<Confirmation | null>(null);
  const [showTicketViewer, setShowTicketViewer] = useState(false);

  const { confirmations, groupedByDate, isLoading, refresh } = useConfirmations({
    filter,
    sort,
  });

  const { todayConfirmations, tomorrowConfirmations } = useUpcomingConfirmations();

  const { results: searchResults, isSearching, search, query, clear: clearSearch } = useConfirmationSearch();

  const filterByType = useCallback((type: ConfirmationType | null) => {
    setFilter(prev => ({
      ...prev,
      types: type ? [type] : undefined,
    }));
  }, []);

  const filterByStatus = useCallback((status: ConfirmationStatus | null) => {
    setFilter(prev => ({
      ...prev,
      status: status ? [status] : undefined,
    }));
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    setFilter(prev => ({
      ...prev,
      dateRange: { start, end },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({});
  }, []);

  const sortBy = useCallback((field: ConfirmationSort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const selectConfirmation = useCallback((confirmation: Confirmation) => {
    setSelectedConfirmation(confirmation);
  }, []);

  const viewTicket = useCallback((confirmation: Confirmation) => {
    setSelectedConfirmation(confirmation);
    setShowTicketViewer(true);
  }, []);

  const closeTicketViewer = useCallback(() => {
    setShowTicketViewer(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConfirmation(null);
    setShowTicketViewer(false);
  }, []);

  return {
    // Data
    confirmations: query ? searchResults : confirmations,
    groupedByDate,
    todayConfirmations,
    tomorrowConfirmations,
    
    // State
    isLoading,
    isSearching,
    filter,
    sort,
    searchQuery: query,
    
    // Selection
    selectedConfirmation,
    showTicketViewer,
    selectConfirmation,
    viewTicket,
    closeTicketViewer,
    clearSelection,
    
    // Actions
    search,
    clearSearch,
    filterByType,
    filterByStatus,
    setDateRange,
    clearFilters,
    sortBy,
    refresh,
  };
}
