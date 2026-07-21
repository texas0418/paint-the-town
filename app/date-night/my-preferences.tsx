import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  ArrowLeft,
  Check,
  Utensils,
  Activity,
  Sun,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useDateNight } from '@/contexts/DateNightContext';
import {
  CuisineType,
  DietaryRestriction,
  ActivityType,
  EnvironmentPreference,
  TimeOfDay,
  BudgetTier,
  DatePreferences,
} from '@/types/date-night';

const cuisineOptions: { value: CuisineType; label: string }[] = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'indian', label: 'Indian' },
  { value: 'thai', label: 'Thai' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'korean', label: 'Korean' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'greek', label: 'Greek' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'caribbean', label: 'Caribbean' },
];

const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
  { value: 'none', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
];

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'romantic', label: 'Romantic', emoji: '💕' },
  { value: 'adventurous', label: 'Adventurous', emoji: '🎢' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'creative', label: 'Creative', emoji: '🎨' },
  { value: 'active', label: 'Active', emoji: '🏃' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'social', label: 'Social', emoji: '🎉' },
  { value: 'intimate', label: 'Intimate', emoji: '🕯️' },
];

const environmentOptions: { value: EnvironmentPreference; label: string }[] = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'both', label: 'Both' },
];

const timeOptions: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
  { value: 'all-day', label: 'All Day' },
];

const budgetOptions: { value: BudgetTier; label: string; description: string }[] = [
  { value: '$', label: '$', description: 'Budget-friendly' },
  { value: '$$', label: '$$', description: 'Moderate' },
  { value: '$$$', label: '$$$', description: 'Upscale' },
  { value: '$$$$', label: '$$$$', description: 'Luxury' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function MyPreferencesScreen() {
  const router = useRouter();
  const { userProfile, setUserPreferences } = useDateNight();

  const [preferences, setPreferences] = useState<DatePreferences>(
    userProfile?.preferences || {
      cuisineTypes: [],
      dietaryRestrictions: ['none'],
      activityTypes: [],
      environmentPreference: 'both',
      preferredTimeOfDay: ['evening'],
      maxTravelDistance: 25,
      budgetTier: '$$',
    }
  );

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const handleSave = () => {
    if (preferences.activityTypes.length === 0) {
      Alert.alert('Select Activities', 'Please select at least one activity type.');
      return;
    }
    setUserPreferences(preferences);
    Alert.alert('Saved!', 'Your preferences have been updated.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.textLight} />
          </Pressable>
          <Text style={styles.headerTitle}>My Preferences</Text>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Check size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Activity Types */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Activity Preferences</Text>
            </View>
            <Text style={styles.sectionDescription}>What types of activities do you enjoy?</Text>
            <View style={styles.chipsContainer}>
              {activityOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.chip,
                    preferences.activityTypes.includes(option.value) && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      activityTypes: toggleArrayItem(prev.activityTypes, option.value),
                    }))
                  }
                >
                  <Text style={styles.chipEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      preferences.activityTypes.includes(option.value) && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cuisine Types */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Utensils size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
            </View>
            <Text style={styles.sectionDescription}>What cuisines do you enjoy?</Text>
            <View style={styles.chipsContainer}>
              {cuisineOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.chipSmall,
                    preferences.cuisineTypes.includes(option.value) && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      cuisineTypes: toggleArrayItem(prev.cuisineTypes, option.value),
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      preferences.cuisineTypes.includes(option.value) && styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Dietary Restrictions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Utensils size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
            </View>
            <View style={styles.chipsContainer}>
              {dietaryOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.chipSmall,
                    preferences.dietaryRestrictions.includes(option.value) && styles.chipSelected,
                  ]}
                  onPress={() => {
                    if (option.value === 'none') {
                      setPreferences((prev) => ({
                        ...prev,
                        dietaryRestrictions: ['none'],
                      }));
                    } else {
                      setPreferences((prev) => ({
                        ...prev,
                        dietaryRestrictions: toggleArrayItem(
                          prev.dietaryRestrictions.filter((d) => d !== 'none'),
                          option.value
                        ),
                      }));
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      preferences.dietaryRestrictions.includes(option.value) &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Environment */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sun size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Environment</Text>
            </View>
            <View style={styles.segmentedControl}>
              {environmentOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.segmentButton,
                    preferences.environmentPreference === option.value &&
                      styles.segmentButtonSelected,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      environmentPreference: option.value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      preferences.environmentPreference === option.value &&
                        styles.segmentTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Time of Day */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Preferred Time</Text>
            </View>
            <View style={styles.chipsContainer}>
              {timeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.chipSmall,
                    preferences.preferredTimeOfDay.includes(option.value) && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      preferredTimeOfDay: toggleArrayItem(prev.preferredTimeOfDay, option.value),
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      preferences.preferredTimeOfDay.includes(option.value) &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Travel Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Max Travel Distance</Text>
            </View>
            <Text style={styles.distanceValue}>{preferences.maxTravelDistance} miles</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={50}
              step={5}
              value={preferences.maxTravelDistance}
              onValueChange={(value) =>
                setPreferences((prev) => ({
                  ...prev,
                  maxTravelDistance: value,
                }))
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>5 mi</Text>
              <Text style={styles.sliderLabel}>50 mi</Text>
            </View>
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Budget Preference</Text>
            </View>
            <View style={styles.budgetContainer}>
              {budgetOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.budgetOption,
                    preferences.budgetTier === option.value && styles.budgetOptionSelected,
                  ]}
                  onPress={() =>
                    setPreferences((prev) => ({
                      ...prev,
                      budgetTier: option.value,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.budgetLabel,
                      preferences.budgetTier === option.value && styles.budgetLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.budgetDescription,
                      preferences.budgetTier === option.value && styles.budgetDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.saveButtonLarge} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textLight,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textLight,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentButtonSelected: {
    backgroundColor: colors.surface,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.primary,
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  budgetContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  budgetOption: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  budgetOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  budgetLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  budgetLabelSelected: {
    color: colors.primary,
  },
  budgetDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  budgetDescriptionSelected: {
    color: colors.primary,
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  saveButtonLarge: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textLight,
  },
});
