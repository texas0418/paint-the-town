import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Shield,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Calendar,
  Receipt,
  Share2,
  Download,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import BookingProgress from '@/components/BookingProgress';
import BookingItemCard from '@/components/BookingItemCard';
import { BookingSession, BookingRequest, BookingResult, PaymentMethodInfo } from '@/types/booking';
import {
  bookingService,
  createBookingRequestsFromItinerary,
  formatCurrency,
} from '@/services/bookingService';

// Mock itinerary data (would come from params/context in real app)
const MOCK_ITINERARY = {
  id: 'itin-1',
  name: "Romantic Valentine's Evening",
  date: '2024-02-14',
  activities: [
    {
      id: 'a1',
      name: 'Dinner at Aria',
      type: 'dining',
      startTime: '19:00',
      endTime: '21:00',
      location: { name: 'Aria Restaurant', address: '490 East Paces Ferry Rd, Atlanta, GA' },
      estimatedCost: '$$$$',
      reservationRequired: true,
    },
    {
      id: 'a2',
      name: 'Hamilton at Fox Theatre',
      type: 'theater',
      startTime: '21:30',
      endTime: '00:00',
      location: { name: 'Fox Theatre', address: '660 Peachtree St NE, Atlanta, GA' },
      estimatedCost: '$$$',
      ticketRequired: true,
    },
  ],
};

const MOCK_PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'pm-1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true },
  { id: 'pm-2', type: 'apple_pay', isDefault: false },
];

type ScreenPhase = 'review' | 'processing' | 'complete';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [phase, setPhase] = useState<ScreenPhase>('review');
  const [session, setSession] = useState<BookingSession | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodInfo>(
    MOCK_PAYMENT_METHODS[0]
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  // Create booking requests from itinerary
  const bookingRequests = createBookingRequestsFromItinerary(MOCK_ITINERARY.activities, {
    partySize: 2,
  });

  const estimatedTotal = bookingRequests.reduce((sum, r) => sum + r.estimatedCost, 0);

  // Subscribe to session updates
  useEffect(() => {
    const unsubscribe = bookingService.subscribe('confirmation-screen', (updatedSession) => {
      setSession(updatedSession);

      if (
        updatedSession.status === 'completed' ||
        updatedSession.status === 'partial' ||
        updatedSession.status === 'failed'
      ) {
        setPhase('complete');
      }
    });

    return unsubscribe;
  }, []);

  // Start booking process
  const handleConfirmBooking = useCallback(async () => {
    setPhase('processing');

    // Create session
    const newSession = bookingService.createSession(
      MOCK_ITINERARY.id,
      MOCK_ITINERARY.name,
      bookingRequests,
      'user-123',
      selectedPaymentMethod.id
    );

    setSession(newSession);

    // Process all bookings
    await bookingService.processAllBookings();
  }, [bookingRequests, selectedPaymentMethod]);

  // Retry a failed booking
  const handleRetry = useCallback(
    async (requestId: string) => {
      if (!session) return;

      try {
        await bookingService.retryBooking(requestId);
      } catch (error) {
        Alert.alert('Error', 'Failed to retry booking');
      }
    },
    [session]
  );

  // Cancel a booking
  const handleCancel = useCallback(async (requestId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Refund policies may apply.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            await bookingService.cancelBooking(requestId);
          },
        },
      ]
    );
  }, []);

  // Cancel all bookings
  const handleCancelAll = useCallback(() => {
    Alert.alert(
      'Cancel All Bookings',
      'Are you sure you want to cancel all bookings? This cannot be undone.',
      [
        { text: 'Keep Bookings', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            await bookingService.cancelSession();
            router.back();
          },
        },
      ]
    );
  }, [router]);

  // Share confirmations
  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would open here');
  };

  // Download receipts
  const handleDownload = () => {
    Alert.alert('Download', 'Download all receipts functionality');
  };

  // Render review phase
  const renderReviewPhase = () => (
    <>
      {/* Itinerary header */}
      <View style={styles.itineraryHeader}>
        <View style={styles.itineraryIcon}>
          <Sparkles size={24} color={colors.primary} />
        </View>
        <View style={styles.itineraryInfo}>
          <Text style={styles.itineraryName}>{MOCK_ITINERARY.name}</Text>
          <View style={styles.itineraryMeta}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.itineraryDate}>{MOCK_ITINERARY.date}</Text>
          </View>
        </View>
      </View>

      {/* Booking items to confirm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings to Make</Text>
        <View style={styles.bookingsList}>
          {bookingRequests.map((request) => (
            <BookingItemCard
              key={request.id}
              request={request}
              expanded={expandedItemId === request.id}
              onToggleExpand={() => {
                setExpandedItemId(expandedItemId === request.id ? null : request.id);
              }}
            />
          ))}
        </View>
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity style={styles.paymentCard} onPress={() => setPaymentSheetVisible(true)}>
          <View style={styles.paymentIcon}>
            <CreditCard size={20} color={colors.primary} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>
              {selectedPaymentMethod.brand || selectedPaymentMethod.type}
              {selectedPaymentMethod.last4 ? ` •••• ${selectedPaymentMethod.last4}` : ''}
            </Text>
            {selectedPaymentMethod.isDefault && <Text style={styles.paymentDefault}>Default</Text>}
          </View>
          <ChevronRight size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Cost summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Summary</Text>
        <View style={styles.costCard}>
          {bookingRequests.map((request) => (
            <View key={request.id} style={styles.costRow}>
              <Text style={styles.costLabel}>{request.activityName}</Text>
              <Text style={styles.costValue}>
                {formatCurrency(request.estimatedCost, request.currency)}
              </Text>
            </View>
          ))}
          <View style={styles.costDivider} />
          <View style={styles.costRow}>
            <Text style={styles.costTotalLabel}>Estimated Total</Text>
            <Text style={styles.costTotalValue}>{formatCurrency(estimatedTotal, 'USD')}</Text>
          </View>
          <Text style={styles.costNote}>Final amounts may vary based on availability and fees</Text>
        </View>
      </View>

      {/* Trust badges */}
      <View style={styles.trustBadges}>
        <View style={styles.trustBadge}>
          <Shield size={16} color={colors.success} />
          <Text style={styles.trustText}>Secure booking</Text>
        </View>
        <View style={styles.trustBadge}>
          <Check size={16} color={colors.success} />
          <Text style={styles.trustText}>Instant confirmation</Text>
        </View>
      </View>
    </>
  );

  // Render processing phase
  const renderProcessingPhase = () => (
    <>
      {session && <BookingProgress session={session} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Status</Text>
        <View style={styles.bookingsList}>
          {session?.requests.map((request) => {
            const result = session.results.get(request.id);
            return (
              <BookingItemCard
                key={request.id}
                request={request}
                result={result}
                expanded={expandedItemId === request.id}
                onToggleExpand={() => {
                  setExpandedItemId(expandedItemId === request.id ? null : request.id);
                }}
                onRetry={() => handleRetry(request.id)}
              />
            );
          })}
        </View>
      </View>

      {session?.status === 'in_progress' && (
        <TouchableOpacity style={styles.cancelAllButton} onPress={handleCancelAll}>
          <Text style={styles.cancelAllText}>Cancel All Bookings</Text>
        </TouchableOpacity>
      )}
    </>
  );

  // Render complete phase
  const renderCompletePhase = () => (
    <>
      {/* Success/partial header */}
      <View
        style={[
          styles.completeHeader,
          session?.status === 'completed' && styles.completeHeaderSuccess,
          session?.status === 'partial' && styles.completeHeaderPartial,
          session?.status === 'failed' && styles.completeHeaderFailed,
        ]}
      >
        {session?.status === 'completed' ? (
          <>
            <View style={styles.completeIcon}>
              <Check size={32} color={colors.success} />
            </View>
            <Text style={styles.completeTitle}>All Bookings Confirmed!</Text>
            <Text style={styles.completeSubtitle}>Your {MOCK_ITINERARY.name} is all set</Text>
          </>
        ) : session?.status === 'partial' ? (
          <>
            <View style={[styles.completeIcon, { backgroundColor: `${colors.warning}15` }]}>
              <AlertTriangle size={32} color={colors.warning} />
            </View>
            <Text style={styles.completeTitle}>Partially Booked</Text>
            <Text style={styles.completeSubtitle}>Some bookings need your attention</Text>
          </>
        ) : (
          <>
            <View style={[styles.completeIcon, { backgroundColor: `${colors.error}15` }]}>
              <X size={32} color={colors.error} />
            </View>
            <Text style={styles.completeTitle}>Bookings Failed</Text>
            <Text style={styles.completeSubtitle}>We couldn&apos;t complete your bookings</Text>
          </>
        )}
      </View>

      {/* Cost summary */}
      {session && (
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Charged</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(
                  session.paymentSummary.actualTotal,
                  session.paymentSummary.currency
                )}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bookings Confirmed</Text>
              <Text style={styles.summaryValue}>
                {session.progress.completed} of {session.progress.total}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Booking results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Bookings</Text>
        <View style={styles.bookingsList}>
          {session?.requests.map((request) => {
            const result = session.results.get(request.id);
            return (
              <BookingItemCard
                key={request.id}
                request={request}
                result={result}
                expanded={expandedItemId === request.id}
                onToggleExpand={() => {
                  setExpandedItemId(expandedItemId === request.id ? null : request.id);
                }}
                onRetry={() => handleRetry(request.id)}
                onCancel={() => handleCancel(request.id)}
              />
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.completeActions}>
        <TouchableOpacity style={styles.completeActionButton} onPress={handleShare}>
          <Share2 size={18} color={colors.primary} />
          <Text style={styles.completeActionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeActionButton} onPress={handleDownload}>
          <Download size={18} color={colors.primary} />
          <Text style={styles.completeActionText}>Receipts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeActionButton}>
          <Receipt size={18} color={colors.primary} />
          <Text style={styles.completeActionText}>Add to Wallet</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === 'review' && 'Confirm Bookings'}
          {phase === 'processing' && 'Booking...'}
          {phase === 'complete' && 'Booking Complete'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {phase === 'review' && renderReviewPhase()}
        {phase === 'processing' && renderProcessingPhase()}
        {phase === 'complete' && renderCompletePhase()}
      </ScrollView>

      {/* Footer */}
      {phase === 'review' && (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerLabel}>Estimated Total</Text>
            <Text style={styles.footerValue}>{formatCurrency(estimatedTotal, 'USD')}</Text>
          </View>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
            <Text style={styles.confirmButtonText}>Confirm & Book All</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'complete' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.push('/date-night')}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
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
    paddingBottom: 100,
  },
  // Itinerary header
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  itineraryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itineraryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  itineraryName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  itineraryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  itineraryDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bookingsList: {
    gap: 10,
  },
  // Payment
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  paymentDefault: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  // Cost
  costCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: colors.text,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  costDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  costTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  costTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  costNote: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Trust badges
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: colors.success,
  },
  // Cancel button
  cancelAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  cancelAllText: {
    fontSize: 14,
    color: colors.error,
  },
  // Complete header
  completeHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: `${colors.success}10`,
    borderRadius: 16,
    marginBottom: 20,
  },
  completeHeaderSuccess: {
    backgroundColor: `${colors.success}10`,
  },
  completeHeaderPartial: {
    backgroundColor: `${colors.warning}10`,
  },
  completeHeaderFailed: {
    backgroundColor: `${colors.error}10`,
  },
  completeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  completeSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Summary card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  // Complete actions
  completeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  completeActionButton: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
  },
  completeActionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  // Footer
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
