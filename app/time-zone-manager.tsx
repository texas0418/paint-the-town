/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Globe,
  Plus,
  Search,
  X,
  Clock,
  Calendar,
  Users,
  Trash2,
  Star,
  StarOff,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Bell,
  Video,
  Phone,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface TimeZone {
  id: string;
  city: string;
  country: string;
  timezone: string;
  offset: number;
  abbreviation: string;
  isFavorite: boolean;
  label?: string;
}

interface ScheduledCall {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: { name: string; timezone: string; city: string }[];
  type: 'video' | 'phone';
  notes?: string;
}

const TIMEZONE_DATA: Omit<TimeZone, 'id' | 'isFavorite'>[] = [
  {
    city: 'New York',
    country: 'USA',
    timezone: 'America/New_York',
    offset: -5,
    abbreviation: 'EST',
  },
  {
    city: 'Los Angeles',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    offset: -8,
    abbreviation: 'PST',
  },
  { city: 'Chicago', country: 'USA', timezone: 'America/Chicago', offset: -6, abbreviation: 'CST' },
  { city: 'London', country: 'UK', timezone: 'Europe/London', offset: 0, abbreviation: 'GMT' },
  { city: 'Paris', country: 'France', timezone: 'Europe/Paris', offset: 1, abbreviation: 'CET' },
  { city: 'Berlin', country: 'Germany', timezone: 'Europe/Berlin', offset: 1, abbreviation: 'CET' },
  { city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo', offset: 9, abbreviation: 'JST' },
  {
    city: 'Sydney',
    country: 'Australia',
    timezone: 'Australia/Sydney',
    offset: 11,
    abbreviation: 'AEDT',
  },
  { city: 'Dubai', country: 'UAE', timezone: 'Asia/Dubai', offset: 4, abbreviation: 'GST' },
  {
    city: 'Singapore',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
    offset: 8,
    abbreviation: 'SGT',
  },
  {
    city: 'Hong Kong',
    country: 'China',
    timezone: 'Asia/Hong_Kong',
    offset: 8,
    abbreviation: 'HKT',
  },
  { city: 'Mumbai', country: 'India', timezone: 'Asia/Kolkata', offset: 5.5, abbreviation: 'IST' },
  {
    city: 'São Paulo',
    country: 'Brazil',
    timezone: 'America/Sao_Paulo',
    offset: -3,
    abbreviation: 'BRT',
  },
  {
    city: 'Toronto',
    country: 'Canada',
    timezone: 'America/Toronto',
    offset: -5,
    abbreviation: 'EST',
  },
  {
    city: 'Vancouver',
    country: 'Canada',
    timezone: 'America/Vancouver',
    offset: -8,
    abbreviation: 'PST',
  },
  {
    city: 'Amsterdam',
    country: 'Netherlands',
    timezone: 'Europe/Amsterdam',
    offset: 1,
    abbreviation: 'CET',
  },
  { city: 'Moscow', country: 'Russia', timezone: 'Europe/Moscow', offset: 3, abbreviation: 'MSK' },
  { city: 'Seoul', country: 'South Korea', timezone: 'Asia/Seoul', offset: 9, abbreviation: 'KST' },
  {
    city: 'Bangkok',
    country: 'Thailand',
    timezone: 'Asia/Bangkok',
    offset: 7,
    abbreviation: 'ICT',
  },
  { city: 'Cairo', country: 'Egypt', timezone: 'Africa/Cairo', offset: 2, abbreviation: 'EET' },
  {
    city: 'Johannesburg',
    country: 'South Africa',
    timezone: 'Africa/Johannesburg',
    offset: 2,
    abbreviation: 'SAST',
  },
  {
    city: 'Auckland',
    country: 'New Zealand',
    timezone: 'Pacific/Auckland',
    offset: 13,
    abbreviation: 'NZDT',
  },
  {
    city: 'Mexico City',
    country: 'Mexico',
    timezone: 'America/Mexico_City',
    offset: -6,
    abbreviation: 'CST',
  },
  {
    city: 'Buenos Aires',
    country: 'Argentina',
    timezone: 'America/Argentina/Buenos_Aires',
    offset: -3,
    abbreviation: 'ART',
  },
];

const DEFAULT_TIMEZONES = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function TimeZoneManagerScreen() {
  const router = useRouter();
  const [trackedZones, setTrackedZones] = useState<TimeZone[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'zones' | 'schedule'>('zones');

  const [newCall, setNewCall] = useState<Partial<ScheduledCall>>({
    title: '',
    date: '',
    time: '',
    participants: [],
    type: 'video',
  });
  const [selectedZonesForCall, setSelectedZonesForCall] = useState<string[]>([]);

  useEffect(() => {
    const defaultZones = TIMEZONE_DATA.filter((tz) => DEFAULT_TIMEZONES.includes(tz.timezone)).map(
      (tz, idx) => ({
        ...tz,
        id: `tz-${idx}`,
        isFavorite: false,
      })
    );
    setTrackedZones(defaultZones);

    setScheduledCalls([
      {
        id: 'call-1',
        title: 'Team Standup',
        date: '2025-01-23',
        time: '09:00',
        participants: [
          { name: 'Sarah', timezone: 'America/New_York', city: 'New York' },
          { name: 'John', timezone: 'Europe/London', city: 'London' },
          { name: 'Yuki', timezone: 'Asia/Tokyo', city: 'Tokyo' },
        ],
        type: 'video',
        notes: 'Weekly sync meeting',
      },
      {
        id: 'call-2',
        title: 'Client Presentation',
        date: '2025-01-24',
        time: '14:00',
        participants: [
          { name: 'Mike', timezone: 'America/Los_Angeles', city: 'Los Angeles' },
          { name: 'Emma', timezone: 'Europe/Paris', city: 'Paris' },
        ],
        type: 'video',
      },
    ]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeInZone = useCallback(
    (offset: number) => {
      const utc = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
      const zoneTime = new Date(utc + 3600000 * offset);
      return zoneTime;
    },
    [currentTime]
  );

  const formatTime = useCallback((date: Date, includeSeconds = false) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    if (includeSeconds) {
      return `${hour12}:${minutes}:${seconds} ${ampm}`;
    }
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const getTimePeriod = useCallback((date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return { icon: Sunrise, label: 'Morning', color: colors.warning };
    if (hour >= 12 && hour < 17)
      return { icon: Sun, label: 'Afternoon', color: colors.secondaryDark };
    if (hour >= 17 && hour < 21) return { icon: Sunset, label: 'Evening', color: colors.secondary };
    return { icon: Moon, label: 'Night', color: colors.primary };
  }, []);

  const getOffsetDisplay = useCallback((offset: number) => {
    const sign = offset >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(offset));
    const minutes = (Math.abs(offset) % 1) * 60;
    if (minutes > 0) {
      return `UTC${sign}${offset >= 0 ? hours : -hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `UTC${sign}${offset}`;
  }, []);

  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return TIMEZONE_DATA;
    const query = searchQuery.toLowerCase();
    return TIMEZONE_DATA.filter(
      (tz) =>
        tz.city.toLowerCase().includes(query) ||
        tz.country.toLowerCase().includes(query) ||
        tz.abbreviation.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleAddTimezone = useCallback(
    (tz: Omit<TimeZone, 'id' | 'isFavorite'>) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const exists = trackedZones.some((t) => t.timezone === tz.timezone);
      if (exists) {
        Alert.alert('Already Added', `${tz.city} is already in your list.`);
        return;
      }

      const newZone: TimeZone = {
        ...tz,
        id: `tz-${Date.now()}`,
        isFavorite: false,
      };
      setTrackedZones((prev) => [...prev, newZone]);
      setShowAddModal(false);
      setSearchQuery('');
    },
    [trackedZones]
  );

  const handleRemoveTimezone = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTrackedZones((prev) => prev.filter((tz) => tz.id !== id));
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTrackedZones((prev) =>
      prev.map((tz) => (tz.id === id ? { ...tz, isFavorite: !tz.isFavorite } : tz))
    );
  }, []);

  const sortedZones = useMemo(() => {
    return [...trackedZones].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.offset - b.offset;
    });
  }, [trackedZones]);

  const handleScheduleCall = useCallback(() => {
    if (!newCall.title || !newCall.date || !newCall.time || selectedZonesForCall.length === 0) {
      Alert.alert('Missing Info', 'Please fill in all required fields and select participants.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const participants = selectedZonesForCall.map((tzId) => {
      const zone = trackedZones.find((z) => z.id === tzId);
      return {
        name: zone?.city || 'Unknown',
        timezone: zone?.timezone || '',
        city: zone?.city || '',
      };
    });

    const call: ScheduledCall = {
      id: `call-${Date.now()}`,
      title: newCall.title,
      date: newCall.date,
      time: newCall.time,
      participants,
      type: newCall.type || 'video',
      notes: newCall.notes,
    };

    setScheduledCalls((prev) => [...prev, call]);
    setShowScheduleModal(false);
    setNewCall({ title: '', date: '', time: '', participants: [], type: 'video' });
    setSelectedZonesForCall([]);
  }, [newCall, selectedZonesForCall, trackedZones]);

  const getCallTimeInZone = useCallback((call: ScheduledCall, participantTimezone: string) => {
    const participant = call.participants.find((p) => p.timezone === participantTimezone);
    if (!participant) return call.time;

    const baseZone = TIMEZONE_DATA.find((tz) => tz.timezone === call.participants[0]?.timezone);
    const targetZone = TIMEZONE_DATA.find((tz) => tz.timezone === participantTimezone);

    if (!baseZone || !targetZone) return call.time;

    const [hours, minutes] = call.time.split(':').map(Number);
    const offsetDiff = targetZone.offset - baseZone.offset;
    let newHours = hours + offsetDiff;

    if (newHours >= 24) newHours -= 24;
    if (newHours < 0) newHours += 24;

    const ampm = newHours >= 12 ? 'PM' : 'AM';
    const hour12 = newHours % 12 || 12;

    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }, []);

  const handleDeleteCall = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert('Delete Call', 'Are you sure you want to remove this scheduled call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setScheduledCalls((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  }, []);

  const renderTimeZoneCard = useCallback(
    (zone: TimeZone) => {
      const zoneTime = getTimeInZone(zone.offset);
      const period = getTimePeriod(zoneTime);
      const PeriodIcon = period.icon;

      return (
        <View key={zone.id} style={styles.zoneCard}>
          <LinearGradient
            colors={[colors.surface, colors.surfaceSecondary]}
            style={styles.zoneCardGradient}
          >
            <View style={styles.zoneHeader}>
              <View style={styles.zoneInfo}>
                <View style={styles.zoneTitleRow}>
                  <Text style={styles.zoneCity}>{zone.city}</Text>
                  <View style={[styles.periodBadge, { backgroundColor: `${period.color}20` }]}>
                    <PeriodIcon size={12} color={period.color} />
                    <Text style={[styles.periodText, { color: period.color }]}>{period.label}</Text>
                  </View>
                </View>
                <Text style={styles.zoneCountry}>{zone.country}</Text>
              </View>
              <View style={styles.zoneActions}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleToggleFavorite(zone.id)}
                >
                  {zone.isFavorite ? (
                    <Star size={18} color={colors.warning} fill={colors.warning} />
                  ) : (
                    <StarOff size={18} color={colors.textTertiary} />
                  )}
                </Pressable>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleRemoveTimezone(zone.id)}
                >
                  <Trash2 size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>

            <View style={styles.timeDisplay}>
              <Text style={styles.timeText}>{formatTime(zoneTime, true)}</Text>
              <Text style={styles.dateText}>{formatDate(zoneTime)}</Text>
            </View>

            <View style={styles.zoneFooter}>
              <View style={styles.offsetBadge}>
                <Text style={styles.offsetText}>{getOffsetDisplay(zone.offset)}</Text>
              </View>
              <Text style={styles.abbreviation}>{zone.abbreviation}</Text>
            </View>
          </LinearGradient>
        </View>
      );
    },
    [
      getTimeInZone,
      getTimePeriod,
      formatTime,
      formatDate,
      getOffsetDisplay,
      handleToggleFavorite,
      handleRemoveTimezone,
    ]
  );

  const renderScheduledCall = useCallback(
    (call: ScheduledCall) => {
      const CallIcon = call.type === 'video' ? Video : Phone;

      return (
        <View key={call.id} style={styles.callCard}>
          <View style={styles.callHeader}>
            <View style={styles.callTypeIcon}>
              <CallIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.callInfo}>
              <Text style={styles.callTitle}>{call.title}</Text>
              <Text style={styles.callDateTime}>
                {call.date} at {call.time}
              </Text>
            </View>
            <Pressable style={styles.deleteCallButton} onPress={() => handleDeleteCall(call.id)}>
              <Trash2 size={16} color={colors.error} />
            </Pressable>
          </View>

          <View style={styles.participantsList}>
            {call.participants.map((p, idx) => (
              <View key={idx} style={styles.participantItem}>
                <View style={styles.participantDot} />
                <Text style={styles.participantCity}>{p.city}</Text>
                <Text style={styles.participantTime}>{getCallTimeInZone(call, p.timezone)}</Text>
              </View>
            ))}
          </View>

          {call.notes && <Text style={styles.callNotes}>{call.notes}</Text>}
        </View>
      );
    },
    [handleDeleteCall, getCallTimeInZone]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Time Zones',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textLight,
        }}
      />

      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerContent}>
            <View style={styles.globalTimeContainer}>
              <Globe size={24} color={colors.textLight} />
              <View style={styles.globalTimeText}>
                <Text style={styles.localLabel}>Your Local Time</Text>
                <Text style={styles.localTime}>{formatTime(currentTime, true)}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'zones' && styles.tabActive]}
          onPress={() => setActiveTab('zones')}
        >
          <Clock size={18} color={activeTab === 'zones' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'zones' && styles.tabTextActive]}>
            Time Zones
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Calendar
            size={18}
            color={activeTab === 'schedule' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
            Schedule
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'zones' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tracked Zones ({trackedZones.length})</Text>
              <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                <Plus size={18} color={colors.textLight} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {sortedZones.length > 0 ? (
              sortedZones.map(renderTimeZoneCard)
            ) : (
              <View style={styles.emptyState}>
                <Globe size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No time zones tracked</Text>
                <Text style={styles.emptySubtitle}>
                  Add time zones to keep track of time around the world
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Scheduled Calls ({scheduledCalls.length})</Text>
              <Pressable style={styles.addButton} onPress={() => setShowScheduleModal(true)}>
                <Plus size={18} color={colors.textLight} />
                <Text style={styles.addButtonText}>New</Text>
              </Pressable>
            </View>

            {scheduledCalls.length > 0 ? (
              scheduledCalls.map(renderScheduledCall)
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No scheduled calls</Text>
                <Text style={styles.emptySubtitle}>
                  Schedule calls across time zones to coordinate with your team
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Time Zone</Text>
            <Pressable
              onPress={() => {
                setShowAddModal(false);
                setSearchQuery('');
              }}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or country..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <ScrollView style={styles.modalContent}>
            {filteredTimezones.map((tz, idx) => {
              const isAdded = trackedZones.some((t) => t.timezone === tz.timezone);
              const zoneTime = getTimeInZone(tz.offset);

              return (
                <Pressable
                  key={idx}
                  style={[styles.timezoneOption, isAdded && styles.timezoneOptionAdded]}
                  onPress={() => !isAdded && handleAddTimezone(tz)}
                  disabled={isAdded}
                >
                  <View style={styles.tzOptionInfo}>
                    <Text style={styles.tzOptionCity}>{tz.city}</Text>
                    <Text style={styles.tzOptionCountry}>
                      {tz.country} • {tz.abbreviation}
                    </Text>
                  </View>
                  <View style={styles.tzOptionRight}>
                    <Text style={styles.tzOptionTime}>{formatTime(zoneTime)}</Text>
                    {isAdded ? (
                      <View style={styles.addedBadge}>
                        <Check size={14} color={colors.success} />
                      </View>
                    ) : (
                      <ChevronRight size={18} color={colors.textTertiary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Call</Text>
            <Pressable onPress={() => setShowScheduleModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Meeting title..."
                placeholderTextColor={colors.textTertiary}
                value={newCall.title}
                onChangeText={(text) => setNewCall((prev) => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  value={newCall.date}
                  onChangeText={(text) => setNewCall((prev) => ({ ...prev, date: text }))}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textTertiary}
                  value={newCall.time}
                  onChangeText={(text) => setNewCall((prev) => ({ ...prev, time: text }))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Call Type</Text>
              <View style={styles.typeSelector}>
                <Pressable
                  style={[styles.typeOption, newCall.type === 'video' && styles.typeOptionActive]}
                  onPress={() => setNewCall((prev) => ({ ...prev, type: 'video' }))}
                >
                  <Video
                    size={18}
                    color={newCall.type === 'video' ? colors.textLight : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newCall.type === 'video' && styles.typeOptionTextActive,
                    ]}
                  >
                    Video
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.typeOption, newCall.type === 'phone' && styles.typeOptionActive]}
                  onPress={() => setNewCall((prev) => ({ ...prev, type: 'phone' }))}
                >
                  <Phone
                    size={18}
                    color={newCall.type === 'phone' ? colors.textLight : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      newCall.type === 'phone' && styles.typeOptionTextActive,
                    ]}
                  >
                    Phone
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Participants (select from your zones)</Text>
              {trackedZones.length > 0 ? (
                <View style={styles.participantsSelect}>
                  {trackedZones.map((zone) => {
                    const isSelected = selectedZonesForCall.includes(zone.id);
                    return (
                      <Pressable
                        key={zone.id}
                        style={[
                          styles.participantOption,
                          isSelected && styles.participantOptionSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedZonesForCall((prev) => prev.filter((id) => id !== zone.id));
                          } else {
                            setSelectedZonesForCall((prev) => [...prev, zone.id]);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.participantOptionText,
                            isSelected && styles.participantOptionTextSelected,
                          ]}
                        >
                          {zone.city}
                        </Text>
                        {isSelected && <Check size={14} color={colors.textLight} />}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noZonesText}>Add time zones first to select participants</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMultiline]}
                placeholder="Add notes..."
                placeholderTextColor={colors.textTertiary}
                value={newCall.notes}
                onChangeText={(text) => setNewCall((prev) => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <Pressable style={styles.scheduleButton} onPress={handleScheduleCall}>
              <Bell size={20} color={colors.textLight} />
              <Text style={styles.scheduleButtonText}>Schedule Call</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerSafe: {
    paddingTop: 60,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  globalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  globalTimeText: {
    flex: 1,
  },
  localLabel: {
    fontSize: 13,
    color: colors.accent,
    opacity: 0.9,
  },
  localTime: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textLight,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 16,
    padding: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  zoneCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  zoneCardGradient: {
    padding: 16,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  zoneInfo: {
    flex: 1,
  },
  zoneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoneCity: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  zoneCountry: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  zoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    marginTop: 16,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  zoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offsetBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offsetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  abbreviation: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  callCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callInfo: {
    flex: 1,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  callDateTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deleteCallButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsList: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  participantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  participantCity: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  participantTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  callNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  timezoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  timezoneOptionAdded: {
    backgroundColor: `${colors.success}10`,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  tzOptionInfo: {
    flex: 1,
  },
  tzOptionCity: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tzOptionCountry: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tzOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tzOptionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  addedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeOptionTextActive: {
    color: colors.textLight,
  },
  participantsSelect: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  participantOptionSelected: {
    backgroundColor: colors.primary,
  },
  participantOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  participantOptionTextSelected: {
    color: colors.textLight,
  },
  noZonesText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic' as const,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 40,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
