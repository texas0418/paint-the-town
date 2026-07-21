// ============================================================================
// Calendar Export Utility for Paint the Town
// Supports iOS Calendar, Google Calendar (via device sync), and other calendars
// ============================================================================

import * as Calendar from 'expo-calendar';
import { Platform, Alert, Linking } from 'react-native';
import {
  CalendarAccount,
  DeviceCalendar,
  CalendarExportOptions,
  CalendarExportResult,
  CalendarEventToCreate,
  CreatedCalendarEvent,
  CalendarExportError,
  ActivityEventMapping,
  CalendarAlarm,
  DEFAULT_EXPORT_OPTIONS,
  CATEGORY_COLORS,
  CalendarErrorCode,
} from '../types/calendar';
import { Trip, Activity, DayItinerary } from '../types';

// ============================================================================
// Permission Handling
// ============================================================================

/**
 * Request calendar permissions from the user
 */
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Calendar.getCalendarPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Calendar Access Required',
        'Paint the Town needs access to your calendar to export your itinerary. Please enable calendar access in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
}

/**
 * Check if calendar permissions are granted
 */
export async function hasCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ============================================================================
// Calendar Discovery
// ============================================================================

/**
 * Get all available calendars on the device
 */
export async function getAvailableCalendars(): Promise<DeviceCalendar[]> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return [];

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    return calendars
      .filter((cal) => cal.allowsModifications)
      .map((cal) => ({
        id: cal.id,
        title: cal.title,
        color: cal.color || '#2196F3',
        source: {
          id: cal.source?.id || 'unknown',
          name: cal.source?.name || 'Unknown',
          type: detectCalendarType(cal.source?.type || ''),
          color: cal.color || '#2196F3',
          isPrimary: cal.isPrimary || false,
        },
        allowsModifications: cal.allowsModifications,
        isPrimary: cal.isPrimary || false,
        entityType: 'event',
      }));
  } catch (error) {
    console.error('Error getting calendars:', error);
    return [];
  }
}

/**
 * Detect calendar source type
 */
function detectCalendarType(sourceType: string): CalendarAccount['type'] {
  const type = sourceType.toLowerCase();

  if (type.includes('icloud') || type.includes('apple') || type.includes('local')) {
    return 'apple';
  }
  if (type.includes('google') || type.includes('gmail')) {
    return 'google';
  }
  if (type.includes('outlook') || type.includes('microsoft') || type.includes('exchange')) {
    return 'outlook';
  }
  if (type.includes('exchange')) {
    return 'exchange';
  }

  return 'other';
}

/**
 * Get the default calendar for the device
 */
export async function getDefaultCalendar(): Promise<DeviceCalendar | null> {
  const calendars = await getAvailableCalendars();

  if (calendars.length === 0) return null;

  // Try to find the primary calendar
  const primary = calendars.find((cal) => cal.isPrimary);
  if (primary) return primary;

  // Fall back to first writable calendar
  return calendars[0];
}

/**
 * Get calendars grouped by account
 */
export async function getCalendarsByAccount(): Promise<Map<string, DeviceCalendar[]>> {
  const calendars = await getAvailableCalendars();
  const grouped = new Map<string, DeviceCalendar[]>();

  calendars.forEach((cal) => {
    const accountName = cal.source.name;
    const existing = grouped.get(accountName) || [];
    grouped.set(accountName, [...existing, cal]);
  });

  return grouped;
}

/**
 * Create a new calendar for Paint the Town trips
 */
export async function createPaintTheTownCalendar(): Promise<string | null> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return null;

  try {
    // Get default calendar source
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultSource = calendars.find((cal) => cal.isPrimary)?.source;

    if (!defaultSource) {
      console.error('No calendar source found');
      return null;
    }

    const calendarId = await Calendar.createCalendarAsync({
      title: 'Paint the Town Trips',
      color: '#FF6B6B',
      entityType: Calendar.EntityTypes.EVENT,
      source: defaultSource,
      name: 'Paint the Town Trips',
      ownerAccount: defaultSource.name,
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return calendarId;
  } catch (error) {
    console.error('Error creating Paint the Town calendar:', error);
    return null;
  }
}

// ============================================================================
// Event Creation
// ============================================================================

/**
 * Create a single calendar event
 */
export async function createCalendarEvent(
  event: CalendarEventToCreate,
  calendarId: string
): Promise<CreatedCalendarEvent> {
  try {
    const eventDetails: Calendar.Event = {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      notes: event.notes,
      url: event.url,
      allDay: event.allDay || false,
      availability: mapAvailability(event.availability),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: event.alarms?.map((alarm) => ({
        relativeOffset: alarm.relativeOffset,
        method: mapAlarmMethod(alarm.method),
      })),
    };

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);

    return {
      id: eventId,
      calendarId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      success: true,
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      id: '',
      calendarId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Map availability string to Calendar constant
 */
function mapAvailability(availability?: string): Calendar.Availability {
  switch (availability) {
    case 'busy':
      return Calendar.Availability.BUSY;
    case 'free':
      return Calendar.Availability.FREE;
    case 'tentative':
      return Calendar.Availability.TENTATIVE;
    default:
      return Calendar.Availability.BUSY;
  }
}

/**
 * Map alarm method string to Calendar constant
 */
function mapAlarmMethod(method?: string): Calendar.AlarmMethod {
  switch (method) {
    case 'alert':
      return Calendar.AlarmMethod.ALERT;
    case 'email':
      return Calendar.AlarmMethod.EMAIL;
    case 'sms':
      return Calendar.AlarmMethod.SMS;
    default:
      return Calendar.AlarmMethod.DEFAULT;
  }
}

// ============================================================================
// Activity to Event Conversion
// ============================================================================

/**
 * Convert an activity to a calendar event
 */
export function activityToCalendarEvent(
  activity: Activity,
  dayDate: string,
  options: CalendarExportOptions
): CalendarEventToCreate {
  // Parse the time from activity
  const { startDateTime, endDateTime } = parseActivityDateTime(activity, dayDate);

  // Build event title
  const title = options.titlePrefix ? `${options.titlePrefix}${activity.name}` : activity.name;

  // Build notes content
  const notes = buildEventNotes(activity, options);

  // Build alarms
  const alarms: CalendarAlarm[] = options.addReminders
    ? options.reminderMinutes.map((mins) => ({ relativeOffset: -mins }))
    : [];

  return {
    title,
    startDate: startDateTime,
    endDate: endDateTime,
    location: options.includeLocation ? activity.location : undefined,
    notes,
    url:
      activity.bookingId && options.includeLinks
        ? `w4nder://booking/${activity.bookingId}`
        : undefined,
    alarms,
    availability: activity.isBooked ? 'busy' : 'tentative',
  };
}

/**
 * Parse activity time and duration to get start/end dates
 */
function parseActivityDateTime(
  activity: Activity,
  dayDate: string
): { startDateTime: Date; endDateTime: Date } {
  const [year, month, day] = dayDate.split('-').map(Number);
  const [hours, minutes] = (activity.time || '09:00').split(':').map(Number);

  const startDateTime = new Date(year, month - 1, day, hours, minutes);

  // Parse duration
  const durationMinutes = parseDurationToMinutes(activity.duration);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  return { startDateTime, endDateTime };
}

/**
 * Parse duration string to minutes
 */
function parseDurationToMinutes(duration: string): number {
  const durationLower = duration.toLowerCase();

  // Handle "X hours" or "X hr"
  const hourMatch = durationLower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hr)/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // Handle "X minutes" or "X min"
  const minMatch = durationLower.match(/(\d+)\s*(?:minutes?|min)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // Handle "X-Y hours" range
  const rangeMatch = durationLower.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:hours?|hr)/);
  if (rangeMatch) {
    const avg = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
    return Math.round(avg * 60);
  }

  // Default to 1 hour
  return 60;
}

/**
 * Build event notes content
 */
function buildEventNotes(activity: Activity, options: CalendarExportOptions): string {
  const lines: string[] = [];

  if (activity.description) {
    lines.push(activity.description);
    lines.push('');
  }

  if (options.includeBookingDetails && activity.isBooked) {
    lines.push('📋 BOOKING DETAILS');
    if (activity.bookingId) {
      lines.push(`Confirmation: ${activity.bookingId}`);
    }
    lines.push(`Status: ${activity.isBooked ? 'Confirmed' : 'Not Booked'}`);
    lines.push('');
  }

  if (options.includeCosts && activity.price > 0) {
    lines.push(`💰 Cost: ${activity.currency || '$'}${activity.price.toFixed(2)}`);
  }

  if (activity.rating) {
    lines.push(`⭐ Rating: ${activity.rating}/5`);
  }

  lines.push('');
  lines.push('─────────────');
  lines.push('Exported from Paint the Town');

  return lines.join('\n');
}

/**
 * Create a travel time event between two activities
 */
export function createTravelTimeEvent(
  fromActivity: Activity,
  toActivity: Activity,
  dayDate: string,
  travelMinutes: number,
  options: CalendarExportOptions
): CalendarEventToCreate | null {
  if (!options.includeTravelTime || travelMinutes <= 0) {
    return null;
  }

  // Get end time of first activity
  const { endDateTime: fromEnd } = parseActivityDateTime(fromActivity, dayDate);
  const { startDateTime: toStart } = parseActivityDateTime(toActivity, dayDate);

  // Create travel event that starts after first activity ends
  const travelStart = new Date(fromEnd);
  const travelEnd = new Date(toStart);

  // Only create if there's actually time between activities
  if (travelEnd <= travelStart) {
    return null;
  }

  return {
    title: `🚗 Travel to ${toActivity.name}`,
    startDate: travelStart,
    endDate: travelEnd,
    location: `From: ${fromActivity.location}\nTo: ${toActivity.location}`,
    notes: `Travel time from ${fromActivity.name} to ${toActivity.name}\nEstimated: ${travelMinutes} minutes`,
    availability: 'busy',
    alarms: options.addReminders ? [{ relativeOffset: -5 }] : [],
  };
}

/**
 * Create a day overview all-day event
 */
export function createDayOverviewEvent(
  day: DayItinerary,
  tripName: string,
  options: CalendarExportOptions
): CalendarEventToCreate {
  const [year, month, dayNum] = day.date.split('-').map(Number);
  const startDate = new Date(year, month - 1, dayNum, 0, 0, 0);
  const endDate = new Date(year, month - 1, dayNum, 23, 59, 59);

  const activityList = day.activities
    .map((a, i) => `${i + 1}. ${a.time || '--:--'} - ${a.name}`)
    .join('\n');

  return {
    title: `${options.titlePrefix || ''}Day ${day.day}: ${day.title}`,
    startDate,
    endDate,
    allDay: true,
    notes: `${tripName}\n\n📋 Today's Activities:\n${activityList}\n\n─────────────\nExported from Paint the Town`,
    availability: 'free',
    alarms: options.addReminders ? [{ relativeOffset: -1440 }] : [], // 24 hours before
  };
}

// ============================================================================
// Full Export Functions
// ============================================================================

/**
 * Export a complete trip to calendar
 */
export async function exportTripToCalendar(
  trip: Trip,
  calendarId: string,
  options: CalendarExportOptions = DEFAULT_EXPORT_OPTIONS,
  onProgress?: (progress: { day: number; totalDays: number; activity: string }) => void
): Promise<CalendarExportResult> {
  const hasPermission = await requestCalendarPermissions();

  if (!hasPermission) {
    return {
      success: false,
      totalEvents: 0,
      createdEvents: 0,
      failedEvents: 0,
      events: [],
      errors: [
        {
          error: 'Calendar permission denied',
          code: 'PERMISSION_DENIED',
        },
      ],
    };
  }

  return exportItineraryToCalendar(
    trip.itinerary,
    trip.destination.name,
    calendarId,
    options,
    onProgress
  );
}

/**
 * Export an itinerary to calendar
 */
export async function exportItineraryToCalendar(
  itinerary: DayItinerary[],
  tripName: string,
  calendarId: string,
  options: CalendarExportOptions = DEFAULT_EXPORT_OPTIONS,
  onProgress?: (progress: { day: number; totalDays: number; activity: string }) => void
): Promise<CalendarExportResult> {
  const events: CreatedCalendarEvent[] = [];
  const errors: CalendarExportError[] = [];
  let totalEvents = 0;

  // Calculate total events to create
  itinerary.forEach((day) => {
    if (options.createDayOverview) totalEvents++;
    totalEvents += day.activities.length;
    if (options.includeTravelTime) {
      totalEvents += Math.max(0, day.activities.length - 1);
    }
  });

  for (let dayIndex = 0; dayIndex < itinerary.length; dayIndex++) {
    const day = itinerary[dayIndex];

    // Create day overview event
    if (options.createDayOverview) {
      const overviewEvent = createDayOverviewEvent(day, tripName, options);
      const result = await createCalendarEvent(overviewEvent, calendarId);
      events.push(result);

      if (!result.success) {
        errors.push({
          dayIndex,
          error: result.error || 'Failed to create day overview event',
          code: 'EVENT_CREATION_FAILED',
        });
      }
    }

    // Create activity events
    for (let actIndex = 0; actIndex < day.activities.length; actIndex++) {
      const activity = day.activities[actIndex];

      onProgress?.({
        day: dayIndex + 1,
        totalDays: itinerary.length,
        activity: activity.name,
      });

      // Create activity event
      const activityEvent = activityToCalendarEvent(activity, day.date, options);
      const result = await createCalendarEvent(activityEvent, calendarId);
      events.push(result);

      if (!result.success) {
        errors.push({
          activityId: activity.id,
          activityName: activity.name,
          dayIndex,
          error: result.error || 'Failed to create event',
          code: 'EVENT_CREATION_FAILED',
        });
      }

      // Create travel time event to next activity
      if (options.includeTravelTime && actIndex < day.activities.length - 1) {
        const nextActivity = day.activities[actIndex + 1];
        const travelEvent = createTravelTimeEvent(
          activity,
          nextActivity,
          day.date,
          15, // Default 15 min travel time - could be calculated
          options
        );

        if (travelEvent) {
          const travelResult = await createCalendarEvent(travelEvent, calendarId);
          events.push(travelResult);

          if (!travelResult.success) {
            errors.push({
              activityId: activity.id,
              activityName: `Travel: ${activity.name} → ${nextActivity.name}`,
              dayIndex,
              error: travelResult.error || 'Failed to create travel event',
              code: 'EVENT_CREATION_FAILED',
            });
          }
        }
      }
    }
  }

  const createdEvents = events.filter((e) => e.success).length;

  return {
    success: errors.length === 0,
    totalEvents,
    createdEvents,
    failedEvents: events.length - createdEvents,
    events,
    errors,
    calendarId,
  };
}

/**
 * Export a single day to calendar
 */
export async function exportDayToCalendar(
  day: DayItinerary,
  tripName: string,
  calendarId: string,
  options: CalendarExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<CalendarExportResult> {
  return exportItineraryToCalendar([day], tripName, calendarId, options);
}

/**
 * Export a single activity to calendar
 */
export async function exportActivityToCalendar(
  activity: Activity,
  date: string,
  calendarId: string,
  options: CalendarExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<CalendarExportResult> {
  const hasPermission = await requestCalendarPermissions();

  if (!hasPermission) {
    return {
      success: false,
      totalEvents: 0,
      createdEvents: 0,
      failedEvents: 0,
      events: [],
      errors: [
        {
          error: 'Calendar permission denied',
          code: 'PERMISSION_DENIED',
        },
      ],
    };
  }

  const event = activityToCalendarEvent(activity, date, options);
  const result = await createCalendarEvent(event, calendarId);

  return {
    success: result.success,
    totalEvents: 1,
    createdEvents: result.success ? 1 : 0,
    failedEvents: result.success ? 0 : 1,
    events: [result],
    errors: result.success
      ? []
      : [
          {
            activityId: activity.id,
            activityName: activity.name,
            error: result.error || 'Failed to create event',
            code: 'EVENT_CREATION_FAILED',
          },
        ],
    calendarId,
  };
}

// ============================================================================
// Delete Events (for updates)
// ============================================================================

/**
 * Delete previously exported events
 */
export async function deleteExportedEvents(eventIds: string[]): Promise<number> {
  let deleted = 0;

  for (const eventId of eventIds) {
    try {
      await Calendar.deleteEventAsync(eventId);
      deleted++;
    } catch (error) {
      console.error(`Failed to delete event ${eventId}:`, error);
    }
  }

  return deleted;
}

// ============================================================================
// Google Calendar Specific (via Deep Link)
// ============================================================================

/**
 * Generate Google Calendar URL for single event
 * This opens Google Calendar in browser/app with pre-filled event
 */
export function generateGoogleCalendarUrl(event: CalendarEventToCreate): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
    details: event.notes || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate ICS file content for sharing
 */
export function generateICSContent(events: CalendarEventToCreate[], tripName: string): string {
  const formatICSDate = (date: Date): string => {
    return (
      date
        .toISOString()
        .replace(/-|:|\.\d{3}/g, '')
        .slice(0, -1) + 'Z'
    );
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paint the Town//Trip Export//EN',
    `X-WR-CALNAME:${escapeText(tripName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event, index) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:w4nder-${Date.now()}-${index}@w4nder.app`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(event.startDate)}`);
    lines.push(`DTEND:${formatICSDate(event.endDate)}`);
    lines.push(`SUMMARY:${escapeText(event.title)}`);

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }
    if (event.notes) {
      lines.push(`DESCRIPTION:${escapeText(event.notes)}`);
    }
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    event.alarms?.forEach((alarm) => {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push('DESCRIPTION:Reminder');
      lines.push(`TRIGGER:-PT${Math.abs(alarm.relativeOffset)}M`);
      lines.push('END:VALARM');
    });

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}
