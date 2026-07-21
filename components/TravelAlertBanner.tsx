import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import {
  Navigation,
  Clock,
  AlertTriangle,
  Car,
  Train,
  Footprints,
  CarTaxiFront,
  X,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { TravelAlert } from '@/types/notifications';

interface TravelAlertBannerProps {
  alert: TravelAlert;
  onDismiss?: () => void;
  onStartNavigation?: () => void;
  onBookRide?: () => void;
  compact?: boolean;
}

const TRANSPORT_ICONS = {
  car: Car,
  transit: Train,
  walking: Footprints,
  rideshare: CarTaxiFront,
};

const TRAFFIC_COLORS = {
  light: colors.success,
  moderate: colors.warning,
  heavy: '#F97316',
  severe: colors.error,
};

// eslint-disable-next-line complexity -- tracked in #1
export default function TravelAlertBanner({
  alert,
  onDismiss,
  onStartNavigation,
  onBookRide,
  compact = false,
}: TravelAlertBannerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const TransportIcon = TRANSPORT_ICONS[alert.transportMode];
  const trafficColor = TRAFFIC_COLORS[alert.trafficCondition];
  const isUrgent = alert.trafficCondition === 'severe' || alert.delayMinutes > 15;

  // Animations
  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Pulse for urgent alerts
    if (isUrgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUrgent]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMinutesUntilDeparture = () => {
    const now = new Date();
    return Math.round((alert.suggestedDepartureTime.getTime() - now.getTime()) / 60000);
  };

  const minutesUntil = getMinutesUntilDeparture();
  const shouldLeaveNow = minutesUntil <= 5;
  const isLate = minutesUntil < 0;

  const openMaps = () => {
    if (!alert.toLocation.coordinates) return;

    const { lat, lng } = alert.toLocation.coordinates;
    const destination = encodeURIComponent(alert.toLocation.address);

    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&dirflg=d`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
        }
      });
    }

    onStartNavigation?.();
  };

  if (compact) {
    return (
      <Animated.View
        style={[
          styles.compactContainer,
          { transform: [{ translateY: slideAnim }] },
          shouldLeaveNow && styles.compactContainerUrgent,
        ]}
      >
        <View style={styles.compactContent}>
          <Navigation size={16} color={shouldLeaveNow ? colors.error : colors.warning} />
          <Text style={styles.compactText}>
            {isLate
              ? `Leave now! ${Math.abs(minutesUntil)} min late`
              : shouldLeaveNow
              ? 'Leave now to arrive on time'
              : `Leave in ${minutesUntil} min`}
          </Text>
          {alert.delayMinutes > 0 && (
            <View style={[styles.delayBadge, { backgroundColor: `${trafficColor}20` }]}>
              <Text style={[styles.delayText, { color: trafficColor }]}>
                +{alert.delayMinutes}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={openMaps} style={styles.compactButton}>
          <Text style={styles.compactButtonText}>Go</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
          borderLeftColor: trafficColor,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${trafficColor}15` }]}>
            <Navigation size={20} color={trafficColor} />
          </View>
          <View>
            <Text style={styles.title}>
              {isLate
                ? 'Running Late!'
                : shouldLeaveNow
                ? 'Leave Now'
                : 'Upcoming Departure'}
            </Text>
            <Text style={styles.subtitle}>
              {alert.currentEstimatedDuration} min to {alert.toLocation.name}
            </Text>
          </View>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <X size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Route info */}
      <View style={styles.routeInfo}>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {alert.fromLocation.name}
          </Text>
        </View>
        <View style={styles.routeLine}>
          <View style={styles.routeDot} />
          <View style={styles.routeDash} />
          <View style={styles.routeDot} />
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {alert.toLocation.name}
          </Text>
        </View>
      </View>

      {/* Timing info */}
      <View style={styles.timingRow}>
        <View style={styles.timingItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.timingLabel}>Leave by</Text>
          <Text style={[styles.timingValue, shouldLeaveNow && { color: colors.error }]}>
            {formatTime(alert.suggestedDepartureTime)}
          </Text>
        </View>

        <View style={styles.timingDivider} />

        <View style={styles.timingItem}>
          <TransportIcon size={14} color={colors.textSecondary} />
          <Text style={styles.timingLabel}>Duration</Text>
          <Text style={styles.timingValue}>{alert.currentEstimatedDuration} min</Text>
        </View>

        {alert.delayMinutes > 0 && (
          <>
            <View style={styles.timingDivider} />
            <View style={styles.timingItem}>
              <AlertTriangle size={14} color={trafficColor} />
              <Text style={styles.timingLabel}>Delay</Text>
              <Text style={[styles.timingValue, { color: trafficColor }]}>
                +{alert.delayMinutes} min
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Traffic condition */}
      {alert.trafficCondition !== 'light' && (
        <View style={[styles.trafficBanner, { backgroundColor: `${trafficColor}10` }]}>
          <AlertTriangle size={14} color={trafficColor} />
          <Text style={[styles.trafficText, { color: trafficColor }]}>
            {alert.trafficCondition.charAt(0).toUpperCase() + alert.trafficCondition.slice(1)} traffic on your route
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={openMaps}
        >
          <Navigation size={18} color="#fff" />
          <Text style={styles.actionButtonTextPrimary}>Start Navigation</Text>
        </TouchableOpacity>

        {alert.transportMode === 'car' && onBookRide && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onBookRide}
          >
            <CarTaxiFront size={18} color={colors.primary} />
            <Text style={styles.actionButtonText}>Book Ride</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Last updated */}
      <Text style={styles.lastUpdated}>
        Updated {formatTime(alert.lastUpdated)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dismissButton: {
    padding: 4,
  },
  routeInfo: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7,
    marginVertical: 4,
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  routeDash: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  timingRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timingDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  trafficBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  trafficText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 10,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactContainerUrgent: {
    backgroundColor: `${colors.error}15`,
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  delayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  delayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  compactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
