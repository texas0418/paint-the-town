import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Check, Home, Trees, Blend } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { ThemeColors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/constants/typography';
import { foodPreferences } from '@/mocks/preferences';
import {
  TasteProfile,
  emptyTasteProfile,
  VenueStyle,
  activityOptions,
  musicGenreOptions,
  drinkOptions,
  TasteOption,
} from '@/types/planner';
import { getTasteProfile, saveTasteProfile } from '@/services/tasteProfileService';

const venueStyles: { id: VenueStyle; name: string; icon: typeof Home }[] = [
  { id: 'indoor', name: 'Indoor', icon: Home },
  { id: 'outdoor', name: 'Outdoor', icon: Trees },
  { id: 'both', name: 'Both', icon: Blend },
];

export default function TasteProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<TasteProfile>(emptyTasteProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTasteProfile()
      .then(setProfile)
      .catch((e) => console.error('Failed to load taste profile:', e))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field: keyof TasteProfile, id: string) => {
    setProfile((p) => {
      const list = p[field] as string[];
      return {
        ...p,
        [field]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTasteProfile(profile);
      router.back();
    } catch (e) {
      Alert.alert('Save failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderChips = (
    title: string,
    options: TasteOption[],
    field: keyof TasteProfile,
    dislike = false
  ) => {
    const selected = profile[field] as string[];
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.chipGrid}>
          {options.map((o) => {
            const isSelected = selected.includes(o.id);
            return (
              <Pressable
                key={o.id}
                style={[
                  styles.chip,
                  isSelected && (dislike ? styles.chipDislike : styles.chipSelected),
                ]}
                onPress={() => toggle(field, o.id)}
              >
                <Text style={styles.chipEmoji}>{o.emoji}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {o.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>My Taste Profile</Text>
            <View style={styles.backBtn} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderChips('Activities I love', activityOptions, 'activityLoves')}
            {renderChips('Cuisines I love', foodPreferences, 'foodLoves')}
            {renderChips('Foods to avoid', foodPreferences, 'foodDislikes', true)}
            {renderChips('Music I like', musicGenreOptions, 'musicGenres')}
            {renderChips('Drinks', drinkOptions, 'drinks')}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Indoor or outdoor?</Text>
              <View style={styles.venueRow}>
                {venueStyles.map((v) => {
                  const IconComponent = v.icon;
                  const isSelected = profile.venueStyle === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      style={[styles.venueCard, isSelected && styles.venueCardSelected]}
                      onPress={() => setProfile((p) => ({ ...p, venueStyle: v.id }))}
                    >
                      <IconComponent
                        size={20}
                        color={isSelected ? colors.textLight : colors.primary}
                      />
                      <Text style={[styles.venueText, isSelected && styles.venueTextSelected]}>
                        {v.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Typical date budget:{' '}
                <Text style={styles.budgetText}>
                  ${profile.dateBudget}
                  {profile.dateBudget >= 500 ? '+' : ''}
                </Text>
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={25}
                maximumValue={500}
                step={25}
                value={profile.dateBudget}
                onValueChange={(v) => setProfile((p) => ({ ...p, dateBudget: v }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My city</Text>
              <View style={styles.cityInputRow}>
                <MapPin size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.cityInput}
                  placeholder="e.g. Los Angeles, CA"
                  placeholderTextColor={colors.textTertiary}
                  value={profile.homeCity}
                  onChangeText={(t) => setProfile((p) => ({ ...p, homeCity: t }))}
                  autoCapitalize="words"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <>
                  <Check size={18} color={colors.textLight} />
                  <Text style={styles.saveButtonText}>Save profile</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    fontFamily: fonts.display,
    color: colors.textLight,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.display,
    color: colors.text,
    marginBottom: 12,
  },
  budgetText: {
    color: colors.primary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDislike: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textLight,
  },
  venueRow: {
    flexDirection: 'row',
    gap: 10,
  },
  venueCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  venueCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  venueTextSelected: {
    color: colors.textLight,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  cityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  cityInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
