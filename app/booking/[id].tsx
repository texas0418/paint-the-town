import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Share, Linking } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  Plane,
  Building2,
  Utensils,
  Car,
  Ticket,
  Shield,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Copy,
  Share2,
  XCircle,
  CheckCircle,
  AlertCircle,
  Navigation,
  Edit3,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Music,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Booking, FlightDetails, HotelDetails, RestaurantDetails } from '@/types';
import useCancellationManagement from '@/hooks/useCancellationManagement';
import BookingModificationModal from '@/components/BookingModificationModal';
import CancellationConfirmationSheet from '@/components/CancellationConfirmationSheet';

// ============================================================================
// Constants
// ============================================================================

const bookingTypeIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Building2,
  restaurant: Utensils,
  transport: Car,
  activity: Ticket,
  insurance: Shield,
  event: Music,
};

const bookingTypeLabels: Record<string, string> = {
  flight: 'Flight',
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  transport: 'Transportation',
  activity: 'Activity',
  insurance: 'Insurance',
  event: 'Event',
};

// ============================================================================
// Main Component
// ============================================================================

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bookings, cancelBooking: appCancelBooking, updateBooking } = useApp();

  // Modal states
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<any>(null);

  const booking = bookings.find((b) => b.id === id);

  // Use cancellation management hook
  const cancellationManager = useCancellationManagement({
    booking: booking!,
    onCancelComplete: (result) => {
      setCancellationResult(result);
      if (result.success) {
        appCancelBooking(booking!.id);
      }
    },
    onModifyComplete: (result) => {
      if (result.success && result.updatedBooking) {
        updateBooking?.(booking!.id, result.updatedBooking);
      }
    },
  });

  // Error state
  if (!booking) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={colors.textTertiary} />
            <Text style={styles.errorText}>Booking not found</Text>
            <Pressable style={styles.errorButton} onPress={() => router.back()}>
              <Text style={styles.errorButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const IconComponent = bookingTypeIcons[booking.type] || Ticket;

  // Helpers
  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.textSecondary;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Actions
  const handleCopyCode = async () => {
    if (booking.confirmationCode) {
      await Clipboard.setStringAsync(booking.confirmationCode);
      Alert.alert('Copied!', 'Confirmation code copied to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Booking: ${booking.name}\nDate: ${formatDate(booking.startDate)}\nLocation: ${booking.location}\nConfirmation: ${booking.confirmationCode || 'N/A'}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleDirections = async () => {
    const address = encodeURIComponent(booking.location);
    const url = `https://maps.google.com/?q=${address}`;
    await Linking.openURL(url);
  };

  const handleCall = async (phone: string) => {
    await Linking.openURL(`tel:${phone}`);
  };

  const handleCancelPress = () => {
    setShowCancelSheet(true);
  };

  const handleModifyPress = () => {
    setShowModifyModal(true);
  };

  const handleConfirmCancel = async () => {
    return cancellationManager.cancelBooking();
  };

  const handleCloseCancelSheet = () => {
    setShowCancelSheet(false);
    if (cancellationResult?.success) {
      router.back();
    }
    setCancellationResult(null);
  };

  // Render flight details
  const renderFlightDetails = (details: FlightDetails) => (
    <View style={styles.detailsSection}>
      <Text style={styles.detailsTitle}>Flight Details</Text>
      <View style={styles.flightRoute}>
        <View style={styles.flightPoint}>
          <Text style={styles.airportCode}>{details.departure.airport}</Text>
          <Text style={styles.flightTime}>{details.departure.time}</Text>
          {details.departure.terminal && (
            <Text style={styles.terminal}>Terminal {details.departure.terminal}</Text>
          )}
          {details.departure.gate && <Text style={styles.gate}>Gate {details.departure.gate}</Text>}
        </View>
        <View style={styles.flightLine}>
          <Plane size={20} color={colors.primary} />
        </View>
        <View style={[styles.flightPoint, { alignItems: 'flex-end' }]}>
          <Text style={styles.airportCode}>{details.arrival.airport}</Text>
          <Text style={styles.flightTime}>{details.arrival.time}</Text>
          {details.arrival.terminal && (
            <Text style={styles.terminal}>Terminal {details.arrival.terminal}</Text>
          )}
        </View>
      </View>
      <View style={styles.flightInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Airline</Text>
          <Text style={styles.infoValue}>{details.airline}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Flight</Text>
          <Text style={styles.infoValue}>{details.flightNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Class</Text>
          <Text style={styles.infoValue}>{details.class}</Text>
        </View>
      </View>
    </View>
  );

  // Render hotel details
  const renderHotelDetails = (details: HotelDetails) => (
    <View style={styles.detailsSection}>
      <Text style={styles.detailsTitle}>Hotel Details</Text>
      <View style={styles.hotelInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Room Type</Text>
          <Text style={styles.infoValue}>{details.roomType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-in</Text>
          <Text style={styles.infoValue}>{details.checkIn}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Check-out</Text>
          <Text style={styles.infoValue}>{details.checkOut}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Guests</Text>
          <Text style={styles.infoValue}>{details.guests} guests</Text>
        </View>
        {details.amenities && details.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            <Text style={styles.infoLabel}>Amenities</Text>
            <Text style={styles.infoValue}>{details.amenities.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render restaurant details
  const renderRestaurantDetails = (details: RestaurantDetails) => (
    <View style={styles.detailsSection}>
      <Text style={styles.detailsTitle}>Reservation Details</Text>
      <View style={styles.hotelInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cuisine</Text>
          <Text style={styles.infoValue}>{details.cuisine}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{details.reservationTime}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Party Size</Text>
          <Text style={styles.infoValue}>{details.partySize} guests</Text>
        </View>
        {details.specialRequests && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes</Text>
            <Text style={styles.infoValue}>{details.specialRequests}</Text>
          </View>
        )}
        {details.phone && (
          <Pressable style={styles.infoRow} onPress={() => handleCall(details.phone!)}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={[styles.infoValue, styles.linkText]}>{details.phone}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cover Image */}
      {booking.image && (
        <>
          <Image source={{ uri: booking.image }} style={styles.coverImage} contentFit="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverGradient}
          />
        </>
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={booking.image ? colors.textLight : colors.text} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.actionBtn} onPress={handleShare}>
              <Share2 size={20} color={booking.image ? colors.textLight : colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <View style={[styles.mainCard, booking.image && styles.mainCardWithImage]}>
            {/* Type Badge & Status */}
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <IconComponent size={14} color={colors.primary} />
                <Text style={styles.typeBadgeText}>
                  {bookingTypeLabels[booking.type] || 'Booking'}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(booking.status) + '20' },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]}
                />
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {getStatusLabel(booking.status)}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{booking.name}</Text>

            {/* Confirmation Code */}
            {booking.confirmationCode && (
              <Pressable style={styles.confirmationBox} onPress={handleCopyCode}>
                <View style={styles.confirmationInfo}>
                  <Text style={styles.confirmationLabel}>Confirmation Code</Text>
                  <Text style={styles.confirmationCode}>{booking.confirmationCode}</Text>
                </View>
                <Copy size={18} color={colors.primary} />
              </Pressable>
            )}

            {/* Quick Info */}
            <View style={styles.quickInfoGrid}>
              <View style={styles.infoCard}>
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.infoCardLabel}>Date</Text>
                <Text style={styles.infoCardValue}>
                  {new Date(booking.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              {booking.time && (
                <View style={styles.infoCard}>
                  <Clock size={20} color={colors.primary} />
                  <Text style={styles.infoCardLabel}>Time</Text>
                  <Text style={styles.infoCardValue}>{booking.time}</Text>
                </View>
              )}
            </View>

            {/* Location */}
            <Pressable style={styles.locationCard} onPress={handleDirections}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.locationText}>{booking.location}</Text>
              <View style={styles.directionsBtn}>
                <Navigation size={16} color={colors.textLight} />
                <Text style={styles.directionsText}>Directions</Text>
              </View>
            </Pressable>
          </View>

          {/* Cancellation Policy Card */}
          {booking.status === 'confirmed' && (
            <View style={styles.policyCard}>
              <View style={styles.policyHeader}>
                {cancellationManager.cancellationPolicy.type === 'free' ? (
                  <CheckCircle size={20} color={colors.success} />
                ) : cancellationManager.cancellationPolicy.type === 'partial' ? (
                  <AlertTriangle size={20} color={colors.warning} />
                ) : (
                  <XCircle size={20} color={colors.error} />
                )}
                <Text style={styles.policyTitle}>Cancellation Policy</Text>
              </View>
              <Text style={styles.policyDescription}>
                {cancellationManager.cancellationPolicy.description}
              </Text>
              {cancellationManager.timeUntilDeadline &&
                cancellationManager.cancellationPolicy.type === 'free' && (
                  <View style={styles.deadlineNotice}>
                    <Clock size={14} color={colors.warning} />
                    <Text style={styles.deadlineText}>
                      {cancellationManager.timeUntilDeadline} for free cancellation
                    </Text>
                  </View>
                )}
            </View>
          )}

          {/* Type-specific Details */}
          {booking.details &&
            booking.type === 'flight' &&
            renderFlightDetails(booking.details as FlightDetails)}
          {booking.details &&
            booking.type === 'hotel' &&
            renderHotelDetails(booking.details as HotelDetails)}
          {booking.details &&
            booking.type === 'restaurant' &&
            renderRestaurantDetails(booking.details as RestaurantDetails)}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceSectionTitle}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Paid</Text>
              <Text style={styles.priceValue}>
                {booking.currency} {booking.price.toLocaleString()}
              </Text>
            </View>
            {booking.provider && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Booked via</Text>
                <Text style={styles.providerText}>{booking.provider}</Text>
              </View>
            )}
          </View>

          {/* Management Actions */}
          {booking.status === 'confirmed' && (
            <View style={styles.managementSection}>
              <Text style={styles.managementTitle}>Manage Booking</Text>

              {cancellationManager.canModify && (
                <Pressable style={styles.managementButton} onPress={handleModifyPress}>
                  <View style={styles.managementButtonIcon}>
                    <Edit3 size={20} color={colors.primary} />
                  </View>
                  <View style={styles.managementButtonContent}>
                    <Text style={styles.managementButtonTitle}>Modify Booking</Text>
                    <Text style={styles.managementButtonDescription}>
                      Change date, time, or party size
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textTertiary} />
                </Pressable>
              )}

              {cancellationManager.canCancel && (
                <Pressable style={styles.managementButton} onPress={handleCancelPress}>
                  <View style={[styles.managementButtonIcon, styles.cancelIcon]}>
                    <XCircle size={20} color={colors.error} />
                  </View>
                  <View style={styles.managementButtonContent}>
                    <Text style={[styles.managementButtonTitle, styles.cancelTitle]}>
                      Cancel Booking
                    </Text>
                    <Text style={styles.managementButtonDescription}>
                      {cancellationManager.cancellationPolicy.type === 'free'
                        ? 'Full refund available'
                        : cancellationManager.cancellationPolicy.type === 'partial'
                          ? 'Partial refund available'
                          : 'No refund available'}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textTertiary} />
                </Pressable>
              )}

              <Pressable
                style={styles.managementButton}
                onPress={cancellationManager.contactSupport}
              >
                <View style={styles.managementButtonIcon}>
                  <HelpCircle size={20} color={colors.primary} />
                </View>
                <View style={styles.managementButtonContent}>
                  <Text style={styles.managementButtonTitle}>Get Help</Text>
                  <Text style={styles.managementButtonDescription}>
                    Contact support for assistance
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}

          {/* Cancelled State */}
          {booking.status === 'cancelled' && (
            <View style={styles.cancelledCard}>
              <XCircle size={32} color={colors.error} />
              <Text style={styles.cancelledTitle}>Booking Cancelled</Text>
              <Text style={styles.cancelledDescription}>
                This booking has been cancelled. If you&apos;re expecting a refund, it will be processed
                within 5-7 business days.
              </Text>
              <Pressable style={styles.rebookButton} onPress={() => router.push('/plan-trip')}>
                <RefreshCw size={18} color={colors.primary} />
                <Text style={styles.rebookButtonText}>Book Again</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Modification Modal */}
      <BookingModificationModal
        visible={showModifyModal}
        onClose={() => setShowModifyModal(false)}
        booking={booking}
        modificationOptions={cancellationManager.modificationOptions}
        onModify={cancellationManager.modifyBooking}
        isProcessing={cancellationManager.isProcessing}
      />

      {/* Cancellation Sheet */}
      <CancellationConfirmationSheet
        visible={showCancelSheet}
        onClose={handleCloseCancelSheet}
        booking={booking}
        cancellationPolicy={cancellationManager.cancellationPolicy}
        refundEstimate={cancellationManager.refundEstimate}
        timeUntilDeadline={cancellationManager.timeUntilDeadline}
        onConfirmCancel={handleConfirmCancel}
        onContactSupport={cancellationManager.contactSupport}
        isProcessing={cancellationManager.isProcessing}
        result={cancellationResult}
      />
    </View>
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
  safeArea: {
    flex: 1,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainCardWithImage: {
    marginTop: 160,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationInfo: {
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  confirmationCode: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily: 'monospace',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 10,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  directionsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  policyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  policyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deadlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: colors.warning + '15',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deadlineText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flightPoint: {
    flex: 1,
  },
  airportCode: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  flightTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  terminal: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  gate: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  flightLine: {
    paddingHorizontal: 16,
  },
  flightInfo: {
    gap: 8,
  },
  hotelInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  amenitiesRow: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  linkText: {
    color: colors.primary,
  },
  priceSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  priceSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  providerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  managementSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  managementButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelIcon: {
    backgroundColor: colors.error + '15',
  },
  managementButtonContent: {
    flex: 1,
  },
  managementButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  cancelTitle: {
    color: colors.error,
  },
  managementButtonDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cancelledCard: {
    backgroundColor: colors.error + '10',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    alignItems: 'center',
  },
  cancelledTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    marginTop: 12,
    marginBottom: 8,
  },
  cancelledDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rebookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomSpacer: {
    height: 32,
  },
});
