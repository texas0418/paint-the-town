// Anniversary Hook for Paint the Town
import { useState, useEffect, useCallback } from 'react';
import anniversaryService from '../services/anniversaryService';
import {
  Anniversary,
  CreateAnniversaryInput,
  UpdateAnniversaryInput,
  UpcomingAnniversary,
  AnniversaryStats,
  AnniversaryReminder,
  MilestoneSuggestion,
  AnniversaryFilters,
  AnniversarySortOption,
} from '../types/anniversary';

export interface UseAnniversaryReturn {
  // State
  anniversaries: Anniversary[];
  upcomingAnniversaries: UpcomingAnniversary[];
  stats: AnniversaryStats | null;
  reminders: AnniversaryReminder[];
  unreadReminders: AnniversaryReminder[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAnniversaries: (filters?: AnniversaryFilters, sort?: AnniversarySortOption) => Promise<void>;
  loadUpcoming: (daysAhead?: number) => Promise<void>;
  loadStats: () => Promise<void>;
  loadReminders: () => Promise<void>;
  createAnniversary: (input: CreateAnniversaryInput) => Promise<Anniversary | null>;
  updateAnniversary: (id: string, input: UpdateAnniversaryInput) => Promise<Anniversary | null>;
  deleteAnniversary: (id: string) => Promise<boolean>;
  markReminderRead: (reminderId: string) => Promise<void>;
  toggleSuggestionBookmark: (suggestionId: string) => Promise<boolean>;
  getSuggestions: (anniversaryId: string) => Promise<MilestoneSuggestion[]>;
  getMilestoneProgress: (anniversaryDate: string) => { current: number; next: any; progress: number };
  refresh: () => Promise<void>;
}

export function useAnniversary(): UseAnniversaryReturn {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [upcomingAnniversaries, setUpcomingAnniversaries] = useState<UpcomingAnniversary[]>([]);
  const [stats, setStats] = useState<AnniversaryStats | null>(null);
  const [reminders, setReminders] = useState<AnniversaryReminder[]>([]);
  const [unreadReminders, setUnreadReminders] = useState<AnniversaryReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnniversaries = useCallback(async (
    filters?: AnniversaryFilters,
    sort: AnniversarySortOption = 'upcoming'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await anniversaryService.getFilteredAnniversaries(filters, sort);
      setAnniversaries(data);
    } catch (e) {
      setError('Failed to load anniversaries');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUpcoming = useCallback(async (daysAhead: number = 90) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await anniversaryService.getUpcomingAnniversaries(daysAhead);
      setUpcomingAnniversaries(data);
    } catch (e) {
      setError('Failed to load upcoming anniversaries');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await anniversaryService.getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  const loadReminders = useCallback(async () => {
    try {
      await anniversaryService.generateReminders();
      const all = await anniversaryService.getReminders();
      const unread = await anniversaryService.getUnreadReminders();
      setReminders(all);
      setUnreadReminders(unread);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    }
  }, []);

  const createAnniversary = useCallback(async (input: CreateAnniversaryInput): Promise<Anniversary | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newAnniversary = await anniversaryService.createAnniversary(input);
      setAnniversaries(prev => [...prev, newAnniversary]);
      return newAnniversary;
    } catch (e) {
      setError('Failed to create anniversary');
      console.error(e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAnniversary = useCallback(async (
    id: string,
    input: UpdateAnniversaryInput
  ): Promise<Anniversary | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await anniversaryService.updateAnniversary(id, input);
      if (updated) {
        setAnniversaries(prev => prev.map(a => a.id === id ? updated : a));
      }
      return updated;
    } catch (e) {
      setError('Failed to update anniversary');
      console.error(e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAnniversary = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const success = await anniversaryService.deleteAnniversary(id);
      if (success) {
        setAnniversaries(prev => prev.filter(a => a.id !== id));
      }
      return success;
    } catch (e) {
      setError('Failed to delete anniversary');
      console.error(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markReminderRead = useCallback(async (reminderId: string) => {
    try {
      await anniversaryService.markReminderAsRead(reminderId);
      setUnreadReminders(prev => prev.filter(r => r.id !== reminderId));
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, isRead: true } : r
      ));
    } catch (e) {
      console.error('Failed to mark reminder as read:', e);
    }
  }, []);

  const toggleSuggestionBookmark = useCallback(async (suggestionId: string): Promise<boolean> => {
    try {
      return await anniversaryService.toggleBookmark(suggestionId);
    } catch (e) {
      console.error('Failed to toggle bookmark:', e);
      return false;
    }
  }, []);

  const getSuggestions = useCallback(async (anniversaryId: string): Promise<MilestoneSuggestion[]> => {
    try {
      return await anniversaryService.getSuggestionsForAnniversary(anniversaryId);
    } catch (e) {
      console.error('Failed to get suggestions:', e);
      return [];
    }
  }, []);

  const getMilestoneProgress = useCallback((anniversaryDate: string) => {
    return anniversaryService.getMilestoneProgress(anniversaryDate);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadAnniversaries(),
      loadUpcoming(),
      loadStats(),
      loadReminders(),
    ]);
  }, [loadAnniversaries, loadUpcoming, loadStats, loadReminders]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  return {
    anniversaries,
    upcomingAnniversaries,
    stats,
    reminders,
    unreadReminders,
    isLoading,
    error,
    loadAnniversaries,
    loadUpcoming,
    loadStats,
    loadReminders,
    createAnniversary,
    updateAnniversary,
    deleteAnniversary,
    markReminderRead,
    toggleSuggestionBookmark,
    getSuggestions,
    getMilestoneProgress,
    refresh,
  };
}

export default useAnniversary;
