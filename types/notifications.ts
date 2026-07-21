// Notification System Types for Paint the Town

// ============================================================================
// Notification Categories & Types
// ============================================================================

export type NotificationCategory =
  | 'activity_reminder'
  | 'travel_alert'
  | 'partner_share'
  | 'partner_update'
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'schedule_change'
  | 'weather_alert'
  | 'price_alert'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type NotificationStatus =
  | 'scheduled'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'dismissed'
  | 'failed';

export type TravelAlertType = 'leave_now' | 'traffic_delay' | 'route_change' | 'arrival_update';

export type ReminderTiming = '5min' | '15min' | '30min' | '1hour' | '2hours' | '1day';

// ============================================================================
// Core Notification Types
// ============================================================================

export interface NotificationPayload {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  body: string;
  subtitle?: string;

  // Visual
  icon?: string;
  imageUrl?: string;
  color?: string;

  // Actions
  actions?: NotificationAction[];
  defaultAction?: NotificationAction;

  // Scheduling
  scheduledFor?: Date;
  expiresAt?: Date;

  // Metadata
  data?: Record<string, any>;
  itineraryId?: string;
  activityId?: string;
  partnerId?: string;

  // Status tracking
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  actionType: 'open_app' | 'open_url' | 'dismiss' | 'snooze' | 'navigate' | 'call' | 'directions';
  payload?: Record<string, any>;
  destructive?: boolean;
}

// ============================================================================
// Activity Reminder Types
// ============================================================================

export interface ActivityReminder {
  id: string;
  activityId: string;
  activityName: string;
  activityType: string;

  // Location
  venueName: string;
  venueAddress: string;

  // Timing
  activityStartTime: Date;
  reminderTime: Date;
  minutesBefore: number;

  // Status
  isEnabled: boolean;
  hasBeenSent: boolean;

  // Customization
  customMessage?: string;
  includeDirections: boolean;
  includeWeather: boolean;
}

export interface ActivityReminderSettings {
  enabled: boolean;
  defaultTimings: ReminderTiming[];
  customTimings: number[]; // minutes before
  includeDirectionsDefault: boolean;
  includeWeatherDefault: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}

// ============================================================================
// Travel Alert Types
// ============================================================================

export interface TravelAlert {
  id: string;
  type: TravelAlertType;

  // Route info
  fromLocation: LocationInfo;
  toLocation: LocationInfo;
  transportMode: 'car' | 'transit' | 'walking' | 'rideshare';

  // Timing
  targetArrivalTime: Date;
  suggestedDepartureTime: Date;
  currentEstimatedDuration: number; // minutes
  normalDuration: number; // minutes without traffic

  // Traffic info
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  delayMinutes: number;
  trafficIncidents?: TrafficIncident[];

  // Status
  isActive: boolean;
  lastUpdated: Date;

  // Customization
  bufferMinutes: number; // Extra time to add
}

export interface LocationInfo {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TrafficIncident {
  type: 'accident' | 'construction' | 'closure' | 'event' | 'weather';
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  delayMinutes: number;
}

export interface TravelAlertSettings {
  enabled: boolean;
  defaultBufferMinutes: number;
  trafficCheckIntervalMinutes: number;
  alertWhenDelayExceeds: number; // minutes
  preferredTransportMode: 'car' | 'transit' | 'walking' | 'rideshare';
  showAlternativeRoutes: boolean;
}

// ============================================================================
// Partner Notification Types
// ============================================================================

export interface PartnerNotification {
  id: string;
  type: PartnerNotificationType;

  // People involved
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;

  // Content
  itineraryId?: string;
  itineraryName?: string;
  message?: string;

  // Status
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;

  // Options
  requiresResponse: boolean;
  expiresAt?: Date;
}

export type PartnerNotificationType =
  | 'itinerary_shared' // Partner shared an itinerary with you
  | 'itinerary_updated' // Partner updated a shared itinerary
  | 'itinerary_accepted' // Partner accepted your shared itinerary
  | 'itinerary_declined' // Partner declined your shared itinerary
  | 'availability_updated' // Partner updated their availability
  | 'booking_confirmed' // Booking was confirmed for shared itinerary
  | 'reminder_shared' // Partner sent you a reminder
  | 'location_shared' // Partner shared their location
  | 'running_late' // Partner is running late
  | 'arrived' // Partner has arrived
  | 'custom_message'; // Custom message from partner

export interface PartnerNotificationSettings {
  enabled: boolean;
  notifyOnShare: boolean;
  notifyOnUpdate: boolean;
  notifyOnBooking: boolean;
  notifyOnLocationShare: boolean;
  allowCustomMessages: boolean;

  // Surprise mode - for planning surprises without alerting partner
  surpriseMode: {
    enabled: boolean;
    hiddenItineraryIds: string[];
  };
}

// ============================================================================
// Notification Preferences (User Settings)
// ============================================================================

export interface NotificationPreferences {
  // Global
  globalEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;

  // Category-specific
  activityReminders: ActivityReminderSettings;
  travelAlerts: TravelAlertSettings;
  partnerNotifications: PartnerNotificationSettings;

  // Quiet hours
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    allowCritical: boolean; // Allow critical notifications during quiet hours
  };

  // Do not disturb
  doNotDisturb: {
    enabled: boolean;
    until?: Date;
    allowFrom: string[]; // Partner IDs that can still notify
  };
}

// ============================================================================
// Notification Templates
// ============================================================================

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[]; // Available template variables
  defaultActions: NotificationAction[];
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // Activity reminders
  activity_reminder_30min: {
    id: 'activity_reminder_30min',
    category: 'activity_reminder',
    titleTemplate: '{{activityName}} in 30 minutes',
    bodyTemplate: 'Time to head to {{venueName}}. {{directions}}',
    variables: ['activityName', 'venueName', 'venueAddress', 'directions'],
    defaultActions: [
      { id: 'directions', title: 'Get Directions', actionType: 'directions' },
      { id: 'snooze', title: 'Snooze 10min', actionType: 'snooze', payload: { minutes: 10 } },
    ],
  },
  activity_reminder_1hour: {
    id: 'activity_reminder_1hour',
    category: 'activity_reminder',
    titleTemplate: '{{activityName}} in 1 hour',
    bodyTemplate: 'Your {{activityType}} at {{venueName}} starts at {{startTime}}.',
    variables: ['activityName', 'activityType', 'venueName', 'startTime'],
    defaultActions: [{ id: 'view', title: 'View Details', actionType: 'open_app' }],
  },

  // Travel alerts
  leave_now: {
    id: 'leave_now',
    category: 'travel_alert',
    titleTemplate: 'Leave now to arrive on time',
    bodyTemplate: '{{duration}} to {{destination}}. {{trafficInfo}}',
    variables: ['duration', 'destination', 'trafficInfo', 'departureTime'],
    defaultActions: [
      { id: 'directions', title: 'Start Navigation', actionType: 'directions' },
      {
        id: 'rideshare',
        title: 'Book Ride',
        actionType: 'open_app',
        payload: { screen: 'rideshare' },
      },
    ],
  },
  traffic_delay: {
    id: 'traffic_delay',
    category: 'travel_alert',
    titleTemplate: 'Traffic delay on your route',
    bodyTemplate:
      '{{delayMinutes}} min delay to {{destination}}. Leave by {{newDepartureTime}} to arrive on time.',
    variables: ['delayMinutes', 'destination', 'newDepartureTime', 'reason'],
    defaultActions: [
      { id: 'directions', title: 'View Route', actionType: 'directions' },
      { id: 'alternatives', title: 'See Alternatives', actionType: 'open_app' },
    ],
  },

  // Partner notifications
  itinerary_shared: {
    id: 'itinerary_shared',
    category: 'partner_share',
    titleTemplate: '{{partnerName}} shared a date plan',
    bodyTemplate: '"{{itineraryName}}" on {{date}}. Tap to view and respond.',
    variables: ['partnerName', 'itineraryName', 'date'],
    defaultActions: [
      { id: 'view', title: 'View Plan', actionType: 'open_app' },
      { id: 'accept', title: 'Accept', actionType: 'open_app', payload: { action: 'accept' } },
    ],
  },
  partner_running_late: {
    id: 'partner_running_late',
    category: 'partner_update',
    titleTemplate: '{{partnerName}} is running late',
    bodyTemplate: 'Expected to arrive {{delayMinutes}} minutes late.',
    variables: ['partnerName', 'delayMinutes', 'newArrivalTime'],
    defaultActions: [
      { id: 'message', title: 'Send Message', actionType: 'open_app', payload: { screen: 'chat' } },
      { id: 'ok', title: 'OK', actionType: 'dismiss' },
    ],
  },
  partner_arrived: {
    id: 'partner_arrived',
    category: 'partner_update',
    titleTemplate: '{{partnerName}} has arrived',
    bodyTemplate: '{{partnerName}} is at {{venueName}}.',
    variables: ['partnerName', 'venueName'],
    defaultActions: [{ id: 'ok', title: 'OK', actionType: 'dismiss' }],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getCategoryIcon(category: NotificationCategory): string {
  const icons: Record<NotificationCategory, string> = {
    activity_reminder: 'Bell',
    travel_alert: 'Navigation',
    partner_share: 'Heart',
    partner_update: 'Users',
    booking_confirmation: 'CheckCircle',
    booking_reminder: 'Calendar',
    schedule_change: 'RefreshCw',
    weather_alert: 'Cloud',
    price_alert: 'DollarSign',
    system: 'Settings',
  };
  return icons[category];
}

export function getCategoryColor(category: NotificationCategory): string {
  const colors: Record<NotificationCategory, string> = {
    activity_reminder: '#3B82F6', // blue
    travel_alert: '#F59E0B', // amber
    partner_share: '#EC4899', // pink
    partner_update: '#8B5CF6', // purple
    booking_confirmation: '#10B981', // green
    booking_reminder: '#6366F1', // indigo
    schedule_change: '#F97316', // orange
    weather_alert: '#06B6D4', // cyan
    price_alert: '#EF4444', // red
    system: '#6B7280', // gray
  };
  return colors[category];
}

export function getPriorityLevel(priority: NotificationPriority): number {
  const levels: Record<NotificationPriority, number> = {
    low: 1,
    normal: 2,
    high: 3,
    critical: 4,
  };
  return levels[priority];
}

export function formatReminderTiming(timing: ReminderTiming): string {
  const labels: Record<ReminderTiming, string> = {
    '5min': '5 minutes before',
    '15min': '15 minutes before',
    '30min': '30 minutes before',
    '1hour': '1 hour before',
    '2hours': '2 hours before',
    '1day': '1 day before',
  };
  return labels[timing];
}

export function getTimingMinutes(timing: ReminderTiming): number {
  const minutes: Record<ReminderTiming, number> = {
    '5min': 5,
    '15min': 15,
    '30min': 30,
    '1hour': 60,
    '2hours': 120,
    '1day': 1440,
  };
  return minutes[timing];
}

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  globalEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,

  activityReminders: {
    enabled: true,
    defaultTimings: ['30min', '1hour'],
    customTimings: [],
    includeDirectionsDefault: true,
    includeWeatherDefault: false,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  },

  travelAlerts: {
    enabled: true,
    defaultBufferMinutes: 15,
    trafficCheckIntervalMinutes: 5,
    alertWhenDelayExceeds: 10,
    preferredTransportMode: 'car',
    showAlternativeRoutes: true,
  },

  partnerNotifications: {
    enabled: true,
    notifyOnShare: true,
    notifyOnUpdate: true,
    notifyOnBooking: true,
    notifyOnLocationShare: true,
    allowCustomMessages: true,
    surpriseMode: {
      enabled: false,
      hiddenItineraryIds: [],
    },
  },

  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    allowCritical: true,
  },

  doNotDisturb: {
    enabled: false,
    allowFrom: [],
  },
};
