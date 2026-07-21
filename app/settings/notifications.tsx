import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Navigation,
  Users,
  Clock,
  Moon,
  Heart,
  Volume2,
  Vibrate,
  ChevronRight,
  Info,
  Shield,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { notificationService } from '@/services/notificationService';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  ReminderTiming,
  formatReminderTiming,
} from '@/types/notifications';

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    notificationService.updatePreferences(updates);
  };

  const toggleReminderTiming = (timing: ReminderTiming) => {
    const currentTimings = preferences.activityReminders.defaultTimings;
    const newTimings = currentTimings.includes(timing)
      ? currentTimings.filter((t) => t !== timing)
      : [...currentTimings, timing];

    updatePreferences({
      activityReminders: {
        ...preferences.activityReminders,
        defaultTimings: newTimings,
      },
    });
  };

  const handleTestNotification = async () => {
    Alert.alert('Test Notification', 'A test notification will be sent in 5 seconds.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          // Schedule a test notification
          const testActivity = {
            id: 'test-1',
            name: 'Test Dinner',
            type: 'dining',
            startTime: new Date(Date.now() + 35 * 60000), // 35 min from now
            location: {
              name: 'Test Restaurant',
              address: '123 Test St',
            },
          };

          await notificationService.scheduleActivityReminder(testActivity, ['30min']);
          Alert.alert('Scheduled', 'Test notification will appear in about 5 minutes.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Global Toggle */}
        <View style={styles.section}>
          <View style={styles.mainToggle}>
            <View style={styles.mainToggleIcon}>
              {preferences.globalEnabled ? (
                <Bell size={28} color={colors.primary} />
              ) : (
                <BellOff size={28} color={colors.textTertiary} />
              )}
            </View>
            <View style={styles.mainToggleInfo}>
              <Text style={styles.mainToggleTitle}>Notifications</Text>
              <Text style={styles.mainToggleSubtitle}>
                {preferences.globalEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={preferences.globalEnabled}
              onValueChange={(value) => updatePreferences({ globalEnabled: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {preferences.globalEnabled && (
          <>
            {/* Sound & Vibration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alert Style</Text>
              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Volume2 size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Switch
                    value={preferences.soundEnabled}
                    onValueChange={(value) => updatePreferences({ soundEnabled: value })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
                <View style={styles.settingDivider} />
                <View style={styles.settingRow}>
                  <Vibrate size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Switch
                    value={preferences.vibrationEnabled}
                    onValueChange={(value) => updatePreferences({ vibrationEnabled: value })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              </View>
            </View>

            {/* Activity Reminders */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Activity Reminders</Text>
              </View>
              <Text style={styles.sectionDescription}>&quot;Dinner at La Bella in 30 minutes&quot;</Text>

              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Reminders</Text>
                  <Switch
                    value={preferences.activityReminders.enabled}
                    onValueChange={(value) =>
                      updatePreferences({
                        activityReminders: {
                          ...preferences.activityReminders,
                          enabled: value,
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.activityReminders.enabled && (
                  <>
                    <View style={styles.settingDivider} />
                    <Text style={styles.subSectionTitle}>Remind me:</Text>
                    <View style={styles.timingOptions}>
                      {(
                        ['5min', '15min', '30min', '1hour', '2hours', '1day'] as ReminderTiming[]
                      ).map((timing) => (
                        <TouchableOpacity
                          key={timing}
                          style={[
                            styles.timingOption,
                            preferences.activityReminders.defaultTimings.includes(timing) &&
                              styles.timingOptionSelected,
                          ]}
                          onPress={() => toggleReminderTiming(timing)}
                        >
                          <Text
                            style={[
                              styles.timingOptionText,
                              preferences.activityReminders.defaultTimings.includes(timing) &&
                                styles.timingOptionTextSelected,
                            ]}
                          >
                            {formatReminderTiming(timing)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Include directions</Text>
                      <Switch
                        value={preferences.activityReminders.includeDirectionsDefault}
                        onValueChange={(value) =>
                          updatePreferences({
                            activityReminders: {
                              ...preferences.activityReminders,
                              includeDirectionsDefault: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Travel Alerts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Navigation size={18} color={colors.warning} />
                <Text style={styles.sectionTitle}>Travel Alerts</Text>
              </View>
              <Text style={styles.sectionDescription}>
                &quot;Leave now to arrive on time&quot; based on traffic
              </Text>

              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Travel Alerts</Text>
                  <Switch
                    value={preferences.travelAlerts.enabled}
                    onValueChange={(value) =>
                      updatePreferences({
                        travelAlerts: {
                          ...preferences.travelAlerts,
                          enabled: value,
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.travelAlerts.enabled && (
                  <>
                    <View style={styles.settingDivider} />
                    <TouchableOpacity style={styles.settingRowTouchable}>
                      <Text style={styles.settingLabel}>Buffer time</Text>
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {preferences.travelAlerts.defaultBufferMinutes} min
                        </Text>
                        <ChevronRight size={18} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.settingDivider} />
                    <TouchableOpacity style={styles.settingRowTouchable}>
                      <Text style={styles.settingLabel}>Alert when delay exceeds</Text>
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {preferences.travelAlerts.alertWhenDelayExceeds} min
                        </Text>
                        <ChevronRight size={18} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Show alternative routes</Text>
                      <Switch
                        value={preferences.travelAlerts.showAlternativeRoutes}
                        onValueChange={(value) =>
                          updatePreferences({
                            travelAlerts: {
                              ...preferences.travelAlerts,
                              showAlternativeRoutes: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Partner Notifications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={18} color={colors.secondary} />
                <Text style={styles.sectionTitle}>Partner Notifications</Text>
              </View>
              <Text style={styles.sectionDescription}>Notify partner when itinerary is shared</Text>

              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Partner Notifications</Text>
                  <Switch
                    value={preferences.partnerNotifications.enabled}
                    onValueChange={(value) =>
                      updatePreferences({
                        partnerNotifications: {
                          ...preferences.partnerNotifications,
                          enabled: value,
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.partnerNotifications.enabled && (
                  <>
                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>When itinerary shared</Text>
                      <Switch
                        value={preferences.partnerNotifications.notifyOnShare}
                        onValueChange={(value) =>
                          updatePreferences({
                            partnerNotifications: {
                              ...preferences.partnerNotifications,
                              notifyOnShare: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>

                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>When itinerary updated</Text>
                      <Switch
                        value={preferences.partnerNotifications.notifyOnUpdate}
                        onValueChange={(value) =>
                          updatePreferences({
                            partnerNotifications: {
                              ...preferences.partnerNotifications,
                              notifyOnUpdate: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>

                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>When booking confirmed</Text>
                      <Switch
                        value={preferences.partnerNotifications.notifyOnBooking}
                        onValueChange={(value) =>
                          updatePreferences({
                            partnerNotifications: {
                              ...preferences.partnerNotifications,
                              notifyOnBooking: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Surprise Mode */}
              <View style={[styles.card, styles.surpriseCard]}>
                <View style={styles.surpriseHeader}>
                  <Heart size={20} color={colors.secondary} />
                  <Text style={styles.surpriseTitle}>Surprise Mode</Text>
                </View>
                <Text style={styles.surpriseDescription}>
                  Planning a surprise? Enable this to prevent notifications from being sent to your
                  partner for specific itineraries.
                </Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Surprise Mode</Text>
                  <Switch
                    value={preferences.partnerNotifications.surpriseMode.enabled}
                    onValueChange={(value) =>
                      updatePreferences({
                        partnerNotifications: {
                          ...preferences.partnerNotifications,
                          surpriseMode: {
                            ...preferences.partnerNotifications.surpriseMode,
                            enabled: value,
                          },
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.secondary }}
                  />
                </View>
              </View>
            </View>

            {/* Quiet Hours */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Moon size={18} color={colors.textSecondary} />
                <Text style={styles.sectionTitle}>Quiet Hours</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                  <Switch
                    value={preferences.quietHours.enabled}
                    onValueChange={(value) =>
                      updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          enabled: value,
                        },
                      })
                    }
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                {preferences.quietHours.enabled && (
                  <>
                    <View style={styles.settingDivider} />
                    <TouchableOpacity style={styles.settingRowTouchable}>
                      <Text style={styles.settingLabel}>Start time</Text>
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {preferences.quietHours.startTime}
                        </Text>
                        <ChevronRight size={18} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.settingDivider} />
                    <TouchableOpacity style={styles.settingRowTouchable}>
                      <Text style={styles.settingLabel}>End time</Text>
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {preferences.quietHours.endTime}
                        </Text>
                        <ChevronRight size={18} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.settingDivider} />
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Allow critical alerts</Text>
                      <Switch
                        value={preferences.quietHours.allowCritical}
                        onValueChange={(value) =>
                          updatePreferences({
                            quietHours: {
                              ...preferences.quietHours,
                              allowCritical: value,
                            },
                          })
                        }
                        trackColor={{ false: colors.border, true: colors.primary }}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Test Notification */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                <Info size={18} color={colors.primary} />
                <Text style={styles.testButtonText}>Send Test Notification</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
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
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
  },
  mainToggleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainToggleInfo: {
    flex: 1,
    marginLeft: 16,
  },
  mainToggleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  mainToggleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  timingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  timingOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  timingOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timingOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  surpriseCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: `${colors.secondary}08`,
    borderWidth: 1,
    borderColor: `${colors.secondary}30`,
  },
  surpriseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  surpriseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.secondary,
  },
  surpriseDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}10`,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
  bottomSpacer: {
    height: 40,
  },
});
