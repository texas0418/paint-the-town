// Notification Hooks for Paint the Town

import { useEffect, useCallback, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '@/services/notificationService';
import {
  NotificationPayload,
  TravelAlert,
  ActivityReminder,
  ReminderTiming,
} from '@/types/notifications';

// ============================================================================
// useNotifications - Initialize and listen to notifications
// ============================================================================

export function useNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const success = await notificationService.initialize();
      setIsInitialized(success);
    };

    initialize();

    // Subscribe to incoming notifications
    const unsubscribe = notificationService.subscribe('useNotifications', (notification) => {
      setLastNotification(notification);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isInitialized,
    lastNotification,
    clearLastNotification: () => setLastNotification(null),
  };
}

// ============================================================================
// useActivityReminders - Schedule reminders for activities
// ============================================================================

interface UseActivityRemindersOptions {
  activities: Array<{
    id: string;
    name: string;
    type: string;
    startTime: Date;
    location: {
      name: string;
      address: string;
      coordinates?: { lat: number; lng: number };
    };
  }>;
  timings?: ReminderTiming[];
  enabled?: boolean;
}

export function useActivityReminders({
  activities,
  timings,
  enabled = true,
}: UseActivityRemindersOptions) {
  const [scheduledReminders, setScheduledReminders] = useState<ActivityReminder[]>([]);
  const previousActivitiesRef = useRef<string>('');

  useEffect(() => {
    if (!enabled) return;

    // Stringify to compare changes
    const activitiesKey = JSON.stringify(activities.map(a => `${a.id}-${a.startTime}`));
    
    // Only reschedule if activities changed
    if (activitiesKey === previousActivitiesRef.current) return;
    previousActivitiesRef.current = activitiesKey;

    const scheduleAll = async () => {
      const allReminders: ActivityReminder[] = [];

      for (const activity of activities) {
        // Skip activities in the past
        if (activity.startTime <= new Date()) continue;

        const reminders = await notificationService.scheduleActivityReminder(
          activity,
          timings
        );
        allReminders.push(...reminders);
      }

      setScheduledReminders(allReminders);
    };

    scheduleAll();

    // Cleanup on unmount
    return () => {
      activities.forEach(activity => {
        notificationService.cancelAllActivityReminders(activity.id);
      });
    };
  }, [activities, timings, enabled]);

  const cancelReminder = useCallback(async (reminderId: string) => {
    await notificationService.cancelActivityReminder(reminderId);
    setScheduledReminders(prev => prev.filter(r => r.id !== reminderId));
  }, []);

  const cancelAllForActivity = useCallback(async (activityId: string) => {
    await notificationService.cancelAllActivityReminders(activityId);
    setScheduledReminders(prev => prev.filter(r => r.activityId !== activityId));
  }, []);

  return {
    scheduledReminders,
    cancelReminder,
    cancelAllForActivity,
  };
}

// ============================================================================
// useTravelAlerts - Monitor traffic and send departure alerts
// ============================================================================

interface UseTravelAlertsOptions {
  enabled?: boolean;
  fromLocation: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  toLocation: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  targetArrivalTime: Date;
  transportMode?: 'car' | 'transit' | 'walking' | 'rideshare';
  normalDuration: number; // estimated minutes without traffic
  bufferMinutes?: number;
}

export function useTravelAlerts({
  enabled = true,
  fromLocation,
  toLocation,
  targetArrivalTime,
  transportMode = 'car',
  normalDuration,
  bufferMinutes = 15,
}: UseTravelAlertsOptions) {
  const [travelAlert, setTravelAlert] = useState<TravelAlert | null>(null);
  const alertIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Don't monitor if arrival time is in the past
    if (targetArrivalTime <= new Date()) return;

    const startMonitoring = async () => {
      const alert = await notificationService.startTravelAlertMonitoring({
        fromLocation,
        toLocation,
        transportMode,
        targetArrivalTime,
        normalDuration,
        bufferMinutes,
      });

      alertIdRef.current = alert.id;
      setTravelAlert(alert);
    };

    startMonitoring();

    // Cleanup
    return () => {
      if (alertIdRef.current) {
        notificationService.stopTravelAlertMonitoring(alertIdRef.current);
      }
    };
  }, [
    enabled,
    fromLocation.address,
    toLocation.address,
    targetArrivalTime.getTime(),
    transportMode,
    normalDuration,
    bufferMinutes,
  ]);

  const stopMonitoring = useCallback(() => {
    if (alertIdRef.current) {
      notificationService.stopTravelAlertMonitoring(alertIdRef.current);
      setTravelAlert(null);
      alertIdRef.current = null;
    }
  }, []);

  return {
    travelAlert,
    isMonitoring: !!travelAlert,
    stopMonitoring,
  };
}

// ============================================================================
// usePartnerNotifications - Send notifications to partner
// ============================================================================

export function usePartnerNotifications() {
  const [isSending, setIsSending] = useState(false);

  const notifyItineraryShared = useCallback(async (
    partnerId: string,
    partnerName: string,
    itineraryId: string,
    itineraryName: string,
    date: string,
    senderName: string
  ) => {
    setIsSending(true);
    try {
      // Check if in surprise mode
      if (notificationService.isInSurpriseMode(itineraryId)) {
        return { success: false, reason: 'surprise_mode' };
      }

      await notificationService.notifyPartnerItineraryShared(
        partnerId,
        partnerName,
        itineraryId,
        itineraryName,
        date,
        senderName
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error.message };
    } finally {
      setIsSending(false);
    }
  }, []);

  const notifyRunningLate = useCallback(async (
    partnerId: string,
    partnerName: string,
    delayMinutes: number,
    senderName: string
  ) => {
    setIsSending(true);
    try {
      await notificationService.notifyPartnerRunningLate(
        partnerId,
        partnerName,
        delayMinutes,
        senderName
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error.message };
    } finally {
      setIsSending(false);
    }
  }, []);

  const notifyArrived = useCallback(async (
    partnerId: string,
    partnerName: string,
    venueName: string,
    senderName: string
  ) => {
    setIsSending(true);
    try {
      await notificationService.notifyPartnerArrived(
        partnerId,
        partnerName,
        venueName,
        senderName
      );
      return { success: true };
    } catch (error: any) {
      return { success: false, reason: error.message };
    } finally {
      setIsSending(false);
    }
  }, []);

  const enableSurpriseMode = useCallback((itineraryId: string) => {
    notificationService.enableSurpriseMode(itineraryId);
  }, []);

  const disableSurpriseMode = useCallback((itineraryId?: string) => {
    notificationService.disableSurpriseMode(itineraryId);
  }, []);

  const isInSurpriseMode = useCallback((itineraryId: string) => {
    return notificationService.isInSurpriseMode(itineraryId);
  }, []);

  return {
    isSending,
    notifyItineraryShared,
    notifyRunningLate,
    notifyArrived,
    enableSurpriseMode,
    disableSurpriseMode,
    isInSurpriseMode,
  };
}

// ============================================================================
// useItineraryNotifications - All-in-one for itinerary-based notifications
// ============================================================================

interface UseItineraryNotificationsOptions {
  itinerary: {
    id: string;
    name: string;
    date: string;
    activities: Array<{
      id: string;
      name: string;
      type: string;
      startTime: string; // HH:mm
      endTime: string;
      location: {
        name: string;
        address: string;
        coordinates?: { lat: number; lng: number };
      };
    }>;
  };
  partner?: {
    id: string;
    name: string;
  };
  currentUserName: string;
  enabled?: boolean;
}

export function useItineraryNotifications({
  itinerary,
  partner,
  currentUserName,
  enabled = true,
}: UseItineraryNotificationsOptions) {
  // Convert activity times to Date objects
  const activitiesWithDates = itinerary.activities.map(activity => {
    const [hours, minutes] = activity.startTime.split(':').map(Number);
    const startTime = new Date(itinerary.date);
    startTime.setHours(hours, minutes, 0, 0);

    return {
      ...activity,
      startTime,
    };
  });

  // Activity reminders
  const { scheduledReminders } = useActivityReminders({
    activities: activitiesWithDates,
    enabled,
  });

  // Travel alerts for transitions between activities
  const [activeTravelAlerts, setActiveTravelAlerts] = useState<TravelAlert[]>([]);

  useEffect(() => {
    if (!enabled) return;

    // Set up travel alerts for each transition
    const setupTravelAlerts = async () => {
      const alerts: TravelAlert[] = [];

      for (let i = 0; i < activitiesWithDates.length - 1; i++) {
        const current = activitiesWithDates[i];
        const next = activitiesWithDates[i + 1];

        // Only if we have coordinates for both
        if (current.location.coordinates && next.location.coordinates) {
          const [nextHours, nextMinutes] = itinerary.activities[i + 1].startTime.split(':').map(Number);
          const targetTime = new Date(itinerary.date);
          targetTime.setHours(nextHours, nextMinutes, 0, 0);

          // Estimate normal duration (rough calculation)
          const distance = calculateDistance(
            current.location.coordinates,
            next.location.coordinates
          );
          const normalDuration = Math.ceil(distance / 0.5); // Assume 30 mph avg

          const alert = await notificationService.startTravelAlertMonitoring({
            fromLocation: current.location,
            toLocation: next.location,
            transportMode: 'car',
            targetArrivalTime: targetTime,
            normalDuration,
            bufferMinutes: 15,
          });

          alerts.push(alert);
        }
      }

      setActiveTravelAlerts(alerts);
    };

    setupTravelAlerts();

    return () => {
      notificationService.stopAllTravelAlertMonitoring();
    };
  }, [itinerary.id, enabled]);

  // Partner notifications
  const partnerNotifications = usePartnerNotifications();

  const shareWithPartner = useCallback(async () => {
    if (!partner) return { success: false, reason: 'no_partner' };

    return partnerNotifications.notifyItineraryShared(
      partner.id,
      partner.name,
      itinerary.id,
      itinerary.name,
      itinerary.date,
      currentUserName
    );
  }, [partner, itinerary, currentUserName, partnerNotifications]);

  return {
    scheduledReminders,
    activeTravelAlerts,
    shareWithPartner,
    notifyRunningLate: (delayMinutes: number) => 
      partner 
        ? partnerNotifications.notifyRunningLate(partner.id, partner.name, delayMinutes, currentUserName)
        : Promise.resolve({ success: false, reason: 'no_partner' }),
    notifyArrived: (venueName: string) =>
      partner
        ? partnerNotifications.notifyArrived(partner.id, partner.name, venueName, currentUserName)
        : Promise.resolve({ success: false, reason: 'no_partner' }),
    enableSurpriseMode: () => partnerNotifications.enableSurpriseMode(itinerary.id),
    disableSurpriseMode: () => partnerNotifications.disableSurpriseMode(itinerary.id),
    isInSurpriseMode: partnerNotifications.isInSurpriseMode(itinerary.id),
  };
}

// Helper function
function calculateDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) *
      Math.cos(to.lat * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
