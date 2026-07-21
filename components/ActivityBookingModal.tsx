/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Mail,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  Activity,
  AvailabilitySlot,
  ActivityBookingRequest,
  formatPrice,
  getProviderColor,
  getProviderName,
  getCancellationLabel,
} from '@/types/activity';
import { activityBookingService } from '@/services/activityBookingService';

interface ActivityBookingModalProps {
  visible: boolean;
  onClose: () => void;
  activity: Activity;
  initialDate?: string;
  onBookingComplete: (confirmationNumber: string) => void;
}

type Step = 'date' | 'time' | 'details' | 'confirm';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function ActivityBookingModal({
  visible,
  onClose,
  activity,
  initialDate,
  onBookingComplete,
}: ActivityBookingModalProps) {
  const [step, setStep] = useState<Step>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Booking data
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);

  // Participants
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Guest info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load availability when date changes
  useEffect(() => {
    if (visible && selectedDate) {
      loadAvailability();
    }
  }, [visible, selectedDate, adults, children]);

  const loadAvailability = async () => {
    setIsLoadingSlots(true);
    try {
      const response = await activityBookingService.getAvailability({
        activityId: activity.id,
        provider: activity.provider,
        date: selectedDate,
        participants: { adults, children: children || undefined },
      });
      setAvailableSlots(response.slots);
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async () => {
    if (!validate() || !selectedSlot) return;

    setIsLoading(true);

    try {
      const request: ActivityBookingRequest = {
        activityId: activity.id,
        provider: activity.provider,
        slotId: selectedSlot.id,
        bookingToken: selectedSlot.bookingToken,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        participants: {
          adults,
          children: children || undefined,
        },
        leadTraveler: {
          firstName,
          lastName,
          email,
          phone,
        },
        specialRequests: specialRequests || undefined,
        email,
        phone,
      };

      const booking = await activityBookingService.bookActivity(request);

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your ${activity.title} experience is booked!\n\nConfirmation #: ${booking.confirmationNumber}`,
        [
          {
            text: 'Done',
            onPress: () => {
              onBookingComplete(booking.confirmationNumber);
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.message || 'Unable to complete booking. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    if (date >= new Date()) {
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedSlot(null);
    }
  };

  const getTotalPrice = () => {
    if (!selectedSlot) return 0;
    return selectedSlot.pricing.totalPrice;
  };

  const goToStep = (newStep: Step) => {
    if (newStep === 'time' && !selectedDate) return;
    if (newStep === 'details' && !selectedSlot) return;
    if (newStep === 'confirm' && !validate()) return;
    setStep(newStep);
  };

  const renderDateStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date</Text>

      {/* Date selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => changeDate(-1)}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>

        <TouchableOpacity
          style={styles.dateArrow}
          onPress={() => changeDate(1)}
        >
          <ChevronRight size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick date buttons */}
      <View style={styles.quickDates}>
        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const date = new Date();
          date.setDate(date.getDate() + offset);
          const dateStr = date.toISOString().split('T')[0];
          const isSelected = selectedDate === dateStr;

          return (
            <TouchableOpacity
              key={offset}
              style={[
                styles.quickDateButton,
                isSelected && styles.quickDateButtonSelected,
              ]}
              onPress={() => {
                setSelectedDate(dateStr);
                setSelectedSlot(null);
              }}
            >
              <Text
                style={[
                  styles.quickDateDay,
                  isSelected && styles.quickDateTextSelected,
                ]}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.quickDateNum,
                  isSelected && styles.quickDateTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Participants */}
      <View style={styles.participantsSection}>
        <Text style={styles.sectionLabel}>Participants</Text>

        <View style={styles.participantRow}>
          <View>
            <Text style={styles.participantLabel}>Adults</Text>
            <Text style={styles.participantPrice}>
              {formatPrice(activity.pricing.basePrice, activity.pricing.currency)} each
            </Text>
          </View>
          <View style={styles.participantCounter}>
            <TouchableOpacity
              style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
              onPress={() => adults > 1 && setAdults(adults - 1)}
              disabled={adults <= 1}
            >
              <Minus size={18} color={adults <= 1 ? colors.textTertiary : colors.text} />
            </TouchableOpacity>
            <Text style={styles.counterValue}>{adults}</Text>
            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setAdults(adults + 1)}
            >
              <Plus size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {activity.pricing.childPrice && (
          <View style={styles.participantRow}>
            <View>
              <Text style={styles.participantLabel}>Children</Text>
              <Text style={styles.participantPrice}>
                {formatPrice(activity.pricing.childPrice, activity.pricing.currency)} each
              </Text>
            </View>
            <View style={styles.participantCounter}>
              <TouchableOpacity
                style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                onPress={() => children > 0 && setChildren(children - 1)}
                disabled={children <= 0}
              >
                <Minus size={18} color={children <= 0 ? colors.textTertiary : colors.text} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{children}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setChildren(children + 1)}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => goToStep('time')}
      >
        <Text style={styles.nextButtonText}>Select Time</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTimeStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Time</Text>
      <Text style={styles.stepSubtitle}>
        {formatDate(selectedDate)} • {adults + children} {adults + children === 1 ? 'guest' : 'guests'}
      </Text>

      {isLoadingSlots ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking availability...</Text>
        </View>
      ) : availableSlots.length === 0 ? (
        <View style={styles.noSlotsContainer}>
          <Clock size={48} color={colors.textTertiary} />
          <Text style={styles.noSlotsTitle}>No times available</Text>
          <Text style={styles.noSlotsText}>
            Try selecting a different date
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.slotsContainer}>
          {availableSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotCard,
                selectedSlot?.id === slot.id && styles.slotCardSelected,
              ]}
              onPress={() => setSelectedSlot(slot)}
            >
              <View style={styles.slotInfo}>
                <Text style={styles.slotTime}>{slot.displayTime}</Text>
                {slot.spotsLeft && slot.spotsLeft < 5 && (
                  <Text style={styles.spotsLeft}>
                    Only {slot.spotsLeft} spots left
                  </Text>
                )}
              </View>
              <View style={styles.slotPriceContainer}>
                <Text style={styles.slotPrice}>
                  {formatPrice(slot.pricing.totalPrice, slot.pricing.currency)}
                </Text>
                <Text style={styles.slotPriceLabel}>total</Text>
              </View>
              {selectedSlot?.id === slot.id && (
                <View style={styles.selectedCheck}>
                  <Check size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goToStep('date')}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { flex: 1 }, !selectedSlot && styles.nextButtonDisabled]}
          onPress={() => selectedSlot && goToStep('details')}
          disabled={!selectedSlot}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Guest Information</Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={[styles.input, errors.firstName && styles.inputError]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
          />
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={[styles.input, errors.lastName && styles.inputError]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
          />
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Special Requests (optional)</Text>
        <TextInput
          style={styles.textArea}
          value={specialRequests}
          onChangeText={setSpecialRequests}
          placeholder="Any dietary restrictions, accessibility needs, etc."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goToStep('time')}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, { flex: 1 }]}
          onPress={() => goToStep('confirm')}
        >
          <Text style={styles.nextButtonText}>Review Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>

      {/* Activity summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{activity.title}</Text>

        <View style={styles.summaryRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.summaryText}>{formatDate(selectedDate)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.summaryText}>
            {selectedSlot?.displayTime} • {activity.duration.displayText}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Users size={16} color={colors.textSecondary} />
          <Text style={styles.summaryText}>
            {adults} {adults === 1 ? 'adult' : 'adults'}
            {children > 0 && `, ${children} ${children === 1 ? 'child' : 'children'}`}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <User size={16} color={colors.textSecondary} />
          <Text style={styles.summaryText}>{firstName} {lastName}</Text>
        </View>

        <View style={[styles.providerBadge, { backgroundColor: getProviderColor(activity.provider) }]}>
          <Text style={styles.providerText}>
            via {getProviderName(activity.provider)}
          </Text>
        </View>
      </View>

      {/* Price breakdown */}
      <View style={styles.priceBreakdown}>
        <Text style={styles.breakdownTitle}>Price Details</Text>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>
            {adults} × Adult{adults > 1 ? 's' : ''}
          </Text>
          <Text style={styles.breakdownValue}>
            {formatPrice(adults * activity.pricing.basePrice, activity.pricing.currency)}
          </Text>
        </View>

        {children > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              {children} × Child{children > 1 ? 'ren' : ''}
            </Text>
            <Text style={styles.breakdownValue}>
              {formatPrice(children * (activity.pricing.childPrice || 0), activity.pricing.currency)}
            </Text>
          </View>
        )}

        <View style={[styles.breakdownRow, styles.breakdownTotal]}>
          <Text style={styles.breakdownTotalLabel}>Total</Text>
          <Text style={styles.breakdownTotalValue}>
            {formatPrice(getTotalPrice(), activity.pricing.currency)}
          </Text>
        </View>
      </View>

      {/* Cancellation policy */}
      <View style={styles.policyCard}>
        <AlertCircle size={16} color={colors.textSecondary} />
        <Text style={styles.policyText}>
          {getCancellationLabel(activity.cancellationPolicy)}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goToStep('details')}
        >
          <ChevronLeft size={20} color={colors.text} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
          onPress={handleBook}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>
              Confirm & Pay {formatPrice(getTotalPrice(), activity.pricing.currency)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Experience</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progress}>
          {(['date', 'time', 'details', 'confirm'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <View style={styles.progressLine} />}
              <View
                style={[
                  styles.progressDot,
                  (step === s || ['date', 'time', 'details', 'confirm'].indexOf(step) > i) &&
                    styles.progressDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressDotText,
                    (step === s || ['date', 'time', 'details', 'confirm'].indexOf(step) > i) &&
                      styles.progressDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Step content */}
        {step === 'date' && renderDateStep()}
        {step === 'time' && renderTimeStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'confirm' && renderConfirmStep()}
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  progressDotTextActive: {
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  // Date step
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateArrow: {
    padding: 8,
  },
  dateDisplay: {
    paddingHorizontal: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  quickDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickDateButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    minWidth: 44,
  },
  quickDateButtonSelected: {
    backgroundColor: colors.primary,
  },
  quickDateDay: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  quickDateNum: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  quickDateTextSelected: {
    color: '#fff',
  },
  participantsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  participantLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  participantPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  participantCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.5,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  // Time step
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  noSlotsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  noSlotsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  slotsContainer: {
    flex: 1,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  spotsLeft: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 2,
  },
  slotPriceContainer: {
    alignItems: 'flex-end',
  },
  slotPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  slotPriceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  // Details step
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  // Confirm step
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  priceBreakdown: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    color: colors.text,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 8,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.backgroundSecondary,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
