// Paint the Town Route Optimizer - Activity Card Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RouteActivity, ActivityCategory } from '../types/routes';

interface ActivityCardProps {
  activity: RouteActivity;
  index: number;
  isSelected?: boolean;
  isDragging?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showTravelToNext?: boolean;
}

const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  restaurant: '🍽️',
  attraction: '🏛️',
  museum: '🖼️',
  shopping: '🛍️',
  outdoor: '🌲',
  entertainment: '🎭',
  spa_wellness: '💆',
  tour: '🚶',
  transport: '🚌',
  hotel: '🏨',
  custom: '📍',
};

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  restaurant: '#FF9500',
  attraction: '#5856D6',
  museum: '#AF52DE',
  shopping: '#FF2D55',
  outdoor: '#34C759',
  entertainment: '#FF3B30',
  spa_wellness: '#00C7BE',
  tour: '#007AFF',
  transport: '#8E8E93',
  hotel: '#FF9500',
  custom: '#666',
};

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  index,
  isSelected = false,
  isDragging = false,
  onPress,
  onLongPress,
  showTravelToNext = true,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const categoryColor = CATEGORY_COLORS[activity.category];

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          isDragging && styles.cardDragging,
          activity.isTimeLocked && styles.cardLocked,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {/* Index Badge */}
        <View style={[styles.indexBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        {/* Time Column */}
        <View style={styles.timeColumn}>
          <Text style={styles.startTime}>
            {formatTime(activity.scheduledStartTime)}
          </Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(activity.duration)}</Text>
          </View>
          <Text style={styles.endTime}>
            {formatTime(activity.scheduledEndTime)}
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: categoryColor }]} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.icon}>{CATEGORY_ICONS[activity.category]}</Text>
            <View style={styles.titleContainer}>
              <Text style={styles.name} numberOfLines={1}>{activity.name}</Text>
              <Text style={styles.category}>
                {activity.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Text>
            </View>
            
            {activity.isTimeLocked && (
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            )}
            
            {activity.wasReordered && (
              <View style={styles.reorderedBadge}>
                <Text style={styles.reorderedText}>Moved</Text>
              </View>
            )}
          </View>

          <Text style={styles.address} numberOfLines={1}>
            {activity.location.address}
          </Text>

          {/* Warnings */}
          {activity.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {activity.warnings.slice(0, 2).map((warning, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.warningBadge,
                    warning.severity === 'error' && styles.warningError,
                    warning.severity === 'warning' && styles.warningWarn,
                  ]}
                >
                  <Text style={styles.warningText} numberOfLines={1}>
                    {warning.severity === 'error' ? '⚠️' : 'ℹ️'} {warning.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {activity.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Drag Handle */}
        {!activity.isTimeLocked && (
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>⋮⋮</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Travel Segment to Next */}
      {showTravelToNext && activity.travelToNext && (
        <View style={styles.travelSegment}>
          <View style={styles.travelLine} />
          <View style={styles.travelInfo}>
            <Text style={styles.travelIcon}>
              {activity.travelToNext.mode === 'walking' ? '🚶' :
               activity.travelToNext.mode === 'driving' ? '🚗' :
               activity.travelToNext.mode === 'transit' ? '🚇' :
               activity.travelToNext.mode === 'cycling' ? '🚴' : '🚕'}
            </Text>
            <Text style={styles.travelDuration}>
              {formatDuration(activity.travelToNext.duration)}
            </Text>
            <Text style={styles.travelDistance}>
              {activity.travelToNext.distance < 1000
                ? `${activity.travelToNext.distance}m`
                : `${(activity.travelToNext.distance / 1000).toFixed(1)}km`}
            </Text>
          </View>
          <View style={styles.travelLine} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#667eea',
  },
  cardDragging: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardLocked: {
    backgroundColor: '#FFFDF5',
  },
  indexBadge: {
    width: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  timeColumn: {
    width: 60,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  durationBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  durationText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  endTime: {
    fontSize: 12,
    color: '#aaa',
  },
  divider: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  category: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  lockBadge: {
    marginLeft: 8,
  },
  lockIcon: {
    fontSize: 14,
  },
  reorderedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  reorderedText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  warningsContainer: {
    marginBottom: 8,
  },
  warningBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  warningError: {
    backgroundColor: '#FFEBEE',
  },
  warningWarn: {
    backgroundColor: '#FFF3E0',
  },
  warningText: {
    fontSize: 12,
    color: '#E65100',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  dragHandle: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandleText: {
    fontSize: 18,
    color: '#ccc',
    letterSpacing: -2,
  },
  travelSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  travelLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  travelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  travelIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  travelDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 6,
  },
  travelDistance: {
    fontSize: 12,
    color: '#999',
  },
});

export default ActivityCard;
