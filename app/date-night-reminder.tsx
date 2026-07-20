import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, BellRing } from 'lucide-react-native';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import {
  ReminderSettings,
  defaultReminderSettings,
  describeReminder,
  getReminderSettings,
  saveReminderSettings,
} from '@/services/dateNightReminderService';

const dayChips = [
  { weekday: 2, label: 'Mon' },
  { weekday: 3, label: 'Tue' },
  { weekday: 4, label: 'Wed' },
  { weekday: 5, label: 'Thu' },
  { weekday: 6, label: 'Fri' },
  { weekday: 7, label: 'Sat' },
  { weekday: 1, label: 'Sun' },
];

const timeChips = [
  { hour: 9, label: '9:00 AM' },
  { hour: 12, label: 'Noon' },
  { hour: 17, label: '5:00 PM' },
  { hour: 19, label: '7:00 PM' },
];

export default function DateNightReminderScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [settings, setSettings] = useState<ReminderSettings>(defaultReminderSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getReminderSettings()
      .then(setSettings)
      .finally(() => setLoaded(true));
  }, []);

  const apply = async (next: ReminderSettings) => {
    const prev = settings;
    setSettings(next); // optimistic — scheduling is fast but not instant
    try {
      const saved = await saveReminderSettings(next);
      setSettings(saved);
    } catch (e) {
      setSettings({ ...prev, enabled: false });
      Alert.alert(
        'Notifications are off',
        e instanceof Error ? e.message : 'Could not schedule the reminder.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradient.primary} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Date night reminder</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <BellRing size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Weekly reminder</Text>
              <Text style={styles.toggleDesc}>
                {settings.enabled
                  ? `On — ${describeReminder(settings)}`
                  : 'A nudge to plan your next date, before the week gets away from you.'}
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(enabled) => apply({ ...settings, enabled })}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.textLight}
              disabled={!loaded}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Remind me on</Text>
        <View style={styles.chipRow}>
          {dayChips.map((d) => {
            const isSelected = settings.weekday === d.weekday;
            return (
              <Pressable
                key={d.weekday}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => apply({ ...settings, weekday: d.weekday })}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>At</Text>
        <View style={styles.chipRow}>
          {timeChips.map((t) => {
            const isSelected = settings.hour === t.hour;
            return (
              <Pressable
                key={t.hour}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => apply({ ...settings, hour: t.hour, minute: 0 })}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint}>
          Thursday works best for most couples — early enough to get a Saturday reservation.
          Reminders are scheduled on this device and tapping one opens the planner.
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerGradient: {
      paddingBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textLight,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 24,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    toggleIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    toggleDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 10,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 24,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.textLight,
    },
    hint: {
      fontSize: 13,
      color: colors.textTertiary,
      lineHeight: 19,
    },
  });
