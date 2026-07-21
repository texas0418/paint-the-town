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
  Heart,
  ChevronDown,
  Check,
  AlertCircle,
  CreditCard,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  Restaurant,
  TimeSlot,
  ReservationRequest,
  ReservationOccasion,
  OCCASION_LABELS,
  getProviderColor,
  getProviderName,
} from '@/types/restaurant';
import { restaurantBookingService } from '@/services/restaurantBookingService';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  restaurant: Restaurant;
  selectedSlot: TimeSlot;
  onBookingComplete: (confirmationNumber: string) => void;
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function BookingModal({
  visible,
  onClose,
  restaurant,
  selectedSlot,
  onBookingComplete,
}: BookingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState<ReservationOccasion | undefined>();
  const [specialRequests, setSpecialRequests] = useState('');
  const [seatingPreference, setSeatingPreference] = useState<'indoor' | 'outdoor' | 'bar' | 'any'>('any');
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBook = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const request: ReservationRequest = {
        timeSlot: selectedSlot,
        restaurantId: restaurant.id,
        partySize: selectedSlot.partySize,
        primaryGuest: {
          firstName,
          lastName,
          email,
          phone,
        },
        specialRequests: specialRequests || undefined,
        occasion,
        seatingPreference,
        phone,
        email,
        receiveUpdates: true,
        receiveMarketing: false,
      };

      const reservation = await restaurantBookingService.makeReservation(request);
      
      Alert.alert(
        'Reservation Confirmed! 🎉',
        `Your table at ${restaurant.name} is booked for ${selectedSlot.displayTime}.\n\nConfirmation #: ${reservation.confirmationNumber}`,
        [
          {
            text: 'Done',
            onPress: () => {
              onBookingComplete(reservation.confirmationNumber);
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Booking Failed',
        error.message || 'Unable to complete reservation. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const parts = [match[1], match[2], match[3]].filter(Boolean);
      if (parts.length === 0) return '';
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
      return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
    }
    return text;
  };

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
          <Text style={styles.headerTitle}>Complete Reservation</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Reservation summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            
            <View style={styles.summaryDetails}>
              <View style={styles.summaryItem}>
                <Calendar size={16} color={colors.textSecondary} />
                <Text style={styles.summaryText}>
                  {selectedSlot.dateTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.summaryText}>{selectedSlot.displayTime}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Users size={16} color={colors.textSecondary} />
                <Text style={styles.summaryText}>
                  {selectedSlot.partySize} {selectedSlot.partySize === 1 ? 'guest' : 'guests'}
                </Text>
              </View>
            </View>

            <View style={[styles.providerBadge, { backgroundColor: getProviderColor(selectedSlot.provider) }]}>
              <Text style={styles.providerText}>
                via {getProviderName(selectedSlot.provider)}
              </Text>
            </View>

            {selectedSlot.requiresDeposit && (
              <View style={styles.depositNotice}>
                <CreditCard size={14} color={colors.warning} />
                <Text style={styles.depositText}>
                  ${selectedSlot.depositAmount} deposit required
                </Text>
              </View>
            )}
          </View>

          {/* Guest information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Information</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  autoCapitalize="words"
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  autoCapitalize="words"
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.inputIconText, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={18} color={colors.textTertiary} />
                <TextInput
                  style={[styles.inputIconText, errors.phone && styles.inputError]}
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhone(text))}
                  placeholder="(555) 123-4567"
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>
          </View>

          {/* Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            {/* Occasion */}
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowOccasionPicker(!showOccasionPicker)}
            >
              <Heart size={18} color={colors.textSecondary} />
              <Text style={styles.selectButtonText}>
                {occasion ? OCCASION_LABELS[occasion] : 'Select occasion (optional)'}
              </Text>
              <ChevronDown size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {showOccasionPicker && (
              <View style={styles.occasionPicker}>
                {(Object.keys(OCCASION_LABELS) as ReservationOccasion[]).map((occ) => (
                  <TouchableOpacity
                    key={occ}
                    style={[
                      styles.occasionOption,
                      occasion === occ && styles.occasionOptionSelected,
                    ]}
                    onPress={() => {
                      setOccasion(occasion === occ ? undefined : occ);
                      setShowOccasionPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.occasionOptionText,
                        occasion === occ && styles.occasionOptionTextSelected,
                      ]}
                    >
                      {OCCASION_LABELS[occ]}
                    </Text>
                    {occasion === occ && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Seating preference */}
            <Text style={styles.inputLabel}>Seating Preference</Text>
            <View style={styles.seatingOptions}>
              {(['any', 'indoor', 'outdoor', 'bar'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.seatingOption,
                    seatingPreference === option && styles.seatingOptionSelected,
                  ]}
                  onPress={() => setSeatingPreference(option)}
                >
                  <Text
                    style={[
                      styles.seatingOptionText,
                      seatingPreference === option && styles.seatingOptionTextSelected,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Special requests */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Special Requests (optional)</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  placeholder="Allergies, dietary restrictions, accessibility needs..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Cancellation policy */}
          {restaurant.cancellationPolicy && (
            <View style={styles.policyCard}>
              <AlertCircle size={16} color={colors.textSecondary} />
              <Text style={styles.policyText}>{restaurant.cancellationPolicy}</Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Book button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.bookButton, isLoading && styles.bookButtonDisabled]}
            onPress={handleBook}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>
                {selectedSlot.requiresDeposit
                  ? `Complete Reservation • $${selectedSlot.depositAmount}`
                  : 'Complete Reservation'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  },
  providerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  depositNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: `${colors.warning}15`,
    padding: 10,
    borderRadius: 8,
  },
  depositText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  // Inputs
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  inputIconText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  textAreaContainer: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
  },
  // Select button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginBottom: 14,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  // Occasion picker
  occasionPicker: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 14,
    overflow: 'hidden',
  },
  occasionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  occasionOptionSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  occasionOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  occasionOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  // Seating options
  seatingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  seatingOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seatingOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  seatingOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  seatingOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  // Policy
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.backgroundSecondary,
    padding: 14,
    borderRadius: 10,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
  // Footer
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
