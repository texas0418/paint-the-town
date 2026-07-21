import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  Clock,
  MapPin,
  Navigation,
  Calendar,
  Plane,
  Hotel,
  Utensils,
  Ticket,
  Car,
  AlertCircle,
  Gift,
  Tag,
  Users,
  ChevronRight,
  Settings,
  CheckCircle,
  Timer,
  Route,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Notification, Booking, Activity, Trip } from '@/types';

interface DepartureAlert {
  id: string;
  type: 'booking' | 'activity';
  title: string;
  location: string;
  eventTime: Date;
  leaveByTime: Date;
  estimatedTravelTime: number;
  tripName?: string;
  bookingType?: Booking['type'];
  isUrgent: boolean;
  image?: string;
}

const DEFAULT_LEAD_TIME = 60;

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function NotificationsScreen() {
  const {
    notifications,
    trips,
    bookings,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'departures' | 'all'>('departures');
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(DEFAULT_LEAD_TIME);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const departureAlerts = useMemo(() => {
    const alerts: DepartureAlert[] = [];
    const now = new Date();

    bookings
      .filter((b) => b.status === 'confirmed')
      .forEach((booking) => {
        const trip = trips.find((t) => t.id === booking.tripId);
        const eventDate = new Date(booking.startDate);

        if (booking.time) {
          const [hours, minutes] = booking.time.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        }

        if (eventDate > now) {
          const estimatedTravel = getEstimatedTravelTime(booking.type);
          const leaveByTime = new Date(
            eventDate.getTime() - (leadTimeMinutes + estimatedTravel) * 60000
          );
          const timeDiff = leaveByTime.getTime() - now.getTime();
          const isUrgent = timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000;

          alerts.push({
            id: `booking-${booking.id}`,
            type: 'booking',
            title: booking.name,
            location: booking.location,
            eventTime: eventDate,
            leaveByTime,
            estimatedTravelTime: estimatedTravel,
            tripName: trip?.destination.name,
            bookingType: booking.type,
            isUrgent,
            image: booking.image,
          });
        }
      });

    trips
      .filter((t) => t.status === 'upcoming' || t.status === 'ongoing')
      .forEach((trip) => {
        trip.itinerary.forEach((day) => {
          day.activities.forEach((activity) => {
            const eventDate = new Date(day.date);
            const [hours, minutes] = activity.time.split(':').map(Number);
            eventDate.setHours(hours, minutes, 0, 0);

            if (eventDate > now) {
              const estimatedTravel = 30;
              const leaveByTime = new Date(
                eventDate.getTime() - (leadTimeMinutes + estimatedTravel) * 60000
              );
              const timeDiff = leaveByTime.getTime() - now.getTime();
              const isUrgent = timeDiff > 0 && timeDiff < 2 * 60 * 60 * 1000;

              const existingBookingAlert = alerts.find(
                (a) => a.title === activity.name && a.eventTime.getTime() === eventDate.getTime()
              );

              if (!existingBookingAlert) {
                alerts.push({
                  id: `activity-${activity.id}-${day.date}`,
                  type: 'activity',
                  title: activity.name,
                  location: activity.location,
                  eventTime: eventDate,
                  leaveByTime,
                  estimatedTravelTime: estimatedTravel,
                  tripName: trip.destination.name,
                  isUrgent,
                  image: activity.image,
                });
              }
            }
          });
        });
      });

    return alerts.sort((a, b) => a.eventTime.getTime() - b.eventTime.getTime());
  }, [bookings, trips, leadTimeMinutes]);

  const getEstimatedTravelTime = (type?: Booking['type']): number => {
    switch (type) {
      case 'flight':
        return 120;
      case 'hotel':
        return 30;
      case 'restaurant':
        return 30;
      case 'activity':
        return 45;
      case 'transport':
        return 15;
      default:
        return 30;
    }
  };

  const formatTimeUntil = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return 'Now';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date): string => {
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

  const getBookingIcon = (type?: Booking['type']) => {
    switch (type) {
      case 'flight':
        return Plane;
      case 'hotel':
        return Hotel;
      case 'restaurant':
        return Utensils;
      case 'activity':
        return Ticket;
      case 'transport':
        return Car;
      default:
        return Calendar;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return Ticket;
      case 'reminder':
        return Clock;
      case 'alert':
        return AlertCircle;
      case 'group':
        return Users;
      case 'reward':
        return Gift;
      case 'promo':
        return Tag;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return colors.primary;
      case 'reminder':
        return colors.secondary;
      case 'alert':
        return colors.error;
      case 'group':
        return colors.accentDark;
      case 'reward':
        return colors.success;
      case 'promo':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const renderDepartureAlert = (alert: DepartureAlert, index: number) => {
    const Icon = alert.bookingType ? getBookingIcon(alert.bookingType) : Calendar;
    const timeUntilLeave = formatTimeUntil(alert.leaveByTime);
    const isPast = alert.leaveByTime < new Date();

    return (
      <TouchableOpacity
        key={alert.id}
        style={[
          styles.departureCard,
          alert.isUrgent && styles.urgentCard,
          isPast && styles.pastCard,
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.departureHeader}>
          <View
            style={[styles.departureIconContainer, alert.isUrgent && styles.urgentIconContainer]}
          >
            <Icon size={20} color={alert.isUrgent ? colors.error : colors.primary} />
          </View>
          <View style={styles.departureInfo}>
            <Text style={styles.departureTitle} numberOfLines={1}>
              {alert.title}
            </Text>
            {alert.tripName && <Text style={styles.departureTripName}>{alert.tripName}</Text>}
          </View>
          {alert.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>Soon</Text>
            </View>
          )}
        </View>

        <View style={styles.departureDetails}>
          <View style={styles.departureRow}>
            <View style={styles.departureTimeBlock}>
              <View style={styles.timeLabel}>
                <Navigation size={14} color={colors.secondary} />
                <Text style={styles.timeLabelText}>Leave by</Text>
              </View>
              <Text style={[styles.departureTimeValue, alert.isUrgent && styles.urgentText]}>
                {formatTime(alert.leaveByTime)}
              </Text>
              <Text style={styles.departureDateText}>{formatDate(alert.leaveByTime)}</Text>
            </View>

            <View style={styles.travelIndicator}>
              <Route size={16} color={colors.textTertiary} />
              <Text style={styles.travelTime}>~{alert.estimatedTravelTime}min</Text>
            </View>

            <View style={styles.departureTimeBlock}>
              <View style={styles.timeLabel}>
                <Clock size={14} color={colors.primary} />
                <Text style={styles.timeLabelText}>Event at</Text>
              </View>
              <Text style={styles.departureTimeValue}>{formatTime(alert.eventTime)}</Text>
              <Text style={styles.departureDateText}>{formatDate(alert.eventTime)}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.textTertiary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {alert.location}
            </Text>
          </View>

          <View style={styles.countdownRow}>
            <Timer size={16} color={alert.isUrgent ? colors.error : colors.success} />
            <Text style={[styles.countdownText, alert.isUrgent && styles.urgentText]}>
              {isPast ? 'Departure time passed' : `Leave in ${timeUntilLeave}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotification = (notification: Notification) => {
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    const timeAgo = getTimeAgo(notification.timestamp);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, !notification.read && styles.unreadCard]}
        activeOpacity={0.7}
        onPress={() => markNotificationRead(notification.id)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>{timeAgo}</Text>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const upcomingAlerts = departureAlerts.filter((a) => a.leaveByTime > new Date());

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {activeTab === 'all' && unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllNotificationsRead}>
            <CheckCircle size={16} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'departures' && styles.activeTab]}
          onPress={() => setActiveTab('departures')}
        >
          <Navigation
            size={18}
            color={activeTab === 'departures' ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === 'departures' && styles.activeTabText]}>
            Departures
          </Text>
          {upcomingAlerts.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingAlerts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Bell size={18} color={activeTab === 'all' ? colors.primary : colors.textTertiary} />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'departures' ? (
          <>
            <View style={styles.leadTimeCard}>
              <View style={styles.leadTimeHeader}>
                <Timer size={20} color={colors.primary} />
                <Text style={styles.leadTimeTitle}>Preparation Time</Text>
              </View>
              <Text style={styles.leadTimeDescription}>
                Get notified this many minutes before you need to leave
              </Text>
              <View style={styles.leadTimeOptions}>
                {[30, 60, 90, 120].map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.leadTimeOption,
                      leadTimeMinutes === minutes && styles.leadTimeOptionActive,
                    ]}
                    onPress={() => setLeadTimeMinutes(minutes)}
                  >
                    <Text
                      style={[
                        styles.leadTimeOptionText,
                        leadTimeMinutes === minutes && styles.leadTimeOptionTextActive,
                      ]}
                    >
                      {minutes}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {upcomingAlerts.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Departures</Text>
                <Text style={styles.sectionSubtitle}>When to leave for your next experiences</Text>
                {upcomingAlerts
                  .slice(0, 10)
                  .map((alert, index) => renderDepartureAlert(alert, index))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Navigation size={48} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Upcoming Departures</Text>
                <Text style={styles.emptyMessage}>
                  When you have bookings or activities scheduled, we&apos;ll show you exactly when to
                  leave
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {notifications.length > 0 ? (
              <View style={styles.section}>{notifications.map(renderNotification)}</View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Bell size={48} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyMessage}>
                  You&apos;re all caught up! We&apos;ll notify you about important updates
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.surface,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textTertiary,
  },
  activeTabText: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  leadTimeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  leadTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  leadTimeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  leadTimeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  leadTimeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  leadTimeOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    alignItems: 'center',
  },
  leadTimeOptionActive: {
    backgroundColor: colors.primary,
  },
  leadTimeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  leadTimeOptionTextActive: {
    color: colors.textLight,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  departureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  urgentCard: {
    borderColor: colors.error,
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  pastCard: {
    opacity: 0.6,
  },
  departureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  departureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  urgentIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  departureInfo: {
    flex: 1,
  },
  departureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  departureTripName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.textLight,
  },
  departureDetails: {
    gap: 14,
  },
  departureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
  },
  departureTimeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  timeLabelText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '500' as const,
  },
  departureTimeValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  departureDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  urgentText: {
    color: colors.error,
  },
  travelIndicator: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  travelTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.success,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  unreadCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDark,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
