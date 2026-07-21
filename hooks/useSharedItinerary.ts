// ============================================================================
// useSharedItinerary Hook
// Manages sharing date night itineraries with partners
// ============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert, Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import {
  SharedItinerary,
  SharedItineraryView,
  SharedViewActivity,
  SurpriseMode,
  SurpriseActivity,
  TeaseLevel,
  ShareAccessLevel,
  PartnerSuggestion,
  ShareInvite,
  generateShareCode,
  generateShareUrl,
  isShareExpired,
  canViewShare,
  getActivityDisplayInfo,
} from '@/types/sharing';

const STORAGE_KEY = '@w4nder/shared_itineraries';

interface UseSharedItineraryOptions {
  itineraryId: string;
  itinerary: any; // Your DateNightItinerary type
  creatorName?: string;
}

// ============================================================================
// Main Hook - For Itinerary Creator
// ============================================================================

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export function useSharedItinerary({
  itineraryId,
  itinerary,
  creatorName = 'Your Partner',
}: UseSharedItineraryOptions) {
  const [sharedItinerary, setSharedItinerary] = useState<SharedItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [surpriseActivities, setSurpriseActivities] = useState<Map<string, SurpriseActivity>>(new Map());
  const [suggestions, setSuggestions] = useState<PartnerSuggestion[]>([]);

  // Load existing share on mount
  useEffect(() => {
    loadSharedItinerary();
  }, [itineraryId]);

  const loadSharedItinerary = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}/${itineraryId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setSharedItinerary(data.sharedItinerary);
        setSurpriseActivities(new Map(data.surpriseActivities || []));
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load shared itinerary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSharedItinerary = async (
    share: SharedItinerary | null,
    surprises: Map<string, SurpriseActivity>,
    suggs: PartnerSuggestion[]
  ) => {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY}/${itineraryId}`,
        JSON.stringify({
          sharedItinerary: share,
          surpriseActivities: Array.from(surprises.entries()),
          suggestions: suggs,
        })
      );
    } catch (error) {
      console.error('Failed to save shared itinerary:', error);
    }
  };

  // ============================================================================
  // Create Share
  // ============================================================================

  const createShare = useCallback(async (options?: {
    accessLevel?: ShareAccessLevel;
    expiresInDays?: number;
    password?: string;
    maxViews?: number;
    surpriseMode?: Partial<SurpriseMode>;
    permissions?: {
      canSeeLocation?: boolean;
      canSeeCost?: boolean;
      canSeeNotes?: boolean;
      canAddToCalendar?: boolean;
      canSuggestChanges?: boolean;
    };
  // eslint-disable-next-line complexity -- tracked in #1
  }): Promise<ShareInvite> => {
    const shareCode = generateShareCode();
    const shareUrl = generateShareUrl(shareCode);
    
    const newShare: SharedItinerary = {
      id: `share_${Date.now()}`,
      itineraryId,
      shareCode,
      shareUrl,
      createdAt: new Date().toISOString(),
      expiresAt: options?.expiresInDays 
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      accessLevel: options?.accessLevel || 'view_only',
      password: options?.password,
      maxViews: options?.maxViews,
      viewCount: 0,
      surpriseMode: {
        enabled: options?.surpriseMode?.enabled ?? false,
        revealAt: options?.surpriseMode?.revealAt,
        revealOnArrival: options?.surpriseMode?.revealOnArrival ?? false,
        teaseLevel: options?.surpriseMode?.teaseLevel || 'category_hint',
      },
      surpriseActivities: Array.from(surpriseActivities.keys()),
      partnerName: itinerary?.partnerName,
      partnerViewed: false,
      canSeeLocation: options?.permissions?.canSeeLocation ?? true,
      canSeeCost: options?.permissions?.canSeeCost ?? false,
      canSeeNotes: options?.permissions?.canSeeNotes ?? false,
      canAddToCalendar: options?.permissions?.canAddToCalendar ?? true,
      canSuggestChanges: options?.permissions?.canSuggestChanges ?? false,
      isActive: true,
    };

    setSharedItinerary(newShare);
    await saveSharedItinerary(newShare, surpriseActivities, suggestions);

    const message = generateShareMessage(newShare, itinerary, creatorName);

    return {
      shareCode,
      shareUrl,
      message,
      expiresAt: newShare.expiresAt,
    };
  }, [itineraryId, itinerary, surpriseActivities, suggestions, creatorName]);

  // ============================================================================
  // Surprise Management
  // ============================================================================

  const markAsSurprise = useCallback((
    activityId: string,
    options?: {
      teaseLevel?: TeaseLevel;
      customHint?: string;
      revealAt?: string;
    }
  ) => {
    const surprise: SurpriseActivity = {
      activityId,
      teaseLevel: options?.teaseLevel || 'category_hint',
      customHint: options?.customHint,
      revealAt: options?.revealAt,
      isRevealed: false,
    };

    setSurpriseActivities(prev => {
      const updated = new Map(prev);
      updated.set(activityId, surprise);
      
      if (sharedItinerary) {
        const updatedShare = {
          ...sharedItinerary,
          surpriseActivities: Array.from(updated.keys()),
        };
        setSharedItinerary(updatedShare);
        saveSharedItinerary(updatedShare, updated, suggestions);
      }
      
      return updated;
    });
  }, [sharedItinerary, suggestions]);

  const removeSurprise = useCallback((activityId: string) => {
    setSurpriseActivities(prev => {
      const updated = new Map(prev);
      updated.delete(activityId);
      
      if (sharedItinerary) {
        const updatedShare = {
          ...sharedItinerary,
          surpriseActivities: Array.from(updated.keys()),
        };
        setSharedItinerary(updatedShare);
        saveSharedItinerary(updatedShare, updated, suggestions);
      }
      
      return updated;
    });
  }, [sharedItinerary, suggestions]);

  const revealSurprise = useCallback((activityId: string) => {
    setSurpriseActivities(prev => {
      const updated = new Map(prev);
      const surprise = updated.get(activityId);
      if (surprise) {
        updated.set(activityId, { ...surprise, isRevealed: true });
      }
      
      if (sharedItinerary) {
        saveSharedItinerary(sharedItinerary, updated, suggestions);
      }
      
      return updated;
    });
  }, [sharedItinerary, suggestions]);

  const revealAllSurprises = useCallback(() => {
    setSurpriseActivities(prev => {
      const updated = new Map(prev);
      for (const [id, surprise] of updated) {
        updated.set(id, { ...surprise, isRevealed: true });
      }
      
      if (sharedItinerary) {
        saveSharedItinerary(sharedItinerary, updated, suggestions);
      }
      
      return updated;
    });
  }, [sharedItinerary, suggestions]);

  const updateSurpriseSettings = useCallback((
    activityId: string,
    updates: Partial<SurpriseActivity>
  ) => {
    setSurpriseActivities(prev => {
      const updated = new Map(prev);
      const existing = updated.get(activityId);
      if (existing) {
        updated.set(activityId, { ...existing, ...updates });
      }
      
      if (sharedItinerary) {
        saveSharedItinerary(sharedItinerary, updated, suggestions);
      }
      
      return updated;
    });
  }, [sharedItinerary, suggestions]);

  // ============================================================================
  // Share Management
  // ============================================================================

  const updateShareSettings = useCallback(async (
    updates: Partial<Omit<SharedItinerary, 'id' | 'itineraryId' | 'shareCode' | 'shareUrl' | 'createdAt'>>
  ) => {
    if (!sharedItinerary) return;

    const updated: SharedItinerary = {
      ...sharedItinerary,
      ...updates,
    };

    setSharedItinerary(updated);
    await saveSharedItinerary(updated, surpriseActivities, suggestions);
  }, [sharedItinerary, surpriseActivities, suggestions]);

  const revokeShare = useCallback(async () => {
    if (!sharedItinerary) return;

    const updated: SharedItinerary = {
      ...sharedItinerary,
      isActive: false,
      revokedAt: new Date().toISOString(),
    };

    setSharedItinerary(updated);
    await saveSharedItinerary(updated, surpriseActivities, suggestions);
  }, [sharedItinerary, surpriseActivities, suggestions]);

  const deleteShare = useCallback(async () => {
    setSharedItinerary(null);
    await AsyncStorage.removeItem(`${STORAGE_KEY}/${itineraryId}`);
  }, [itineraryId]);

  const regenerateShareCode = useCallback(async () => {
    if (!sharedItinerary) return null;

    const newCode = generateShareCode();
    const newUrl = generateShareUrl(newCode);

    const updated: SharedItinerary = {
      ...sharedItinerary,
      shareCode: newCode,
      shareUrl: newUrl,
    };

    setSharedItinerary(updated);
    await saveSharedItinerary(updated, surpriseActivities, suggestions);

    return { shareCode: newCode, shareUrl: newUrl };
  }, [sharedItinerary, surpriseActivities, suggestions]);

  // ============================================================================
  // Sharing Actions
  // ============================================================================

  const shareViaSystem = useCallback(async () => {
    if (!sharedItinerary) {
      Alert.alert('Not Shared', 'Please create a share link first.');
      return;
    }

    const message = generateShareMessage(sharedItinerary, itinerary, creatorName);

    try {
      await Share.share({
        message,
        title: `${itinerary?.name || 'Date Night'} Itinerary`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [sharedItinerary, itinerary, creatorName]);

  const copyShareLink = useCallback(async () => {
    if (!sharedItinerary) return;

    await Clipboard.setStringAsync(sharedItinerary.shareUrl);
    Alert.alert('Copied!', 'Share link copied to clipboard');
  }, [sharedItinerary]);

  const copyShareCode = useCallback(async () => {
    if (!sharedItinerary) return;

    await Clipboard.setStringAsync(sharedItinerary.shareCode);
    Alert.alert('Copied!', `Code "${sharedItinerary.shareCode}" copied to clipboard`);
  }, [sharedItinerary]);

  // ============================================================================
  // Partner Suggestions
  // ============================================================================

  const respondToSuggestion = useCallback(async (
    suggestionId: string,
    accept: boolean,
    response?: string
  ) => {
    setSuggestions(prev => {
      const updated = prev.map(s => 
        s.id === suggestionId
          ? {
              ...s,
              status: accept ? 'accepted' : 'declined' as const,
              respondedAt: new Date().toISOString(),
              response,
            }
          : s
      );
      
      if (sharedItinerary) {
        saveSharedItinerary(sharedItinerary, surpriseActivities, updated);
      }
      
      return updated;
    });
  }, [sharedItinerary, surpriseActivities]);

  // ============================================================================
  // Generate Partner View
  // ============================================================================

  // eslint-disable-next-line complexity -- tracked in #1
  const getPartnerView = useMemo((): SharedItineraryView | null => {
    if (!itinerary) return null;

    const activities: SharedViewActivity[] = (itinerary.activities || []).map((activity: any) => {
      const surpriseActivity = surpriseActivities.get(activity.id);
      return getActivityDisplayInfo(
        activity,
        surpriseActivity,
        sharedItinerary?.surpriseMode
      );
    });

    const surpriseCount = activities.filter(a => a.isSurprise).length;

    return {
      id: itineraryId,
      name: itinerary.name || 'Date Night',
      date: itinerary.date,
      greeting: itinerary.greeting || `${creatorName} planned something special for you!`,
      partnerName: itinerary.partnerName || 'Partner',
      creatorName,
      activityCount: activities.length,
      surpriseCount,
      totalDuration: activities.reduce((sum, a) => sum + (a.duration || 0), 0),
      activities,
      canSeeLocation: sharedItinerary?.canSeeLocation ?? true,
      canSeeCost: sharedItinerary?.canSeeCost ?? false,
      canAddToCalendar: sharedItinerary?.canAddToCalendar ?? true,
      lastUpdated: new Date().toISOString(),
      shareSettings: {
        surpriseMode: sharedItinerary?.surpriseMode || { enabled: false, revealOnArrival: false, teaseLevel: 'category_hint' },
        accessLevel: sharedItinerary?.accessLevel || 'view_only',
      },
    };
  }, [itinerary, itineraryId, sharedItinerary, surpriseActivities, creatorName]);

  // ============================================================================
  // Computed State
  // ============================================================================

  const isShared = !!sharedItinerary?.isActive;
  const hasExpired = sharedItinerary ? isShareExpired(sharedItinerary) : false;
  const surpriseCount = surpriseActivities.size;
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  return {
    // State
    sharedItinerary,
    isLoading,
    isShared,
    hasExpired,
    surpriseActivities,
    surpriseCount,
    suggestions,
    pendingSuggestions,
    partnerView: getPartnerView,

    // Share Management
    createShare,
    updateShareSettings,
    revokeShare,
    deleteShare,
    regenerateShareCode,

    // Sharing Actions
    shareViaSystem,
    copyShareLink,
    copyShareCode,

    // Surprise Management
    markAsSurprise,
    removeSurprise,
    revealSurprise,
    revealAllSurprises,
    updateSurpriseSettings,

    // Suggestions
    respondToSuggestion,
  };
}

// ============================================================================
// Partner View Hook - For Partner Accessing Shared Itinerary
// ============================================================================

interface UsePartnerViewOptions {
  shareCode?: string;
  shareUrl?: string;
}

export function usePartnerView({ shareCode, shareUrl }: UsePartnerViewOptions) {
  const [sharedView, setSharedView] = useState<SharedItineraryView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);

  const loadSharedView = useCallback(async (password?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch from your backend API
      // For now, we'll simulate loading from local storage
      
      const allKeys = await AsyncStorage.getAllKeys();
      const shareKeys = allKeys.filter(k => k.startsWith(STORAGE_KEY));
      
      for (const key of shareKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          const share = data.sharedItinerary as SharedItinerary;
          
          if (share && (share.shareCode === shareCode || share.shareUrl === shareUrl)) {
            // Check if password required
            if (share.password && share.password !== password) {
              setRequiresPassword(true);
              setIsLoading(false);
              return;
            }

            // Check if can view
            if (!canViewShare(share, password)) {
              setError('This share link has expired or is no longer available.');
              setIsLoading(false);
              return;
            }

            // In production, this would come from the API
            // For demo, we'll construct a mock view
            setSharedView({
              id: share.itineraryId,
              name: 'Date Night',
              date: new Date().toISOString(),
              greeting: 'Someone special planned this for you!',
              partnerName: share.partnerName || 'Partner',
              creatorName: 'Your Partner',
              activityCount: 0,
              surpriseCount: 0,
              activities: [],
              canSeeLocation: share.canSeeLocation,
              canSeeCost: share.canSeeCost,
              canAddToCalendar: share.canAddToCalendar,
              lastUpdated: new Date().toISOString(),
              shareSettings: {
                surpriseMode: share.surpriseMode,
                accessLevel: share.accessLevel,
              },
            });
            
            setRequiresPassword(false);
            setIsLoading(false);
            return;
          }
        }
      }

      setError('Share not found. Please check the code and try again.');
    } catch (err) {
      console.error('Failed to load shared view:', err);
      setError('Failed to load. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [shareCode, shareUrl]);

  useEffect(() => {
    if (shareCode || shareUrl) {
      loadSharedView();
    }
  }, [shareCode, shareUrl]);

  const submitPassword = useCallback((password: string) => {
    loadSharedView(password);
  }, [loadSharedView]);

  const submitSuggestion = useCallback(async (suggestion: Omit<PartnerSuggestion, 'id' | 'sharedItineraryId' | 'status' | 'createdAt'>) => {
    // In production, this would send to the backend
    Alert.alert('Suggestion Sent', 'Your suggestion has been sent to your partner!');
  }, []);

  const addToCalendar = useCallback(async () => {
    if (!sharedView?.canAddToCalendar) {
      Alert.alert('Not Available', 'Calendar access is not enabled for this share.');
      return;
    }
    
    // In production, use expo-calendar to add events
    Alert.alert('Added!', 'Date night added to your calendar');
  }, [sharedView]);

  return {
    sharedView,
    isLoading,
    error,
    requiresPassword,
    submitPassword,
    submitSuggestion,
    addToCalendar,
    refresh: loadSharedView,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateShareMessage(
  share: SharedItinerary,
  itinerary: any,
  creatorName: string
): string {
  const date = itinerary?.date 
    ? new Date(itinerary.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'soon';

  const surpriseCount = share.surpriseActivities.length;
  const surpriseText = surpriseCount > 0 
    ? `\n\n🎁 ${surpriseCount} surprise${surpriseCount > 1 ? 's' : ''} await${surpriseCount === 1 ? 's' : ''} you!`
    : '';

  return `💕 ${creatorName} planned a date night for you!

📅 ${date}
${surpriseText}

View the itinerary:
${share.shareUrl}

Or enter code: ${share.shareCode}`;
}
