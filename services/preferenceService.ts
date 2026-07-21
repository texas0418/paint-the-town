// Paint the Town Preference Sync - Preference Service

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserPreferences,
  PreferenceCategory,
  PreferenceStrength,
  PreferenceSource,
  ConflictResolution,
  SyncStatus,
  Companion,
  PreferenceConflict,
  MergedPreferences,
  SuggestionScore,
  SuggestionMatch,
  SuggestionSettings,
  PreferenceLearningEvent,
  LearningInsight,
  SyncRecord,
  PreferenceExport,
  DiningPreferences,
  ActivityPreferences,
  AccommodationPreferences,
  TransportationPreferences,
  BudgetPreferences,
  TimingPreferences,
  AccessibilityPreferences,
  SocialPreferences,
} from '../types/preferences';

// Storage keys
const STORAGE_KEYS = {
  PREFERENCES: '@w4nder/user_preferences',
  COMPANIONS: '@w4nder/companions',
  MERGED: '@w4nder/merged_preferences',
  LEARNING_EVENTS: '@w4nder/learning_events',
  LEARNING_INSIGHTS: '@w4nder/learning_insights',
  SYNC_HISTORY: '@w4nder/sync_history',
  SUGGESTION_SETTINGS: '@w4nder/suggestion_settings',
};

// Strength weights for scoring
const STRENGTH_WEIGHTS: Record<PreferenceStrength, number> = {
  must_have: 1.0,
  strong: 0.8,
  moderate: 0.5,
  slight: 0.3,
  neutral: 0.1,
};

// Category weights for overall scoring
const CATEGORY_WEIGHTS: Record<PreferenceCategory, number> = {
  dining: 0.15,
  activities: 0.2,
  accommodation: 0.15,
  transportation: 0.1,
  budget: 0.15,
  timing: 0.1,
  accessibility: 0.1,
  social: 0.05,
};

class PreferenceService {
  // ============================================================================
  // PREFERENCE CRUD
  // ============================================================================

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  }

  async savePreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      preferences.version += 1;
      preferences.lastSynced = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      return false;
    }
  }

  async updatePreference(
    category: PreferenceCategory,
    field: string,
    value: any,
    strength: PreferenceStrength = 'moderate',
    source: PreferenceSource = 'explicit'
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences();
      if (!preferences) return false;

      // Update the preference value
      const categoryPrefs = preferences[category] as any;
      if (categoryPrefs && field in categoryPrefs) {
        categoryPrefs[field] = value;
      }

      // Update metadata
      const metadataKey = `${category}.${field}`;
      preferences.metadata[metadataKey] = {
        value,
        strength,
        source,
        confidence: source === 'explicit' ? 1.0 : 0.7,
        lastUpdated: new Date().toISOString(),
      };

      preferences.syncStatus = 'pending';
      return await this.savePreferences(preferences);
    } catch (error) {
      console.error('Error updating preference:', error);
      return false;
    }
  }

  createDefaultPreferences(userId: string): UserPreferences {
    return {
      id: `pref_${Date.now()}`,
      userId,
      version: 1,
      lastSynced: new Date().toISOString(),
      syncStatus: 'synced',

      dining: this.getDefaultDiningPreferences(),
      activities: this.getDefaultActivityPreferences(),
      accommodation: this.getDefaultAccommodationPreferences(),
      transportation: this.getDefaultTransportationPreferences(),
      budget: this.getDefaultBudgetPreferences(),
      timing: this.getDefaultTimingPreferences(),
      accessibility: this.getDefaultAccessibilityPreferences(),
      social: this.getDefaultSocialPreferences(),

      metadata: {},
    };
  }

  // ============================================================================
  // DEFAULT PREFERENCES
  // ============================================================================

  private getDefaultDiningPreferences(): DiningPreferences {
    return {
      cuisineTypes: [
        { type: 'italian', strength: 'moderate' },
        { type: 'japanese', strength: 'moderate' },
        { type: 'american', strength: 'moderate' },
      ],
      dietaryRestrictions: [],
      diningStyles: [{ style: 'casual', strength: 'moderate' }],
      ambiance: [{ type: 'lively', strength: 'slight' }],
      priceRange: { min: 2, max: 3, strength: 'moderate' },
      mealTimes: {
        breakfast: { preferred: true, timeRange: { start: '07:00', end: '09:00' } },
        lunch: { preferred: true, timeRange: { start: '12:00', end: '14:00' } },
        dinner: { preferred: true, timeRange: { start: '18:00', end: '21:00' } },
        brunch: { preferred: false },
      },
      partySize: { typical: 2, max: 6 },
      reservationPreference: 'preferred',
      specialRequests: [],
    };
  }

  private getDefaultActivityPreferences(): ActivityPreferences {
    return {
      activityTypes: [
        { type: 'sightseeing', strength: 'moderate' },
        { type: 'cultural', strength: 'moderate' },
        { type: 'food_drink', strength: 'moderate' },
      ],
      physicalIntensity: {
        min: 'light',
        max: 'moderate',
        preferred: 'light',
      },
      duration: {
        minHours: 1,
        maxHours: 4,
        preferredHours: 2,
      },
      groupSizePreference: [
        { size: 'couple', strength: 'moderate' },
        { size: 'small_group', strength: 'slight' },
      ],
      indoorOutdoor: {
        indoor: 'moderate',
        outdoor: 'moderate',
      },
      guidedPreference: 'either',
      advanceBooking: 'preferred',
      crowdTolerance: 'moderate',
      photoOpportunities: 'moderate',
      childFriendly: false,
      petFriendly: false,
    };
  }

  private getDefaultAccommodationPreferences(): AccommodationPreferences {
    return {
      types: [
        { type: 'boutique_hotel', strength: 'moderate' },
        { type: 'vacation_rental', strength: 'slight' },
      ],
      starRating: { min: 3, preferred: 4 },
      mustHaveAmenities: ['wifi'],
      niceToHaveAmenities: ['gym', 'restaurant'],
      location: {
        centralPreference: 'moderate',
        maxDistanceFromCenter: 5,
        nearTransport: 'moderate',
        quietArea: 'slight',
      },
      roomPreferences: {
        bedType: 'king',
        minSquareMeters: 25,
        floorPreference: 'no_preference',
        viewImportance: 'slight',
      },
      checkInOutFlexibility: 'moderate',
    };
  }

  private getDefaultTransportationPreferences(): TransportationPreferences {
    return {
      localTransport: [
        { mode: 'walking', strength: 'strong' },
        { mode: 'public_transit', strength: 'moderate' },
        { mode: 'taxi_rideshare', strength: 'moderate' },
      ],
      maxWalkingDistance: 2000,
      flightPreferences: {
        class: 'economy',
        seatPreference: 'aisle',
        directFlightsOnly: false,
        maxLayovers: 1,
        maxLayoverDuration: 4,
        preferredAirlines: [],
        avoidAirlines: [],
      },
      carRental: {
        preferred: false,
        vehicleType: 'no_preference',
        automaticOnly: true,
      },
    };
  }

  private getDefaultBudgetPreferences(): BudgetPreferences {
    return {
      overallLevel: 'comfortable',
      dailyBudget: {
        min: 150,
        max: 300,
        currency: 'USD',
      },
      categoryBudgets: {
        accommodation: { percentage: 35, flexibility: 'flexible' },
        dining: { percentage: 25, flexibility: 'flexible' },
        activities: { percentage: 20, flexibility: 'very_flexible' },
        transportation: { percentage: 15, flexibility: 'flexible' },
        shopping: { percentage: 5, flexibility: 'very_flexible' },
      },
      splurgeCategories: ['dining'],
      saveCategories: ['transportation'],
      dealSensitivity: 'nice_to_have',
    };
  }

  private getDefaultTimingPreferences(): TimingPreferences {
    return {
      wakeUpTime: '08:00',
      bedTime: '23:00',
      preferredActivityTimes: [
        { time: 'morning', strength: 'moderate' },
        { time: 'afternoon', strength: 'moderate' },
        { time: 'evening', strength: 'strong' },
      ],
      pacingStyle: 'moderate',
      restDaysFrequency: 'occasionally',
      spontaneityLevel: 'mostly_planned',
      peakSeasonTolerance: 'tolerate',
    };
  }

  private getDefaultAccessibilityPreferences(): AccessibilityPreferences {
    return {
      mobilityRequirements: {
        wheelchairAccessible: false,
        limitedWalking: false,
        maxStairs: 50,
        elevatorRequired: false,
      },
      sensoryRequirements: {
        hearingAccommodations: false,
        visualAccommodations: false,
        quietEnvironments: false,
      },
      dietaryMedical: {
        foodAllergies: [],
        medicationStorage: false,
        nearMedicalFacilities: false,
      },
      serviceAnimal: false,
    };
  }

  private getDefaultSocialPreferences(): SocialPreferences {
    return {
      travelStyle: 'couple',
      socialInteraction: 'moderate',
      localInteraction: 'moderate',
      languageComfort: {
        languages: ['English'],
        needsEnglish: true,
        translationTools: true,
      },
      companionCompatibility: {
        shareAccommodation: true,
        shareActivities: 'most',
        shareMeals: 'most',
        needAloneTime: false,
      },
    };
  }

  // ============================================================================
  // COMPANION MANAGEMENT
  // ============================================================================

  async getCompanions(): Promise<Companion[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting companions:', error);
      return [];
    }
  }

  async saveCompanion(companion: Companion): Promise<boolean> {
    try {
      const companions = await this.getCompanions();
      const existingIndex = companions.findIndex((c) => c.id === companion.id);

      if (existingIndex >= 0) {
        companions[existingIndex] = companion;
      } else {
        companions.push(companion);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.COMPANIONS, JSON.stringify(companions));
      return true;
    } catch (error) {
      console.error('Error saving companion:', error);
      return false;
    }
  }

  async removeCompanion(companionId: string): Promise<boolean> {
    try {
      const companions = await this.getCompanions();
      const filtered = companions.filter((c) => c.id !== companionId);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPANIONS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing companion:', error);
      return false;
    }
  }

  // ============================================================================
  // PREFERENCE MERGING
  // ============================================================================

  async mergePreferences(
    userPreferences: UserPreferences,
    companionPreferences: UserPreferences[],
    companionNames: string[],
    weights?: number[]
  ): Promise<MergedPreferences> {
    const allPreferences = [userPreferences, ...companionPreferences];
    const allNames = ['You', ...companionNames];
    const allWeights = weights || allPreferences.map(() => 1 / allPreferences.length);

    const conflicts: PreferenceConflict[] = [];

    // Merge each category
    const mergedDining = this.mergeDiningPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedActivities = this.mergeActivityPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedAccommodation = this.mergeAccommodationPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedTransportation = this.mergeTransportationPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedBudget = this.mergeBudgetPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedTiming = this.mergeTimingPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );
    const mergedAccessibility = this.mergeAccessibilityPreferences(allPreferences);
    const mergedSocial = this.mergeSocialPreferences(
      allPreferences,
      allNames,
      allWeights,
      conflicts
    );

    const merged: MergedPreferences = {
      id: `merged_${Date.now()}`,
      participants: allPreferences.map((p, i) => ({
        userId: p.userId,
        name: allNames[i],
        weight: allWeights[i],
      })),
      mergedAt: new Date().toISOString(),
      conflicts,
      unresolvedConflicts: conflicts.filter((c) => !c.resolvedValue).length,
      dining: mergedDining,
      activities: mergedActivities,
      accommodation: mergedAccommodation,
      transportation: mergedTransportation,
      budget: mergedBudget,
      timing: mergedTiming,
      accessibility: mergedAccessibility,
      social: mergedSocial,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.MERGED, JSON.stringify(merged));
    return merged;
  }

  private mergeDiningPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<DiningPreferences> {
    // Merge cuisine types - find common preferences
    const cuisineScores = new Map<string, number>();
    allPrefs.forEach((pref, idx) => {
      pref.dining.cuisineTypes.forEach((c) => {
        const current = cuisineScores.get(c.type) || 0;
        cuisineScores.set(c.type, current + STRENGTH_WEIGHTS[c.strength] * weights[idx]);
      });
    });

    const mergedCuisines = Array.from(cuisineScores.entries())
      .filter(([_, score]) => score >= 0.3)
      .map(([type, score]) => ({
        type: type as any,
        strength: this.scoreToStrength(score),
      }));

    // Merge dietary restrictions - union of all
    const allRestrictions = new Set<string>();
    allPrefs.forEach((pref) => {
      pref.dining.dietaryRestrictions.forEach((r) => allRestrictions.add(r));
    });

    // Merge price range - find overlap or detect conflict
    const priceRanges = allPrefs.map((p) => p.dining.priceRange);
    const minMax = Math.max(...priceRanges.map((r) => r.min));
    const maxMin = Math.min(...priceRanges.map((r) => r.max));

    if (minMax > maxMin) {
      // Conflict detected
      conflicts.push({
        id: `conflict_dining_price_${Date.now()}`,
        category: 'dining',
        field: 'priceRange',
        displayName: 'Restaurant Price Range',
        userValue: priceRanges[0],
        userStrength: priceRanges[0].strength,
        companionValue: priceRanges[1],
        companionStrength: priceRanges[1]?.strength || 'moderate',
        companionName: names[1] || 'Companion',
        suggestedResolution: 'average',
      });
    }

    return {
      cuisineTypes: mergedCuisines,
      dietaryRestrictions: Array.from(allRestrictions) as any[],
      priceRange: {
        min: Math.round((minMax + Math.min(...priceRanges.map((r) => r.min))) / 2),
        max: Math.round((maxMin + Math.max(...priceRanges.map((r) => r.max))) / 2),
        strength: 'moderate',
      },
    };
  }

  private mergeActivityPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<ActivityPreferences> {
    // Merge activity types
    const activityScores = new Map<string, number>();
    allPrefs.forEach((pref, idx) => {
      pref.activities.activityTypes.forEach((a) => {
        const current = activityScores.get(a.type) || 0;
        activityScores.set(a.type, current + STRENGTH_WEIGHTS[a.strength] * weights[idx]);
      });
    });

    const mergedActivities = Array.from(activityScores.entries())
      .filter(([_, score]) => score >= 0.3)
      .map(([type, score]) => ({
        type: type as any,
        strength: this.scoreToStrength(score),
      }));

    // Check physical intensity compatibility
    const intensityLevels = ['sedentary', 'light', 'moderate', 'vigorous', 'extreme'];
    const maxIntensities = allPrefs.map((p) =>
      intensityLevels.indexOf(p.activities.physicalIntensity.max)
    );

    if (Math.max(...maxIntensities) - Math.min(...maxIntensities) > 2) {
      conflicts.push({
        id: `conflict_activity_intensity_${Date.now()}`,
        category: 'activities',
        field: 'physicalIntensity',
        displayName: 'Activity Intensity',
        userValue: allPrefs[0].activities.physicalIntensity,
        userStrength: 'moderate',
        companionValue: allPrefs[1]?.activities.physicalIntensity,
        companionStrength: 'moderate',
        companionName: names[1] || 'Companion',
        suggestedResolution: 'average',
      });
    }

    return {
      activityTypes: mergedActivities,
      physicalIntensity: {
        min: intensityLevels[
          Math.max(
            ...allPrefs.map((p) => intensityLevels.indexOf(p.activities.physicalIntensity.min))
          )
        ] as any,
        max: intensityLevels[
          Math.min(
            ...allPrefs.map((p) => intensityLevels.indexOf(p.activities.physicalIntensity.max))
          )
        ] as any,
        preferred: 'moderate',
      },
      childFriendly: allPrefs.some((p) => p.activities.childFriendly),
      petFriendly: allPrefs.some((p) => p.activities.petFriendly),
    };
  }

  private mergeAccommodationPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<AccommodationPreferences> {
    // Must-have amenities - union
    const mustHave = new Set<string>();
    allPrefs.forEach((p) => p.accommodation.mustHaveAmenities.forEach((a) => mustHave.add(a)));

    // Star rating - highest minimum
    const minStars = Math.max(...allPrefs.map((p) => p.accommodation.starRating.min));

    return {
      mustHaveAmenities: Array.from(mustHave) as any[],
      starRating: {
        min: minStars,
        preferred: Math.max(...allPrefs.map((p) => p.accommodation.starRating.preferred)),
      },
    };
  }

  private mergeTransportationPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<TransportationPreferences> {
    // Walking distance - minimum (most restrictive)
    const minWalking = Math.min(...allPrefs.map((p) => p.transportation.maxWalkingDistance));

    return {
      maxWalkingDistance: minWalking,
    };
  }

  private mergeBudgetPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<BudgetPreferences> {
    const budgets = allPrefs.map((p) => p.budget.dailyBudget);

    // Check for significant budget mismatch
    const maxBudget = Math.max(...budgets.map((b) => b.max));
    const minBudget = Math.min(...budgets.map((b) => b.max));

    if (maxBudget / minBudget > 2) {
      conflicts.push({
        id: `conflict_budget_daily_${Date.now()}`,
        category: 'budget',
        field: 'dailyBudget',
        displayName: 'Daily Budget',
        userValue: budgets[0],
        userStrength: 'strong',
        companionValue: budgets[1],
        companionStrength: 'strong',
        companionName: names[1] || 'Companion',
        suggestedResolution: 'manual',
      });
    }

    return {
      dailyBudget: {
        min: Math.round(budgets.reduce((sum, b) => sum + b.min, 0) / budgets.length),
        max: Math.round(budgets.reduce((sum, b) => sum + b.max, 0) / budgets.length),
        currency: budgets[0].currency,
      },
    };
  }

  private mergeTimingPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<TimingPreferences> {
    // Pacing style - most relaxed wins
    const pacingOrder = ['packed', 'moderate', 'relaxed', 'very_relaxed'];
    const mostRelaxed = Math.max(...allPrefs.map((p) => pacingOrder.indexOf(p.timing.pacingStyle)));

    return {
      pacingStyle: pacingOrder[mostRelaxed] as any,
    };
  }

  private mergeAccessibilityPreferences(allPrefs: UserPreferences[]): AccessibilityPreferences {
    // Always union - if anyone needs accessibility, include it
    return {
      mobilityRequirements: {
        wheelchairAccessible: allPrefs.some(
          (p) => p.accessibility.mobilityRequirements.wheelchairAccessible
        ),
        limitedWalking: allPrefs.some((p) => p.accessibility.mobilityRequirements.limitedWalking),
        maxStairs: Math.min(...allPrefs.map((p) => p.accessibility.mobilityRequirements.maxStairs)),
        elevatorRequired: allPrefs.some(
          (p) => p.accessibility.mobilityRequirements.elevatorRequired
        ),
      },
      sensoryRequirements: {
        hearingAccommodations: allPrefs.some(
          (p) => p.accessibility.sensoryRequirements.hearingAccommodations
        ),
        visualAccommodations: allPrefs.some(
          (p) => p.accessibility.sensoryRequirements.visualAccommodations
        ),
        quietEnvironments: allPrefs.some(
          (p) => p.accessibility.sensoryRequirements.quietEnvironments
        ),
      },
      dietaryMedical: {
        foodAllergies: [
          ...new Set(allPrefs.flatMap((p) => p.accessibility.dietaryMedical.foodAllergies)),
        ],
        medicationStorage: allPrefs.some((p) => p.accessibility.dietaryMedical.medicationStorage),
        nearMedicalFacilities: allPrefs.some(
          (p) => p.accessibility.dietaryMedical.nearMedicalFacilities
        ),
      },
      serviceAnimal: allPrefs.some((p) => p.accessibility.serviceAnimal),
    };
  }

  private mergeSocialPreferences(
    allPrefs: UserPreferences[],
    names: string[],
    weights: number[],
    conflicts: PreferenceConflict[]
  ): Partial<SocialPreferences> {
    return {
      travelStyle: allPrefs.length > 2 ? 'group' : 'couple',
    };
  }

  private scoreToStrength(score: number): PreferenceStrength {
    if (score >= 0.9) return 'must_have';
    if (score >= 0.7) return 'strong';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'slight';
    return 'neutral';
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedValue?: any
  ): Promise<boolean> {
    try {
      const mergedData = await AsyncStorage.getItem(STORAGE_KEYS.MERGED);
      if (!mergedData) return false;

      const merged: MergedPreferences = JSON.parse(mergedData);
      const conflict = merged.conflicts.find((c) => c.id === conflictId);

      if (!conflict) return false;

      // Apply resolution
      switch (resolution) {
        case 'user_wins':
          conflict.resolvedValue = conflict.userValue;
          break;
        case 'companion_wins':
          conflict.resolvedValue = conflict.companionValue;
          break;
        case 'average':
          conflict.resolvedValue = this.calculateAverage(
            conflict.userValue,
            conflict.companionValue
          );
          break;
        case 'manual':
          conflict.resolvedValue = resolvedValue;
          break;
        default:
          conflict.resolvedValue = resolvedValue || conflict.userValue;
      }

      conflict.resolvedBy = 'user';
      merged.unresolvedConflicts = merged.conflicts.filter((c) => !c.resolvedValue).length;

      await AsyncStorage.setItem(STORAGE_KEYS.MERGED, JSON.stringify(merged));
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  }

  private calculateAverage(value1: any, value2: any): any {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.round((value1 + value2) / 2);
    }
    if (value1?.min !== undefined && value1?.max !== undefined) {
      return {
        min: Math.round((value1.min + (value2?.min || value1.min)) / 2),
        max: Math.round((value1.max + (value2?.max || value1.max)) / 2),
      };
    }
    return value1;
  }

  // ============================================================================
  // SUGGESTION SCORING
  // ============================================================================

  async getSuggestionSettings(): Promise<SuggestionSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SUGGESTION_SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSuggestionSettings();
    } catch (error) {
      return this.getDefaultSuggestionSettings();
    }
  }

  async saveSuggestionSettings(settings: SuggestionSettings): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTION_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving suggestion settings:', error);
      return false;
    }
  }

  private getDefaultSuggestionSettings(): SuggestionSettings {
    return {
      enablePersonalization: true,
      strictFiltering: false,
      showScores: true,
      minScore: 40,
      prioritizeNewExperiences: true,
      balanceCategories: true,
    };
  }

  scoreRestaurant(
    restaurant: any,
    preferences: UserPreferences | MergedPreferences
  ): SuggestionScore {
    const matches: SuggestionMatch[] = [];
    const dining = 'dining' in preferences ? preferences.dining : null;

    if (!dining) {
      return this.createEmptyScore(restaurant.id, 'restaurant');
    }

    // Score cuisine match
    const cuisineMatch = this.scoreCuisineMatch(restaurant.cuisine, dining.cuisineTypes || []);
    matches.push(cuisineMatch);

    // Score price match
    const priceMatch = this.scorePriceMatch(restaurant.priceLevel, dining.priceRange);
    matches.push(priceMatch);

    // Score ambiance match
    const ambianceMatch = this.scoreAmbianceMatch(restaurant.ambiance, dining.ambiance || []);
    matches.push(ambianceMatch);

    // Score dietary compatibility
    const dietaryMatch = this.scoreDietaryMatch(
      restaurant.dietaryOptions || [],
      dining.dietaryRestrictions || []
    );
    matches.push(dietaryMatch);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(matches);

    return {
      itemId: restaurant.id,
      itemType: 'restaurant',
      overallScore,
      matchBreakdown: matches,
      topMatches: matches.filter((m) => m.score >= 80).map((m) => m.displayName),
      potentialIssues: matches.filter((m) => m.score < 40).map((m) => m.displayName),
      personalized: true,
      confidence: 0.85,
    };
  }

  scoreActivity(activity: any, preferences: UserPreferences | MergedPreferences): SuggestionScore {
    const matches: SuggestionMatch[] = [];
    const activities = 'activities' in preferences ? preferences.activities : null;

    if (!activities) {
      return this.createEmptyScore(activity.id, 'activity');
    }

    // Score activity type match
    const typeMatch = this.scoreActivityTypeMatch(activity.type, activities.activityTypes || []);
    matches.push(typeMatch);

    // Score intensity match
    const intensityMatch = this.scoreIntensityMatch(
      activity.intensity,
      activities.physicalIntensity
    );
    matches.push(intensityMatch);

    // Score duration match
    const durationMatch = this.scoreDurationMatch(activity.duration, activities.duration);
    matches.push(durationMatch);

    const overallScore = this.calculateOverallScore(matches);

    return {
      itemId: activity.id,
      itemType: 'activity',
      overallScore,
      matchBreakdown: matches,
      topMatches: matches.filter((m) => m.score >= 80).map((m) => m.displayName),
      potentialIssues: matches.filter((m) => m.score < 40).map((m) => m.displayName),
      personalized: true,
      confidence: 0.8,
    };
  }

  private scoreCuisineMatch(restaurantCuisine: string, userCuisines: any[]): SuggestionMatch {
    const match = userCuisines.find(
      (c) => c.type.toLowerCase() === restaurantCuisine?.toLowerCase()
    );

    return {
      field: 'cuisineTypes',
      displayName: 'Cuisine',
      matchType: match ? 'exact' : 'no_match',
      userPreference: userCuisines.map((c) => c.type),
      itemValue: restaurantCuisine,
      score: match ? STRENGTH_WEIGHTS[match.strength] * 100 : 30,
      weight: 0.3,
    };
  }

  private scorePriceMatch(restaurantPrice: number, userPrice: any): SuggestionMatch {
    if (!userPrice) {
      return {
        field: 'priceRange',
        displayName: 'Price',
        matchType: 'no_match',
        userPreference: null,
        itemValue: restaurantPrice,
        score: 50,
        weight: 0.2,
      };
    }

    const inRange = restaurantPrice >= userPrice.min && restaurantPrice <= userPrice.max;
    const nearRange = restaurantPrice >= userPrice.min - 1 && restaurantPrice <= userPrice.max + 1;

    return {
      field: 'priceRange',
      displayName: 'Price',
      matchType: inRange ? 'exact' : nearRange ? 'partial' : 'no_match',
      userPreference: userPrice,
      itemValue: restaurantPrice,
      score: inRange ? 100 : nearRange ? 60 : 20,
      weight: 0.2,
    };
  }

  private scoreAmbianceMatch(restaurantAmbiance: string, userAmbiance: any[]): SuggestionMatch {
    const match = userAmbiance.find(
      (a) => a.type.toLowerCase() === restaurantAmbiance?.toLowerCase()
    );

    return {
      field: 'ambiance',
      displayName: 'Ambiance',
      matchType: match ? 'exact' : 'no_match',
      userPreference: userAmbiance.map((a) => a.type),
      itemValue: restaurantAmbiance,
      score: match ? STRENGTH_WEIGHTS[match.strength] * 100 : 40,
      weight: 0.15,
    };
  }

  private scoreDietaryMatch(
    restaurantOptions: string[],
    userRestrictions: string[]
  ): SuggestionMatch {
    if (userRestrictions.length === 0) {
      return {
        field: 'dietaryRestrictions',
        displayName: 'Dietary',
        matchType: 'exact',
        userPreference: [],
        itemValue: restaurantOptions,
        score: 100,
        weight: 0.35,
      };
    }

    const met = userRestrictions.filter((r) =>
      restaurantOptions.some((o) => o.toLowerCase().includes(r.toLowerCase()))
    );
    const metPercentage = met.length / userRestrictions.length;

    return {
      field: 'dietaryRestrictions',
      displayName: 'Dietary',
      matchType: metPercentage === 1 ? 'exact' : metPercentage > 0 ? 'partial' : 'no_match',
      userPreference: userRestrictions,
      itemValue: restaurantOptions,
      score: metPercentage * 100,
      weight: 0.35,
    };
  }

  private scoreActivityTypeMatch(activityType: string, userTypes: any[]): SuggestionMatch {
    const match = userTypes.find((t) => t.type.toLowerCase() === activityType?.toLowerCase());

    return {
      field: 'activityTypes',
      displayName: 'Activity Type',
      matchType: match ? 'exact' : 'no_match',
      userPreference: userTypes.map((t) => t.type),
      itemValue: activityType,
      score: match ? STRENGTH_WEIGHTS[match.strength] * 100 : 30,
      weight: 0.4,
    };
  }

  private scoreIntensityMatch(activityIntensity: string, userIntensity: any): SuggestionMatch {
    if (!userIntensity) {
      return {
        field: 'physicalIntensity',
        displayName: 'Intensity',
        matchType: 'no_match',
        userPreference: null,
        itemValue: activityIntensity,
        score: 50,
        weight: 0.3,
      };
    }

    const levels = ['sedentary', 'light', 'moderate', 'vigorous', 'extreme'];
    const activityLevel = levels.indexOf(activityIntensity);
    const minLevel = levels.indexOf(userIntensity.min);
    const maxLevel = levels.indexOf(userIntensity.max);

    const inRange = activityLevel >= minLevel && activityLevel <= maxLevel;

    return {
      field: 'physicalIntensity',
      displayName: 'Intensity',
      matchType: inRange ? 'exact' : 'no_match',
      userPreference: userIntensity,
      itemValue: activityIntensity,
      score: inRange
        ? 100
        : Math.max(0, 100 - Math.abs(activityLevel - (minLevel + maxLevel) / 2) * 30),
      weight: 0.3,
    };
  }

  private scoreDurationMatch(activityDuration: number, userDuration: any): SuggestionMatch {
    if (!userDuration) {
      return {
        field: 'duration',
        displayName: 'Duration',
        matchType: 'no_match',
        userPreference: null,
        itemValue: activityDuration,
        score: 50,
        weight: 0.3,
      };
    }

    const inRange =
      activityDuration >= userDuration.minHours && activityDuration <= userDuration.maxHours;
    const nearPreferred = Math.abs(activityDuration - userDuration.preferredHours) <= 1;

    return {
      field: 'duration',
      displayName: 'Duration',
      matchType: inRange && nearPreferred ? 'exact' : inRange ? 'partial' : 'no_match',
      userPreference: userDuration,
      itemValue: activityDuration,
      score: nearPreferred ? 100 : inRange ? 70 : 30,
      weight: 0.3,
    };
  }

  private calculateOverallScore(matches: SuggestionMatch[]): number {
    const totalWeight = matches.reduce((sum, m) => sum + m.weight, 0);
    const weightedSum = matches.reduce((sum, m) => sum + m.score * m.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private createEmptyScore(itemId: string, itemType: any): SuggestionScore {
    return {
      itemId,
      itemType,
      overallScore: 50,
      matchBreakdown: [],
      topMatches: [],
      potentialIssues: [],
      personalized: false,
      confidence: 0,
    };
  }

  // ============================================================================
  // PREFERENCE LEARNING
  // ============================================================================

  async recordLearningEvent(
    event: Omit<PreferenceLearningEvent, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      const eventsData = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_EVENTS);
      const events: PreferenceLearningEvent[] = eventsData ? JSON.parse(eventsData) : [];

      const newEvent: PreferenceLearningEvent = {
        ...event,
        id: `event_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };

      events.push(newEvent);

      // Keep last 500 events
      const trimmedEvents = events.slice(-500);
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_EVENTS, JSON.stringify(trimmedEvents));

      // Generate insights from recent events
      await this.generateInsights(trimmedEvents);
    } catch (error) {
      console.error('Error recording learning event:', error);
    }
  }

  private async generateInsights(events: PreferenceLearningEvent[]): Promise<void> {
    const insights: LearningInsight[] = [];
    const recentEvents = events.filter(
      (e) => new Date(e.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Analyze booking patterns
    const bookings = recentEvents.filter((e) => e.eventType === 'booking');
    if (bookings.length >= 3) {
      // Check for cuisine patterns
      const cuisineCounts = new Map<string, number>();
      bookings.forEach((b) => {
        if (b.itemType === 'restaurant' && b.itemAttributes.cuisine) {
          const count = cuisineCounts.get(b.itemAttributes.cuisine) || 0;
          cuisineCounts.set(b.itemAttributes.cuisine, count + 1);
        }
      });

      const topCuisine = Array.from(cuisineCounts.entries()).sort((a, b) => b[1] - a[1])[0];

      if (topCuisine && topCuisine[1] >= 3) {
        insights.push({
          id: `insight_cuisine_${Date.now()}`,
          category: 'dining',
          insight: `You've booked ${topCuisine[0]} restaurants ${topCuisine[1]} times recently`,
          confidence: 0.8,
          basedOn: bookings.map((b) => b.id),
          suggestedUpdate: {
            field: 'cuisineTypes',
            currentValue: null,
            suggestedValue: { type: topCuisine[0], strength: 'strong' },
            reason: 'Based on your recent bookings',
          },
          status: 'pending',
        });
      }
    }

    // Analyze ratings
    const ratings = recentEvents.filter((e) => e.eventType === 'rating');
    const highRatings = ratings.filter((r) => (r.userAction.value || 0) >= 4);

    if (highRatings.length >= 3) {
      // Check for activity type patterns in high ratings
      const activityCounts = new Map<string, number>();
      highRatings.forEach((r) => {
        if (r.itemType === 'activity' && r.itemAttributes.type) {
          const count = activityCounts.get(r.itemAttributes.type) || 0;
          activityCounts.set(r.itemAttributes.type, count + 1);
        }
      });

      const topActivity = Array.from(activityCounts.entries()).sort((a, b) => b[1] - a[1])[0];

      if (topActivity && topActivity[1] >= 2) {
        insights.push({
          id: `insight_activity_${Date.now()}`,
          category: 'activities',
          insight: `You consistently rate ${topActivity[0]} activities highly`,
          confidence: 0.75,
          basedOn: highRatings.map((r) => r.id),
          suggestedUpdate: {
            field: 'activityTypes',
            currentValue: null,
            suggestedValue: { type: topActivity[0], strength: 'strong' },
            reason: 'Based on your ratings',
          },
          status: 'pending',
        });
      }
    }

    // Save insights
    if (insights.length > 0) {
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_INSIGHTS);
      const existing: LearningInsight[] = existingData ? JSON.parse(existingData) : [];
      const combined = [...existing.filter((e) => e.status !== 'pending'), ...insights];
      await AsyncStorage.setItem(
        STORAGE_KEYS.LEARNING_INSIGHTS,
        JSON.stringify(combined.slice(-50))
      );
    }
  }

  async getLearningInsights(): Promise<LearningInsight[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_INSIGHTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async applyInsight(insightId: string): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_INSIGHTS);
      const insights: LearningInsight[] = data ? JSON.parse(data) : [];
      const insight = insights.find((i) => i.id === insightId);

      if (!insight) return false;

      // Apply the suggested update
      await this.updatePreference(
        insight.category,
        insight.suggestedUpdate.field,
        insight.suggestedUpdate.suggestedValue,
        'strong',
        'inferred'
      );

      // Update insight status
      insight.status = 'accepted';
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_INSIGHTS, JSON.stringify(insights));

      return true;
    } catch (error) {
      console.error('Error applying insight:', error);
      return false;
    }
  }

  async rejectInsight(insightId: string): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_INSIGHTS);
      const insights: LearningInsight[] = data ? JSON.parse(data) : [];
      const insight = insights.find((i) => i.id === insightId);

      if (!insight) return false;

      insight.status = 'rejected';
      await AsyncStorage.setItem(STORAGE_KEYS.LEARNING_INSIGHTS, JSON.stringify(insights));

      return true;
    } catch (error) {
      console.error('Error rejecting insight:', error);
      return false;
    }
  }

  // ============================================================================
  // SYNC
  // ============================================================================

  async syncPreferences(): Promise<SyncRecord> {
    const record: SyncRecord = {
      id: `sync_${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'upload',
      status: 'success',
      changesApplied: 0,
      conflicts: 0,
      deviceId: 'local_device',
      deviceName: 'This Device',
    };

    try {
      const preferences = await this.getPreferences();
      if (preferences) {
        // In real app, this would sync to server
        // For now, just update sync status
        preferences.syncStatus = 'synced';
        preferences.lastSynced = new Date().toISOString();
        await this.savePreferences(preferences);
        record.changesApplied = 1;
      }

      // Save sync record
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
      const history: SyncRecord[] = historyData ? JSON.parse(historyData) : [];
      history.push(record);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(history.slice(-20)));
    } catch (error) {
      record.status = 'failed';
      console.error('Sync error:', error);
    }

    return record;
  }

  async getSyncHistory(): Promise<SyncRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  // ============================================================================
  // EXPORT / IMPORT
  // ============================================================================

  async exportPreferences(): Promise<PreferenceExport | null> {
    try {
      const preferences = await this.getPreferences();
      const companions = await this.getCompanions();
      const eventsData = await AsyncStorage.getItem(STORAGE_KEYS.LEARNING_EVENTS);
      const events = eventsData ? JSON.parse(eventsData) : [];

      if (!preferences) return null;

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userId: preferences.userId,
        preferences,
        companions,
        learningHistory: events,
      };
    } catch (error) {
      console.error('Error exporting preferences:', error);
      return null;
    }
  }

  async importPreferences(exportData: PreferenceExport): Promise<boolean> {
    try {
      await this.savePreferences(exportData.preferences);

      for (const companion of exportData.companions) {
        await this.saveCompanion(companion);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.LEARNING_EVENTS,
        JSON.stringify(exportData.learningHistory)
      );

      return true;
    } catch (error) {
      console.error('Error importing preferences:', error);
      return false;
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key)));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
}

export const preferenceService = new PreferenceService();
