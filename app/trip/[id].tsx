// app/trip/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Share2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit3,
  MoreVertical,
  CheckCircle,
  Circle,
  Utensils,
  Plane,
  Building2,
  Camera,
  ShoppingBag,
  Music,
  Sparkles,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { getTripById, updateTrip, deleteTrip } from '@/services';
import { Trip, DayItinerary, Activity } from '@/types';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

const activityIcons: Record<string, typeof Utensils> = {
  food: Utensils,
  restaurant: Utensils,
  flight: Plane,
  hotel: Building2,
  accommodation: Building2,
  sightseeing: Camera,
  shopping: ShoppingBag,
  entertainment: Music,
  activity: Sparkles,
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function TripDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  const fetchTrip = useCallback(async () => {
    if (!id) return;

    try {
      const data = await getTripById(id);
      setTrip(data);
      // Expand first day by default
      if (data?.itinerary?.length > 0) {
        setExpandedDays([data.itinerary[0].day]);
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleShare = async () => {
    if (!trip) return;

    try {
      await Share.share({
        message: `Check out my trip to ${trip.destination?.name}! ${trip.startDate} - ${trip.endDate}`,
        title: trip.destination?.name || 'My Trip',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMoreOptions = () => {
    Alert.alert(
      'Trip Options',
      '',
      [
        {
          text: 'Edit Trip',
          onPress: () => router.push(`/edit-trip?id=${id}`),
        },
        {
          text: 'Delete Trip',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Trip',
              'Are you sure you want to delete this trip? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteTrip(id!);
                    router.replace('/(tabs)/trips');
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleDayExpanded = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
    }
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
  };

  const getDaysCount = () => {
    if (!trip) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return colors.warning;
      case 'booked':
        return colors.primary;
      case 'in_progress':
        return colors.success;
      case 'completed':
        return colors.textSecondary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planning';
      case 'booked':
        return 'Booked';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getActivityIcon = (type: string) => {
    return activityIcons[type?.toLowerCase()] || Sparkles;
  };

  const renderActivityItem = (activity: Activity, isLast: boolean) => {
    const IconComponent = getActivityIcon(activity.category);

    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={styles.activityTimeline}>
          <View style={styles.activityDot}>
            <IconComponent size={14} color={colors.primary} />
          </View>
          {!isLast && <View style={styles.activityLine} />}
        </View>
        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            {activity.time && (
              <Text style={styles.activityTime}>{activity.time}</Text>
            )}
            {activity.isBooked && (
              <View style={styles.bookedBadge}>
                <CheckCircle size={12} color={colors.success} />
                <Text style={styles.bookedText}>Booked</Text>
              </View>
            )}
          </View>
          <Text style={styles.activityName}>{activity.name}</Text>
          {activity.location && (
            <View style={styles.activityLocation}>
              <MapPin size={12} color={colors.textTertiary} />
              <Text style={styles.activityLocationText}>{activity.location}</Text>
            </View>
          )}
          {activity.price > 0 && (
            <Text style={styles.activityPrice}>
              ${activity.price} {activity.currency}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderDaySection = (day: DayItinerary) => {
    const isExpanded = expandedDays.includes(day.day);

    return (
      <View key={day.day} style={styles.daySection}>
        <Pressable
          style={styles.dayHeader}
          onPress={() => toggleDayExpanded(day.day)}
        >
          <View style={styles.dayBadge}>
            <Text style={styles.dayNumber}>{day.day}</Text>
          </View>
          <View style={styles.dayInfo}>
            <Text style={styles.dayTitle}>{day.title || `Day ${day.day}`}</Text>
            <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
          </View>
          <View style={styles.dayMeta}>
            <Text style={styles.dayActivitiesCount}>
              {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
            </Text>
            {isExpanded ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </View>
        </Pressable>

        {isExpanded && (
          <View style={styles.dayContent}>
            {day.activities.length > 0 ? (
              day.activities.map((activity, index) =>
                renderActivityItem(activity, index === day.activities.length - 1)
              )
            ) : (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>No activities planned</Text>
                <Pressable
                  style={styles.addActivityButton}
                  onPress={() => router.push(`/add-activity?tripId=${id}&day=${day.day}`)}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addActivityText}>Add Activity</Text>
                </Pressable>
              </View>
            )}

            {day.activities.length > 0 && (
              <Pressable
                style={styles.addMoreButton}
                onPress={() => router.push(`/add-activity?tripId=${id}&day=${day.day}`)}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.addMoreText}>Add more</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Trip not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const heroImage = trip.coverImage || trip.destination?.image;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {heroImage ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <MapPin size={48} color={colors.textTertiary} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.3, 1]}
            style={styles.heroGradient}
          />

          {/* Header Actions */}
          <SafeAreaView style={styles.headerActions} edges={['top']}>
            <Pressable style={styles.iconButton} onPress={() => router.back()}>
              <ArrowLeft size={22} color={colors.textLight} />
            </Pressable>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconButton} onPress={handleShare}>
                <Share2 size={22} color={colors.textLight} />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={handleMoreOptions}>
                <MoreVertical size={22} color={colors.textLight} />
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(trip.status)}</Text>
            </View>
            <Text style={styles.tripName}>
              {trip.destination?.name || 'My Trip'}
            </Text>
            {trip.destination?.country && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.textLight} />
                <Text style={styles.locationText}>{trip.destination.country}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Calendar size={20} color={colors.primary} />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
                <Text style={styles.statLabel}>{getDaysCount()} days</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <DollarSign size={20} color={colors.success} />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>
                  ${trip.spentBudget.toLocaleString()} / ${trip.totalBudget.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Budget ({trip.currency})</Text>
              </View>
            </View>
          </View>

          {/* AI Planning Card */}
          <Pressable
            style={styles.aiCard}
            onPress={() => router.push(`/ai-planner?tripId=${id}`)}
          >
            <LinearGradient
              colors={[colors.secondary, colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiCardGradient}
            >
              <View style={styles.aiIconContainer}>
                <Sparkles size={24} color={colors.textLight} />
              </View>
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiTitle}>AI Trip Assistant</Text>
                <Text style={styles.aiSubtitle}>
                  Get personalized recommendations
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </LinearGradient>
          </Pressable>

          {/* Itinerary Section */}
          <View style={styles.itinerarySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Itinerary</Text>
              <Pressable onPress={() => setExpandedDays(trip.itinerary.map((d) => d.day))}>
                <Text style={styles.expandAll}>Expand all</Text>
              </Pressable>
            </View>

            {trip.itinerary.length > 0 ? (
              trip.itinerary.map(renderDaySection)
            ) : (
              <View style={styles.emptyItinerary}>
                <Calendar size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No itinerary yet</Text>
                <Text style={styles.emptyText}>
                  Start adding activities to plan your trip
                </Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push(`/add-activity?tripId=${id}&day=1`)}
                >
                  <Plus size={18} color={colors.textLight} />
                  <Text style={styles.emptyButtonText}>Add First Activity</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.bottomButton}
          onPress={() => router.push(`/trip/${id}/bookings`)}
        >
          <Building2 size={20} color={colors.text} />
          <Text style={styles.bottomButtonText}>Bookings</Text>
        </Pressable>
        <View style={styles.bottomDivider} />
        <Pressable
          style={styles.bottomButton}
          onPress={() => router.push(`/trip/${id}/expenses`)}
        >
          <DollarSign size={20} color={colors.text} />
          <Text style={styles.bottomButtonText}>Expenses</Text>
        </Pressable>
        <View style={styles.bottomDivider} />
        <Pressable
          style={[styles.bottomButton, styles.primaryButton]}
          onPress={() => router.push(`/add-activity?tripId=${id}`)}
        >
          <Plus size={20} color={colors.textLight} />
          <Text style={styles.primaryButtonText}>Add</Text>
        </Pressable>
      </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  tripName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  aiCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  aiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  aiSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.85,
    marginTop: 2,
  },
  itinerarySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  expandAll: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  daySection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  dayInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dayMeta: {
    alignItems: 'flex-end',
  },
  dayActivitiesCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  dayContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  activityItem: {
    flexDirection: 'row',
    paddingTop: 16,
  },
  activityTimeline: {
    width: 32,
    alignItems: 'center',
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bookedText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.success,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityLocationText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  activityPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.success,
    marginTop: 4,
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyDayText: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addActivityText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  emptyItinerary: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  bottomDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginLeft: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
});
