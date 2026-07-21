import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Heart,
  Plane,
  Briefcase,
  Plus,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';

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

// Generic itinerary type that works for all sources
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

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function CalendarScreen() {
  const router = useRouter();

  // Get date night itineraries
  const { itineraries: dateNightItineraries } = useDateNight();

  // TODO: Add other itinerary sources
  // const { trips } = useTrips();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'date-night' | 'trip' | 'business'>('all');

  // Convert all itineraries to generic format
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

    // TODO: Add other types here

    return [...dateNights];
  }, [dateNightItineraries]);

  // Filter by type
  const filteredItineraries = useMemo(() => {
    if (filterType === 'all') return allItineraries;
    return allItineraries.filter((i) => i.type === filterType);
  }, [allItineraries, filterType]);

  const getItinerariesForDate = useCallback(
    (date: Date): GenericItinerary[] => {
      return filteredItineraries.filter((itinerary) => {
        const itineraryDate = new Date(itinerary.date);
        return (
          itineraryDate.getFullYear() === date.getFullYear() &&
          itineraryDate.getMonth() === date.getMonth() &&
          itineraryDate.getDate() === date.getDate()
        );
      });
    },
    [filteredItineraries]
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

    // Previous month
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

    // Current month
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

    // Next month
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

  const handleDayPress = (day: CalendarDay) => {
    setSelectedDate(day.date);
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

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
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

  const getStatusColor = (status: string) => {
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
    switch (itinerary.type) {
      case 'date-night':
        router.push(`/date-night/edit-itinerary?id=${itinerary.id}`);
        break;
      // TODO: Add other routes
      default:
        break;
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All', icon: CalendarIcon },
    { value: 'date-night', label: 'Dates', icon: Heart },
    { value: 'trip', label: 'Trips', icon: Plane },
    { value: 'business', label: 'Business', icon: Briefcase },
  ] as const;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Pressable style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {filterOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = filterType === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.filterTab, isActive && styles.filterTabActive]}
                  onPress={() => setFilterType(option.value)}
                >
                  <IconComponent
                    size={16}
                    color={isActive ? colors.textLight : colors.textSecondary}
                  />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
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
                  onPress={() => handleDayPress(day)}
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
                <View style={styles.emptyState}>
                  <CalendarIcon size={40} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No plans</Text>
                  <Text style={styles.emptyDescription}>Nothing scheduled for this day</Text>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => router.push('/date-night/generate-plan')}
                  >
                    <Plus size={18} color={colors.textLight} />
                    <Text style={styles.addButtonText}>Add Plans</Text>
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
                          <Text style={[styles.typeText, { color: typeColor }]}>
                            {itinerary.type === 'date-night'
                              ? 'Date Night'
                              : itinerary.type.charAt(0).toUpperCase() + itinerary.type.slice(1)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(itinerary.status)}15` },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(itinerary.status) },
                            ]}
                          />
                          <Text
                            style={[styles.statusText, { color: getStatusColor(itinerary.status) }]}
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
                        <View style={styles.metaItem}>
                          <Clock size={14} color={colors.textSecondary} />
                          <Text style={styles.metaText}>
                            {itinerary.activitiesCount} activities
                          </Text>
                        </View>
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingTop: 16,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textLight,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
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
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
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
  statusText: {
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
