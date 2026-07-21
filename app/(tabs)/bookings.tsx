import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plane,
  Building2,
  Utensils,
  Car,
  Ticket,
  Shield,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Music,
  Filter,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Booking } from '@/types';

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

const bookingTypeColors: Record<string, string> = {
  flight: colors.primary,
  hotel: colors.secondary,
  restaurant: colors.warning,
  transport: colors.success,
  activity: colors.primaryLight,
  insurance: colors.accentDark,
  event: '#E91E63',
};

type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

// ============================================================================
// Main Component
// ============================================================================

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function BookingsScreen() {
  const router = useRouter();
  const { bookings, cancelBooking } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === 'all') return true;
      if (filter === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    });
  }, [bookings, filter]);

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const groups: { [key: string]: Booking[] } = {};

    filteredBookings.forEach((booking) => {
      const date = new Date(booking.startDate);
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(booking);
    });

    // Sort each group by date
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });

    return groups;
  }, [filteredBookings]);

  // Get sorted group keys
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedBookings).sort((a, b) => {
      const dateA = new Date(groupedBookings[a][0].startDate);
      const dateB = new Date(groupedBookings[b][0].startDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [groupedBookings]);

  // Status helpers
  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
      case 'completed':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

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

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle quick cancel
  const handleQuickCancel = useCallback(
    (booking: Booking) => {
      Alert.alert('Cancel Booking', `Are you sure you want to cancel "${booking.name}"?`, [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            cancelBooking(booking.id);
            setSelectedBookingId(null);
          },
        },
      ]);
    },
    [cancelBooking]
  );

  // Handle booking press
  const handleBookingPress = useCallback(
    (booking: Booking) => {
      router.push(`/booking/${booking.id}`);
    },
    [router]
  );

  // Handle actions menu
  const handleActionsPress = useCallback(
    (bookingId: string) => {
      setSelectedBookingId(selectedBookingId === bookingId ? null : bookingId);
    },
    [selectedBookingId]
  );

  // Render booking card
  const renderBookingCard = (booking: Booking) => {
    const IconComponent = bookingTypeIcons[booking.type] || Ticket;
    const typeColor = bookingTypeColors[booking.type] || colors.primary;
    const StatusIcon = getStatusIcon(booking.status);
    const statusColor = getStatusColor(booking.status);
    const isSelected = selectedBookingId === booking.id;
    const canCancel = booking.status === 'confirmed' || booking.status === 'pending';

    return (
      <View key={booking.id}>
        <Pressable
          style={[styles.bookingCard, isSelected && styles.bookingCardSelected]}
          onPress={() => handleBookingPress(booking)}
        >
          {/* Type indicator */}
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />

          {/* Content */}
          <View style={styles.bookingContent}>
            {/* Header row */}
            <View style={styles.bookingHeader}>
              <View style={styles.bookingTypeRow}>
                <View style={[styles.typeIcon, { backgroundColor: typeColor + '15' }]}>
                  <IconComponent size={16} color={typeColor} />
                </View>
                <Text style={styles.bookingType}>
                  {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}
                </Text>
              </View>

              <View style={styles.bookingActions}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                  <StatusIcon size={12} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Text>
                </View>

                {canCancel && (
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => handleActionsPress(booking.id)}
                    hitSlop={8}
                  >
                    <MoreHorizontal size={18} color={colors.textSecondary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Main info */}
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.name}
            </Text>

            {/* Details row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatDate(booking.startDate)}</Text>
              </View>
              {booking.time && (
                <View style={styles.detailItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{booking.time}</Text>
                </View>
              )}
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {booking.location}
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.bookingFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>
                  {booking.currency} {booking.price.toLocaleString()}
                </Text>
              </View>
              {booking.confirmationCode && (
                <View style={styles.confirmationContainer}>
                  <Text style={styles.confirmationLabel}>Confirmation</Text>
                  <Text style={styles.confirmationValue}>{booking.confirmationCode}</Text>
                </View>
              )}
              <ChevronRight size={20} color={colors.textTertiary} />
            </View>
          </View>

          {/* Image if available */}
          {booking.image && (
            <Image source={{ uri: booking.image }} style={styles.bookingImage} contentFit="cover" />
          )}
        </Pressable>

        {/* Quick actions dropdown */}
        {isSelected && canCancel && (
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickActionButton}
              onPress={() => {
                setSelectedBookingId(null);
                router.push(`/booking/${booking.id}`);
              }}
            >
              <Edit3 size={16} color={colors.primary} />
              <Text style={styles.quickActionText}>Modify</Text>
            </Pressable>

            <View style={styles.quickActionDivider} />

            <Pressable style={styles.quickActionButton} onPress={() => handleQuickCancel(booking)}>
              <Trash2 size={16} color={colors.error} />
              <Text style={[styles.quickActionText, { color: colors.error }]}>Cancel</Text>
            </Pressable>

            <View style={styles.quickActionDivider} />

            <Pressable
              style={styles.quickActionButton}
              onPress={() => {
                setSelectedBookingId(null);
                router.push(`/booking/${booking.id}`);
              }}
            >
              <ExternalLink size={16} color={colors.textSecondary} />
              <Text style={styles.quickActionText}>Details</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ticket size={64} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Bookings</Text>
      <Text style={styles.emptyDescription}>
        {filter === 'all'
          ? "You don't have any bookings yet. Start planning your next adventure!"
          : `No ${filter} bookings found.`}
      </Text>
      {filter === 'all' && (
        <Pressable style={styles.emptyButton} onPress={() => router.push('/plan-trip')}>
          <Text style={styles.emptyButtonText}>Plan a Trip</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
          </Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'upcoming', 'completed', 'cancelled'] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Bookings List */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredBookings.length > 0
            ? sortedGroupKeys.map((groupKey) => (
                <View key={groupKey} style={styles.group}>
                  <Text style={styles.groupTitle}>{groupKey}</Text>
                  {groupedBookings[groupKey].map(renderBookingCard)}
                </View>
              ))
            : renderEmptyState()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  typeIndicator: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bookingContent: {
    flex: 1,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingType: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  bookingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  bookingName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  confirmationContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  confirmationLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  confirmationValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    fontFamily: 'monospace',
  },
  bookingImage: {
    width: 100,
    height: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  quickActionDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});
