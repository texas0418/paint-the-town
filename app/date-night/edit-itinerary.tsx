import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  MoreVertical,
  Navigation,
  Share2,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import ItineraryTimeline from '@/components/ItineraryTimeline';
import NavigationModal from '@/components/NavigationModal';
import RideshareModal from '@/components/RideshareModal';
import { TransportationMode, ActivityWithTransport, ItineraryLeg } from '@/types/transportation';
import {
  createTransportLeg,
  updateLegMode,
  openDirections,
  suggestTransportMode,
} from '@/utils/transportationUtils';
import { detectTimeConflicts, TimeConflict, formatDuration } from '@/types/timeConflicts';

// Mock data with intentional conflicts for demonstration
const MOCK_ITINERARY = {
  id: '1',
  name: 'Romantic Evening',
  date: '2024-02-14',
  status: 'planned' as const,
  activities: [
    {
      id: 'a1',
      name: 'Cocktails at The Rooftop',
      description: 'Start the evening with craft cocktails and city views',
      type: 'drinks',
      location: {
        name: 'The Rooftop Bar',
        address: '123 Main St, Atlanta, GA',
        coordinates: { lat: 33.749, lng: -84.388 },
      },
      startTime: '18:00',
      endTime: '19:15', // Overlaps with dinner!
      estimatedCost: '$$' as const,
      reservationRequired: false,
      reservationMade: false,
    },
    {
      id: 'a2',
      name: 'Dinner at Aria',
      description: 'Fine dining with seasonal tasting menu',
      type: 'dining',
      location: {
        name: 'Aria Restaurant',
        address: '490 East Paces Ferry Rd, Atlanta, GA',
        coordinates: { lat: 33.8374, lng: -84.3628 },
      },
      startTime: '19:00', // Starts before cocktails ends!
      endTime: '21:30',
      estimatedCost: '$$$$' as const,
      reservationRequired: true,
      reservationMade: true,
    },
    {
      id: 'a3',
      name: "Live Jazz at Venkman's",
      description: 'End the night with live music and dancing',
      type: 'entertainment',
      location: {
        name: "Venkman's",
        address: '740 Ralph McGill Blvd, Atlanta, GA',
        coordinates: { lat: 33.7634, lng: -84.3626 },
      },
      startTime: '21:35', // Very tight transition!
      endTime: '00:30', // Past midnight
      estimatedCost: '$$' as const,
      reservationRequired: false,
      reservationMade: false,
    },
  ],
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function EditItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [itinerary, setItinerary] = useState(MOCK_ITINERARY);
  const [activities, setActivities] = useState<ActivityWithTransport[]>([]);
  const [navigationModalVisible, setNavigationModalVisible] = useState(false);
  const [rideshareModalVisible, setRideshareModalVisible] = useState(false);
  const [selectedNavigation, setSelectedNavigation] = useState<{
    from: ActivityWithTransport;
    to: ActivityWithTransport;
    mode: TransportationMode;
  } | null>(null);

  // Initialize activities with transportation legs
  useEffect(() => {
    const activitiesWithTransport: ActivityWithTransport[] = itinerary.activities.map(
      (activity, index) => {
        const nextActivity = itinerary.activities[index + 1];
        let transportToNext: ItineraryLeg | undefined;

        if (nextActivity) {
          const distance =
            activity.location.coordinates && nextActivity.location.coordinates
              ? calculateDistanceSimple(
                  activity.location.coordinates,
                  nextActivity.location.coordinates
                )
              : 2;

          const suggestedMode = suggestTransportMode(distance);

          transportToNext = createTransportLeg(
            activity.id,
            nextActivity.id,
            activity.location.coordinates,
            nextActivity.location.coordinates,
            suggestedMode
          );
        }

        return {
          ...activity,
          transportToNext,
        };
      }
    );

    setActivities(activitiesWithTransport);
  }, [itinerary]);

  // Conflict detection result
  const conflictResult = useMemo(() => {
    return detectTimeConflicts(activities);
  }, [activities]);

  // Simple distance calculation
  const calculateDistanceSimple = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ) => {
    const R = 3959;
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.lat * Math.PI) / 180) *
        Math.cos((to.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  };

  const handleTransportModeChange = useCallback((legId: string, newMode: TransportationMode) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.transportToNext?.id === legId) {
          return {
            ...activity,
            transportToNext: updateLegMode(activity.transportToNext, newMode),
          };
        }
        return activity;
      })
    );
  }, []);

  const handleNavigate = useCallback(
    (from: ActivityWithTransport, to: ActivityWithTransport, mode: TransportationMode) => {
      setSelectedNavigation({ from, to, mode });

      if (mode === 'rideshare') {
        setRideshareModalVisible(true);
      } else {
        setNavigationModalVisible(true);
      }
    },
    []
  );

  const handleActivityPress = useCallback((activity: ActivityWithTransport) => {
    // TODO: navigate to activity edit screen
    Alert.alert(
      activity.name,
      `Edit "${activity.name}"\n\nStart: ${activity.startTime}\nEnd: ${activity.endTime}\nLocation: ${activity.location.name}`,
      [
        { text: 'Edit Times', onPress: () => handleEditTimes(activity) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleEditTimes = useCallback((activity: ActivityWithTransport) => {
    // TODO: show time picker
    Alert.alert(
      'Edit Times',
      'Time picker would appear here to adjust start/end times and resolve conflicts.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleResolveConflict = useCallback(
    (conflict: TimeConflict) => {
      // Show resolution options based on conflict type
      const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] =
        [];

      if (conflict.type === 'overlap' || conflict.type === 'same_time') {
        options.push({
          text: 'Adjust Times',
          onPress: () => {
            const activity = activities.find((a) => a.id === conflict.activityIds[0]);
            if (activity) handleEditTimes(activity);
          },
        });
        options.push({
          text: 'Remove One Activity',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Remove Activity', 'Which activity would you like to remove?', [
              ...conflict.activityIds.map((id) => {
                const activity = activities.find((a) => a.id === id);
                return {
                  text: activity?.name || id,
                  onPress: () => {
                    setActivities((prev) => prev.filter((a) => a.id !== id));
                  },
                };
              }),
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
        });
      }

      if (conflict.type === 'insufficient_travel' || conflict.type === 'tight_transition') {
        options.push({
          text: 'Change Transportation',
          onPress: () => {
            // Expand the relevant leg
            const fromActivity = activities.find((a) => a.id === conflict.activityIds[0]);
            if (fromActivity?.transportToNext) {
              Alert.alert(
                'Faster Transportation',
                'Consider switching to rideshare for faster pickup, or driving if you have a car nearby.',
                [
                  {
                    text: 'Use Rideshare',
                    onPress: () =>
                      handleTransportModeChange(fromActivity.transportToNext!.id, 'rideshare'),
                  },
                  {
                    text: 'Drive',
                    onPress: () =>
                      handleTransportModeChange(fromActivity.transportToNext!.id, 'car'),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          },
        });
        options.push({
          text: 'Adjust Activity Times',
          onPress: () => {
            const activity = activities.find((a) => a.id === conflict.activityIds[0]);
            if (activity) handleEditTimes(activity);
          },
        });
      }

      options.push({ text: 'Dismiss', style: 'cancel' });

      Alert.alert(
        conflict.shortMessage,
        `${conflict.message}\n\n${conflict.suggestedFix ? `💡 ${conflict.suggestedFix}` : ''}`,
        options
      );
    },
    [activities, handleEditTimes, handleTransportModeChange]
  );

  const handleAddActivity = useCallback(() => {
    Alert.alert('Add Activity', 'Add activity screen would open here');
  }, []);

  const handleConfirmItinerary = useCallback(() => {
    if (conflictResult.hasErrors) {
      Alert.alert(
        'Cannot Confirm',
        `Please resolve ${conflictResult.summary.errors} schedule ${
          conflictResult.summary.errors === 1 ? 'conflict' : 'conflicts'
        } before confirming your itinerary.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (conflictResult.hasWarnings) {
      Alert.alert(
        'Schedule Warnings',
        `Your itinerary has ${conflictResult.summary.warnings} ${
          conflictResult.summary.warnings === 1 ? 'warning' : 'warnings'
        }. Are you sure you want to confirm?`,
        [
          { text: 'Review', style: 'cancel' },
          {
            text: 'Confirm Anyway',
            onPress: () => {
              Alert.alert('Success!', 'Your itinerary has been confirmed.');
            },
          },
        ]
      );
      return;
    }

    Alert.alert('Success!', 'Your itinerary has been confirmed.');
  }, [conflictResult]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTotalDuration = () => {
    if (activities.length < 2) return '0 min';

    const totalTransportMinutes = activities.reduce((total, activity) => {
      return total + (activity.transportToNext?.estimatedDuration || 0);
    }, 0);

    return formatDuration(totalTransportMinutes);
  };

  const getStatusIcon = () => {
    if (conflictResult.hasErrors) {
      return <AlertTriangle size={16} color={colors.error} />;
    }
    if (conflictResult.hasWarnings) {
      return <AlertTriangle size={16} color={colors.warning} />;
    }
    return <CheckCircle size={16} color={colors.success} />;
  };

  const getStatusText = () => {
    if (conflictResult.hasErrors) {
      return `${conflictResult.summary.errors} conflicts`;
    }
    if (conflictResult.hasWarnings) {
      return `${conflictResult.summary.warnings} warnings`;
    }
    return 'Ready';
  };

  const getStatusColor = () => {
    if (conflictResult.hasErrors) return colors.error;
    if (conflictResult.hasWarnings) return colors.warning;
    return colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {itinerary.name}
          </Text>
          <View style={styles.headerSubtitle}>
            <Calendar size={12} color={colors.textSecondary} />
            <Text style={styles.headerDate}>{formatDate(itinerary.date)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Activities</Text>
          <Text style={styles.summaryValue}>{activities.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Travel Time</Text>
          <Text style={styles.summaryValue}>{getTotalDuration()}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Status</Text>
          <View style={styles.statusRow}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>
        </View>
      </View>

      {/* Timeline with Conflict Detection */}
      <ItineraryTimeline
        activities={activities}
        onActivityPress={handleActivityPress}
        onTransportModeChange={handleTransportModeChange}
        onNavigate={handleNavigate}
        onAddActivity={handleAddActivity}
        onResolveConflict={handleResolveConflict}
        editable={itinerary.status !== 'completed'}
        showConflictBanner={true}
      />

      {/* Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, conflictResult.hasErrors && styles.confirmButtonDisabled]}
          onPress={handleConfirmItinerary}
          activeOpacity={0.7}
        >
          {conflictResult.hasErrors ? (
            <>
              <AlertTriangle size={18} color="#fff" />
              <Text style={styles.confirmButtonText}>Resolve Conflicts to Confirm</Text>
            </>
          ) : (
            <>
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm Itinerary</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Navigation Modal */}
      {selectedNavigation && (
        <NavigationModal
          visible={navigationModalVisible}
          onClose={() => {
            setNavigationModalVisible(false);
            setSelectedNavigation(null);
          }}
          from={{
            name: selectedNavigation.from.location.name,
            address: selectedNavigation.from.location.address,
            coordinates: selectedNavigation.from.location.coordinates,
          }}
          to={{
            name: selectedNavigation.to.location.name,
            address: selectedNavigation.to.location.address,
            coordinates: selectedNavigation.to.location.coordinates,
          }}
          mode={selectedNavigation.mode}
        />
      )}

      {/* Rideshare Modal */}
      {selectedNavigation && (
        <RideshareModal
          visible={rideshareModalVisible}
          onClose={() => {
            setRideshareModalVisible(false);
            setSelectedNavigation(null);
          }}
          pickup={{
            name: selectedNavigation.from.location.name,
            address: selectedNavigation.from.location.address,
            coordinates: selectedNavigation.from.location.coordinates,
          }}
          dropoff={{
            name: selectedNavigation.to.location.name,
            address: selectedNavigation.to.location.address,
            coordinates: selectedNavigation.to.location.coordinates,
          }}
        />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moreButton: {
    padding: 4,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
