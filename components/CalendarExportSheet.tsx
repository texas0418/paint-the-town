// ============================================================================
// CalendarExportSheet Component
// Full-featured modal for exporting itineraries to device calendar
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Calendar,
  CalendarPlus,
  Check,
  ChevronRight,
  Clock,
  Bell,
  MapPin,
  DollarSign,
  Link2,
  FileText,
  Share2,
  AlertCircle,
  CheckCircle2,
  Smartphone,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useCalendarExport } from '@/hooks/useCalendarExport';
import { Trip, DayItinerary } from '@/types';
import {
  DeviceCalendar,
  CalendarExportOptions,
  CalendarExportSheetProps,
} from '@/types/calendar';

// ============================================================================
// Sub-Components
// ============================================================================

interface CalendarItemProps {
  calendar: DeviceCalendar;
  isSelected: boolean;
  onSelect: () => void;
}

const CalendarItem: React.FC<CalendarItemProps> = ({
  calendar,
  isSelected,
  onSelect,
}) => {
  const getAccountIcon = () => {
    switch (calendar.source.type) {
      case 'apple':
        return '🍎';
      case 'google':
        return '📧';
      case 'outlook':
        return '📨';
      default:
        return '📅';
    }
  };

  return (
    <Pressable
      style={[styles.calendarItem, isSelected && styles.calendarItemSelected]}
      onPress={onSelect}
    >
      <View style={[styles.calendarColor, { backgroundColor: calendar.color }]} />
      <View style={styles.calendarInfo}>
        <Text style={styles.calendarName}>{calendar.title}</Text>
        <Text style={styles.calendarAccount}>
          {getAccountIcon()} {calendar.source.name}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.selectedCheck}>
          <Check size={18} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
};

interface OptionToggleProps {
  label: string;
  description?: string;
  icon: React.ReactNode;
  value: boolean;
  onToggle: () => void;
}

const OptionToggle: React.FC<OptionToggleProps> = ({
  label,
  description,
  icon,
  value,
  onToggle,
}) => (
  <View style={styles.optionRow}>
    <View style={styles.optionIcon}>{icon}</View>
    <View style={styles.optionInfo}>
      <Text style={styles.optionLabel}>{label}</Text>
      {description && <Text style={styles.optionDescription}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.border, true: colors.primaryLight }}
      thumbColor={value ? colors.primary : '#f4f3f4'}
    />
  </View>
);

// ============================================================================
// Main Component
// ============================================================================

type ExportStep = 'calendar' | 'options' | 'exporting' | 'complete' | 'error';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export const CalendarExportSheet: React.FC<CalendarExportSheetProps> = ({
  visible,
  onClose,
  trip,
  itinerary,
  tripName,
  onExportComplete,
}) => {
  const {
    hasPermission,
    calendars,
    selectedCalendar,
    isLoadingCalendars,
    isExporting,
    progress,
    lastResult,
    options,
    requestPermission,
    loadCalendars,
    selectCalendar,
    exportTrip,
    exportItinerary,
    updateOptions,
    shareAsICS,
    reset,
  } = useCalendarExport();

  const [currentStep, setCurrentStep] = useState<ExportStep>('calendar');
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Derive display name
  const displayName = tripName || trip?.destination.name || 'Trip';
  const displayItinerary = itinerary || trip?.itinerary || [];

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      reset();
      setCurrentStep('calendar');
      if (hasPermission) {
        loadCalendars();
      }
    }
  }, [visible, hasPermission, loadCalendars, reset]);

  useEffect(() => {
    if (progress.status === 'complete' && lastResult) {
      setCurrentStep('complete');
      onExportComplete?.(lastResult);
    } else if (progress.status === 'error') {
      setCurrentStep('error');
    } else if (progress.status === 'exporting') {
      setCurrentStep('exporting');
    }
  }, [progress.status, lastResult, onExportComplete]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      loadCalendars();
    }
  };

  const handleExport = async () => {
    setCurrentStep('exporting');
    
    if (trip) {
      await exportTrip(trip);
    } else if (displayItinerary.length > 0) {
      await exportItinerary(displayItinerary, displayName);
    }
  };

  const handleShareICS = async () => {
    await shareAsICS(displayItinerary, displayName);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Functions
  // ─────────────────────────────────────────────────────────────────────────

  const renderPermissionRequest = () => (
    <View style={styles.centeredContent}>
      <View style={styles.iconContainer}>
        <Calendar size={48} color={colors.primary} />
      </View>
      <Text style={styles.centeredTitle}>Calendar Access Required</Text>
      <Text style={styles.centeredDescription}>
        Paint the Town needs access to your calendar to export your itinerary events.
      </Text>
      <Pressable style={styles.primaryButton} onPress={handleRequestPermission}>
        <CalendarPlus size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>Grant Access</Text>
      </Pressable>
      
      {/* Alternative: Share as ICS file */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>
      
      <Pressable style={styles.secondaryButton} onPress={handleShareICS}>
        <Share2 size={18} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>Share as Calendar File</Text>
      </Pressable>
      <Text style={styles.helpText}>
        This creates a .ics file you can open in any calendar app
      </Text>
    </View>
  );

  const renderCalendarSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Calendar</Text>
      <Text style={styles.stepDescription}>
        Choose where to add your {displayName} itinerary
      </Text>
      
      {isLoadingCalendars ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading calendars...</Text>
        </View>
      ) : calendars.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={32} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No writable calendars found</Text>
          <Pressable style={styles.secondaryButton} onPress={handleShareICS}>
            <Share2 size={18} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Share as File Instead</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.calendarList} showsVerticalScrollIndicator={false}>
          {calendars.map(calendar => (
            <CalendarItem
              key={calendar.id}
              calendar={calendar}
              isSelected={selectedCalendar?.id === calendar.id}
              onSelect={() => selectCalendar(calendar)}
            />
          ))}
        </ScrollView>
      )}
      
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.primaryButton, !selectedCalendar && styles.buttonDisabled]}
          onPress={() => setCurrentStep('options')}
          disabled={!selectedCalendar}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
          <ChevronRight size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );

  const renderOptions = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Export Options</Text>
      <Text style={styles.stepDescription}>
        Customize how events appear in your calendar
      </Text>
      
      <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
        {/* Main Options */}
        <OptionToggle
          label="Add Reminders"
          description="Get notified before each activity"
          icon={<Bell size={20} color={colors.textSecondary} />}
          value={options.addReminders}
          onToggle={() => updateOptions({ addReminders: !options.addReminders })}
        />
        
        <OptionToggle
          label="Include Travel Time"
          description="Add buffer events between activities"
          icon={<Clock size={20} color={colors.textSecondary} />}
          value={options.includeTravelTime}
          onToggle={() => updateOptions({ includeTravelTime: !options.includeTravelTime })}
        />
        
        <OptionToggle
          label="Day Overview Events"
          description="Create all-day summary for each day"
          icon={<FileText size={20} color={colors.textSecondary} />}
          value={options.createDayOverview}
          onToggle={() => updateOptions({ createDayOverview: !options.createDayOverview })}
        />
        
        {/* Toggle for more options */}
        <Pressable
          style={styles.showMoreButton}
          onPress={() => setShowAllOptions(!showAllOptions)}
        >
          <Text style={styles.showMoreText}>
            {showAllOptions ? 'Show Less' : 'More Options'}
          </Text>
          <ChevronRight
            size={16}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: showAllOptions ? '90deg' : '0deg' }] }}
          />
        </Pressable>
        
        {showAllOptions && (
          <>
            <OptionToggle
              label="Include Location"
              description="Add venue addresses to events"
              icon={<MapPin size={20} color={colors.textSecondary} />}
              value={options.includeLocation}
              onToggle={() => updateOptions({ includeLocation: !options.includeLocation })}
            />
            
            <OptionToggle
              label="Include Booking Details"
              description="Add confirmation info to notes"
              icon={<FileText size={20} color={colors.textSecondary} />}
              value={options.includeBookingDetails}
              onToggle={() => updateOptions({ includeBookingDetails: !options.includeBookingDetails })}
            />
            
            <OptionToggle
              label="Include Costs"
              description="Show price in event notes"
              icon={<DollarSign size={20} color={colors.textSecondary} />}
              value={options.includeCosts}
              onToggle={() => updateOptions({ includeCosts: !options.includeCosts })}
            />
            
            <OptionToggle
              label="Include Links"
              description="Add booking links to events"
              icon={<Link2 size={20} color={colors.textSecondary} />}
              value={options.includeLinks}
              onToggle={() => updateOptions({ includeLinks: !options.includeLinks })}
            />
          </>
        )}
      </ScrollView>
      
      {/* Summary */}
      <View style={styles.exportSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Calendar:</Text>
          <Text style={styles.summaryValue}>{selectedCalendar?.title}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Days:</Text>
          <Text style={styles.summaryValue}>{displayItinerary.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Activities:</Text>
          <Text style={styles.summaryValue}>
            {displayItinerary.reduce((sum, day) => sum + day.activities.length, 0)}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionRow}>
        <Pressable
          style={styles.backButton}
          onPress={() => setCurrentStep('calendar')}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleExport}>
          <CalendarPlus size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Export to Calendar</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderExporting = () => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.centeredTitle}>Exporting to Calendar</Text>
      <Text style={styles.centeredDescription}>{progress.message}</Text>
      
      {progress.totalDays && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((progress.currentDay || 0) / progress.totalDays) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Day {progress.currentDay} of {progress.totalDays}
          </Text>
        </View>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.centeredContent}>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <CheckCircle2 size={48} color={colors.success} />
      </View>
      <Text style={styles.centeredTitle}>Export Complete!</Text>
      <Text style={styles.centeredDescription}>
        {lastResult?.createdEvents} events added to {selectedCalendar?.title}
      </Text>
      
      {lastResult && lastResult.failedEvents > 0 && (
        <View style={styles.warningBanner}>
          <AlertCircle size={18} color={colors.warning} />
          <Text style={styles.warningText}>
            {lastResult.failedEvents} events failed to export
          </Text>
        </View>
      )}
      
      <Pressable style={styles.primaryButton} onPress={handleClose}>
        <Text style={styles.primaryButtonText}>Done</Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
    <View style={styles.centeredContent}>
      <View style={[styles.iconContainer, styles.errorIcon]}>
        <AlertCircle size={48} color={colors.error} />
      </View>
      <Text style={styles.centeredTitle}>Export Failed</Text>
      <Text style={styles.centeredDescription}>
        {lastResult?.errors[0]?.error || 'An unexpected error occurred'}
      </Text>
      
      <Pressable style={styles.primaryButton} onPress={() => setCurrentStep('options')}>
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </Pressable>
      
      <Pressable style={styles.secondaryButton} onPress={handleShareICS}>
        <Share2 size={18} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>Share as File Instead</Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    if (!hasPermission && currentStep === 'calendar') {
      return renderPermissionRequest();
    }
    
    switch (currentStep) {
      case 'calendar':
        return renderCalendarSelection();
      case 'options':
        return renderOptions();
      case 'exporting':
        return renderExporting();
      case 'complete':
        return renderComplete();
      case 'error':
        return renderError();
      default:
        return renderCalendarSelection();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Main Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayBackground} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Calendar size={22} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Add to Calendar</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          
          {/* Content */}
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  
  // Centered Content
  centeredContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    backgroundColor: colors.success + '20',
  },
  errorIcon: {
    backgroundColor: colors.error + '20',
  },
  centeredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  centeredDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  
  // Step Content
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  
  // Calendar List
  calendarList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  calendarItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '15',
  },
  calendarColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  calendarAccount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Options
  optionsList: {
    maxHeight: 280,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  
  // Export Summary
  exportSummary: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  
  // Progress
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    marginLeft: 8,
  },
  
  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  
  // Help Text
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
});

export default CalendarExportSheet;
