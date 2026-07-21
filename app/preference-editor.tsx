// Paint the Town Preference Sync - Preference Editor Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreferenceSync } from '../hooks/usePreferenceSync';
import {
  PreferenceCategory,
  PreferenceStrength,
  CuisineType,
  ActivityType,
  DiningAmbiance,
  DiningStyle,
  AccommodationType,
  TransportMode,
} from '../types/preferences';
import {
  PREFERENCE_CATEGORIES,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
} from '../mocks/mockPreferenceData';

interface PreferenceEditorScreenProps {
  navigation?: any;
  route?: { params?: { category?: PreferenceCategory } };
  category?: PreferenceCategory;
}

const CUISINE_OPTIONS: CuisineType[] = [
  'italian',
  'japanese',
  'chinese',
  'mexican',
  'indian',
  'thai',
  'french',
  'mediterranean',
  'american',
  'korean',
  'vietnamese',
  'greek',
  'spanish',
  'middle_eastern',
  'seafood',
  'steakhouse',
];

const ACTIVITY_OPTIONS: ActivityType[] = [
  'sightseeing',
  'museums',
  'outdoor_adventure',
  'beach',
  'hiking',
  'water_sports',
  'nightlife',
  'shopping',
  'spa_wellness',
  'cultural',
  'food_drink',
  'entertainment',
  'photography',
  'historical',
  'art',
];

const AMBIANCE_OPTIONS: DiningAmbiance[] = [
  'romantic',
  'lively',
  'quiet',
  'trendy',
  'traditional',
  'outdoor',
  'rooftop',
  'waterfront',
  'cozy',
];

const ACCOMMODATION_OPTIONS: AccommodationType[] = [
  'luxury_hotel',
  'boutique_hotel',
  'resort',
  'vacation_rental',
  'bed_breakfast',
  'apartment',
  'villa',
  'hostel',
];

const TRANSPORT_OPTIONS: TransportMode[] = [
  'walking',
  'public_transit',
  'taxi_rideshare',
  'rental_car',
  'bike',
];

const STRENGTH_OPTIONS: PreferenceStrength[] = [
  'must_have',
  'strong',
  'moderate',
  'slight',
  'neutral',
];

const PreferenceEditorScreen: React.FC<PreferenceEditorScreenProps> = ({
  navigation,
  route,
  category: propCategory,
}) => {
  const category = propCategory || route?.params?.category || 'dining';

  const {
    preferences,
    updatePreference,
    getPreferenceStrength,
    getPreferenceSource,
    getCategoryCompleteness,
  } = usePreferenceSync();

  const [saving, setSaving] = useState(false);
  const [editedPrefs, setEditedPrefs] = useState<any>(preferences?.[category] || {});

  const categoryInfo = useMemo(() => {
    return PREFERENCE_CATEGORIES.find((c) => c.id === category);
  }, [category]);

  const completeness = getCategoryCompleteness(category);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Save each field that was edited
      for (const [field, value] of Object.entries(editedPrefs)) {
        await updatePreference(category, field, value);
      }
      Alert.alert('Saved', 'Your preferences have been updated.');
      navigation?.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences.');
    }
    setSaving(false);
  }, [editedPrefs, category, updatePreference, navigation]);

  const updateField = useCallback((field: string, value: any) => {
    setEditedPrefs((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const toggleArrayItem = useCallback(
    (field: string, item: any, strength: PreferenceStrength = 'moderate') => {
      setEditedPrefs((prev: any) => {
        const current = prev[field] || [];
        const existingIndex = current.findIndex(
          (c: any) => (c.type || c.style || c.mode || c.size) === item
        );

        if (existingIndex >= 0) {
          // Remove item
          return {
            ...prev,
            [field]: current.filter((_: any, i: number) => i !== existingIndex),
          };
        } else {
          // Add item with default key
          const key = field.includes('cuisine')
            ? 'type'
            : field.includes('style')
              ? 'style'
              : field.includes('ambiance')
                ? 'type'
                : field.includes('activity')
                  ? 'type'
                  : field.includes('transport')
                    ? 'mode'
                    : field.includes('accommodation')
                      ? 'type'
                      : field.includes('group')
                        ? 'size'
                        : 'type';
          return {
            ...prev,
            [field]: [...current, { [key]: item, strength }],
          };
        }
      });
    },
    []
  );

  const isItemSelected = useCallback(
    (field: string, item: any): boolean => {
      const current = editedPrefs[field] || [];
      return current.some((c: any) => (c.type || c.style || c.mode || c.size) === item);
    },
    [editedPrefs]
  );

  const getItemStrength = useCallback(
    (field: string, item: any): PreferenceStrength => {
      const current = editedPrefs[field] || [];
      const found = current.find((c: any) => (c.type || c.style || c.mode || c.size) === item);
      return found?.strength || 'neutral';
    },
    [editedPrefs]
  );

  const updateItemStrength = useCallback(
    (field: string, item: any, strength: PreferenceStrength) => {
      setEditedPrefs((prev: any) => {
        const current = prev[field] || [];
        return {
          ...prev,
          [field]: current.map((c: any) => {
            const key = c.type || c.style || c.mode || c.size;
            if (key === item) {
              return { ...c, strength };
            }
            return c;
          }),
        };
      });
    },
    []
  );

  const renderMultiSelect = (
    title: string,
    field: string,
    options: string[],
    showStrength: boolean = true
  ) => (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => {
          const selected = isItemSelected(field, option);
          const strength = getItemStrength(field, option);

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                selected && styles.optionChipSelected,
                selected && { borderColor: STRENGTH_COLORS[strength] },
              ]}
              onPress={() => toggleArrayItem(field, option)}
              onLongPress={() => {
                if (selected && showStrength) {
                  Alert.alert(
                    'Set Preference Strength',
                    `How strongly do you prefer ${formatLabel(option)}?`,
                    STRENGTH_OPTIONS.map((s) => ({
                      text: STRENGTH_LABELS[s],
                      onPress: () => updateItemStrength(field, option, s),
                    }))
                  );
                }
              }}
            >
              <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                {formatLabel(option)}
              </Text>
              {selected && showStrength && (
                <View
                  style={[styles.strengthDot, { backgroundColor: STRENGTH_COLORS[strength] }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {showStrength && (
        <Text style={styles.fieldHint}>Long press a selected item to set preference strength</Text>
      )}
    </View>
  );

  const renderSlider = (
    title: string,
    field: string,
    min: number,
    max: number,
    step: number = 1,
    unit: string = ''
  ) => {
    const value = editedPrefs[field] ?? min;

    return (
      <View style={styles.fieldSection}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => updateField(field, Math.max(min, value - step))}
          >
            <Text style={styles.sliderBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.sliderValue}>
            <Text style={styles.sliderValueText}>
              {value}
              {unit}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sliderBtn}
            onPress={() => updateField(field, Math.min(max, value + step))}
          >
            <Text style={styles.sliderBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRangeSlider = (
    title: string,
    minField: string,
    maxField: string,
    absoluteMin: number,
    absoluteMax: number,
    unit: string = ''
  ) => {
    const minValue = editedPrefs[minField] ?? absoluteMin;
    const maxValue = editedPrefs[maxField] ?? absoluteMax;

    return (
      <View style={styles.fieldSection}>
        <Text style={styles.fieldTitle}>{title}</Text>
        <View style={styles.rangeContainer}>
          <View style={styles.rangeInput}>
            <Text style={styles.rangeLabel}>Min</Text>
            <View style={styles.rangeValue}>
              <TouchableOpacity
                style={styles.rangeBtnSmall}
                onPress={() => updateField(minField, Math.max(absoluteMin, minValue - 1))}
              >
                <Text style={styles.rangeBtnSmallText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.rangeValueText}>
                {minValue}
                {unit}
              </Text>
              <TouchableOpacity
                style={styles.rangeBtnSmall}
                onPress={() => updateField(minField, Math.min(maxValue, minValue + 1))}
              >
                <Text style={styles.rangeBtnSmallText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.rangeSeparator}>to</Text>
          <View style={styles.rangeInput}>
            <Text style={styles.rangeLabel}>Max</Text>
            <View style={styles.rangeValue}>
              <TouchableOpacity
                style={styles.rangeBtnSmall}
                onPress={() => updateField(maxField, Math.max(minValue, maxValue - 1))}
              >
                <Text style={styles.rangeBtnSmallText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.rangeValueText}>
                {maxValue}
                {unit}
              </Text>
              <TouchableOpacity
                style={styles.rangeBtnSmall}
                onPress={() => updateField(maxField, Math.min(absoluteMax, maxValue + 1))}
              >
                <Text style={styles.rangeBtnSmallText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderToggle = (title: string, field: string, description?: string) => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {description && <Text style={styles.toggleDesc}>{description}</Text>}
      </View>
      <Switch
        value={editedPrefs[field] ?? false}
        onValueChange={(value) => updateField(field, value)}
        trackColor={{ false: '#ddd', true: '#667eea' }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderSegmented = (
    title: string,
    field: string,
    options: Array<{ value: string; label: string }>
  ) => (
    <View style={styles.fieldSection}>
      <Text style={styles.fieldTitle}>{title}</Text>
      <View style={styles.segmentedContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segmentedOption,
              editedPrefs[field] === option.value && styles.segmentedOptionSelected,
            ]}
            onPress={() => updateField(field, option.value)}
          >
            <Text
              style={[
                styles.segmentedOptionText,
                editedPrefs[field] === option.value && styles.segmentedOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDiningPreferences = () => (
    <>
      {renderMultiSelect('Favorite Cuisines', 'cuisineTypes', CUISINE_OPTIONS)}
      {renderMultiSelect('Preferred Ambiance', 'ambiance', AMBIANCE_OPTIONS)}
      {renderMultiSelect('Dining Styles', 'diningStyles', [
        'fine_dining',
        'casual',
        'fast_casual',
        'cafe',
        'bistro',
        'food_truck',
      ])}
      {renderRangeSlider('Price Range', 'priceRange.min', 'priceRange.max', 1, 4, '$')}
      {renderSegmented('Reservations', 'reservationPreference', [
        { value: 'always', label: 'Always' },
        { value: 'preferred', label: 'Preferred' },
        { value: 'walk_in', label: 'Walk-in' },
        { value: 'no_preference', label: 'No Pref' },
      ])}
    </>
  );

  const renderActivityPreferences = () => (
    <>
      {renderMultiSelect('Activity Types', 'activityTypes', ACTIVITY_OPTIONS)}
      {renderSegmented('Physical Intensity', 'physicalIntensity.preferred', [
        { value: 'sedentary', label: 'Easy' },
        { value: 'light', label: 'Light' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'vigorous', label: 'Active' },
      ])}
      {renderRangeSlider('Duration', 'duration.minHours', 'duration.maxHours', 0.5, 8, 'h')}
      {renderSegmented('Guided Tours', 'guidedPreference', [
        { value: 'guided', label: 'Guided' },
        { value: 'self_guided', label: 'Self' },
        { value: 'either', label: 'Either' },
      ])}
      {renderToggle('Child Friendly', 'childFriendly', 'Include family-friendly activities')}
      {renderToggle('Pet Friendly', 'petFriendly', 'Include pet-friendly options')}
    </>
  );

  const renderAccommodationPreferences = () => (
    <>
      {renderMultiSelect('Accommodation Types', 'types', ACCOMMODATION_OPTIONS)}
      {renderRangeSlider('Star Rating', 'starRating.min', 'starRating.preferred', 1, 5, '★')}
      {renderMultiSelect(
        'Must-Have Amenities',
        'mustHaveAmenities',
        [
          'wifi',
          'pool',
          'gym',
          'spa',
          'restaurant',
          'parking',
          'kitchen',
          'balcony',
          'breakfast_included',
        ],
        false
      )}
    </>
  );

  const renderTransportationPreferences = () => (
    <>
      {renderMultiSelect('Local Transport', 'localTransport', TRANSPORT_OPTIONS)}
      {renderSlider('Max Walking Distance', 'maxWalkingDistance', 500, 5000, 500, 'm')}
      {renderSegmented('Flight Class', 'flightPreferences.class', [
        { value: 'economy', label: 'Economy' },
        { value: 'premium_economy', label: 'Premium' },
        { value: 'business', label: 'Business' },
        { value: 'first', label: 'First' },
      ])}
      {renderToggle('Direct Flights Only', 'flightPreferences.directFlightsOnly')}
    </>
  );

  const renderBudgetPreferences = () => (
    <>
      {renderSegmented('Overall Budget', 'overallLevel', [
        { value: 'budget', label: 'Budget' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'comfortable', label: 'Comfort' },
        { value: 'luxury', label: 'Luxury' },
      ])}
      {renderRangeSlider('Daily Budget (USD)', 'dailyBudget.min', 'dailyBudget.max', 50, 1000, '$')}
      {renderSegmented('Deal Hunting', 'dealSensitivity', [
        { value: 'always_look', label: 'Always' },
        { value: 'nice_to_have', label: 'Sometimes' },
        { value: 'not_important', label: 'Not Important' },
      ])}
    </>
  );

  const renderTimingPreferences = () => (
    <>
      {renderSegmented('Trip Pacing', 'pacingStyle', [
        { value: 'packed', label: 'Packed' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'relaxed', label: 'Relaxed' },
        { value: 'very_relaxed', label: 'Very Relaxed' },
      ])}
      {renderSegmented('Spontaneity', 'spontaneityLevel', [
        { value: 'fully_planned', label: 'Planned' },
        { value: 'mostly_planned', label: 'Mostly' },
        { value: 'flexible', label: 'Flexible' },
        { value: 'very_spontaneous', label: 'Spontaneous' },
      ])}
      {renderSegmented('Peak Season', 'peakSeasonTolerance', [
        { value: 'avoid', label: 'Avoid' },
        { value: 'tolerate', label: 'Tolerate' },
        { value: 'prefer', label: 'Prefer' },
      ])}
    </>
  );

  const renderAccessibilityPreferences = () => (
    <>
      {renderToggle('Wheelchair Accessible', 'mobilityRequirements.wheelchairAccessible')}
      {renderToggle('Limited Walking', 'mobilityRequirements.limitedWalking')}
      {renderToggle('Elevator Required', 'mobilityRequirements.elevatorRequired')}
      {renderToggle('Quiet Environments', 'sensoryRequirements.quietEnvironments')}
      {renderToggle('Near Medical Facilities', 'dietaryMedical.nearMedicalFacilities')}
      {renderToggle('Service Animal', 'serviceAnimal')}
    </>
  );

  const renderSocialPreferences = () => (
    <>
      {renderSegmented('Travel Style', 'travelStyle', [
        { value: 'solo', label: 'Solo' },
        { value: 'couple', label: 'Couple' },
        { value: 'family', label: 'Family' },
        { value: 'friends', label: 'Friends' },
        { value: 'group', label: 'Group' },
      ])}
      {renderSegmented('Social Interaction', 'socialInteraction', [
        { value: 'very_social', label: 'Social' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'reserved', label: 'Reserved' },
        { value: 'prefer_privacy', label: 'Private' },
      ])}
      {renderSegmented('Local Experiences', 'localInteraction', [
        { value: 'immersive', label: 'Immersive' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'tourist_focused', label: 'Tourist' },
      ])}
    </>
  );

  const renderCategoryContent = () => {
    switch (category) {
      case 'dining':
        return renderDiningPreferences();
      case 'activities':
        return renderActivityPreferences();
      case 'accommodation':
        return renderAccommodationPreferences();
      case 'transportation':
        return renderTransportationPreferences();
      case 'budget':
        return renderBudgetPreferences();
      case 'timing':
        return renderTimingPreferences();
      case 'accessibility':
        return renderAccessibilityPreferences();
      case 'social':
        return renderSocialPreferences();
      default:
        return null;
    }
  };

  const formatLabel = (str: string): string => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#667eea" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{categoryInfo?.icon}</Text>
          <Text style={styles.headerTitle}>{categoryInfo?.name}</Text>
          <Text style={styles.headerSubtitle}>{categoryInfo?.description}</Text>

          <View style={styles.completenessBar}>
            <View style={styles.completenessTrack}>
              <View style={[styles.completenessFill, { width: `${completeness}%` }]} />
            </View>
            <Text style={styles.completenessText}>{completeness}% complete</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCategoryContent()}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {},
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#667eea',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  completenessBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  completenessTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    marginRight: 12,
  },
  completenessFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  completenessText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    width: 90,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldSection: {
    marginBottom: 24,
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e8e8e8',
  },
  optionChipSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#667eea',
  },
  optionChipText: {
    fontSize: 14,
    color: '#666',
  },
  optionChipTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
  },
  sliderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderBtnText: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: '600',
  },
  sliderValue: {
    flex: 1,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  rangeInput: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  rangeValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeBtnSmallText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  rangeValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
    color: '#888',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentedOptionSelected: {
    backgroundColor: '#667eea',
  },
  segmentedOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  segmentedOptionTextSelected: {
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PreferenceEditorScreen;
