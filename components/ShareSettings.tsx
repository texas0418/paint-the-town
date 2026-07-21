// ============================================================================
// Share Settings Component - Creator's Sharing Controls
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Modal,
  Alert,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Share2,
  Link,
  Copy,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Calendar,
  MapPin,
  DollarSign,
  MessageSquare,
  Clock,
  RefreshCw,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  QrCode,
  Send,
  Users,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useSharedItinerary } from '@/hooks/useSharedItinerary';
import { TeaseLevel } from '@/types/sharing';

interface ShareSettingsProps {
  visible: boolean;
  onClose: () => void;
  itineraryId: string;
  itinerary: any;
  creatorName?: string;
}

const TEASE_LEVELS: { id: TeaseLevel; label: string; description: string }[] = [
  { id: 'full_mystery', label: 'Full Mystery', description: 'Shows only "Surprise Activity"' },
  { id: 'category_hint', label: 'Category Hint', description: 'Shows "Surprise Dinner 🍽️"' },
  { id: 'time_only', label: 'Time Only', description: 'Shows time but nothing else' },
  { id: 'neighborhood', label: 'Neighborhood', description: 'Shows general area' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function ShareSettings({
  visible,
  onClose,
  itineraryId,
  itinerary,
  creatorName = 'You',
}: ShareSettingsProps) {
  const [showSurpriseSettings, setShowSurpriseSettings] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const {
    sharedItinerary,
    isShared,
    surpriseActivities,
    surpriseCount,
    createShare,
    updateShareSettings,
    revokeShare,
    deleteShare,
    regenerateShareCode,
    shareViaSystem,
    copyShareLink,
    copyShareCode,
    markAsSurprise,
    removeSurprise,
    revealSurprise,
    revealAllSurprises,
    updateSurpriseSettings,
  } = useSharedItinerary({
    itineraryId,
    itinerary,
    creatorName,
  });

  // Share settings state
  const [settings, setSettings] = useState({
    surpriseModeEnabled: false,
    teaseLevel: 'category_hint' as TeaseLevel,
    canSeeLocation: true,
    canSeeCost: false,
    canSeeNotes: false,
    canAddToCalendar: true,
    canSuggestChanges: false,
    password: '',
    expiresInDays: 0, // 0 = no expiry
  });

  const handleCreateShare = async () => {
    try {
      const invite = await createShare({
        surpriseMode: {
          enabled: settings.surpriseModeEnabled,
          teaseLevel: settings.teaseLevel,
          revealOnArrival: false,
        },
        password: settings.password || undefined,
        expiresInDays: settings.expiresInDays || undefined,
        permissions: {
          canSeeLocation: settings.canSeeLocation,
          canSeeCost: settings.canSeeCost,
          canSeeNotes: settings.canSeeNotes,
          canAddToCalendar: settings.canAddToCalendar,
          canSuggestChanges: settings.canSuggestChanges,
        },
      });

      Alert.alert(
        'Share Created! 🎉',
        `Share code: ${invite.shareCode}\n\nWould you like to send it to your partner?`,
        [
          { text: 'Copy Code', onPress: () => copyShareCode() },
          { text: 'Share Now', onPress: () => shareViaSystem() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create share link');
    }
  };

  const handleRevokeShare = () => {
    Alert.alert(
      'Revoke Share?',
      'Your partner will no longer be able to view this itinerary.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revoke', 
          style: 'destructive',
          onPress: () => revokeShare(),
        },
      ]
    );
  };

  const handleRegenerateCode = async () => {
    Alert.alert(
      'Generate New Code?',
      'The old code will stop working.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Generate',
          onPress: async () => {
            const result = await regenerateShareCode();
            if (result) {
              Alert.alert('New Code', `Your new share code is: ${result.shareCode}`);
            }
          },
        },
      ]
    );
  };

  const toggleActivitySurprise = (activityId: string) => {
    if (surpriseActivities.has(activityId)) {
      removeSurprise(activityId);
    } else {
      markAsSurprise(activityId, { teaseLevel: settings.teaseLevel });
    }
  };

  // ============================================================================
  // Render Share Status Section
  // ============================================================================

  const renderShareStatus = () => {
    if (!isShared) {
      return (
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <EyeOff size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.statusTitle}>Not Shared Yet</Text>
          <Text style={styles.statusSubtitle}>
            Create a share link to let your partner view this itinerary
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statusCardActive}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, styles.statusIconActive]}>
            <Eye size={24} color={colors.success} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Shared</Text>
            <Text style={styles.statusSubtitle}>
              {sharedItinerary?.partnerViewed 
                ? 'Partner has viewed'
                : 'Waiting for partner to view'}
            </Text>
          </View>
        </View>

        {/* Share Code Display */}
        <View style={styles.shareCodeContainer}>
          <Text style={styles.shareCodeLabel}>Share Code</Text>
          <View style={styles.shareCodeRow}>
            <Text style={styles.shareCode}>{sharedItinerary?.shareCode}</Text>
            <Pressable style={styles.shareCodeBtn} onPress={copyShareCode}>
              <Copy size={18} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickAction} onPress={shareViaSystem}>
            <Send size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>Send</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={copyShareLink}>
            <Link size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>Copy Link</Text>
          </Pressable>
          <Pressable style={styles.quickAction} onPress={handleRegenerateCode}>
            <RefreshCw size={18} color={colors.primary} />
            <Text style={styles.quickActionText}>New Code</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render Surprise Settings
  // ============================================================================

  const renderSurpriseSettings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Gift size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Surprise Mode</Text>
      </View>

      {/* Enable Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Enable Surprises</Text>
          <Text style={styles.settingHint}>
            Hide selected activities from your partner
          </Text>
        </View>
        <Switch
          value={settings.surpriseModeEnabled}
          onValueChange={(value) => setSettings({ ...settings, surpriseModeEnabled: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      {settings.surpriseModeEnabled && (
        <>
          {/* Tease Level */}
          <View style={styles.teaseSection}>
            <Text style={styles.teaseLabel}>How much to reveal?</Text>
            <View style={styles.teaseOptions}>
              {TEASE_LEVELS.map((level) => (
                <Pressable
                  key={level.id}
                  style={[
                    styles.teaseOption,
                    settings.teaseLevel === level.id && styles.teaseOptionSelected,
                  ]}
                  onPress={() => setSettings({ ...settings, teaseLevel: level.id })}
                >
                  <Text style={[
                    styles.teaseOptionLabel,
                    settings.teaseLevel === level.id && styles.teaseOptionLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.teaseOptionHint}>{level.description}</Text>
                  {settings.teaseLevel === level.id && (
                    <Check size={16} color={colors.primary} style={styles.teaseCheck} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Select Activities */}
          <View style={styles.activitiesSection}>
            <Text style={styles.activitiesLabel}>
              Select activities to hide ({surpriseCount} selected)
            </Text>
            {itinerary?.activities?.map((activity: any) => (
              <Pressable
                key={activity.id}
                style={styles.activityRow}
                onPress={() => toggleActivitySurprise(activity.id)}
              >
                <View style={[
                  styles.activityCheck,
                  surpriseActivities.has(activity.id) && styles.activityCheckActive,
                ]}>
                  {surpriseActivities.has(activity.id) && (
                    <Check size={14} color="#fff" />
                  )}
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityTime}>{activity.startTime}</Text>
                </View>
                {surpriseActivities.has(activity.id) && (
                  <Gift size={16} color={colors.warning} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Reveal All Button */}
          {surpriseCount > 0 && isShared && (
            <Pressable style={styles.revealAllBtn} onPress={revealAllSurprises}>
              <Sparkles size={18} color={colors.primary} />
              <Text style={styles.revealAllText}>Reveal All Surprises</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );

  // ============================================================================
  // Render Permission Settings
  // ============================================================================

  const renderPermissions = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Lock size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Partner Permissions</Text>
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <MapPin size={18} color={colors.textSecondary} />
          <Text style={styles.settingLabel}>See Locations</Text>
        </View>
        <Switch
          value={settings.canSeeLocation}
          onValueChange={(value) => setSettings({ ...settings, canSeeLocation: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <DollarSign size={18} color={colors.textSecondary} />
          <Text style={styles.settingLabel}>See Estimated Costs</Text>
        </View>
        <Switch
          value={settings.canSeeCost}
          onValueChange={(value) => setSettings({ ...settings, canSeeCost: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Calendar size={18} color={colors.textSecondary} />
          <Text style={styles.settingLabel}>Add to Calendar</Text>
        </View>
        <Switch
          value={settings.canAddToCalendar}
          onValueChange={(value) => setSettings({ ...settings, canAddToCalendar: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <MessageSquare size={18} color={colors.textSecondary} />
          <Text style={styles.settingLabel}>Send Suggestions</Text>
        </View>
        <Switch
          value={settings.canSuggestChanges}
          onValueChange={(value) => setSettings({ ...settings, canSuggestChanges: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );

  // ============================================================================
  // Render Security Settings
  // ============================================================================

  const renderSecurity = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Lock size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Security</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password Protection (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave empty for no password"
          placeholderTextColor={colors.textTertiary}
          value={settings.password}
          onChangeText={(value) => setSettings({ ...settings, password: value })}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Expires After</Text>
        <View style={styles.expiryOptions}>
          {[
            { value: 0, label: 'Never' },
            { value: 1, label: '1 day' },
            { value: 7, label: '1 week' },
            { value: 30, label: '30 days' },
          ].map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.expiryOption,
                settings.expiresInDays === option.value && styles.expiryOptionSelected,
              ]}
              onPress={() => setSettings({ ...settings, expiresInDays: option.value })}
            >
              <Text style={[
                styles.expiryOptionText,
                settings.expiresInDays === option.value && styles.expiryOptionTextSelected,
              ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <X size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Share Itinerary</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status */}
          {renderShareStatus()}

          {/* Surprise Settings */}
          {renderSurpriseSettings()}

          {/* Permissions */}
          {renderPermissions()}

          {/* Security */}
          {!isShared && renderSecurity()}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!isShared ? (
              <Pressable style={styles.primaryBtn} onPress={handleCreateShare}>
                <Share2 size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Create Share Link</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.dangerBtn} onPress={handleRevokeShare}>
                <Trash2 size={20} color={colors.error} />
                <Text style={styles.dangerBtnText}>Revoke Access</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Styles
// ============================================================================

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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Status Card
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusCardActive: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusIconActive: {
    backgroundColor: colors.success + '20',
    marginBottom: 0,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Share Code
  shareCodeContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shareCodeLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  shareCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareCode: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 4,
  },
  shareCodeBtn: {
    padding: 8,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
  },

  // Section
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
  },
  settingHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Tease Levels
  teaseSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  teaseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  teaseOptions: {
    gap: 8,
  },
  teaseOption: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teaseOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  teaseOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  teaseOptionLabelSelected: {
    color: colors.primary,
  },
  teaseOptionHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  teaseCheck: {
    position: 'absolute',
    right: 12,
    top: 12,
  },

  // Activities
  activitiesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activitiesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityCheck: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityCheckActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
    color: colors.text,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Reveal All
  revealAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary + '15',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  revealAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },

  // Input
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
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Expiry
  expiryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  expiryOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expiryOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  expiryOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },

  // Actions
  actions: {
    marginTop: 8,
    marginBottom: 32,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.error + '15',
    paddingVertical: 16,
    borderRadius: 12,
  },
  dangerBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
  },
});
