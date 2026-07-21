/* eslint-disable max-lines -- tracked in #1 */
// app/(tabs)/trips.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plane,
  Building2,
  Utensils,
  Car,
  Ticket,
  Shield,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Music,
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  List,
  Heart,
  Users,
  Briefcase,
  Plus,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import {
  getTrips,
  getBookings,
  cancelBooking as cancelBookingService,
  Booking,
} from '@/services';
import { Trip } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = (SCREEN_WIDTH - 40 - 12) / 7;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type ViewMode = 'list' | 'calendar';
type FilterType = 'all' | 'upcoming' | 'completed' | 'cancelled';

interface GenericItinerary {
  id: string;
  name: string;
  date: string;
  type: 'date-night' | 'trip' | 'business' | 'other';
  status: 'draft' | 'planned' | 'completed' | 'cancelled';
  partnerName?: string;
  destination?: string;
  activitiesCount: number;
  isSurprise?: boolean;
  totalEstimatedCost?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  itineraries: GenericItinerary[];
}

const bookingTypeIcons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: Building2,
  restaurant: Utensils,
  transport: Car,
  car: Car,
  activity: Ticket,
  insurance: Shield,
  event: Music,
  other: Ticket,
};

const bookingTypeColors: Record<string, string> = {
  flight: colors.primary,
  hotel: colors.secondary,
  restaurant: colors.warning,
  transport: colors.success,
  car: colors.success,
  activity: colors.primaryLight,
  insurance: colors.accentDark,
  event: '#E91E63',
  other: colors.textSecondary,
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function TripsScreen() {
  const router = useRouter();
  const { itineraries: dateNightItineraries } = useDateNight();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Data from Supabase
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      const [bookingsData, tripsData] = await Promise.all([
        getBookings(),
        getTrips(),
      ]);
      setBookings(bookingsData);
      setTrips(tripsData);
    } catch (error) {
      console.error('Error fetching trips data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === 'all') return true;
      if (filter === 'upcoming') return b.status === 'confirmed' || b.status === 'pending';
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
    });
  }, [bookings, filter]);

  const groupedBookings = useMemo(() => {
    const groups: { [key: string]: Booking[] } = {};
    filteredBookings.forEach((booking) => {
      const date = new Date(booking.startDate);
      const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(booking);
    });
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    });
    return groups;
  }, [filteredBookings]);

  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedBookings).sort((a, b) => {
      const dateA = new Date(groupedBookings[a][0].startDate);
      const dateB = new Date(groupedBookings[b][0].startDate);
      return dateA.getTime() - dateB.getTime();
    });
  }, [groupedBookings]);

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'cancelled':
        return XCircle;
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
      default:
        return colors.textTertiary;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleQuickCancel = useCallback(
    (booking: Booking) => {
      Alert.alert('Cancel Booking', `Are you sure you want to cancel "${booking.name}"?`, [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            await cancelBookingService(booking.id);
            setSelectedBookingId(null);
            fetchData(); // Refresh data
          },
        },
      ]);
    },
    [fetchData]
  );

  const handleBookingPress = useCallback(
    (booking: Booking) => {
      router.push(`/booking/${booking.id}`);
    },
    [router]
  );

  const handleActionsPress = useCallback(
    (bookingId: string) => {
      setSelectedBookingId(selectedBookingId === bookingId ? null : bookingId);
    },
    [selectedBookingId]
  );

  // Calendar View Logic
  const allItineraries = useMemo((): GenericItinerary[] => {
    const dateNights: GenericItinerary[] = dateNightItineraries.map((i) => ({
      id: i.id,
      name: i.name,
      date: i.date,
      type: 'date-night' as const,
      status: i.status,
      partnerName: i.partnerName,
      destination: i.destination,
      activitiesCount: i.activities.length,
      isSurprise: i.isSurprise,
      totalEstimatedCost: i.totalEstimatedCost,
    }));

    // Add trips as itineraries
    const tripItineraries: GenericItinerary[] = trips.map((t) => ({
      id: t.id,
      name: t.destination?.name || 'Trip',
      date: t.startDate,
      type: 'trip' as const,
      status: t.status === 'completed' ? 'completed' : t.status === 'cancelled' ? 'cancelled' : 'planned',
      destination: t.destination?.country,
      activitiesCount: t.itinerary?.length || 0,
    }));

    return [...dateNights, ...tripItineraries];
  }, [dateNightItineraries, trips]);

  const getItinerariesForDate = useCallback(
    (date: Date): GenericItinerary[] => {
      return allItineraries.filter((itinerary) => {
        const itineraryDate = new Date(itinerary.date);
        return (
          itineraryDate.getFullYear() === date.getFullYear() &&
          itineraryDate.getMonth() === date.getMonth() &&
          itineraryDate.getDate() === date.getDate()
        );
      });
    },
    [allItineraries]
  );

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        itineraries: getItinerariesForDate(date),
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        itineraries: getItinerariesForDate(date),
      });
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        itineraries: getItinerariesForDate(date),
      });
    }
    return days;
  }, [currentDate, getItinerariesForDate]);

  const selectedDateItineraries = useMemo(() => {
    if (!selectedDate) return [];
    return getItinerariesForDate(selectedDate);
  }, [selectedDate, getItinerariesForDate]);

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const formatSelectedDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'date-night':
        return colors.secondary;
      case 'trip':
        return colors.primary;
      case 'business':
        return '#6366F1';
      default:
        return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'date-night':
        return Heart;
      case 'trip':
        return Plane;
      case 'business':
        return Briefcase;
      default:
        return CalendarIcon;
    }
  };

  const getCalendarStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'draft':
        return colors.textTertiary;
      default:
        return colors.secondary;
    }
  };

  const getDotColors = (dayItineraries: GenericItinerary[]) => {
    if (dayItineraries.length === 0) return [];
    const types = [...new Set(dayItineraries.map((i) => i.type))];
    return types.map(getTypeColor).slice(0, 3);
  };

  const handleItineraryPress = (itinerary: GenericItinerary) => {
    if (itinerary.type === 'date-night') {
      router.push(`/date-night/edit-itinerary?id=${itinerary.id}`);
    } else if (itinerary.type === 'trip') {
      router.push(`/trip/${itinerary.id}`);
    }
  };

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
          <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
          <View style={styles.bookingContent}>
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
            <Text style={styles.bookingName} numberOfLines={1}>
              {booking.name}
            </Text>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <CalendarIcon size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{formatDate(booking.startDate)}</Text>
              </View>
            </View>
            {booking.location && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {booking.location}
                </Text>
              </View>
            )}
            <View style={styles.bookingFooter}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>
                  {booking.currency} {booking.price.toLocaleString()}
                </Text>
              </View>
              {booking.confirmationNumber && (
                <View style={styles.confirmationContainer}>
                  <Text style={styles.confirmationLabel}>Confirmation</Text>
                  <Text style={styles.confirmationValue}>{booking.confirmationNumber}</Text>
                </View>
              )}
              <ChevronRight size={20} color={colors.textTertiary} />
            </View>
          </View>
        </Pressable>
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
          </View>
        )}
      </View>
    );
  };

  const renderListView = () => (
    <>
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

      <ScrollView
        style={styles.listContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredBookings.length > 0 ? (
          sortedGroupKeys.map((groupKey) => (
            <View key={groupKey} style={styles.group}>
              <Text style={styles.groupTitle}>{groupKey}</Text>
              {groupedBookings[groupKey].map(renderBookingCard)}
            </View>
          ))
        ) : (
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
                <Plus size={18} color={colors.textLight} />
                <Text style={styles.emptyButtonText}>Plan a Trip</Text>
              </Pressable>
            )}
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );

  const renderCalendarView = () => (
    <View style={styles.calendarContainer}>
      {/* Month Navigation */}
      <View style={styles.monthNavigation}>
        <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Pressable onPress={goToToday}>
          <Text style={styles.monthTitle}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={goToNextMonth}>
          <ChevronRight size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedDate && day.date.toDateString() === selectedDate.toDateString();
          const dotColors = getDotColors(day.itineraries);
          return (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                day.isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDate(day.date)}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.dayNumberOtherMonth,
                  isSelected && styles.dayNumberSelected,
                  day.isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {day.date.getDate()}
              </Text>
              {dotColors.length > 0 && (
                <View style={styles.dotContainer}>
                  {dotColors.map((color, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Date Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <CalendarIcon size={20} color={colors.primary} />
          <Text style={styles.detailsTitle}>
            {selectedDate ? formatSelectedDate(selectedDate) : 'Select a date'}
          </Text>
        </View>
        <ScrollView
          style={styles.itinerariesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itinerariesContent}
        >
          {selectedDateItineraries.length === 0 ? (
            <View style={styles.calendarEmptyState}>
              <CalendarIcon size={40} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No plans</Text>
              <Text style={styles.emptyDescription}>Nothing scheduled for this day</Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push('/plan-trip')}
              >
                <Plus size={18} color={colors.textLight} />
                <Text style={styles.emptyButtonText}>Add Plans</Text>
              </Pressable>
            </View>
          ) : (
            selectedDateItineraries.map((itinerary) => {
              const TypeIcon = getTypeIcon(itinerary.type);
              const typeColor = getTypeColor(itinerary.type);
              return (
                <Pressable
                  key={itinerary.id}
                  style={styles.itineraryCard}
                  onPress={() => handleItineraryPress(itinerary)}
                >
                  <View style={styles.itineraryHeader}>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
                      <TypeIcon size={14} color={typeColor} />
                      <Text style={[styles.itineraryTypeText, { color: typeColor }]}>
                        {itinerary.type === 'date-night'
                          ? 'Date Night'
                          : itinerary.type.charAt(0).toUpperCase() + itinerary.type.slice(1)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.calStatusBadge,
                        { backgroundColor: `${getCalendarStatusColor(itinerary.status)}15` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getCalendarStatusColor(itinerary.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.calStatusText,
                          { color: getCalendarStatusColor(itinerary.status) },
                        ]}
                      >
                        {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itineraryName}>{itinerary.name}</Text>
                  <View style={styles.itineraryMeta}>
                    {itinerary.partnerName && (
                      <View style={styles.metaItem}>
                        <Users size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{itinerary.partnerName}</Text>
                      </View>
                    )}
                    {itinerary.destination && (
                      <View style={styles.metaItem}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{itinerary.destination}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>
              {trips.length} trip{trips.length !== 1 ? 's' : ''} • {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? colors.primary : colors.textLight} />
            </Pressable>
            <Pressable
              style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
              onPress={() => setViewMode('calendar')}
            >
              <CalendarIcon
                size={18}
                color={viewMode === 'calendar' ? colors.primary : colors.textLight}
              />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {viewMode === 'list' ? renderListView() : renderCalendarView()}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 3,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: colors.surface,
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
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
  listContent: {
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bookingCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  typeIndicator: {
    width: 4,
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
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
  quickActions: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 12,
    marginHorizontal: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  calendarContainer: {
    flex: 1,
    paddingTop: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dayCell: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: DAY_WIDTH / 2,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: DAY_WIDTH / 2,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  dayNumberOtherMonth: {
    color: colors.textTertiary,
  },
  dayNumberSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  detailsSection: {
    flex: 1,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  itinerariesList: {
    flex: 1,
  },
  itinerariesContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  calendarEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  itineraryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itineraryTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itineraryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  itineraryMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
