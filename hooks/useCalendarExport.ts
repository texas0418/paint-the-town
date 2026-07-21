// ============================================================================
// useCalendarExport Hook
// React hook for managing calendar export state and operations
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform, Share } from 'react-native';
// eslint-disable-next-line import/no-unresolved -- tracked in #3
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  DeviceCalendar,
  CalendarExportOptions,
  CalendarExportResult,
  CalendarExportProgress,
  DEFAULT_EXPORT_OPTIONS,
} from '../types/calendar';
import { Trip, DayItinerary, Activity } from '../types';
import {
  requestCalendarPermissions,
  hasCalendarPermission,
  getAvailableCalendars,
  getDefaultCalendar,
  getCalendarsByAccount,
  exportTripToCalendar,
  exportItineraryToCalendar,
  exportDayToCalendar,
  exportActivityToCalendar,
  generateICSContent,
  activityToCalendarEvent,
  createDayOverviewEvent,
} from '../utils/calendarExport';

// ============================================================================
// Hook State Interface
// ============================================================================

interface UseCalendarExportState {
  // Permission state
  hasPermission: boolean;
  isCheckingPermission: boolean;
  
  // Calendar state
  calendars: DeviceCalendar[];
  selectedCalendar: DeviceCalendar | null;
  isLoadingCalendars: boolean;
  
  // Export state
  isExporting: boolean;
  progress: CalendarExportProgress;
  lastResult: CalendarExportResult | null;
  
  // Options
  options: CalendarExportOptions;
}

interface UseCalendarExportReturn extends UseCalendarExportState {
  // Permission actions
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  
  // Calendar actions
  loadCalendars: () => Promise<void>;
  selectCalendar: (calendar: DeviceCalendar) => void;
  
  // Export actions
  exportTrip: (trip: Trip) => Promise<CalendarExportResult>;
  exportItinerary: (itinerary: DayItinerary[], tripName: string) => Promise<CalendarExportResult>;
  exportDay: (day: DayItinerary, tripName: string) => Promise<CalendarExportResult>;
  exportActivity: (activity: Activity, date: string) => Promise<CalendarExportResult>;
  
  // ICS Export (universal)
  shareAsICS: (itinerary: DayItinerary[], tripName: string) => Promise<void>;
  
  // Options actions
  updateOptions: (options: Partial<CalendarExportOptions>) => void;
  resetOptions: () => void;
  
  // Utility
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export function useCalendarExport(): UseCalendarExportReturn {
  // ─────────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────────
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [calendars, setCalendars] = useState<DeviceCalendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<DeviceCalendar | null>(null);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<CalendarExportProgress>({
    status: 'idle',
    eventsCreated: 0,
    totalEvents: 0,
  });
  const [lastResult, setLastResult] = useState<CalendarExportResult | null>(null);
  const [options, setOptions] = useState<CalendarExportOptions>(DEFAULT_EXPORT_OPTIONS);

  // ─────────────────────────────────────────────────────────────────────────
  // Permission Actions
  // ─────────────────────────────────────────────────────────────────────────
  
  const checkPermission = useCallback(async (): Promise<boolean> => {
    setIsCheckingPermission(true);
    try {
      const granted = await hasCalendarPermission();
      setHasPermission(granted);
      return granted;
    } finally {
      setIsCheckingPermission(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setProgress(prev => ({ ...prev, status: 'requesting_permission' }));
    setIsCheckingPermission(true);
    try {
      const granted = await requestCalendarPermissions();
      setHasPermission(granted);
      
      if (granted) {
        // Load calendars after getting permission
        await loadCalendars();
      }
      
      return granted;
    } finally {
      setIsCheckingPermission(false);
      setProgress(prev => ({ ...prev, status: 'idle' }));
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Calendar Actions
  // ─────────────────────────────────────────────────────────────────────────
  
  const loadCalendars = useCallback(async (): Promise<void> => {
    setIsLoadingCalendars(true);
    try {
      const availableCalendars = await getAvailableCalendars();
      setCalendars(availableCalendars);
      
      // Auto-select default calendar if none selected
      if (!selectedCalendar && availableCalendars.length > 0) {
        const defaultCal = await getDefaultCalendar();
        if (defaultCal) {
          setSelectedCalendar(defaultCal);
        }
      }
    } finally {
      setIsLoadingCalendars(false);
    }
  }, [selectedCalendar]);

  const selectCalendar = useCallback((calendar: DeviceCalendar) => {
    setSelectedCalendar(calendar);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Export Actions
  // ─────────────────────────────────────────────────────────────────────────
  
  const handleExportProgress = useCallback((progressUpdate: {
    day: number;
    totalDays: number;
    activity: string;
  }) => {
    setProgress(prev => ({
      ...prev,
      currentDay: progressUpdate.day,
      totalDays: progressUpdate.totalDays,
      currentActivity: progressUpdate.activity,
      message: `Day ${progressUpdate.day}/${progressUpdate.totalDays}: ${progressUpdate.activity}`,
    }));
  }, []);

  const exportTrip = useCallback(async (trip: Trip): Promise<CalendarExportResult> => {
    if (!selectedCalendar) {
      const error: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{ error: 'No calendar selected', code: 'CALENDAR_NOT_FOUND' }],
      };
      setLastResult(error);
      return error;
    }

    setIsExporting(true);
    setProgress({
      status: 'exporting',
      eventsCreated: 0,
      totalEvents: trip.itinerary.reduce((sum, day) => sum + day.activities.length, 0),
    });

    try {
      const result = await exportTripToCalendar(
        trip,
        selectedCalendar.id,
        options,
        handleExportProgress
      );
      
      setLastResult(result);
      setProgress(prev => ({
        ...prev,
        status: 'complete',
        eventsCreated: result.createdEvents,
        message: result.success
          ? `Successfully added ${result.createdEvents} events to your calendar!`
          : `Added ${result.createdEvents} events with ${result.failedEvents} failures`,
      }));
      
      return result;
    } catch (error) {
      const errorResult: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }],
      };
      setLastResult(errorResult);
      setProgress(prev => ({ ...prev, status: 'error', message: 'Export failed' }));
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, [selectedCalendar, options, handleExportProgress]);

  const exportItinerary = useCallback(async (
    itinerary: DayItinerary[],
    tripName: string
  ): Promise<CalendarExportResult> => {
    if (!selectedCalendar) {
      const error: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{ error: 'No calendar selected', code: 'CALENDAR_NOT_FOUND' }],
      };
      setLastResult(error);
      return error;
    }

    setIsExporting(true);
    setProgress({
      status: 'exporting',
      eventsCreated: 0,
      totalEvents: itinerary.reduce((sum, day) => sum + day.activities.length, 0),
    });

    try {
      const result = await exportItineraryToCalendar(
        itinerary,
        tripName,
        selectedCalendar.id,
        options,
        handleExportProgress
      );
      
      setLastResult(result);
      setProgress(prev => ({
        ...prev,
        status: 'complete',
        eventsCreated: result.createdEvents,
        message: result.success
          ? `Successfully added ${result.createdEvents} events!`
          : `Added ${result.createdEvents} events with ${result.failedEvents} failures`,
      }));
      
      return result;
    } catch (error) {
      const errorResult: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }],
      };
      setLastResult(errorResult);
      setProgress(prev => ({ ...prev, status: 'error', message: 'Export failed' }));
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, [selectedCalendar, options, handleExportProgress]);

  const exportDay = useCallback(async (
    day: DayItinerary,
    tripName: string
  ): Promise<CalendarExportResult> => {
    if (!selectedCalendar) {
      const error: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{ error: 'No calendar selected', code: 'CALENDAR_NOT_FOUND' }],
      };
      setLastResult(error);
      return error;
    }

    setIsExporting(true);
    setProgress({
      status: 'exporting',
      eventsCreated: 0,
      totalEvents: day.activities.length + 1,
    });

    try {
      const result = await exportDayToCalendar(day, tripName, selectedCalendar.id, options);
      setLastResult(result);
      setProgress(prev => ({
        ...prev,
        status: 'complete',
        eventsCreated: result.createdEvents,
      }));
      return result;
    } catch (error) {
      const errorResult: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }],
      };
      setLastResult(errorResult);
      setProgress(prev => ({ ...prev, status: 'error' }));
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, [selectedCalendar, options]);

  const exportActivity = useCallback(async (
    activity: Activity,
    date: string
  ): Promise<CalendarExportResult> => {
    if (!selectedCalendar) {
      const error: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{ error: 'No calendar selected', code: 'CALENDAR_NOT_FOUND' }],
      };
      setLastResult(error);
      return error;
    }

    setIsExporting(true);
    setProgress({
      status: 'exporting',
      eventsCreated: 0,
      totalEvents: 1,
    });

    try {
      const result = await exportActivityToCalendar(
        activity,
        date,
        selectedCalendar.id,
        options
      );
      setLastResult(result);
      setProgress(prev => ({
        ...prev,
        status: 'complete',
        eventsCreated: result.createdEvents,
      }));
      return result;
    } catch (error) {
      const errorResult: CalendarExportResult = {
        success: false,
        totalEvents: 0,
        createdEvents: 0,
        failedEvents: 0,
        events: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }],
      };
      setLastResult(errorResult);
      setProgress(prev => ({ ...prev, status: 'error' }));
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  }, [selectedCalendar, options]);

  // ─────────────────────────────────────────────────────────────────────────
  // ICS Export (Universal - works with any calendar app)
  // ─────────────────────────────────────────────────────────────────────────
  
  const shareAsICS = useCallback(async (
    itinerary: DayItinerary[],
    tripName: string
  ): Promise<void> => {
    setIsExporting(true);
    setProgress({ status: 'exporting', eventsCreated: 0, totalEvents: 0 });
    
    try {
      // Convert itinerary to calendar events
      const events = itinerary.flatMap(day => {
        const dayEvents = [
          createDayOverviewEvent(day, tripName, options),
          ...day.activities.map(activity =>
            activityToCalendarEvent(activity, day.date, options)
          ),
        ];
        return dayEvents;
      });
      
      // Generate ICS content
      const icsContent = generateICSContent(events, tripName);
      
      // Save to temp file
      const fileName = `${tripName.replace(/[^a-zA-Z0-9]/g, '_')}_itinerary.ics`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, icsContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/calendar',
          dialogTitle: `Share ${tripName} Itinerary`,
          UTI: 'public.calendar-event',
        });
      } else {
        // Fallback to native share
        await Share.share({
          title: `${tripName} Itinerary`,
          message: `Download the ICS file to add ${tripName} to your calendar`,
          url: filePath,
        });
      }
      
      setProgress(prev => ({
        ...prev,
        status: 'complete',
        message: 'ICS file ready to share!',
      }));
    } catch (error) {
      console.error('Error sharing ICS:', error);
      Alert.alert('Export Failed', 'Could not create calendar file. Please try again.');
      setProgress(prev => ({ ...prev, status: 'error', message: 'Export failed' }));
    } finally {
      setIsExporting(false);
    }
  }, [options]);

  // ─────────────────────────────────────────────────────────────────────────
  // Options Actions
  // ─────────────────────────────────────────────────────────────────────────
  
  const updateOptions = useCallback((newOptions: Partial<CalendarExportOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions(DEFAULT_EXPORT_OPTIONS);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────────────────
  
  const reset = useCallback(() => {
    setProgress({ status: 'idle', eventsCreated: 0, totalEvents: 0 });
    setLastResult(null);
    setIsExporting(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────
  
  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // ─────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────
  
  return {
    // State
    hasPermission,
    isCheckingPermission,
    calendars,
    selectedCalendar,
    isLoadingCalendars,
    isExporting,
    progress,
    lastResult,
    options,
    
    // Actions
    checkPermission,
    requestPermission,
    loadCalendars,
    selectCalendar,
    exportTrip,
    exportItinerary,
    exportDay,
    exportActivity,
    shareAsICS,
    updateOptions,
    resetOptions,
    reset,
  };
}

export default useCalendarExport;
