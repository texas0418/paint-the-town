// Paint the Town Preference Sync - Suggestion Settings Screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferenceSync } from '../hooks/usePreferenceSync';
import { SuggestionSettings } from '../types/preferences';

interface SuggestionSettingsScreenProps {
  navigation?: any;
}

const SuggestionSettingsScreen: React.FC<SuggestionSettingsScreenProps> = ({ navigation }) => {
  const {
    suggestionSettings,
    updateSuggestionSettings,
    clearAllData,
    exportPreferences,
    syncNow,
    syncHistory,
  } = usePreferenceSync();

  const [settings, setSettings] = useState<SuggestionSettings>(suggestionSettings);

  const handleToggle = useCallback(
    (key: keyof SuggestionSettings, value: boolean) => {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      updateSuggestionSettings(updated);
    },
    [settings, updateSuggestionSettings]
  );

  const handleSliderChange = useCallback(
    (key: keyof SuggestionSettings, value: number) => {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      updateSuggestionSettings(updated);
    },
    [settings, updateSuggestionSettings]
  );

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your preferences, companions, and learning history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Data Cleared', 'All preference data has been deleted.');
          },
        },
      ]
    );
  }, [clearAllData]);

  const handleExport = useCallback(async () => {
    const json = await exportPreferences();
    if (json) {
      Alert.alert(
        'Export Complete',
        'Your preferences have been exported. You can share or save this data.',
        [{ text: 'OK' }]
      );
    }
  }, [exportPreferences]);

  const handleSync = useCallback(async () => {
    const result = await syncNow();
    Alert.alert('Sync Complete', `Status: ${result.status}\nChanges: ${result.changesApplied}`, [
      { text: 'OK' },
    ]);
  }, [syncNow]);

  const renderToggleSetting = (
    title: string,
    description: string,
    key: keyof SuggestionSettings,
    value: boolean
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => handleToggle(key, val)}
        trackColor={{ false: '#ddd', true: '#667eea' }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderSliderSetting = (
    title: string,
    description: string,
    key: keyof SuggestionSettings,
    value: number,
    min: number,
    max: number,
    step: number
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.sliderBtn}
          onPress={() => handleSliderChange(key, Math.max(min, value - step))}
        >
          <Text style={styles.sliderBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.sliderValue}>{value}</Text>
        <TouchableOpacity
          style={styles.sliderBtn}
          onPress={() => handleSliderChange(key, Math.min(max, value + step))}
        >
          <Text style={styles.sliderBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize how suggestions work</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Personalization Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalization</Text>

          {renderToggleSetting(
            'Enable Personalization',
            'Use your preferences to rank suggestions',
            'enablePersonalization',
            settings.enablePersonalization
          )}

          {renderToggleSetting(
            'Strict Filtering',
            'Only show items matching must-have preferences',
            'strictFiltering',
            settings.strictFiltering
          )}

          {renderToggleSetting(
            'Show Match Scores',
            'Display how well items match your preferences',
            'showScores',
            settings.showScores
          )}

          {renderSliderSetting(
            'Minimum Score',
            'Hide suggestions below this match score',
            'minScore',
            settings.minScore,
            0,
            80,
            10
          )}
        </View>

        {/* Discovery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>

          {renderToggleSetting(
            'Prioritize New Experiences',
            "Suggest things you haven't tried before",
            'prioritizeNewExperiences',
            settings.prioritizeNewExperiences
          )}

          {renderToggleSetting(
            'Balance Categories',
            'Mix different types of suggestions',
            'balanceCategories',
            settings.balanceCategories
          )}
        </View>

        {/* Sync & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Data</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleSync}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Sync Now</Text>
              <Text style={styles.actionDesc}>
                Last synced:{' '}
                {syncHistory[0]?.timestamp
                  ? new Date(syncHistory[0].timestamp).toLocaleString()
                  : 'Never'}
              </Text>
            </View>
            <Text style={styles.actionIcon}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Export Preferences</Text>
              <Text style={styles.actionDesc}>Save your preferences as JSON</Text>
            </View>
            <Text style={styles.actionIcon}>📤</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Import Preferences</Text>
              <Text style={styles.actionDesc}>Restore from a backup file</Text>
            </View>
            <Text style={styles.actionIcon}>📥</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleDanger}>Danger Zone</Text>

          <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
            <View style={styles.actionInfo}>
              <Text style={styles.dangerTitle}>Clear All Data</Text>
              <Text style={styles.dangerDesc}>Delete all preferences, companions, and history</Text>
            </View>
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Preference Sync Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Learning Events</Text>
            <Text style={styles.aboutValue}>{syncHistory.length} synced</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerContent: {},
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitleDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderBtnText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
    marginHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: '#888',
  },
  actionIcon: {
    fontSize: 24,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 2,
  },
  dangerDesc: {
    fontSize: 13,
    color: '#FF6B6B',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 15,
    color: '#666',
  },
  aboutValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SuggestionSettingsScreen;
