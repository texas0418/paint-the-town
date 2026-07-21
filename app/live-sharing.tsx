/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Users,
  Bell,
  Settings,
  Trash2,
  Phone,
  Mail,
  Share2,
  Clock,
  Battery,
  Navigation,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  UserPlus,
  Eye,
  EyeOff,
  Calendar,
  ChevronRight,
  Radio,
  Zap,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { LiveSharingContact, SafetyCheckIn, LocationUpdate } from '@/types';

type TabType = 'sharing' | 'contacts' | 'history' | 'settings';

const MOCK_CONTACTS: LiveSharingContact[] = [
  {
    id: '1',
    name: 'Mom',
    phone: '+1 234 567 8901',
    email: 'mom@email.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    relationship: 'family',
    isActive: true,
    canSeeLocation: true,
    canSeeItinerary: true,
    notifyOnArrival: true,
    notifyOnDeparture: true,
    addedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Dad',
    phone: '+1 234 567 8902',
    email: 'dad@email.com',
    relationship: 'family',
    isActive: true,
    canSeeLocation: true,
    canSeeItinerary: false,
    notifyOnArrival: true,
    notifyOnDeparture: false,
    addedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: '3',
    name: 'Sarah (Sister)',
    phone: '+1 234 567 8903',
    relationship: 'family',
    isActive: false,
    canSeeLocation: false,
    canSeeItinerary: false,
    notifyOnArrival: false,
    notifyOnDeparture: false,
    addedAt: '2024-02-01T14:30:00Z',
  },
];

const MOCK_CHECK_INS: SafetyCheckIn[] = [
  {
    id: '1',
    sessionId: 'session-1',
    timestamp: '2024-03-15T18:30:00Z',
    status: 'safe',
    message: 'Arrived at the hotel safely!',
    acknowledgedBy: ['1', '2'],
  },
  {
    id: '2',
    sessionId: 'session-1',
    timestamp: '2024-03-15T14:00:00Z',
    status: 'safe',
    message: 'Flight landed, heading to baggage claim',
  },
  {
    id: '3',
    sessionId: 'session-1',
    timestamp: '2024-03-15T08:00:00Z',
    status: 'safe',
    message: 'At the airport, about to board',
    acknowledgedBy: ['1'],
  },
];

const MOCK_LOCATION_HISTORY: LocationUpdate[] = [
  {
    id: '1',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    timestamp: '2024-03-15T18:30:00Z',
    address: 'Park Hyatt Tokyo',
    city: 'Tokyo',
    country: 'Japan',
    batteryLevel: 78,
  },
  {
    id: '2',
    coordinates: { lat: 35.5494, lng: 139.7798 },
    timestamp: '2024-03-15T16:00:00Z',
    address: 'Haneda Airport Terminal 3',
    city: 'Tokyo',
    country: 'Japan',
    batteryLevel: 85,
  },
  {
    id: '3',
    coordinates: { lat: 37.4602, lng: -122.1715 },
    timestamp: '2024-03-15T08:00:00Z',
    address: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'USA',
    batteryLevel: 100,
  },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function LiveSharingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('sharing');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [contacts, setContacts] = useState<LiveSharingContact[]>(MOCK_CONTACTS);
  const [checkIns, setCheckIns] = useState<SafetyCheckIn[]>(MOCK_CHECK_INS);
  const [locationHistory] = useState<LocationUpdate[]>(MOCK_LOCATION_HISTORY);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'family' as LiveSharingContact['relationship'],
  });

  const [settings, setSettings] = useState({
    updateFrequency: 'every_5_min',
    shareSpeed: false,
    shareBattery: true,
    shareItinerary: true,
    lowBatteryAlert: true,
    lowBatteryThreshold: 20,
    geofenceAlerts: true,
    nightModeEnabled: false,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sosAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSessionActive && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isSessionActive, isPaused, pulseAnim]);

  const handleStartSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSessionActive(true);
    setIsPaused(false);
    console.log('Starting live sharing session');
  }, []);

  const handlePauseSession = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
    console.log(isPaused ? 'Resuming session' : 'Pausing session');
  }, [isPaused]);

  const handleEndSession = useCallback(() => {
    Alert.alert(
      'End Sharing Session',
      'Your contacts will no longer see your location. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsSessionActive(false);
            setIsPaused(false);
            console.log('Session ended');
          },
        },
      ]
    );
  }, []);

  const handleSOS = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(sosAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(sosAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(sosAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(sosAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    Alert.alert(
      'Emergency SOS',
      'This will immediately alert all your active contacts with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            console.log('SOS alert sent to all contacts');
            Alert.alert('SOS Sent', 'All your contacts have been alerted with your location.');
          },
        },
      ]
    );
  }, [sosAnim]);

  const handleCheckIn = useCallback(() => {
    if (!checkInMessage.trim()) {
      const newCheckIn: SafetyCheckIn = {
        id: Date.now().toString(),
        sessionId: 'session-1',
        timestamp: new Date().toISOString(),
        status: 'safe',
        message: 'I am safe!',
      };
      setCheckIns((prev) => [newCheckIn, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCheckInModal(false);
      console.log('Quick check-in sent');
      return;
    }

    const newCheckIn: SafetyCheckIn = {
      id: Date.now().toString(),
      sessionId: 'session-1',
      timestamp: new Date().toISOString(),
      status: 'safe',
      message: checkInMessage,
    };
    setCheckIns((prev) => [newCheckIn, ...prev]);
    setCheckInMessage('');
    setShowCheckInModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Check-in sent:', checkInMessage);
  }, [checkInMessage]);

  const handleShareLink = useCallback(async () => {
    try {
      await Share.share({
        message: 'Track my live location: https://travelapp.com/share/abc123',
        title: 'Share My Location',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  }, []);

  const handleAddContact = useCallback(() => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Missing Information', 'Please enter at least a name and phone number.');
      return;
    }

    const contact: LiveSharingContact = {
      id: Date.now().toString(),
      ...newContact,
      isActive: true,
      canSeeLocation: true,
      canSeeItinerary: false,
      notifyOnArrival: true,
      notifyOnDeparture: true,
      addedAt: new Date().toISOString(),
    };

    setContacts((prev) => [...prev, contact]);
    setNewContact({ name: '', phone: '', email: '', relationship: 'family' });
    setShowAddContact(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Contact added:', contact.name);
  }, [newContact]);

  const handleRemoveContact = useCallback(
    (contactId: string) => {
      const contact = contacts.find((c) => c.id === contactId);
      Alert.alert('Remove Contact', `Remove ${contact?.name} from your sharing list?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setContacts((prev) => prev.filter((c) => c.id !== contactId));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]);
    },
    [contacts]
  );

  const toggleContactActive = useCallback((contactId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isActive: !c.isActive, canSeeLocation: !c.isActive } : c
      )
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(timestamp);
  };

  // eslint-disable-next-line complexity -- tracked in #1
  const renderSharingTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIndicator}>
            {isSessionActive ? (
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    backgroundColor: isPaused ? colors.warning : colors.success,
                    transform: [{ scale: isPaused ? 1 : pulseAnim }],
                  },
                ]}
              />
            ) : (
              <View style={[styles.pulseCircle, { backgroundColor: colors.textTertiary }]} />
            )}
            <Text style={styles.statusText}>
              {isSessionActive ? (isPaused ? 'Paused' : 'Sharing Live') : 'Not Sharing'}
            </Text>
          </View>
          {isSessionActive && (
            <TouchableOpacity onPress={handleShareLink} style={styles.shareButton}>
              <Share2 size={18} color={colors.primary} />
              <Text style={styles.shareButtonText}>Share Link</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSessionActive && (
          <View style={styles.currentLocation}>
            <MapPin size={20} color={colors.primary} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>
                {locationHistory[0]?.address || 'Getting location...'}
              </Text>
              <Text style={styles.locationMeta}>
                {locationHistory[0]?.city}, {locationHistory[0]?.country} • Updated{' '}
                {getRelativeTime(locationHistory[0]?.timestamp || new Date().toISOString())}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.sessionControls}>
          {!isSessionActive ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
              activeOpacity={0.8}
            >
              <Play size={24} color={colors.textLight} />
              <Text style={styles.startButtonText}>Start Sharing</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={handlePauseSession}
                activeOpacity={0.8}
              >
                {isPaused ? (
                  <Play size={20} color={colors.textLight} />
                ) : (
                  <Pause size={20} color={colors.textLight} />
                )}
                <Text style={styles.controlButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={handleEndSession}
                activeOpacity={0.8}
              >
                <Square size={20} color={colors.textLight} />
                <Text style={styles.controlButtonText}>End</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => setShowCheckInModal(true)}
          activeOpacity={0.8}
        >
          <CheckCircle size={24} color={colors.success} />
          <Text style={styles.checkInButtonText}>Check In</Text>
          <Text style={styles.checkInSubtext}>Let them know you are safe</Text>
        </TouchableOpacity>

        <Animated.View
          style={{
            transform: [
              {
                scale: Animated.add(
                  1,
                  sosAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] })
                ),
              },
            ],
          }}
        >
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS} activeOpacity={0.8}>
            <AlertTriangle size={24} color={colors.textLight} />
            <Text style={styles.sosButtonText}>SOS</Text>
            <Text style={styles.sosSubtext}>Emergency alert</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.activeContacts}>
        <Text style={styles.sectionTitle}>Active Viewers</Text>
        {contacts.filter((c) => c.isActive).length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No active contacts</Text>
            <Text style={styles.emptySubtext}>Add contacts to share your location</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contactsScroll}
          >
            {contacts
              .filter((c) => c.isActive)
              .map((contact) => (
                <View key={contact.id} style={styles.activeContactCard}>
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactInitial}>{contact.name[0]}</Text>
                    <View style={styles.onlineIndicator} />
                  </View>
                  <Text style={styles.contactName} numberOfLines={1}>
                    {contact.name}
                  </Text>
                  <View style={styles.contactPermissions}>
                    {contact.canSeeLocation && <MapPin size={12} color={colors.success} />}
                    {contact.canSeeItinerary && <Calendar size={12} color={colors.primary} />}
                  </View>
                </View>
              ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.recentCheckIns}>
        <Text style={styles.sectionTitle}>Recent Check-ins</Text>
        {checkIns.slice(0, 3).map((checkIn, index) => (
          <View key={checkIn.id} style={styles.checkInCard}>
            <View style={styles.checkInIcon}>
              <CheckCircle size={20} color={colors.success} />
            </View>
            <View style={styles.checkInContent}>
              <Text style={styles.checkInMessage}>{checkIn.message}</Text>
              <Text style={styles.checkInTime}>{getRelativeTime(checkIn.timestamp)}</Text>
            </View>
            {checkIn.acknowledgedBy && checkIn.acknowledgedBy.length > 0 && (
              <View style={styles.acknowledgedBadge}>
                <Eye size={12} color={colors.textSecondary} />
                <Text style={styles.acknowledgedText}>{checkIn.acknowledgedBy.length}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const renderContactsTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={styles.addContactButton}
        onPress={() => setShowAddContact(true)}
        activeOpacity={0.8}
      >
        <UserPlus size={24} color={colors.primary} />
        <Text style={styles.addContactText}>Add New Contact</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Your Contacts ({contacts.length})</Text>

      {contacts.map((contact) => (
        <View key={contact.id} style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactInitial}>{contact.name[0]}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactCardName}>{contact.name}</Text>
              <Text style={styles.contactRelationship}>
                {contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)}
              </Text>
            </View>
            <Switch
              value={contact.isActive}
              onValueChange={() => toggleContactActive(contact.id)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={contact.isActive ? colors.primary : colors.textTertiary}
            />
          </View>

          <View style={styles.contactDetails}>
            <View style={styles.contactDetailRow}>
              <Phone size={16} color={colors.textSecondary} />
              <Text style={styles.contactDetailText}>{contact.phone}</Text>
            </View>
            {contact.email && (
              <View style={styles.contactDetailRow}>
                <Mail size={16} color={colors.textSecondary} />
                <Text style={styles.contactDetailText}>{contact.email}</Text>
              </View>
            )}
          </View>

          <View style={styles.contactPermissionsSection}>
            <Text style={styles.permissionsLabel}>Permissions</Text>
            <View style={styles.permissionTags}>
              <View
                style={[styles.permissionTag, contact.canSeeLocation && styles.permissionTagActive]}
              >
                <MapPin
                  size={12}
                  color={contact.canSeeLocation ? colors.textLight : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.permissionTagText,
                    contact.canSeeLocation && styles.permissionTagTextActive,
                  ]}
                >
                  Location
                </Text>
              </View>
              <View
                style={[
                  styles.permissionTag,
                  contact.canSeeItinerary && styles.permissionTagActive,
                ]}
              >
                <Calendar
                  size={12}
                  color={contact.canSeeItinerary ? colors.textLight : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.permissionTagText,
                    contact.canSeeItinerary && styles.permissionTagTextActive,
                  ]}
                >
                  Itinerary
                </Text>
              </View>
              <View
                style={[
                  styles.permissionTag,
                  contact.notifyOnArrival && styles.permissionTagActive,
                ]}
              >
                <Bell
                  size={12}
                  color={contact.notifyOnArrival ? colors.textLight : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.permissionTagText,
                    contact.notifyOnArrival && styles.permissionTagTextActive,
                  ]}
                >
                  Alerts
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.removeContactButton}
            onPress={() => handleRemoveContact(contact.id)}
          >
            <Trash2 size={16} color={colors.error} />
            <Text style={styles.removeContactText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Location Timeline</Text>

      <View style={styles.timeline}>
        {locationHistory.map((location, index) => (
          <View key={location.id} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={[styles.timelineDot, index === 0 && styles.timelineDotActive]} />
              {index < locationHistory.length - 1 && <View style={styles.timelineConnector} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineAddress}>{location.address}</Text>
              <Text style={styles.timelineLocation}>
                {location.city}, {location.country}
              </Text>
              <View style={styles.timelineMeta}>
                <Clock size={12} color={colors.textTertiary} />
                <Text style={styles.timelineTime}>
                  {formatTime(location.timestamp)} • {formatDate(location.timestamp)}
                </Text>
                {location.batteryLevel && (
                  <>
                    <Battery
                      size={12}
                      color={location.batteryLevel < 20 ? colors.error : colors.textTertiary}
                    />
                    <Text style={styles.timelineTime}>{location.batteryLevel}%</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Check-in History</Text>

      {checkIns.map((checkIn) => (
        <View key={checkIn.id} style={styles.historyCheckIn}>
          <View
            style={[
              styles.checkInStatusDot,
              { backgroundColor: checkIn.status === 'safe' ? colors.success : colors.error },
            ]}
          />
          <View style={styles.historyCheckInContent}>
            <Text style={styles.historyCheckInMessage}>{checkIn.message}</Text>
            <Text style={styles.historyCheckInTime}>
              {formatTime(checkIn.timestamp)} • {formatDate(checkIn.timestamp)}
            </Text>
          </View>
          {checkIn.acknowledgedBy && (
            <View style={styles.acknowledgedBy}>
              <Eye size={14} color={colors.textTertiary} />
              <Text style={styles.acknowledgedCount}>{checkIn.acknowledgedBy.length} seen</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Location Updates</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Radio size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Update Frequency</Text>
              <Text style={styles.settingDescription}>How often to share your location</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingValue}>
            <Text style={styles.settingValueText}>Every 5 min</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Navigation size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share Speed</Text>
              <Text style={styles.settingDescription}>Let contacts see your travel speed</Text>
            </View>
          </View>
          <Switch
            value={settings.shareSpeed}
            onValueChange={(v) => setSettings((s) => ({ ...s, shareSpeed: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.shareSpeed ? colors.primary : colors.textTertiary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Battery size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share Battery Level</Text>
              <Text style={styles.settingDescription}>Contacts can see your battery status</Text>
            </View>
          </View>
          <Switch
            value={settings.shareBattery}
            onValueChange={(v) => setSettings((s) => ({ ...s, shareBattery: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.shareBattery ? colors.primary : colors.textTertiary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Calendar size={20} color={colors.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Share Itinerary</Text>
              <Text style={styles.settingDescription}>Let contacts view your trip plans</Text>
            </View>
          </View>
          <Switch
            value={settings.shareItinerary}
            onValueChange={(v) => setSettings((s) => ({ ...s, shareItinerary: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.shareItinerary ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Safety Alerts</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Zap size={20} color={colors.warning} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Low Battery Alert</Text>
              <Text style={styles.settingDescription}>Notify contacts when battery is low</Text>
            </View>
          </View>
          <Switch
            value={settings.lowBatteryAlert}
            onValueChange={(v) => setSettings((s) => ({ ...s, lowBatteryAlert: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.lowBatteryAlert ? colors.primary : colors.textTertiary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <MapPin size={20} color={colors.secondary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Geofence Alerts</Text>
              <Text style={styles.settingDescription}>Notify when entering/leaving areas</Text>
            </View>
          </View>
          <Switch
            value={settings.geofenceAlerts}
            onValueChange={(v) => setSettings((s) => ({ ...s, geofenceAlerts: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.geofenceAlerts ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Privacy</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <EyeOff size={20} color={colors.textSecondary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Night Mode</Text>
              <Text style={styles.settingDescription}>Pause sharing during sleep hours</Text>
            </View>
          </View>
          <Switch
            value={settings.nightModeEnabled}
            onValueChange={(v) => setSettings((s) => ({ ...s, nightModeEnabled: v }))}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={settings.nightModeEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
      </View>
    </View>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'sharing':
        return renderSharingTab();
      case 'contacts':
        return renderContactsTab();
      case 'history':
        return renderHistoryTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderSharingTab();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Trip Sharing</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.tabs}>
          {[
            { id: 'sharing' as const, label: 'Sharing', icon: Radio },
            { id: 'contacts' as const, label: 'Contacts', icon: Users },
            { id: 'history' as const, label: 'History', icon: Clock },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <tab.icon
                size={18}
                color={activeTab === tab.id ? colors.primary : colors.textTertiary}
              />
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderTab()}
        </ScrollView>
      </SafeAreaView>

      {showAddContact && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowAddContact(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.name}
                  onChangeText={(v) => setNewContact((c) => ({ ...c, name: v }))}
                  placeholder="Enter name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.phone}
                  onChangeText={(v) => setNewContact((c) => ({ ...c, phone: v }))}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newContact.email}
                  onChangeText={(v) => setNewContact((c) => ({ ...c, email: v }))}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.relationshipOptions}>
                  {(['family', 'friend', 'emergency', 'other'] as const).map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.relationshipOption,
                        newContact.relationship === rel && styles.relationshipOptionActive,
                      ]}
                      onPress={() => setNewContact((c) => ({ ...c, relationship: rel }))}
                    >
                      <Text
                        style={[
                          styles.relationshipOptionText,
                          newContact.relationship === rel && styles.relationshipOptionTextActive,
                        ]}
                      >
                        {rel.charAt(0).toUpperCase() + rel.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={handleAddContact}>
                <Text style={styles.modalButtonText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showCheckInModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Safety Check-in</Text>
              <TouchableOpacity onPress={() => setShowCheckInModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.quickCheckIn}>
                <TouchableOpacity style={styles.quickCheckInButton} onPress={handleCheckIn}>
                  <CheckCircle size={32} color={colors.success} />
                  <Text style={styles.quickCheckInText}>I am Safe!</Text>
                  <Text style={styles.quickCheckInSubtext}>Quick check-in</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.orDivider}>or add a message</Text>

              <TextInput
                style={[styles.input, styles.messageInput]}
                value={checkInMessage}
                onChangeText={setCheckInMessage}
                placeholder="Add a custom message..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.modalButton, !checkInMessage && styles.modalButtonDisabled]}
                onPress={handleCheckIn}
                disabled={!checkInMessage}
              >
                <Text style={styles.modalButtonText}>Send Check-in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
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
  headerRight: {
    width: 32,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  tabContent: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.accent,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  locationMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sessionControls: {
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  controlButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  checkInButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success,
  },
  checkInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
    marginTop: 8,
  },
  checkInSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  sosButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 8,
  },
  sosSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginTop: 24,
  },
  activeContacts: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  contactsScroll: {
    marginHorizontal: -4,
  },
  activeContactCard: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: 90,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  contactInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textLight,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  contactPermissions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  recentCheckIns: {
    marginTop: 8,
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  checkInIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInContent: {
    flex: 1,
  },
  checkInMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  checkInTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  acknowledgedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: colors.accent,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addContactText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  contactCard: {
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
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  contactRelationship: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  contactDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  contactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactPermissionsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  permissionsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    marginBottom: 8,
  },
  permissionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
  },
  permissionTagActive: {
    backgroundColor: colors.primary,
  },
  permissionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  permissionTagTextActive: {
    color: colors.textLight,
  },
  removeContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  removeContactText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLine: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textTertiary,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  timelineLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginRight: 8,
  },
  historyCheckIn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  checkInStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  historyCheckInContent: {
    flex: 1,
  },
  historyCheckInMessage: {
    fontSize: 14,
    color: colors.text,
  },
  historyCheckInTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  acknowledgedBy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acknowledgedCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  relationshipOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  relationshipOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  relationshipOptionTextActive: {
    color: colors.textLight,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  quickCheckIn: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quickCheckInButton: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    borderRadius: 16,
    width: '100%',
  },
  quickCheckInText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginTop: 12,
  },
  quickCheckInSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  orDivider: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
