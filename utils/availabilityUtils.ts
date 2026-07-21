// Availability Sync Utilities for Paint the Town

import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import {
  CalendarAccount,
  CalendarInfo,
  CalendarEvent,
  TimeSlot,
  AvailabilityWindow,
  UserAvailability,
  MutualAvailability,
  MutualTimeSlot,
  AvailabilityPreferences,
  DateSuggestion,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_AVAILABILITY_PREFERENCES,
} from '@/types/availability';

// ============================================================================
// Calendar Permissions & Access
// ============================================================================

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Calendar Access Required',
      'Paint the Town needs calendar access to find available times for your dates. Please enable it in Settings.',
      [{ text: 'OK' }]
    );
    return false;
  }

  return true;
}

export async function getCalendarAccounts(): Promise<CalendarAccount[]> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return [];

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Group by source/account
  const accountMap = new Map<string, CalendarAccount>();

  calendars.forEach((cal) => {
    const sourceId = cal.source?.id || 'local';
    const sourceName = cal.source?.name || 'Local';
    const sourceType = detectCalendarSource(cal.source?.type || '');

    if (!accountMap.has(sourceId)) {
      accountMap.set(sourceId, {
        id: sourceId,
        source: sourceType,
        email: sourceName,
        name: sourceName,
        color: getSourceColor(sourceType),
        isConnected: true,
        lastSynced: new Date().toISOString(),
        calendars: [],
      });
    }

    const account = accountMap.get(sourceId)!;
    account.calendars.push({
      id: cal.id,
      accountId: sourceId,
      name: cal.title,
      color: cal.color || '#6B7280',
      isEnabled: true,
      isWritable: cal.allowsModifications,
    });
  });

  return Array.from(accountMap.values());
}

function detectCalendarSource(sourceType: string): 'apple' | 'google' | 'outlook' | 'manual' {
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
  return 'manual';
}

function getSourceColor(source: 'apple' | 'google' | 'outlook' | 'manual'): string {
  const colors = {
    apple: '#007AFF',
    google: '#4285F4',
    outlook: '#0078D4',
    manual: '#6B7280',
  };
  return colors[source];
}

// ============================================================================
// Fetch Calendar Events
// ============================================================================

export async function fetchCalendarEvents(
  calendarIds: string[],
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return [];

  const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);

  return events.map((event) => ({
    id: event.id,
    calendarId: event.calendarId,
    title: event.title || 'Busy',
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    isAllDay: event.allDay || false,
    location: event.location,
    notes: event.notes,
    isRecurring: !!event.recurrenceRule,
    isBusy: event.availability !== 'free',
  }));
}

// ============================================================================
// Availability Calculation
// ============================================================================

export function calculateAvailability(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  preferences: AvailabilityPreferences = DEFAULT_AVAILABILITY_PREFERENCES
): AvailabilityWindow[] {
  const windows: AvailabilityWindow[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = formatDateString(currentDate);
    const dayOfWeek = DAYS_OF_WEEK[currentDate.getDay()];
    const isWeekend = dayOfWeek === 'saturday' || dayOfWeek === 'sunday';

    // Get events for this day
    const dayEvents = events.filter((event) => {
      const eventDate = formatDateString(event.startDate);
      return eventDate === dateStr && event.isBusy;
    });

    // Calculate free slots
    const slots = calculateFreeSlots(currentDate, dayEvents, preferences);

    windows.push({
      id: `window-${dateStr}`,
      date: dateStr,
      dayOfWeek,
      slots,
      isWeekend,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return windows;
}

function calculateFreeSlots(
  date: Date,
  events: CalendarEvent[],
  preferences: AvailabilityPreferences
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Define the search window based on preferences
  const [prefStartHour, prefStartMin] = preferences.preferredTimeStart.split(':').map(Number);
  const [prefEndHour, prefEndMin] = preferences.preferredTimeEnd.split(':').map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(prefStartHour, prefStartMin, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(prefEndHour, prefEndMin, 0, 0);

  // Handle overnight preferences (e.g., 18:00 - 02:00)
  if (dayEnd <= dayStart) {
    dayEnd.setDate(dayEnd.getDate() + 1);
  }

  // Sort events by start time
  const sortedEvents = [...events]
    .filter((e) => !e.isAllDay)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Add all-day events as blocking the entire day
  const hasAllDayEvent = events.some((e) => e.isAllDay);
  if (hasAllDayEvent) {
    return []; // No availability if there's an all-day event
  }

  // Find gaps between events
  let currentStart = dayStart;

  for (const event of sortedEvents) {
    // Add buffer times
    const eventStart = new Date(
      event.startDate.getTime() - preferences.bufferBeforeMinutes * 60000
    );
    const eventEnd = new Date(event.endDate.getTime() + preferences.bufferAfterMinutes * 60000);

    // Skip events outside our window
    if (eventEnd <= dayStart || eventStart >= dayEnd) {
      continue;
    }

    // If there's a gap before this event
    if (eventStart > currentStart) {
      const slotEnd = eventStart < dayEnd ? eventStart : dayEnd;
      const durationMinutes = (slotEnd.getTime() - currentStart.getTime()) / 60000;

      if (durationMinutes >= preferences.minimumSlotMinutes) {
        slots.push({
          start: new Date(currentStart),
          end: new Date(slotEnd),
          durationMinutes,
        });
      }
    }

    // Move current start past this event
    if (eventEnd > currentStart) {
      currentStart = new Date(eventEnd);
    }
  }

  // Check for remaining time after last event
  if (currentStart < dayEnd) {
    const durationMinutes = (dayEnd.getTime() - currentStart.getTime()) / 60000;

    if (durationMinutes >= preferences.minimumSlotMinutes) {
      slots.push({
        start: new Date(currentStart),
        end: new Date(dayEnd),
        durationMinutes,
      });
    }
  }

  return slots;
}

// ============================================================================
// Mutual Availability
// ============================================================================

export function findMutualAvailability(
  user1Availability: UserAvailability,
  user2Availability: UserAvailability
): MutualAvailability[] {
  const mutualWindows: MutualAvailability[] = [];

  // Create a map of user2's windows by date
  const user2WindowMap = new Map<string, AvailabilityWindow>();
  user2Availability.windows.forEach((w) => user2WindowMap.set(w.date, w));

  // Find overlapping windows
  for (const user1Window of user1Availability.windows) {
    const user2Window = user2WindowMap.get(user1Window.date);
    if (!user2Window) continue;

    const mutualSlots = findOverlappingSlots(
      user1Window.slots,
      user2Window.slots,
      user1Availability.preferences,
      user2Availability.preferences
    );

    if (mutualSlots.length > 0) {
      // Check if this day matches both users' preferred days
      const isIdeal =
        user1Availability.preferences.preferredDays.includes(user1Window.dayOfWeek) &&
        user2Availability.preferences.preferredDays.includes(user1Window.dayOfWeek);

      mutualWindows.push({
        date: user1Window.date,
        dayOfWeek: user1Window.dayOfWeek,
        slots: mutualSlots,
        isIdeal,
      });
    }
  }

  // Sort by quality (ideal first, then by date)
  mutualWindows.sort((a, b) => {
    if (a.isIdeal !== b.isIdeal) return a.isIdeal ? -1 : 1;
    return a.date.localeCompare(b.date);
  });

  return mutualWindows;
}

function findOverlappingSlots(
  slots1: TimeSlot[],
  slots2: TimeSlot[],
  prefs1: AvailabilityPreferences,
  prefs2: AvailabilityPreferences
): MutualTimeSlot[] {
  const overlaps: MutualTimeSlot[] = [];

  for (const slot1 of slots1) {
    for (const slot2 of slots2) {
      const overlapStart = new Date(Math.max(slot1.start.getTime(), slot2.start.getTime()));
      const overlapEnd = new Date(Math.min(slot1.end.getTime(), slot2.end.getTime()));

      if (overlapStart < overlapEnd) {
        const durationMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / 60000;
        const minRequired = Math.max(prefs1.minimumSlotMinutes, prefs2.minimumSlotMinutes);

        if (durationMinutes >= minRequired) {
          // Check if slot matches preferences
          const matchesUser1Prefs = isWithinTimeRange(
            overlapStart,
            prefs1.preferredTimeStart,
            prefs1.preferredTimeEnd
          );
          const matchesUser2Prefs = isWithinTimeRange(
            overlapStart,
            prefs2.preferredTimeStart,
            prefs2.preferredTimeEnd
          );

          let quality: 'ideal' | 'good' | 'possible' = 'possible';
          if (matchesUser1Prefs && matchesUser2Prefs) {
            quality = 'ideal';
          } else if (matchesUser1Prefs || matchesUser2Prefs) {
            quality = 'good';
          }

          overlaps.push({
            start: overlapStart,
            end: overlapEnd,
            durationMinutes,
            quality,
            matchesPreferences: {
              user1: matchesUser1Prefs,
              user2: matchesUser2Prefs,
            },
          });
        }
      }
    }
  }

  // Sort by quality and duration
  overlaps.sort((a, b) => {
    const qualityOrder = { ideal: 0, good: 1, possible: 2 };
    if (qualityOrder[a.quality] !== qualityOrder[b.quality]) {
      return qualityOrder[a.quality] - qualityOrder[b.quality];
    }
    return b.durationMinutes - a.durationMinutes;
  });

  return overlaps;
}

function isWithinTimeRange(date: Date, startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeMinutes = hours * 60 + minutes;

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes > startMinutes) {
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  } else {
    // Overnight range
    return timeMinutes >= startMinutes || timeMinutes < endMinutes;
  }
}

// ============================================================================
// Date Suggestions
// ============================================================================

export function generateDateSuggestions(
  mutualAvailability: MutualAvailability[],
  maxSuggestions: number = 5
): DateSuggestion[] {
  const suggestions: DateSuggestion[] = [];

  for (const window of mutualAvailability) {
    for (const slot of window.slots) {
      if (suggestions.length >= maxSuggestions) break;

      let reason = '';
      if (slot.quality === 'ideal') {
        reason = 'Perfect match! Both of you prefer this time.';
      } else if (slot.quality === 'good') {
        reason = 'Works well for both schedules.';
      } else {
        reason = 'Available time slot found.';
      }

      if (slot.durationMinutes >= 180) {
        reason += ' Plenty of time for dinner and an activity!';
      } else if (slot.durationMinutes >= 120) {
        reason += ' Great for dinner or an evening activity.';
      }

      suggestions.push({
        id: `suggestion-${window.date}-${slot.start.getTime()}`,
        slot,
        date: window.date,
        dayOfWeek: window.dayOfWeek,
        quality: slot.quality,
        reason,
      });
    }

    if (suggestions.length >= maxSuggestions) break;
  }

  return suggestions;
}

// ============================================================================
// Share Code Generation
// ============================================================================

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function validateShareCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

// ============================================================================
// Formatting Helpers
// ============================================================================

export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatTimeRange(start: Date, end: Date): string {
  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getQualityColor(quality: 'ideal' | 'good' | 'possible'): string {
  switch (quality) {
    case 'ideal':
      return '#10B981'; // green
    case 'good':
      return '#3B82F6'; // blue
    case 'possible':
      return '#6B7280'; // gray
  }
}

export function getQualityLabel(quality: 'ideal' | 'good' | 'possible'): string {
  switch (quality) {
    case 'ideal':
      return 'Perfect';
    case 'good':
      return 'Good';
    case 'possible':
      return 'Possible';
  }
}
