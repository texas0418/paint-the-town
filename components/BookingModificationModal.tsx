import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Info,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { Booking } from '@/types';
import { ModificationOptions, ModificationResult } from '@/hooks/useCancellationManagement';

// ============================================================================
// Types
// ============================================================================

interface BookingModificationModalProps {
  visible: boolean;
  onClose: () => void;
  booking: Booking;
  modificationOptions: ModificationOptions;
  onModify: (request: {
    newDate?: string;
    newTime?: string;
    newPartySize?: number;
    notes?: string;
  }) => Promise<ModificationResult>;
  isProcessing?: boolean;
}

// ============================================================================
// Time Slot Options
// ============================================================================

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00',
];

// ============================================================================
// Component
// ============================================================================

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function BookingModificationModal({
  visible,
  onClose,
  booking,
  modificationOptions,
  onModify,
  isProcessing = false,
}: BookingModificationModalProps) {
  // Form state
  const [selectedDate, setSelectedDate] = useState(booking.startDate);
  const [selectedTime, setSelectedTime] = useState(booking.time || '19:00');
  const [partySize, setPartySize] = useState(
    (booking.details as any)?.partySize || 2
  );
  const [notes, setNotes] = useState('');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [result, setResult] = useState<ModificationResult | null>(null);

  // Generate date options (next 30 days)
  const dateOptions = useMemo(() => {
    const dates: { value: string; label: string }[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      dates.push({ value, label });
    }
    
    return dates;
  }, []);

  // Check if any changes were made
  const hasChanges = useMemo(() => {
    return (
      selectedDate !== booking.startDate ||
      selectedTime !== (booking.time || '19:00') ||
      partySize !== ((booking.details as any)?.partySize || 2)
    );
  }, [selectedDate, selectedTime, partySize, booking]);

  // Handle modification submission
  const handleSubmit = useCallback(async () => {
    const request: {
      newDate?: string;
      newTime?: string;
      newPartySize?: number;
      notes?: string;
    } = {};

    if (selectedDate !== booking.startDate) {
      request.newDate = selectedDate;
    }
    if (selectedTime !== (booking.time || '19:00')) {
      request.newTime = selectedTime;
    }
    if (partySize !== ((booking.details as any)?.partySize || 2)) {
      request.newPartySize = partySize;
    }
    if (notes) {
      request.notes = notes;
    }

    const modifyResult = await onModify(request);
    setResult(modifyResult);

    if (modifyResult.success) {
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 2000);
    }
  }, [selectedDate, selectedTime, partySize, notes, booking, onModify, onClose]);

  // Reset form when modal opens
  const handleClose = useCallback(() => {
    setSelectedDate(booking.startDate);
    setSelectedTime(booking.time || '19:00');
    setPartySize((booking.details as any)?.partySize || 2);
    setNotes('');
    setResult(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  }, [booking, onClose]);

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Render success state
  if (result?.success) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Check size={48} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Booking Modified!</Text>
            <Text style={styles.successMessage}>{result.message}</Text>
            {result.fee && result.fee > 0 && (
              <View style={styles.feeNotice}>
                <DollarSign size={16} color={colors.warning} />
                <Text style={styles.feeNoticeText}>
                  Modification fee: {booking.currency || 'USD'} {result.fee.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modify Booking</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.bookingName}>{booking.name}</Text>
            <Text style={styles.bookingLocation}>{booking.location}</Text>
          </View>

          {/* Modification Fee Notice */}
          {modificationOptions.modificationFee && modificationOptions.modificationFee > 0 && (
            <View style={styles.feeCard}>
              <AlertCircle size={18} color={colors.warning} />
              <Text style={styles.feeText}>
                A modification fee of {booking.currency || 'USD'} {modificationOptions.modificationFee.toFixed(2)} applies
              </Text>
            </View>
          )}

          {/* Date Selection */}
          {modificationOptions.canChangeDate && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.selectorText}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                {showDatePicker ? (
                  <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              
              {showDatePicker && (
                <View style={styles.optionsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateOptions}
                  >
                    {dateOptions.map((date) => (
                      <TouchableOpacity
                        key={date.value}
                        style={[
                          styles.dateOption,
                          selectedDate === date.value && styles.dateOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedDate(date.value);
                          setShowDatePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            selectedDate === date.value && styles.dateOptionTextSelected,
                          ]}
                        >
                          {date.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Time Selection */}
          {modificationOptions.canChangeTime && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowTimePicker(!showTimePicker)}
              >
                <Clock size={20} color={colors.primary} />
                <Text style={styles.selectorText}>{formatTime(selectedTime)}</Text>
                {showTimePicker ? (
                  <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              
              {showTimePicker && (
                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedTime === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedTime(time);
                        setShowTimePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedTime === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Party Size */}
          {modificationOptions.canChangePartySize && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Party Size</Text>
              <View style={styles.partySizeContainer}>
                <TouchableOpacity
                  style={[
                    styles.partySizeButton,
                    partySize <= 1 && styles.partySizeButtonDisabled,
                  ]}
                  onPress={() => setPartySize(Math.max(1, partySize - 1))}
                  disabled={partySize <= 1}
                >
                  <Text style={styles.partySizeButtonText}>−</Text>
                </TouchableOpacity>
                
                <View style={styles.partySizeValue}>
                  <Users size={20} color={colors.primary} />
                  <Text style={styles.partySizeText}>{partySize}</Text>
                  <Text style={styles.partySizeLabel}>
                    {partySize === 1 ? 'guest' : 'guests'}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.partySizeButton,
                    partySize >= (modificationOptions.maxPartySize || 20) &&
                      styles.partySizeButtonDisabled,
                  ]}
                  onPress={() =>
                    setPartySize(
                      Math.min(modificationOptions.maxPartySize || 20, partySize + 1)
                    )
                  }
                  disabled={partySize >= (modificationOptions.maxPartySize || 20)}
                >
                  <Text style={styles.partySizeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              {modificationOptions.maxPartySize && (
                <Text style={styles.maxPartySizeText}>
                  Maximum {modificationOptions.maxPartySize} guests
                </Text>
              )}
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special requests or changes..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Error Message */}
          {result && !result.success && (
            <View style={styles.errorCard}>
              <AlertCircle size={18} color={colors.error} />
              <Text style={styles.errorText}>{result.message}</Text>
            </View>
          )}

          {/* Info Note */}
          <View style={styles.infoCard}>
            <Info size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              Changes are subject to availability. You will receive a confirmation
              email once your modification is processed.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!hasChanges || isProcessing) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!hasChanges || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {modificationOptions.modificationFee && modificationOptions.modificationFee > 0
                  ? `Confirm Changes (${booking.currency || 'USD'} ${modificationOptions.modificationFee.toFixed(2)} fee)`
                  : 'Confirm Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  bookingLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  feeText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionsContainer: {
    marginTop: 8,
  },
  dateOptions: {
    gap: 8,
    paddingVertical: 4,
  },
  dateOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  dateOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  partySizeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySizeButtonDisabled: {
    backgroundColor: colors.border,
  },
  partySizeButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  partySizeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partySizeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  partySizeLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  maxPartySizeText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '15',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  feeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  feeNoticeText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
});
