// Paint the Town Time-Optimized Routes - Route Settings Screen

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TransportPreferences, OptimizationConstraints, TransportMode } from '../types/routes';
import { TRANSPORT_MODE_INFO } from '../mocks/mockRouteData';

interface RouteSettingsScreenProps {
  navigation?: any;
  transportPreferences?: TransportPreferences;
  constraints?: OptimizationConstraints;
  onSave?: (prefs: TransportPreferences, constraints: OptimizationConstraints) => void;
}

const DEFAULT_PREFS: TransportPreferences = {
  preferredModes: ['walking', 'transit', 'rideshare'],
  maxWalkingDistance: 1500,
  maxWalkingDuration: 20,
};

const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  startTime: '09:00',
  endTime: '21:00',
  lunchWindow: { start: '12:00', end: '14:00' },
  dinnerWindow: { start: '18:00', end: '20:00' },
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
const RouteSettingsScreen: React.FC<RouteSettingsScreenProps> = ({
  navigation,
  transportPreferences = DEFAULT_PREFS,
  constraints = DEFAULT_CONSTRAINTS,
  onSave,
}) => {
  const [prefs, setPrefs] = useState<TransportPreferences>(transportPreferences);
  const [cons, setCons] = useState<OptimizationConstraints>(constraints);

  const toggleMode = useCallback((mode: TransportMode) => {
    setPrefs((prev) => {
      const modes = prev.preferredModes.includes(mode)
        ? prev.preferredModes.filter((m) => m !== mode)
        : [...prev.preferredModes, mode];
      return { ...prev, preferredModes: modes };
    });
  }, []);

  const updateTime = useCallback((field: 'startTime' | 'endTime', delta: number) => {
    setCons((prev) => {
      const [h, m] = prev[field].split(':').map(Number);
      const newH = Math.max(6, Math.min(23, h + delta));
      return { ...prev, [field]: `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
    });
  }, []);

  const updateMealTime = useCallback(
    (meal: 'lunchWindow' | 'dinnerWindow', type: 'start' | 'end', delta: number) => {
      setCons((prev) => {
        const window = prev[meal];
        if (!window) return prev;
        const [h, m] = window[type].split(':').map(Number);
        const newH = Math.max(6, Math.min(23, h + delta));
        return {
          ...prev,
          [meal]: {
            ...window,
            [type]: `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          },
        };
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    onSave?.(prefs, cons);
    navigation?.goBack();
  }, [prefs, cons, onSave, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00b894', '#00cec9']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Route Settings</Text>
        <Text style={styles.headerSubtitle}>Customize optimization preferences</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Transport Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Transport</Text>
          <View style={styles.modesGrid}>
            {(Object.keys(TRANSPORT_MODE_INFO) as TransportMode[]).map((mode) => {
              const info = TRANSPORT_MODE_INFO[mode];
              const selected = prefs.preferredModes.includes(mode);
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeCard, selected && styles.modeCardSelected]}
                  onPress={() => toggleMode(mode)}
                >
                  <Text style={styles.modeIcon}>{info.icon}</Text>
                  <Text style={[styles.modeName, selected && styles.modeNameSelected]}>
                    {info.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Walking Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Walking Preferences</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Walking Distance</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setPrefs((p) => ({
                    ...p,
                    maxWalkingDistance: Math.max(500, p.maxWalkingDistance - 250),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>
                {prefs.maxWalkingDistance >= 1000
                  ? `${(prefs.maxWalkingDistance / 1000).toFixed(1)} km`
                  : `${prefs.maxWalkingDistance} m`}
              </Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setPrefs((p) => ({
                    ...p,
                    maxWalkingDistance: Math.min(5000, p.maxWalkingDistance + 250),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Max Walking Duration</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setPrefs((p) => ({
                    ...p,
                    maxWalkingDuration: Math.max(5, p.maxWalkingDuration - 5),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{prefs.maxWalkingDuration} min</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  setPrefs((p) => ({
                    ...p,
                    maxWalkingDuration: Math.min(45, p.maxWalkingDuration + 5),
                  }))
                }
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Route Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Options</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Avoid Highways</Text>
              <Text style={styles.toggleDesc}>Prefer surface roads</Text>
            </View>
            <Switch
              value={prefs.avoidHighways || false}
              onValueChange={(v) => setPrefs((p) => ({ ...p, avoidHighways: v }))}
              trackColor={{ false: '#ddd', true: '#00b894' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Avoid Tolls</Text>
              <Text style={styles.toggleDesc}>Skip toll roads</Text>
            </View>
            <Switch
              value={prefs.avoidTolls || false}
              onValueChange={(v) => setPrefs((p) => ({ ...p, avoidTolls: v }))}
              trackColor={{ false: '#ddd', true: '#00b894' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Wheelchair Accessible</Text>
              <Text style={styles.toggleDesc}>Only accessible routes</Text>
            </View>
            <Switch
              value={prefs.wheelchairAccessible || false}
              onValueChange={(v) => setPrefs((p) => ({ ...p, wheelchairAccessible: v }))}
              trackColor={{ false: '#ddd', true: '#00b894' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Day Start</Text>
              <View style={styles.timeStepper}>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => updateTime('startTime', -1)}
                >
                  <Text style={styles.timeBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.timeValue}>{cons.startTime}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => updateTime('startTime', 1)}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>Day End</Text>
              <View style={styles.timeStepper}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => updateTime('endTime', -1)}>
                  <Text style={styles.timeBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.timeValue}>{cons.endTime}</Text>
                <TouchableOpacity style={styles.timeBtn} onPress={() => updateTime('endTime', 1)}>
                  <Text style={styles.timeBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Lunch Window */}
          <View style={styles.mealSection}>
            <Text style={styles.mealTitle}>🍽️ Lunch Window</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>From</Text>
                <View style={styles.timeStepper}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('lunchWindow', 'start', -1)}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{cons.lunchWindow?.start}</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('lunchWindow', 'start', 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>To</Text>
                <View style={styles.timeStepper}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('lunchWindow', 'end', -1)}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{cons.lunchWindow?.end}</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('lunchWindow', 'end', 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Dinner Window */}
          <View style={styles.mealSection}>
            <Text style={styles.mealTitle}>🍷 Dinner Window</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>From</Text>
                <View style={styles.timeStepper}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('dinnerWindow', 'start', -1)}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{cons.dinnerWindow?.start}</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('dinnerWindow', 'start', 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timeBlock}>
                <Text style={styles.timeLabel}>To</Text>
                <View style={styles.timeStepper}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('dinnerWindow', 'end', -1)}
                  >
                    <Text style={styles.timeBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>{cons.dinnerWindow?.end}</Text>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => updateMealTime('dinnerWindow', 'end', 1)}
                  >
                    <Text style={styles.timeBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  backButton: { marginBottom: 16 },
  backButtonText: { fontSize: 28, color: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modeCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardSelected: { borderColor: '#00b894', backgroundColor: '#E8FFF8' },
  modeIcon: { fontSize: 28, marginBottom: 8 },
  modeName: { fontSize: 13, fontWeight: '600', color: '#666' },
  modeNameSelected: { color: '#00b894' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: { fontSize: 20, color: '#00b894', fontWeight: '600' },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00b894',
    marginHorizontal: 12,
    minWidth: 60,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toggleInfo: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  toggleDesc: { fontSize: 13, color: '#888' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeBlock: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  timeLabel: { fontSize: 12, color: '#888', marginBottom: 8 },
  timeStepper: { flexDirection: 'row', alignItems: 'center' },
  timeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBtnText: { fontSize: 18, color: '#00b894', fontWeight: '600' },
  timeValue: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginHorizontal: 12 },
  mealSection: { marginTop: 16 },
  mealTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  saveButton: {
    backgroundColor: '#00b894',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  bottomPadding: { height: 40 },
});

export default RouteSettingsScreen;
