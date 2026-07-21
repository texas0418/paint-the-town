import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Utensils,
  Music,
  Film,
  Plane,
  Hotel,
  Car,
  Compass,
  Sparkles,
  Map,
  Trophy,
  Navigation,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  BookingRequest,
  BookingResult,
  BookingCategory,
  getStatusColor,
  getStatusLabel,
  getCategoryLabel,
  PROVIDER_CONFIGS,
} from '@/types/booking';
import { formatCurrency } from '@/services/bookingService';

interface BookingItemCardProps {
  request: BookingRequest;
  result?: BookingResult;
  onRetry?: () => void;
  onCancel?: () => void;
  onViewDetails?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const CATEGORY_ICONS: Record<BookingCategory, React.ComponentType<any>> = {
  restaurant: Utensils,
  concert: Music,
  theater: Music,
  movie: Film,
  flight: Plane,
  hotel: Hotel,
  car_rental: Car,
  activity: Compass,
  spa: Sparkles,
  tour: Map,
  sports_event: Trophy,
  transportation: Navigation,
  other: Calendar,
};

// eslint-disable-next-line complexity -- tracked in #1
export default function BookingItemCard({
  request,
  result,
  onRetry,
  onCancel,
  onViewDetails,
  expanded = false,
  onToggleExpand,
}: BookingItemCardProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const status = result?.status || 'pending';
  const statusColor = getStatusColor(status);
  const CategoryIcon = CATEGORY_ICONS[request.category] || Calendar;
  const provider = PROVIDER_CONFIGS[result?.provider || request.provider];

  // Animations
  useEffect(() => {
    if (status === 'processing' || status === 'confirming') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    if (status === 'requires_action' || status === 'payment_required') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={18} color={statusColor} />;
      case 'failed':
      case 'cancelled':
        return <XCircle size={18} color={statusColor} />;
      case 'processing':
      case 'confirming':
        return (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Loader size={18} color={statusColor} />
          </Animated.View>
        );
      case 'requires_action':
      case 'payment_required':
        return <AlertTriangle size={18} color={statusColor} />;
      case 'waitlisted':
        return <Clock size={18} color={statusColor} />;
      default:
        return <Clock size={18} color={statusColor} />;
    }
  };

  const openConfirmationUrl = () => {
    if (result?.confirmationUrl) {
      Linking.openURL(result.confirmationUrl);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        status === 'confirmed' && styles.containerConfirmed,
        status === 'failed' && styles.containerFailed,
        (status === 'requires_action' || status === 'payment_required') && {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Main content */}
      <TouchableOpacity
        style={styles.mainContent}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        {/* Category icon */}
        <View style={[styles.categoryIcon, { backgroundColor: `${provider.color}15` }]}>
          <CategoryIcon size={20} color={provider.color} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.activityName} numberOfLines={1}>
            {request.activityName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.providerName}>{provider.displayName}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.categoryName}>{getCategoryLabel(request.category)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusLabel(status)}
          </Text>
        </View>

        {/* Expand toggle */}
        {onToggleExpand && (
          <View style={styles.expandToggle}>
            {expanded ? (
              <ChevronUp size={18} color={colors.textTertiary} />
            ) : (
              <ChevronDown size={18} color={colors.textTertiary} />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Booking details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {request.details.date} at {request.details.time}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {request.details.venueName}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {request.details.partySize} {request.details.partySize === 1 ? 'person' : 'people'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <CreditCard size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {result?.finalCost
                  ? formatCurrency(result.finalCost, result.currency)
                  : `Est. ${formatCurrency(request.estimatedCost, request.currency)}`}
              </Text>
            </View>
          </View>

          {/* Confirmation info */}
          {result?.confirmationNumber && (
            <View style={styles.confirmationBox}>
              <Text style={styles.confirmationLabel}>Confirmation #</Text>
              <Text style={styles.confirmationNumber}>{result.confirmationNumber}</Text>
              {result.confirmationUrl && (
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={openConfirmationUrl}
                >
                  <ExternalLink size={14} color={colors.primary} />
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tickets */}
          {result?.tickets && result.tickets.length > 0 && (
            <View style={styles.ticketsContainer}>
              <View style={styles.ticketsHeader}>
                <Ticket size={16} color={colors.primary} />
                <Text style={styles.ticketsTitle}>
                  {result.tickets.length} {result.tickets.length === 1 ? 'Ticket' : 'Tickets'}
                </Text>
              </View>
              {result.tickets.slice(0, 2).map((ticket, index) => (
                <View key={ticket.id} style={styles.ticketItem}>
                  <QrCode size={14} color={colors.textSecondary} />
                  <Text style={styles.ticketText}>{ticket.seat || ticket.type}</Text>
                </View>
              ))}
              {result.tickets.length > 2 && (
                <Text style={styles.moreTickets}>
                  +{result.tickets.length - 2} more
                </Text>
              )}
            </View>
          )}

          {/* Error message */}
          {result?.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorMessage}>{result.error.message}</Text>
              {result.error.suggestedAction && (
                <Text style={styles.errorSuggestion}>{result.error.suggestedAction}</Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {(status === 'failed' || status === 'cancelled') && onRetry && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRetry}
              >
                <RefreshCw size={16} color={colors.primary} />
                <Text style={styles.actionButtonText}>Retry</Text>
              </TouchableOpacity>
            )}

            {status === 'confirmed' && onCancel && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={onCancel}
              >
                <XCircle size={16} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
            )}

            {(status === 'requires_action' || status === 'payment_required') && result?.requiredActions?.[0] && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => {
                  if (result.requiredActions?.[0]?.actionUrl) {
                    Linking.openURL(result.requiredActions[0].actionUrl);
                  }
                }}
              >
                <AlertTriangle size={16} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                  {result.requiredActions[0].description}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// Compact version for lists
interface CompactBookingItemProps {
  request: BookingRequest;
  result?: BookingResult;
  onPress?: () => void;
}

export function CompactBookingItem({ request, result, onPress }: CompactBookingItemProps) {
  const status = result?.status || 'pending';
  const statusColor = getStatusColor(status);
  const CategoryIcon = CATEGORY_ICONS[request.category] || Calendar;

  return (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CategoryIcon size={16} color={colors.textSecondary} />
      <Text style={styles.compactName} numberOfLines={1}>{request.activityName}</Text>
      <View style={[styles.compactStatus, { backgroundColor: `${statusColor}15` }]}>
        <View style={[styles.compactDot, { backgroundColor: statusColor }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  containerConfirmed: {
    borderColor: colors.success,
    borderLeftWidth: 4,
  },
  containerFailed: {
    borderColor: colors.error,
    borderLeftWidth: 4,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  providerName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: 12,
    color: colors.textTertiary,
    marginHorizontal: 4,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusContainer: {
    alignItems: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  expandToggle: {
    padding: 4,
  },
  // Expanded content
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}10`,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  confirmationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  confirmationNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
    flex: 1,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  ticketsContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  ticketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ticketsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  ticketText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  moreTickets: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: `${colors.error}10`,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: colors.error,
  },
  errorSuggestion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDanger: {
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  compactName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  compactStatus: {
    padding: 4,
    borderRadius: 4,
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
