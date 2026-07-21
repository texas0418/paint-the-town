// Paint the Town Preference Sync - usePreferenceSync Hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPreferences,
  PreferenceCategory,
  PreferenceStrength,
  PreferenceSource,
  Companion,
  MergedPreferences,
  PreferenceConflict,
  ConflictResolution,
  SuggestionScore,
  SuggestionSettings,
  LearningInsight,
  SyncRecord,
  PreferenceSyncState,
  PreferenceLearningEvent,
} from '../types/preferences';
import { preferenceService } from '../services/preferenceService';

interface UsePreferenceSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;  // milliseconds
  userId?: string;
}

interface UsePreferenceSyncReturn {
  // State
  state: PreferenceSyncState;
  isReady: boolean;
  
  // Preference CRUD
  preferences: UserPreferences | null;
  updatePreference: (
    category: PreferenceCategory,
    field: string,
    value: any,
    strength?: PreferenceStrength,
    source?: PreferenceSource
  ) => Promise<boolean>;
  resetPreferences: () => Promise<void>;
  
  // Companion management
  companions: Companion[];
  addCompanion: (companion: Omit<Companion, 'id'>) => Promise<boolean>;
  updateCompanion: (companion: Companion) => Promise<boolean>;
  removeCompanion: (companionId: string) => Promise<boolean>;
  
  // Merging
  mergedPreferences: MergedPreferences | null;
  mergeWithCompanions: (companionIds: string[], weights?: number[]) => Promise<MergedPreferences | null>;
  clearMergedPreferences: () => void;
  
  // Conflicts
  conflicts: PreferenceConflict[];
  resolveConflict: (
    conflictId: string,
    resolution: ConflictResolution,
    resolvedValue?: any
  ) => Promise<boolean>;
  unresolvedConflictCount: number;
  
  // Suggestion scoring
  suggestionSettings: SuggestionSettings;
  updateSuggestionSettings: (settings: Partial<SuggestionSettings>) => Promise<void>;
  scoreRestaurant: (restaurant: any) => SuggestionScore;
  scoreActivity: (activity: any) => SuggestionScore;
  scoreItems: (items: any[], type: 'restaurant' | 'activity') => SuggestionScore[];
  
  // Learning
  learningInsights: LearningInsight[];
  pendingInsights: LearningInsight[];
  recordEvent: (event: Omit<PreferenceLearningEvent, 'id' | 'timestamp'>) => Promise<void>;
  applyInsight: (insightId: string) => Promise<boolean>;
  rejectInsight: (insightId: string) => Promise<boolean>;
  
  // Sync
  syncStatus: string;
  lastSyncTime: string | null;
  syncHistory: SyncRecord[];
  syncNow: () => Promise<SyncRecord>;
  
  // Export/Import
  exportPreferences: () => Promise<string | null>;
  importPreferences: (jsonData: string) => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
  
  // Utilities
  getPreferenceStrength: (category: PreferenceCategory, field: string) => PreferenceStrength;
  getPreferenceSource: (category: PreferenceCategory, field: string) => PreferenceSource;
  getCategoryCompleteness: (category: PreferenceCategory) => number;
  refresh: () => Promise<void>;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export function usePreferenceSync(
  options: UsePreferenceSyncOptions = {}
): UsePreferenceSyncReturn {
  const { autoSync = true, syncInterval = 5 * 60 * 1000, userId = 'default_user' } = options;
  
  // State
  const [state, setState] = useState<PreferenceSyncState>({
    preferences: null,
    companions: [],
    mergedPreferences: null,
    conflicts: [],
    suggestionSettings: {
      enablePersonalization: true,
      strictFiltering: false,
      showScores: true,
      minScore: 40,
      prioritizeNewExperiences: true,
      balanceCategories: true,
    },
    learningInsights: [],
    syncHistory: [],
    isLoading: true,
    isSyncing: false,
    error: null,
    lastSyncTime: null,
  });
  
  const [isReady, setIsReady] = useState(false);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const loadInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let preferences = await preferenceService.getPreferences();
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = preferenceService.createDefaultPreferences(userId);
        await preferenceService.savePreferences(preferences);
      }
      
      const companions = await preferenceService.getCompanions();
      const suggestionSettings = await preferenceService.getSuggestionSettings();
      const learningInsights = await preferenceService.getLearningInsights();
      const syncHistory = await preferenceService.getSyncHistory();
      
      setState(prev => ({
        ...prev,
        preferences,
        companions,
        suggestionSettings,
        learningInsights,
        syncHistory,
        lastSyncTime: preferences?.lastSynced || null,
        isLoading: false,
      }));
      
      setIsReady(true);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load preferences',
      }));
    }
  }, [userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !isReady) return;
    
    const interval = setInterval(async () => {
      if (state.preferences?.syncStatus === 'pending') {
        await syncNow();
      }
    }, syncInterval);
    
    return () => clearInterval(interval);
  }, [autoSync, syncInterval, isReady, state.preferences?.syncStatus]);

  // ============================================================================
  // PREFERENCE CRUD
  // ============================================================================

  const updatePreference = useCallback(async (
    category: PreferenceCategory,
    field: string,
    value: any,
    strength: PreferenceStrength = 'moderate',
    source: PreferenceSource = 'explicit'
  ): Promise<boolean> => {
    const success = await preferenceService.updatePreference(category, field, value, strength, source);
    
    if (success) {
      const updated = await preferenceService.getPreferences();
      setState(prev => ({ ...prev, preferences: updated }));
    }
    
    return success;
  }, []);

  const resetPreferences = useCallback(async () => {
    const newPrefs = preferenceService.createDefaultPreferences(userId);
    await preferenceService.savePreferences(newPrefs);
    setState(prev => ({ ...prev, preferences: newPrefs }));
  }, [userId]);

  // ============================================================================
  // COMPANION MANAGEMENT
  // ============================================================================

  const addCompanion = useCallback(async (
    companionData: Omit<Companion, 'id'>
  ): Promise<boolean> => {
    const companion: Companion = {
      ...companionData,
      id: `companion_${Date.now()}`,
    };
    
    const success = await preferenceService.saveCompanion(companion);
    
    if (success) {
      const updated = await preferenceService.getCompanions();
      setState(prev => ({ ...prev, companions: updated }));
    }
    
    return success;
  }, []);

  const updateCompanion = useCallback(async (companion: Companion): Promise<boolean> => {
    const success = await preferenceService.saveCompanion(companion);
    
    if (success) {
      const updated = await preferenceService.getCompanions();
      setState(prev => ({ ...prev, companions: updated }));
    }
    
    return success;
  }, []);

  const removeCompanion = useCallback(async (companionId: string): Promise<boolean> => {
    const success = await preferenceService.removeCompanion(companionId);
    
    if (success) {
      const updated = await preferenceService.getCompanions();
      setState(prev => ({ ...prev, companions: updated }));
    }
    
    return success;
  }, []);

  // ============================================================================
  // MERGING
  // ============================================================================

  const mergeWithCompanions = useCallback(async (
    companionIds: string[],
    weights?: number[]
  ): Promise<MergedPreferences | null> => {
    if (!state.preferences) return null;
    
    const selectedCompanions = state.companions.filter(c => companionIds.includes(c.id));
    const companionPrefs = selectedCompanions
      .filter(c => c.preferences)
      .map(c => c.preferences!);
    const companionNames = selectedCompanions.map(c => c.name);
    
    if (companionPrefs.length === 0) {
      // No companion preferences available - create mock for demo
      return null;
    }
    
    const merged = await preferenceService.mergePreferences(
      state.preferences,
      companionPrefs,
      companionNames,
      weights
    );
    
    setState(prev => ({
      ...prev,
      mergedPreferences: merged,
      conflicts: merged.conflicts,
    }));
    
    return merged;
  }, [state.preferences, state.companions]);

  const clearMergedPreferences = useCallback(() => {
    setState(prev => ({
      ...prev,
      mergedPreferences: null,
      conflicts: [],
    }));
  }, []);

  // ============================================================================
  // CONFLICTS
  // ============================================================================

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: ConflictResolution,
    resolvedValue?: any
  ): Promise<boolean> => {
    const success = await preferenceService.resolveConflict(conflictId, resolution, resolvedValue);
    
    if (success) {
      setState(prev => ({
        ...prev,
        conflicts: prev.conflicts.map(c =>
          c.id === conflictId
            ? { ...c, resolvedValue: resolvedValue || c.userValue, resolvedBy: 'user' as const }
            : c
        ),
      }));
    }
    
    return success;
  }, []);

  const unresolvedConflictCount = useMemo(() => {
    return state.conflicts.filter(c => !c.resolvedValue).length;
  }, [state.conflicts]);

  // ============================================================================
  // SUGGESTION SCORING
  // ============================================================================

  const updateSuggestionSettings = useCallback(async (
    settings: Partial<SuggestionSettings>
  ): Promise<void> => {
    const updated = { ...state.suggestionSettings, ...settings };
    await preferenceService.saveSuggestionSettings(updated);
    setState(prev => ({ ...prev, suggestionSettings: updated }));
  }, [state.suggestionSettings]);

  const scoreRestaurant = useCallback((restaurant: any): SuggestionScore => {
    const prefsToUse = state.mergedPreferences || state.preferences;
    if (!prefsToUse) {
      return {
        itemId: restaurant.id,
        itemType: 'restaurant',
        overallScore: 50,
        matchBreakdown: [],
        topMatches: [],
        potentialIssues: [],
        personalized: false,
        confidence: 0,
      };
    }
    return preferenceService.scoreRestaurant(restaurant, prefsToUse);
  }, [state.preferences, state.mergedPreferences]);

  const scoreActivity = useCallback((activity: any): SuggestionScore => {
    const prefsToUse = state.mergedPreferences || state.preferences;
    if (!prefsToUse) {
      return {
        itemId: activity.id,
        itemType: 'activity',
        overallScore: 50,
        matchBreakdown: [],
        topMatches: [],
        potentialIssues: [],
        personalized: false,
        confidence: 0,
      };
    }
    return preferenceService.scoreActivity(activity, prefsToUse);
  }, [state.preferences, state.mergedPreferences]);

  const scoreItems = useCallback((
    items: any[],
    type: 'restaurant' | 'activity'
  ): SuggestionScore[] => {
    return items.map(item =>
      type === 'restaurant' ? scoreRestaurant(item) : scoreActivity(item)
    ).sort((a, b) => b.overallScore - a.overallScore);
  }, [scoreRestaurant, scoreActivity]);

  // ============================================================================
  // LEARNING
  // ============================================================================

  const recordEvent = useCallback(async (
    event: Omit<PreferenceLearningEvent, 'id' | 'timestamp'>
  ): Promise<void> => {
    await preferenceService.recordLearningEvent(event);
    
    // Refresh insights
    const insights = await preferenceService.getLearningInsights();
    setState(prev => ({ ...prev, learningInsights: insights }));
  }, []);

  const applyInsight = useCallback(async (insightId: string): Promise<boolean> => {
    const success = await preferenceService.applyInsight(insightId);
    
    if (success) {
      const insights = await preferenceService.getLearningInsights();
      const preferences = await preferenceService.getPreferences();
      setState(prev => ({ ...prev, learningInsights: insights, preferences }));
    }
    
    return success;
  }, []);

  const rejectInsight = useCallback(async (insightId: string): Promise<boolean> => {
    const success = await preferenceService.rejectInsight(insightId);
    
    if (success) {
      const insights = await preferenceService.getLearningInsights();
      setState(prev => ({ ...prev, learningInsights: insights }));
    }
    
    return success;
  }, []);

  const pendingInsights = useMemo(() => {
    return state.learningInsights.filter(i => i.status === 'pending');
  }, [state.learningInsights]);

  // ============================================================================
  // SYNC
  // ============================================================================

  const syncNow = useCallback(async (): Promise<SyncRecord> => {
    setState(prev => ({ ...prev, isSyncing: true }));
    
    const record = await preferenceService.syncPreferences();
    const preferences = await preferenceService.getPreferences();
    const history = await preferenceService.getSyncHistory();
    
    setState(prev => ({
      ...prev,
      preferences,
      syncHistory: history,
      lastSyncTime: record.timestamp,
      isSyncing: false,
    }));
    
    return record;
  }, []);

  // ============================================================================
  // EXPORT / IMPORT
  // ============================================================================

  const exportPreferences = useCallback(async (): Promise<string | null> => {
    const data = await preferenceService.exportPreferences();
    return data ? JSON.stringify(data, null, 2) : null;
  }, []);

  const importPreferences = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonData);
      const success = await preferenceService.importPreferences(data);
      
      if (success) {
        await loadInitialData();
      }
      
      return success;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }, [loadInitialData]);

  const clearAllData = useCallback(async (): Promise<boolean> => {
    const success = await preferenceService.clearAllData();
    
    if (success) {
      await loadInitialData();
    }
    
    return success;
  }, [loadInitialData]);

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const getPreferenceStrength = useCallback((
    category: PreferenceCategory,
    field: string
  ): PreferenceStrength => {
    const metadataKey = `${category}.${field}`;
    return state.preferences?.metadata[metadataKey]?.strength || 'neutral';
  }, [state.preferences]);

  const getPreferenceSource = useCallback((
    category: PreferenceCategory,
    field: string
  ): PreferenceSource => {
    const metadataKey = `${category}.${field}`;
    return state.preferences?.metadata[metadataKey]?.source || 'default';
  }, [state.preferences]);

  const getCategoryCompleteness = useCallback((category: PreferenceCategory): number => {
    if (!state.preferences) return 0;
    
    const categoryPrefs = state.preferences[category];
    if (!categoryPrefs) return 0;
    
    const fields = Object.keys(categoryPrefs);
    const setFields = fields.filter(field => {
      const value = (categoryPrefs as any)[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== undefined);
      }
      return value !== null && value !== undefined;
    });
    
    return Math.round((setFields.length / fields.length) * 100);
  }, [state.preferences]);

  const refresh = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    state,
    isReady,
    
    preferences: state.preferences,
    updatePreference,
    resetPreferences,
    
    companions: state.companions,
    addCompanion,
    updateCompanion,
    removeCompanion,
    
    mergedPreferences: state.mergedPreferences,
    mergeWithCompanions,
    clearMergedPreferences,
    
    conflicts: state.conflicts,
    resolveConflict,
    unresolvedConflictCount,
    
    suggestionSettings: state.suggestionSettings,
    updateSuggestionSettings,
    scoreRestaurant,
    scoreActivity,
    scoreItems,
    
    learningInsights: state.learningInsights,
    pendingInsights,
    recordEvent,
    applyInsight,
    rejectInsight,
    
    syncStatus: state.preferences?.syncStatus || 'synced',
    lastSyncTime: state.lastSyncTime,
    syncHistory: state.syncHistory,
    syncNow,
    
    exportPreferences,
    importPreferences,
    clearAllData,
    
    getPreferenceStrength,
    getPreferenceSource,
    getCategoryCompleteness,
    refresh,
  };
}

export default usePreferenceSync;
