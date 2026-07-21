import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Settings,
  Users,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Clock,
  Heart,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import AvailabilityGrid, { SlotDetailCard } from '@/components/AvailabilityGrid';
import CalendarConnectSheet from '@/components/CalendarConnectSheet';
import PartnerSyncSheet from '@/components/PartnerSyncSheet';
import DateSuggestionsList, { DateSuggestionsPreview } from '@/components/DateSuggestionsList';
import {
  CalendarInfo,
  MutualAvailability,
  MutualTimeSlot,
  DateSuggestion,
  UserAvailability,
  DEFAULT_AVAILABILITY_PREFERENCES,
} from '@/types/availability';
import {
  fetchCalendarEvents,
  calculateAvailability,
  findMutualAvailability,
  generateDateSuggestions,
  formatDateDisplay,
} from '@/utils/availabilityUtils';

// Mock user data
const MOCK_USER: UserAvailability = {
  userId: 'user-1',
  userName: 'You',
  userColor: colors.primary,
  windows: [],
  lastUpdated: new Date().toISOString(),
  preferences: {
    ...DEFAULT_AVAILABILITY_PREFERENCES,
    preferredDays: ['friday', 'saturday'],
    preferredTimeStart: '18:00',
    preferredTimeEnd: '23:00',
  },
};

const MOCK_PARTNER: UserAvailability = {
  userId: 'partner-1',
  userName: 'Sarah',
  userColor: colors.secondary,
  windows: [],
  lastUpdated: new Date().toISOString(),
  preferences: {
    ...DEFAULT_AVAILABILITY_PREFERENCES,
    preferredDays: ['friday', 'saturday', 'sunday'],
    preferredTimeStart: '17:00',
    preferredTimeEnd: '22:00',
  },
};

type ViewMode = 'grid' | 'suggestions';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function AvailabilitySyncScreen() {
  const router = useRouter();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [calendarSheetVisible, setCalendarSheetVisible] = useState(false);
  const [partnerSheetVisible, setPartnerSheetVisible] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<CalendarInfo[]>([]);
  const [userAvailability, setUserAvailability] = useState<UserAvailability>(MOCK_USER);
  const [partnerAvailability, setPartnerAvailability] = useState<UserAvailability | null>(
    MOCK_PARTNER
  );
  const [selectedDate, setSelectedDate] = useState<{
    date: string;
    slots: MutualTimeSlot[];
  } | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DateSuggestion | null>(null);

  // Calculate mutual availability
  const mutualAvailability = useMemo(() => {
    if (!partnerAvailability) return [];
    return findMutualAvailability(userAvailability, partnerAvailability);
  }, [userAvailability, partnerAvailability]);

  // Generate suggestions
  const suggestions = useMemo(() => {
    return generateDateSuggestions(mutualAvailability, 10);
  }, [mutualAvailability]);

  // Load calendar data
  const loadAvailability = useCallback(async () => {
    if (selectedCalendars.length === 0) return;

    const calendarIds = selectedCalendars.map((c) => c.id);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28); // 4 weeks

    try {
      const events = await fetchCalendarEvents(calendarIds, startDate, endDate);
      const windows = calculateAvailability(
        events,
        startDate,
        endDate,
        userAvailability.preferences
      );

      setUserAvailability((prev) => ({
        ...prev,
        windows,
        lastUpdated: new Date().toISOString(),
      }));

      // TODO: also fetch partner's availability from the server
      // For now, generate mock partner windows
      const partnerWindows = calculateAvailability(
        [], // Partner has no events for demo
        startDate,
        endDate,
        partnerAvailability?.preferences || DEFAULT_AVAILABILITY_PREFERENCES
      );

      if (partnerAvailability) {
        setPartnerAvailability((prev) =>
          prev
            ? {
                ...prev,
                windows: partnerWindows,
                lastUpdated: new Date().toISOString(),
              }
            : null
        );
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    }
  }, [selectedCalendars, userAvailability.preferences, partnerAvailability?.preferences]);

  // Initial load
  useEffect(() => {
    // Generate some mock availability for demo
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 28);

    const userWindows = calculateAvailability(
      [], // No events = all time free
      startDate,
      endDate,
      userAvailability.preferences
    );

    const partnerWindows = calculateAvailability(
      [],
      startDate,
      endDate,
      partnerAvailability?.preferences || DEFAULT_AVAILABILITY_PREFERENCES
    );

    setUserAvailability((prev) => ({ ...prev, windows: userWindows }));
    if (partnerAvailability) {
      setPartnerAvailability((prev) => (prev ? { ...prev, windows: partnerWindows } : null));
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAvailability();
    setRefreshing(false);
  };

  const handleSlotPress = (date: string, slot: MutualTimeSlot) => {
    const dayAvailability = mutualAvailability.find((a) => a.date === date);
    if (dayAvailability) {
      setSelectedDate({
        date,
        slots: dayAvailability.slots,
      });
    }
  };

  const handleSlotSelect = (slot: MutualTimeSlot) => {
    Alert.alert(
      'Create Date Night?',
      `Would you like to plan a date for ${selectedDate ? formatDateDisplay(selectedDate.date) : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            router.push({
              pathname: '/date-night/generate',
              params: {
                date: selectedDate?.date,
                startTime: slot.start.toISOString(),
                endTime: slot.end.toISOString(),
              },
            });
          },
        },
      ]
    );
  };

  const handleSuggestionSelect = (suggestion: DateSuggestion) => {
    setSelectedSuggestion(suggestion);
    Alert.alert(
      'Create Date Night?',
      `${suggestion.reason}\n\nWould you like to plan a date for this time?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: () => {
            router.push({
              pathname: '/date-night/generate',
              params: {
                date: suggestion.date,
                startTime: suggestion.slot.start.toISOString(),
                endTime: suggestion.slot.end.toISOString(),
              },
            });
          },
        },
      ]
    );
  };

  const handleCalendarsSelected = (calendars: CalendarInfo[]) => {
    setSelectedCalendars(calendars);
    // Reload availability with new calendars
    setTimeout(loadAvailability, 500);
  };

  const isPartnerLinked = !!partnerAvailability;
  const totalFreeSlots = mutualAvailability.reduce((sum, day) => sum + day.slots.length, 0);
  const perfectMatches = suggestions.filter((s) => s.quality === 'ideal').length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Find Free Time</Text>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => Alert.alert('Settings', 'Preferences screen would open')}
        >
          <Settings size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setCalendarSheetVisible(true)}
        >
          <CalendarPlus size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>
            {selectedCalendars.length > 0 ? `${selectedCalendars.length} calendars` : 'Connect'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, isPartnerLinked && styles.quickActionButtonActive]}
          onPress={() => setPartnerSheetVisible(true)}
        >
          <Users size={18} color={isPartnerLinked ? colors.success : colors.primary} />
          <Text style={[styles.quickActionText, isPartnerLinked && { color: colors.success }]}>
            {isPartnerLinked ? partnerAvailability.userName : 'Link Partner'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionButton} onPress={handleRefresh}>
          <RefreshCw size={18} color={colors.primary} />
          <Text style={styles.quickActionText}>Sync</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      {isPartnerLinked && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalFreeSlots}</Text>
            <Text style={styles.statLabel}>Free slots</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{perfectMatches}</Text>
            <Text style={styles.statLabel}>Perfect matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Weeks</Text>
          </View>
        </View>
      )}

      {/* View Mode Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
          onPress={() => setViewMode('grid')}
        >
          <Calendar size={16} color={viewMode === 'grid' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === 'suggestions' && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode('suggestions')}
        >
          <Sparkles
            size={16}
            color={viewMode === 'suggestions' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewMode === 'suggestions' && styles.viewToggleTextActive,
            ]}
          >
            Suggestions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {!isPartnerLinked ? (
          // Not linked prompt
          <View style={styles.notLinkedContainer}>
            <View style={styles.notLinkedIcon}>
              <Heart size={40} color={colors.secondary} />
            </View>
            <Text style={styles.notLinkedTitle}>Connect with Your Partner</Text>
            <Text style={styles.notLinkedText}>
              Link calendars with your partner to automatically find times when you&apos;re both free for
              date night
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setPartnerSheetVisible(true)}
            >
              <Users size={18} color="#fff" />
              <Text style={styles.linkButtonText}>Link Partner</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'grid' ? (
          // Calendar grid view
          <View style={styles.gridContainer}>
            <AvailabilityGrid
              mutualAvailability={mutualAvailability}
              userColor={colors.primary}
              partnerColor={colors.secondary}
              onSlotPress={handleSlotPress}
              selectedSlot={
                selectedDate
                  ? {
                      date: selectedDate.date,
                      slotStart: selectedDate.slots[0]?.start.getTime() || 0,
                    }
                  : null
              }
            />

            {selectedDate && (
              <SlotDetailCard
                date={selectedDate.date}
                dayOfWeek={
                  mutualAvailability.find((a) => a.date === selectedDate.date)?.dayOfWeek ||
                  'saturday'
                }
                slots={selectedDate.slots}
                onSlotSelect={handleSlotSelect}
                onClose={() => setSelectedDate(null)}
              />
            )}

            {/* Preview suggestions below grid */}
            {suggestions.length > 0 && !selectedDate && (
              <View style={styles.previewSection}>
                <DateSuggestionsPreview
                  suggestions={suggestions}
                  onSelectSuggestion={handleSuggestionSelect}
                  onSeeAll={() => setViewMode('suggestions')}
                />
              </View>
            )}
          </View>
        ) : (
          // Suggestions list view
          <View style={styles.suggestionsContainer}>
            <DateSuggestionsList
              suggestions={suggestions}
              onSelectSuggestion={handleSuggestionSelect}
              selectedSuggestionId={selectedSuggestion?.id}
            />
          </View>
        )}
      </ScrollView>

      {/* Calendar Connect Sheet */}
      <CalendarConnectSheet
        visible={calendarSheetVisible}
        onClose={() => setCalendarSheetVisible(false)}
        onCalendarsSelected={handleCalendarsSelected}
        selectedCalendarIds={selectedCalendars.map((c) => c.id)}
      />

      {/* Partner Sync Sheet */}
      <PartnerSyncSheet
        visible={partnerSheetVisible}
        onClose={() => setPartnerSheetVisible(false)}
        onCodeGenerated={(code) => console.log('Generated code:', code)}
        onCodeEntered={(code) => console.log('Entered code:', code)}
        partnerName={partnerAvailability?.userName}
        isLinked={isPartnerLinked}
        lastSynced={partnerAvailability?.lastUpdated}
      />
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
  settingsButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  quickActionButtonActive: {
    backgroundColor: `${colors.success}15`,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 4,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.background,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  viewToggleTextActive: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notLinkedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  notLinkedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notLinkedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notLinkedText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gridContainer: {
    gap: 16,
  },
  previewSection: {
    marginTop: 8,
  },
  suggestionsContainer: {
    // Suggestions list fills the content
  },
});
