// ============================================================================
// useRSVP Hook
// Manages RSVP invitations and responses for date nights
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import {
  RSVP,
  RSVPStatus,
  RSVPInvite,
  RSVPResponse,
  RSVPReminder,
  getRSVPStatusLabel,
  isRSVPExpired,
} from '@/types/rsvp';
import { generateShareCode, generateShareUrl } from '@/types/sharing';

const STORAGE_KEY = '@w4nder/rsvps';

// ============================================================================
// Creator Hook - Send and manage RSVP invitations
// ============================================================================

interface UseRSVPCreatorOptions {
  itineraryId: string;
  itinerary: any;
  creatorName: string;
  sharedItineraryId?: string;
}

export function useRSVPCreator({
  itineraryId,
  itinerary,
  creatorName,
  sharedItineraryId,
}: UseRSVPCreatorOptions) {
  const [rsvp, setRSVP] = useState<RSVP | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing RSVP
  useEffect(() => {
    loadRSVP();
  }, [itineraryId]);

  const loadRSVP = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}/${itineraryId}`);
      if (stored) {
        setRSVP(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load RSVP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRSVP = async (data: RSVP) => {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}/${itineraryId}`, JSON.stringify(data));
      setRSVP(data);
    } catch (error) {
      console.error('Failed to save RSVP:', error);
    }
  };

  // Create RSVP invitation
  const createRSVPInvite = useCallback(async (options?: {
    personalMessage?: string;
    responseDeadline?: string;
    allowAlternativeDates?: boolean;
    allowDietaryInfo?: boolean;
    allowAccessibilityInfo?: boolean;
  // eslint-disable-next-line complexity -- tracked in #1
  }): Promise<RSVPInvite> => {
    const shareCode = generateShareCode();
    const shareUrl = generateShareUrl(shareCode);
    
    const newRSVP: RSVP = {
      id: `rsvp_${Date.now()}`,
      sharedItineraryId: sharedItineraryId || '',
      itineraryId,
      partnerName: itinerary?.partnerName || 'Partner',
      status: 'pending',
      canAttend: false,
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: options?.responseDeadline,
    };

    await saveRSVP(newRSVP);

    const invite: RSVPInvite = {
      id: newRSVP.id,
      itineraryId,
      itineraryName: itinerary?.name || 'Date Night',
      date: itinerary?.date || new Date().toISOString(),
      time: itinerary?.activities?.[0]?.startTime,
      creatorName,
      personalMessage: options?.personalMessage,
      shareCode,
      shareUrl,
      requireResponse: true,
      responseDeadline: options?.responseDeadline,
      allowAlternativeDates: options?.allowAlternativeDates ?? true,
      allowDietaryInfo: options?.allowDietaryInfo ?? true,
      allowAccessibilityInfo: options?.allowAccessibilityInfo ?? true,
      rsvpStatus: 'pending',
      activityCount: itinerary?.activities?.length || 0,
      surpriseCount: 0, // Would come from sharing hook
      estimatedDuration: calculateDuration(itinerary),
      neighborhood: getNeighborhood(itinerary),
    };

    return invite;
  }, [itineraryId, itinerary, sharedItineraryId, creatorName]);

  // Send RSVP via system share
  const sendRSVPInvite = useCallback(async (invite: RSVPInvite) => {
    const message = generateInviteMessage(invite);
    
    try {
      await Share.share({
        message,
        title: `Date Night Invitation from ${creatorName}`,
      });
    } catch (error) {
      console.error('Failed to share RSVP:', error);
    }
  }, [creatorName]);

  // Copy invite link
  const copyInviteLink = useCallback(async (invite: RSVPInvite) => {
    await Clipboard.setStringAsync(invite.shareUrl);
    Alert.alert('Copied!', 'Invitation link copied to clipboard');
  }, []);

  // Send reminder
  const sendReminder = useCallback(async () => {
    if (!rsvp || rsvp.status !== 'pending') return;

    // In production, this would trigger a push notification or SMS
    const updatedRSVP: RSVP = {
      ...rsvp,
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveRSVP(updatedRSVP);
    Alert.alert('Reminder Sent', 'A reminder has been sent to your partner.');
  }, [rsvp]);

  // Cancel RSVP request
  const cancelRSVP = useCallback(async () => {
    await AsyncStorage.removeItem(`${STORAGE_KEY}/${itineraryId}`);
    setRSVP(null);
  }, [itineraryId]);

  // Check if partner responded
  const hasResponse = rsvp?.status !== 'pending';
  const isAccepted = rsvp?.status === 'accepted';
  const isDeclined = rsvp?.status === 'declined';
  const isTentative = rsvp?.status === 'tentative';
  const isPending = rsvp?.status === 'pending';
  const isExpired = rsvp ? isRSVPExpired(rsvp) : false;

  return {
    rsvp,
    isLoading,
    hasResponse,
    isAccepted,
    isDeclined,
    isTentative,
    isPending,
    isExpired,
    createRSVPInvite,
    sendRSVPInvite,
    copyInviteLink,
    sendReminder,
    cancelRSVP,
    refresh: loadRSVP,
  };
}

// ============================================================================
// Partner Hook - Respond to RSVP invitations
// ============================================================================

interface UseRSVPResponseOptions {
  shareCode?: string;
  rsvpId?: string;
}

export function useRSVPResponse({ shareCode, rsvpId }: UseRSVPResponseOptions) {
  const [invite, setInvite] = useState<RSVPInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  // Load invite details
  useEffect(() => {
    if (shareCode || rsvpId) {
      loadInvite();
    }
  }, [shareCode, rsvpId]);

  const loadInvite = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch from backend API
      // For now, search local storage
      const allKeys = await AsyncStorage.getAllKeys();
      const rsvpKeys = allKeys.filter(k => k.startsWith(STORAGE_KEY));

      for (const key of rsvpKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const rsvp = JSON.parse(stored) as RSVP;
          // Match by share code or ID
          if (rsvp.id === rsvpId) {
            // Convert to invite format
            setInvite({
              id: rsvp.id,
              itineraryId: rsvp.itineraryId,
              itineraryName: 'Date Night', // Would come from backend
              date: new Date().toISOString(),
              creatorName: 'Your Partner',
              shareCode: shareCode || '',
              shareUrl: '',
              requireResponse: true,
              allowAlternativeDates: true,
              allowDietaryInfo: true,
              allowAccessibilityInfo: true,
              rsvpStatus: rsvp.status,
              activityCount: 0,
              surpriseCount: 0,
            });
            setHasResponded(rsvp.status !== 'pending');
            setIsLoading(false);
            return;
          }
        }
      }

      // Demo mode - create mock invite
      setInvite({
        id: `rsvp_demo_${Date.now()}`,
        itineraryId: 'demo',
        itineraryName: 'Romantic Date Night',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        time: '7:00 PM',
        creatorName: 'Your Partner',
        personalMessage: "I've planned something special for us! 💕",
        shareCode: shareCode || 'DEMO01',
        shareUrl: '',
        requireResponse: true,
        allowAlternativeDates: true,
        allowDietaryInfo: true,
        allowAccessibilityInfo: true,
        rsvpStatus: 'pending',
        activityCount: 3,
        surpriseCount: 1,
        estimatedDuration: '4 hours',
        neighborhood: 'Downtown',
      });
    } catch (err) {
      console.error('Failed to load invite:', err);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit RSVP response
  const submitResponse = useCallback(async (response: RSVPResponse) => {
    if (!invite) return;

    try {
      // Find and update the RSVP
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}/${invite.itineraryId}`);
      
      if (stored) {
        const rsvp = JSON.parse(stored) as RSVP;
        const updated: RSVP = {
          ...rsvp,
          status: response.status,
          respondedAt: new Date().toISOString(),
          canAttend: response.status === 'accepted',
          alternativeDates: response.alternativeDates,
          preferredTime: response.preferredTime,
          dietaryRestrictions: response.dietaryRestrictions,
          accessibilityNeeds: response.accessibilityNeeds,
          specialRequests: response.specialRequests,
          excitementLevel: response.excitementLevel,
          reactionEmoji: response.reactionEmoji,
          personalNote: response.personalNote,
          updatedAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(`${STORAGE_KEY}/${invite.itineraryId}`, JSON.stringify(updated));
      }

      setHasResponded(true);
      setInvite(prev => prev ? { ...prev, rsvpStatus: response.status } : null);

      // Show confirmation
      const statusLabel = getRSVPStatusLabel(response.status);
      Alert.alert(
        'Response Sent! 💕',
        `Your RSVP (${statusLabel}) has been sent to ${invite.creatorName}.`
      );

    } catch (error) {
      console.error('Failed to submit response:', error);
      Alert.alert('Error', 'Failed to send your response. Please try again.');
    }
  }, [invite]);

  // Quick responses
  const acceptInvite = useCallback((options?: Partial<RSVPResponse>) => {
    submitResponse({
      status: 'accepted',
      ...options,
    });
  }, [submitResponse]);

  const declineInvite = useCallback((reason?: string, alternativeDates?: string[]) => {
    submitResponse({
      status: 'declined',
      reason,
      alternativeDates,
    });
  }, [submitResponse]);

  const markTentative = useCallback((reason?: string, preferredTime?: 'earlier' | 'same' | 'later') => {
    submitResponse({
      status: 'tentative',
      reason,
      preferredTime,
    });
  }, [submitResponse]);

  return {
    invite,
    isLoading,
    error,
    hasResponded,
    submitResponse,
    acceptInvite,
    declineInvite,
    markTentative,
    refresh: loadInvite,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateInviteMessage(invite: RSVPInvite): string {
  const date = new Date(invite.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  let message = `💕 ${invite.creatorName} is inviting you to a date night!\n\n`;
  message += `📅 ${date}`;
  if (invite.time) message += ` at ${invite.time}`;
  message += '\n';
  
  if (invite.neighborhood) {
    message += `📍 ${invite.neighborhood}\n`;
  }
  
  message += `✨ ${invite.activityCount} activities planned`;
  if (invite.surpriseCount > 0) {
    message += ` (${invite.surpriseCount} surprise${invite.surpriseCount > 1 ? 's' : ''}!)`;
  }
  message += '\n';

  if (invite.personalMessage) {
    message += `\n💬 "${invite.personalMessage}"\n`;
  }

  message += `\nView details & RSVP:\n${invite.shareUrl}`;
  
  if (invite.responseDeadline) {
    const deadline = new Date(invite.responseDeadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    message += `\n\n⏰ Please respond by ${deadline}`;
  }

  return message;
}

function calculateDuration(itinerary: any): string | undefined {
  if (!itinerary?.activities?.length) return undefined;
  
  const activities = itinerary.activities;
  const first = activities[0];
  const last = activities[activities.length - 1];
  
  if (!first?.startTime || !last?.endTime) return undefined;
  
  // Simple calculation - in production would be more accurate
  const totalMinutes = activities.reduce((sum: number, a: any) => sum + (a.duration || 60), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}

function getNeighborhood(itinerary: any): string | undefined {
  const firstActivity = itinerary?.activities?.[0];
  return firstActivity?.location?.neighborhood || firstActivity?.location?.city;
}
