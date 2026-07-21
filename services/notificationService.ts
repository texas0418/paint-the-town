// Notification Service for Paint the Town

import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import {
  NotificationPayload,
  NotificationCategory,
  NotificationPriority,
  NotificationAction,
  ActivityReminder,
  TravelAlert,
  PartnerNotification,
  NotificationPreferences,
  NOTIFICATION_TEMPLATES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getTimingMinutes,
  ReminderTiming,
} from '@/types/notifications';

// ============================================================================
// Notification Configuration
// ============================================================================

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ============================================================================
// Notification Service Class
// ============================================================================

class NotificationService {
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private scheduledNotifications: Map<string, string> = new Map(); // id -> expo notification id
  private travelAlertIntervals: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, (notification: NotificationPayload) => void> = new Map();

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Set up notification categories for iOS
      await this.setupNotificationCategories();

      // Set up notification listeners
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Disabled',
        'Enable notifications to receive activity reminders and travel alerts.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Get push token for remote notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });

      await Notifications.setNotificationChannelAsync('travel', {
        name: 'Travel Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
      });

      await Notifications.setNotificationChannelAsync('partner', {
        name: 'Partner Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EC4899',
      });
    }

    return true;
  }

  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('activity_reminder', [
      {
        identifier: 'directions',
        buttonTitle: 'Get Directions',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 10min',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('travel_alert', [
      {
        identifier: 'start_navigation',
        buttonTitle: 'Start Navigation',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'book_ride',
        buttonTitle: 'Book Ride',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('partner_share', [
      {
        identifier: 'view',
        buttonTitle: 'View Plan',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'accept',
        buttonTitle: 'Accept',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  private setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      const payload = notification.request.content.data as NotificationPayload;
      this.listeners.forEach((callback) => callback(payload));
    });

    // Handle notification interaction
    Notifications.addNotificationResponseReceivedListener((response) => {
      const payload = response.notification.request.content.data as NotificationPayload;
      const actionId = response.actionIdentifier;

      this.handleNotificationAction(payload, actionId);
    });
  }

  // ============================================================================
  // Subscription
  // ============================================================================

  subscribe(id: string, callback: (notification: NotificationPayload) => void) {
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  // ============================================================================
  // Activity Reminders
  // ============================================================================

  async scheduleActivityReminder(
    activity: {
      id: string;
      name: string;
      type: string;
      startTime: Date;
      location: {
        name: string;
        address: string;
        coordinates?: { lat: number; lng: number };
      };
    },
    timings: ReminderTiming[] = this.preferences.activityReminders.defaultTimings
  ): Promise<ActivityReminder[]> {
    const reminders: ActivityReminder[] = [];

    for (const timing of timings) {
      const minutesBefore = getTimingMinutes(timing);
      const reminderTime = new Date(activity.startTime.getTime() - minutesBefore * 60000);

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) continue;

      // Check quiet hours
      if (this.isInQuietHours(reminderTime)) continue;

      const reminder: ActivityReminder = {
        id: `reminder-${activity.id}-${timing}`,
        activityId: activity.id,
        activityName: activity.name,
        activityType: activity.type,
        venueName: activity.location.name,
        venueAddress: activity.location.address,
        activityStartTime: activity.startTime,
        reminderTime,
        minutesBefore,
        isEnabled: true,
        hasBeenSent: false,
        includeDirections: this.preferences.activityReminders.includeDirectionsDefault,
        includeWeather: this.preferences.activityReminders.includeWeatherDefault,
      };

      // Build notification content
      const template =
        minutesBefore <= 30
          ? NOTIFICATION_TEMPLATES.activity_reminder_30min
          : NOTIFICATION_TEMPLATES.activity_reminder_1hour;

      const title = this.interpolateTemplate(template.titleTemplate, {
        activityName: activity.name,
      });

      const body = this.interpolateTemplate(template.bodyTemplate, {
        activityName: activity.name,
        activityType: activity.type,
        venueName: activity.location.name,
        startTime: this.formatTime(activity.startTime),
        directions: activity.location.coordinates ? 'Tap for directions.' : '',
      });

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            id: reminder.id,
            category: 'activity_reminder',
            activityId: activity.id,
            ...reminder,
          },
          categoryIdentifier: 'activity_reminder',
          sound: 'default',
        },
        trigger: {
          date: reminderTime,
        },
      });

      this.scheduledNotifications.set(reminder.id, notificationId);
      reminders.push(reminder);
    }

    return reminders;
  }

  async cancelActivityReminder(reminderId: string) {
    const notificationId = this.scheduledNotifications.get(reminderId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications.delete(reminderId);
    }
  }

  async cancelAllActivityReminders(activityId: string) {
    for (const [reminderId, notificationId] of this.scheduledNotifications) {
      if (reminderId.startsWith(`reminder-${activityId}`)) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        this.scheduledNotifications.delete(reminderId);
      }
    }
  }

  // ============================================================================
  // Travel Alerts
  // ============================================================================

  async startTravelAlertMonitoring(
    alert: Omit<
      TravelAlert,
      | 'id'
      | 'currentEstimatedDuration'
      | 'trafficCondition'
      | 'delayMinutes'
      | 'lastUpdated'
      | 'isActive'
    >
  ): Promise<TravelAlert> {
    const travelAlert: TravelAlert = {
      id: `travel-${Date.now()}`,
      ...alert,
      currentEstimatedDuration: alert.normalDuration,
      trafficCondition: 'light',
      delayMinutes: 0,
      isActive: true,
      lastUpdated: new Date(),
    };

    // Start monitoring traffic
    this.startTrafficMonitoring(travelAlert);

    return travelAlert;
  }

  private startTrafficMonitoring(alert: TravelAlert) {
    const checkInterval = this.preferences.travelAlerts.trafficCheckIntervalMinutes * 60000;

    const intervalId = setInterval(async () => {
      await this.checkTrafficAndNotify(alert);
    }, checkInterval);

    this.travelAlertIntervals.set(alert.id, intervalId);

    // Do an immediate check
    this.checkTrafficAndNotify(alert);
  }

  private async checkTrafficAndNotify(alert: TravelAlert) {
    // TODO: call a traffic API (Google Maps, TomTom, etc.)
    // For now, simulate traffic conditions
    const trafficData = await this.fetchTrafficData(alert);

    alert.currentEstimatedDuration = trafficData.duration;
    alert.trafficCondition = trafficData.condition;
    alert.delayMinutes = trafficData.delay;
    alert.lastUpdated = new Date();

    // Calculate when to leave
    const requiredDepartureTime = new Date(
      alert.targetArrivalTime.getTime() -
        (alert.currentEstimatedDuration + alert.bufferMinutes) * 60000
    );

    alert.suggestedDepartureTime = requiredDepartureTime;

    const now = new Date();
    const minutesUntilDeparture = (requiredDepartureTime.getTime() - now.getTime()) / 60000;

    // Send "leave now" notification
    if (minutesUntilDeparture <= 5 && minutesUntilDeparture > 0) {
      await this.sendLeaveNowNotification(alert);
    }

    // Send traffic delay notification
    if (alert.delayMinutes >= this.preferences.travelAlerts.alertWhenDelayExceeds) {
      await this.sendTrafficDelayNotification(alert);
    }
  }

  private async fetchTrafficData(alert: TravelAlert): Promise<{
    duration: number;
    condition: 'light' | 'moderate' | 'heavy' | 'severe';
    delay: number;
  }> {
    // Simulate traffic API call
    // In production, use Google Maps Directions API, TomTom, or HERE
    const randomFactor = 0.8 + Math.random() * 0.6; // 0.8 to 1.4
    const duration = Math.round(alert.normalDuration * randomFactor);
    const delay = Math.max(0, duration - alert.normalDuration);

    let condition: 'light' | 'moderate' | 'heavy' | 'severe' = 'light';
    if (delay > 20) condition = 'severe';
    else if (delay > 10) condition = 'heavy';
    else if (delay > 5) condition = 'moderate';

    return { duration, condition, delay };
  }

  private async sendLeaveNowNotification(alert: TravelAlert) {
    const template = NOTIFICATION_TEMPLATES.leave_now;

    const title = this.interpolateTemplate(template.titleTemplate, {});
    const body = this.interpolateTemplate(template.bodyTemplate, {
      duration: `${alert.currentEstimatedDuration} min`,
      destination: alert.toLocation.name,
      trafficInfo:
        alert.trafficCondition === 'light'
          ? 'Traffic is light.'
          : `${alert.trafficCondition.charAt(0).toUpperCase() + alert.trafficCondition.slice(1)} traffic.`,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          id: `leave-now-${alert.id}`,
          category: 'travel_alert',
          type: 'leave_now',
          ...alert,
        },
        categoryIdentifier: 'travel_alert',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Send immediately
    });
  }

  private async sendTrafficDelayNotification(alert: TravelAlert) {
    const template = NOTIFICATION_TEMPLATES.traffic_delay;

    const title = this.interpolateTemplate(template.titleTemplate, {});
    const body = this.interpolateTemplate(template.bodyTemplate, {
      delayMinutes: alert.delayMinutes.toString(),
      destination: alert.toLocation.name,
      newDepartureTime: this.formatTime(alert.suggestedDepartureTime),
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          id: `traffic-delay-${alert.id}`,
          category: 'travel_alert',
          type: 'traffic_delay',
          ...alert,
        },
        categoryIdentifier: 'travel_alert',
        sound: 'default',
      },
      trigger: null,
    });
  }

  stopTravelAlertMonitoring(alertId: string) {
    const intervalId = this.travelAlertIntervals.get(alertId);
    if (intervalId) {
      clearInterval(intervalId);
      this.travelAlertIntervals.delete(alertId);
    }
  }

  stopAllTravelAlertMonitoring() {
    this.travelAlertIntervals.forEach((intervalId) => clearInterval(intervalId));
    this.travelAlertIntervals.clear();
  }

  // ============================================================================
  // Partner Notifications
  // ============================================================================

  async sendPartnerNotification(
    notification: Omit<PartnerNotification, 'id' | 'sentAt'>
  ): Promise<PartnerNotification> {
    // Check if partner notifications are enabled
    if (!this.preferences.partnerNotifications.enabled) {
      throw new Error('Partner notifications are disabled');
    }

    // Check surprise mode
    if (
      this.preferences.partnerNotifications.surpriseMode.enabled &&
      notification.itineraryId &&
      this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.includes(
        notification.itineraryId
      )
    ) {
      throw new Error('Cannot notify partner - itinerary is in surprise mode');
    }

    const partnerNotification: PartnerNotification = {
      ...notification,
      id: `partner-${Date.now()}`,
      sentAt: new Date(),
    };

    // TODO: send to the backend, which would then
    // send a push notification to the partner's device
    await this.sendToPartnerDevice(partnerNotification);

    return partnerNotification;
  }

  async notifyPartnerItineraryShared(
    partnerId: string,
    partnerName: string,
    itineraryId: string,
    itineraryName: string,
    date: string,
    senderName: string
  ): Promise<PartnerNotification> {
    // Check surprise mode first
    if (
      this.preferences.partnerNotifications.surpriseMode.enabled &&
      this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.includes(itineraryId)
    ) {
      throw new Error('Itinerary is marked as surprise - notification blocked');
    }

    return this.sendPartnerNotification({
      type: 'itinerary_shared',
      senderId: 'current-user', // Would be actual user ID
      senderName,
      recipientId: partnerId,
      recipientName: partnerName,
      itineraryId,
      itineraryName,
      requiresResponse: true,
    });
  }

  async notifyPartnerRunningLate(
    partnerId: string,
    partnerName: string,
    delayMinutes: number,
    senderName: string
  ): Promise<PartnerNotification> {
    return this.sendPartnerNotification({
      type: 'running_late',
      senderId: 'current-user',
      senderName,
      recipientId: partnerId,
      recipientName: partnerName,
      message: `Running ${delayMinutes} minutes late`,
      requiresResponse: false,
    });
  }

  async notifyPartnerArrived(
    partnerId: string,
    partnerName: string,
    venueName: string,
    senderName: string
  ): Promise<PartnerNotification> {
    return this.sendPartnerNotification({
      type: 'arrived',
      senderId: 'current-user',
      senderName,
      recipientId: partnerId,
      recipientName: partnerName,
      message: `Arrived at ${venueName}`,
      requiresResponse: false,
    });
  }

  private async sendToPartnerDevice(notification: PartnerNotification) {
    // In production, this would call your backend API to send a push notification
    // to the partner's device via FCM (Android) or APNs (iOS)

    console.log('Sending partner notification:', notification);

    // For demo purposes, we'll show a local notification as if received
    const template =
      NOTIFICATION_TEMPLATES[notification.type] || NOTIFICATION_TEMPLATES.itinerary_shared;

    const title = this.interpolateTemplate(template.titleTemplate, {
      partnerName: notification.senderName,
      itineraryName: notification.itineraryName || '',
    });

    const body = this.interpolateTemplate(template.bodyTemplate, {
      partnerName: notification.senderName,
      itineraryName: notification.itineraryName || '',
      date: notification.itineraryId ? 'upcoming' : '',
      delayMinutes: notification.message?.match(/\d+/)?.[0] || '',
      venueName: notification.message?.replace('Arrived at ', '') || '',
    });

    // This simulates receiving the notification
    // In production, this would happen on the partner's device
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          id: notification.id,
          category: 'partner_share',
          ...notification,
        },
        categoryIdentifier: 'partner_share',
        sound: 'default',
      },
      trigger: null,
    });
  }

  // ============================================================================
  // Surprise Mode (for planning surprises)
  // ============================================================================

  enableSurpriseMode(itineraryId: string) {
    if (
      !this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.includes(itineraryId)
    ) {
      this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.push(itineraryId);
    }
    this.preferences.partnerNotifications.surpriseMode.enabled = true;
  }

  disableSurpriseMode(itineraryId?: string) {
    if (itineraryId) {
      this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds =
        this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.filter(
          (id) => id !== itineraryId
        );
    } else {
      this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds = [];
    }

    if (this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.length === 0) {
      this.preferences.partnerNotifications.surpriseMode.enabled = false;
    }
  }

  isInSurpriseMode(itineraryId: string): boolean {
    return this.preferences.partnerNotifications.surpriseMode.hiddenItineraryIds.includes(
      itineraryId
    );
  }

  // ============================================================================
  // Notification Action Handler
  // ============================================================================

  private handleNotificationAction(payload: NotificationPayload, actionId: string) {
    console.log('Notification action:', actionId, payload);

    switch (actionId) {
      case 'snooze':
        this.snoozeNotification(payload, 10);
        break;
      case 'directions':
      case 'start_navigation':
        this.openDirections(payload);
        break;
      case 'book_ride':
        // Navigate to rideshare screen
        break;
      case 'view':
      case 'accept':
        // Navigate to appropriate screen based on payload
        break;
      default:
        // Default tap action
        break;
    }
  }

  private async snoozeNotification(payload: NotificationPayload, minutes: number) {
    const snoozeTime = new Date(Date.now() + minutes * 60000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        categoryIdentifier: payload.category,
        sound: 'default',
      },
      trigger: {
        date: snoozeTime,
      },
    });
  }

  private openDirections(payload: NotificationPayload) {
    // Would open maps app with directions
    console.log('Opening directions for:', payload.data);
  }

  // ============================================================================
  // Preferences
  // ============================================================================

  updatePreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    // Remove any remaining template variables
    result = result.replace(/{{[^}]+}}/g, '');
    return result.trim();
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private isInQuietHours(date: Date): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const time = date.getHours() * 60 + date.getMinutes();
    const [startHour, startMin] = this.preferences.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.endTime.split(':').map(Number);

    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    if (start < end) {
      return time >= start && time < end;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return time >= start || time < end;
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications.clear();
    this.stopAllTravelAlertMonitoring();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export convenience functions
export const scheduleActivityReminder =
  notificationService.scheduleActivityReminder.bind(notificationService);
export const startTravelAlertMonitoring =
  notificationService.startTravelAlertMonitoring.bind(notificationService);
export const sendPartnerNotification =
  notificationService.sendPartnerNotification.bind(notificationService);
