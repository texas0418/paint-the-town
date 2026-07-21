// ============================================================================
// Calendar Export Types for Paint the Town
// ============================================================================

import { Activity, DayItinerary, Trip } from './index';

// ============================================================================
// Calendar Account & Selection Types
// ============================================================================

export interface CalendarAccount {
  id: string;
  name: string;
  type: 'apple' | 'google' | 'outlook' | 'exchange' | 'local' | 'other';
  color: string;
  isPrimary: boolean;
}

export interface DeviceCalendar {
  id: string;
  title: string;
  color: string;
  source: CalendarAccount;
  allowsModifications: boolean;
  isPrimary: boolean;
  entityType: 'event' | 'reminder';
}

export interface CalendarSelection {
  calendarId: string;
  calendarName: string;
  accountType: CalendarAccount['type'];
}

// ============================================================================
// Export Configuration Types
// ============================================================================

export interface CalendarExportOptions {
  /** Include travel time between activities */
  includeTravelTime: boolean;

  /** Add reminder notifications */
  addReminders: boolean;

  /** Reminder time in minutes before event */
  reminderMinutes: number[];

  /** Include booking confirmation details in notes */
  includeBookingDetails: boolean;

  /** Include location/address information */
  includeLocation: boolean;

  /** Include cost information in notes */
  includeCosts: boolean;

  /** Add links to bookings/confirmations */
  includeLinks: boolean;

  /** Color code by activity category */
  colorByCategory: boolean;

  /** Create all-day event for each day overview */
  createDayOverview: boolean;

  /** Prefix for event titles */
  titlePrefix?: string;

  /** Custom timezone (defaults to device) */
  timezone?: string;
}

export const DEFAULT_EXPORT_OPTIONS: CalendarExportOptions = {
  includeTravelTime: true,
  addReminders: true,
  reminderMinutes: [30, 60],
  includeBookingDetails: true,
  includeLocation: true,
  includeCosts: false,
  includeLinks: true,
  colorByCategory: false,
  createDayOverview: true,
  titlePrefix: '🌴 ',
  timezone: undefined,
};

// ============================================================================
// Calendar Event Types
// ============================================================================

export interface CalendarEventToCreate {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  url?: string;
  alarms?: CalendarAlarm[];
  allDay?: boolean;
  availability?: 'busy' | 'free' | 'tentative';
  organizer?: string;
  calendarId?: string;
}

export interface CalendarAlarm {
  relativeOffset: number; // minutes before event (negative number)
  method?: 'alert' | 'email' | 'sms' | 'default';
}

export interface CreatedCalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  success: boolean;
  error?: string;
}

// ============================================================================
// Export Result Types
// ============================================================================

export interface CalendarExportResult {
  success: boolean;
  totalEvents: number;
  createdEvents: number;
  failedEvents: number;
  events: CreatedCalendarEvent[];
  errors: CalendarExportError[];
  calendarName?: string;
  calendarId?: string;
}

export interface CalendarExportError {
  activityId?: string;
  activityName?: string;
  dayIndex?: number;
  error: string;
  code: CalendarErrorCode;
}

export type CalendarErrorCode =
  | 'PERMISSION_DENIED'
  | 'CALENDAR_NOT_FOUND'
  | 'CALENDAR_NOT_WRITABLE'
  | 'INVALID_DATE'
  | 'EVENT_CREATION_FAILED'
  | 'UNKNOWN_ERROR';

// ============================================================================
// Export Progress Types
// ============================================================================

export interface CalendarExportProgress {
  status:
    | 'idle'
    | 'requesting_permission'
    | 'selecting_calendar'
    | 'exporting'
    | 'complete'
    | 'error';
  currentDay?: number;
  totalDays?: number;
  currentActivity?: string;
  eventsCreated: number;
  totalEvents: number;
  message?: string;
}

// ============================================================================
// Activity to Event Mapping
// ============================================================================

export interface ActivityEventMapping {
  activity: Activity;
  dayDate: string;
  startDateTime: Date;
  endDateTime: Date;
  travelEvent?: CalendarEventToCreate;
}

// ============================================================================
// Category Colors
// ============================================================================

export const CATEGORY_COLORS: Record<string, string> = {
  Sightseeing: '#4CAF50',
  Dining: '#FF9800',
  Cultural: '#9C27B0',
  Entertainment: '#E91E63',
  Transport: '#607D8B',
  Adventure: '#F44336',
  Relaxation: '#00BCD4',
  Shopping: '#795548',
  Nightlife: '#3F51B5',
  Tours: '#8BC34A',
  default: '#2196F3',
};

// ============================================================================
// Helper Types for UI
// ============================================================================

export interface CalendarExportSheetProps {
  visible: boolean;
  onClose: () => void;
  trip?: Trip;
  itinerary?: DayItinerary[];
  tripName?: string;
  onExportComplete?: (result: CalendarExportResult) => void;
}

export interface CalendarSelectorProps {
  calendars: DeviceCalendar[];
  selectedCalendarId?: string;
  onSelect: (calendar: DeviceCalendar) => void;
}

export interface ExportOptionsEditorProps {
  options: CalendarExportOptions;
  onChange: (options: CalendarExportOptions) => void;
}
