// Availability Sync Types for Paint the Town

export type CalendarSource = 'apple' | 'google' | 'outlook' | 'manual';

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export interface CalendarAccount {
  id: string;
  source: CalendarSource;
  email: string;
  name: string;
  color: string;
  isConnected: boolean;
  lastSynced?: string;
  calendars: CalendarInfo[];
}

export interface CalendarInfo {
  id: string;
  accountId: string;
  name: string;
  color: string;
  isEnabled: boolean; // Whether to include in availability calculation
  isWritable: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  isBusy: boolean; // false = free/tentative
}

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface AvailabilityWindow {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  slots: TimeSlot[];
  isWeekend: boolean;
}

export interface UserAvailability {
  userId: string;
  userName: string;
  userColor: string;
  windows: AvailabilityWindow[];
  lastUpdated: string;
  preferences: AvailabilityPreferences;
}

export interface AvailabilityPreferences {
  preferredDays: DayOfWeek[];
  preferredTimeStart: string; // HH:mm
  preferredTimeEnd: string; // HH:mm
  minimumSlotMinutes: number;
  excludeWorkHours: boolean;
  workHoursStart: string; // HH:mm
  workHoursEnd: string; // HH:mm
  bufferBeforeMinutes: number; // Buffer before events
  bufferAfterMinutes: number; // Buffer after events
}

export interface MutualAvailability {
  date: string;
  dayOfWeek: DayOfWeek;
  slots: MutualTimeSlot[];
  isIdeal: boolean; // Matches both users' preferences
}

export interface MutualTimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
  quality: 'ideal' | 'good' | 'possible';
  matchesPreferences: {
    user1: boolean;
    user2: boolean;
  };
}

export interface AvailabilitySyncState {
  userAvailability: UserAvailability | null;
  partnerAvailability: UserAvailability | null;
  mutualAvailability: MutualAvailability[];
  isLoading: boolean;
  lastSyncTime: string | null;
  error: string | null;
}

export interface DateSuggestion {
  id: string;
  slot: MutualTimeSlot;
  date: string;
  dayOfWeek: DayOfWeek;
  quality: 'ideal' | 'good' | 'possible';
  reason: string;
}

// Share code for partner linking
export interface AvailabilityShareCode {
  code: string;
  expiresAt: string;
  createdBy: string;
  isUsed: boolean;
}

// Default preferences
export const DEFAULT_AVAILABILITY_PREFERENCES: AvailabilityPreferences = {
  preferredDays: ['friday', 'saturday', 'sunday'],
  preferredTimeStart: '18:00',
  preferredTimeEnd: '23:00',
  minimumSlotMinutes: 120, // 2 hours minimum for a date
  excludeWorkHours: true,
  workHoursStart: '09:00',
  workHoursEnd: '17:00',
  bufferBeforeMinutes: 30,
  bufferAfterMinutes: 30,
};

// Calendar source colors
export const CALENDAR_SOURCE_COLORS: Record<CalendarSource, string> = {
  apple: '#007AFF',
  google: '#4285F4',
  outlook: '#0078D4',
  manual: '#6B7280',
};

// Day of week helpers
export const DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};
