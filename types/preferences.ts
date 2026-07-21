// Paint the Town Preference Sync - Type Definitions

// ============================================================================
// CORE PREFERENCE TYPES
// ============================================================================

export type PreferenceCategory =
  | 'dining'
  | 'activities'
  | 'accommodation'
  | 'transportation'
  | 'budget'
  | 'timing'
  | 'accessibility'
  | 'social';

export type PreferenceSource =
  | 'explicit' // User directly set
  | 'inferred' // Learned from behavior
  | 'imported' // From external service
  | 'companion' // From travel companion
  | 'default'; // System default

export type PreferenceStrength =
  | 'must_have' // Non-negotiable
  | 'strong' // Highly preferred
  | 'moderate' // Nice to have
  | 'slight' // Minor preference
  | 'neutral'; // No preference

export type ConflictResolution =
  | 'user_wins' // Current user preference takes priority
  | 'companion_wins' // Companion preference takes priority
  | 'strongest_wins' // Highest strength preference wins
  | 'average' // Find middle ground
  | 'either' // Accept either option
  | 'manual'; // Requires user decision

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'conflict' | 'offline' | 'error';

// ============================================================================
// DINING PREFERENCES
// ============================================================================

export type CuisineType =
  | 'italian'
  | 'japanese'
  | 'chinese'
  | 'mexican'
  | 'indian'
  | 'thai'
  | 'french'
  | 'mediterranean'
  | 'american'
  | 'korean'
  | 'vietnamese'
  | 'greek'
  | 'spanish'
  | 'middle_eastern'
  | 'brazilian'
  | 'ethiopian'
  | 'caribbean'
  | 'fusion'
  | 'seafood'
  | 'steakhouse'
  | 'vegetarian'
  | 'vegan'
  | 'other';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'shellfish_free'
  | 'halal'
  | 'kosher'
  | 'low_sodium'
  | 'low_sugar'
  | 'keto'
  | 'paleo';

export type DiningStyle =
  | 'fine_dining'
  | 'casual'
  | 'fast_casual'
  | 'cafe'
  | 'bistro'
  | 'food_truck'
  | 'buffet'
  | 'family_style'
  | 'tasting_menu'
  | 'counter_service';

export type DiningAmbiance =
  | 'romantic'
  | 'lively'
  | 'quiet'
  | 'trendy'
  | 'traditional'
  | 'outdoor'
  | 'rooftop'
  | 'waterfront'
  | 'scenic_view'
  | 'cozy';

export interface DiningPreferences {
  cuisineTypes: Array<{ type: CuisineType; strength: PreferenceStrength }>;
  dietaryRestrictions: DietaryRestriction[];
  diningStyles: Array<{ style: DiningStyle; strength: PreferenceStrength }>;
  ambiance: Array<{ type: DiningAmbiance; strength: PreferenceStrength }>;
  priceRange: {
    min: number; // 1-4 ($-$$$$)
    max: number;
    strength: PreferenceStrength;
  };
  mealTimes: {
    breakfast: { preferred: boolean; timeRange?: { start: string; end: string } };
    lunch: { preferred: boolean; timeRange?: { start: string; end: string } };
    dinner: { preferred: boolean; timeRange?: { start: string; end: string } };
    brunch: { preferred: boolean; timeRange?: { start: string; end: string } };
  };
  partySize: {
    typical: number;
    max: number;
  };
  reservationPreference: 'always' | 'preferred' | 'walk_in' | 'no_preference';
  specialRequests: string[];
}

// ============================================================================
// ACTIVITY PREFERENCES
// ============================================================================

export type ActivityType =
  | 'sightseeing'
  | 'museums'
  | 'outdoor_adventure'
  | 'beach'
  | 'hiking'
  | 'water_sports'
  | 'nightlife'
  | 'shopping'
  | 'spa_wellness'
  | 'cultural'
  | 'sports'
  | 'tours'
  | 'food_drink'
  | 'entertainment'
  | 'photography'
  | 'wildlife'
  | 'historical'
  | 'art'
  | 'music'
  | 'festivals'
  | 'local_experiences'
  | 'classes_workshops';

export type PhysicalIntensity = 'sedentary' | 'light' | 'moderate' | 'vigorous' | 'extreme';

export type GroupSize =
  | 'solo'
  | 'couple'
  | 'small_group' // 3-6
  | 'medium_group' // 7-15
  | 'large_group'; // 16+

export interface ActivityPreferences {
  activityTypes: Array<{ type: ActivityType; strength: PreferenceStrength }>;
  physicalIntensity: {
    min: PhysicalIntensity;
    max: PhysicalIntensity;
    preferred: PhysicalIntensity;
  };
  duration: {
    minHours: number;
    maxHours: number;
    preferredHours: number;
  };
  groupSizePreference: Array<{ size: GroupSize; strength: PreferenceStrength }>;
  indoorOutdoor: {
    indoor: PreferenceStrength;
    outdoor: PreferenceStrength;
  };
  guidedPreference: 'guided' | 'self_guided' | 'either';
  advanceBooking: 'required' | 'preferred' | 'spontaneous' | 'no_preference';
  crowdTolerance: 'avoid_crowds' | 'moderate' | 'dont_mind' | 'enjoy_crowds';
  photoOpportunities: PreferenceStrength;
  childFriendly: boolean;
  petFriendly: boolean;
}

// ============================================================================
// ACCOMMODATION PREFERENCES
// ============================================================================

export type AccommodationType =
  | 'luxury_hotel'
  | 'boutique_hotel'
  | 'business_hotel'
  | 'resort'
  | 'bed_breakfast'
  | 'vacation_rental'
  | 'hostel'
  | 'apartment'
  | 'villa'
  | 'cabin'
  | 'glamping'
  | 'camping';

export type AccommodationAmenity =
  | 'wifi'
  | 'pool'
  | 'gym'
  | 'spa'
  | 'restaurant'
  | 'bar'
  | 'room_service'
  | 'parking'
  | 'ev_charging'
  | 'pet_friendly'
  | 'kitchen'
  | 'laundry'
  | 'workspace'
  | 'balcony'
  | 'ocean_view'
  | 'city_view'
  | 'concierge'
  | 'airport_shuttle'
  | 'breakfast_included';

export interface AccommodationPreferences {
  types: Array<{ type: AccommodationType; strength: PreferenceStrength }>;
  starRating: {
    min: number; // 1-5
    preferred: number;
  };
  mustHaveAmenities: AccommodationAmenity[];
  niceToHaveAmenities: AccommodationAmenity[];
  location: {
    centralPreference: PreferenceStrength; // How important is being central
    maxDistanceFromCenter: number; // km
    nearTransport: PreferenceStrength;
    quietArea: PreferenceStrength;
  };
  roomPreferences: {
    bedType: 'king' | 'queen' | 'double' | 'twin' | 'no_preference';
    minSquareMeters: number;
    floorPreference: 'low' | 'high' | 'no_preference';
    viewImportance: PreferenceStrength;
  };
  checkInOutFlexibility: PreferenceStrength;
}

// ============================================================================
// TRANSPORTATION PREFERENCES
// ============================================================================

export type TransportMode =
  | 'walking'
  | 'public_transit'
  | 'taxi_rideshare'
  | 'rental_car'
  | 'bike'
  | 'scooter'
  | 'private_driver'
  | 'tour_bus';

export type FlightClass = 'economy' | 'premium_economy' | 'business' | 'first';

export interface TransportationPreferences {
  localTransport: Array<{ mode: TransportMode; strength: PreferenceStrength }>;
  maxWalkingDistance: number; // meters
  flightPreferences: {
    class: FlightClass;
    seatPreference: 'window' | 'aisle' | 'middle' | 'no_preference';
    directFlightsOnly: boolean;
    maxLayovers: number;
    maxLayoverDuration: number; // hours
    preferredAirlines: string[];
    avoidAirlines: string[];
  };
  carRental: {
    preferred: boolean;
    vehicleType: 'economy' | 'compact' | 'midsize' | 'suv' | 'luxury' | 'no_preference';
    automaticOnly: boolean;
  };
}

// ============================================================================
// BUDGET PREFERENCES
// ============================================================================

export type BudgetLevel = 'budget' | 'moderate' | 'comfortable' | 'luxury' | 'ultra_luxury';

export interface BudgetPreferences {
  overallLevel: BudgetLevel;
  dailyBudget: {
    min: number;
    max: number;
    currency: string;
  };
  categoryBudgets: {
    accommodation: { percentage: number; flexibility: 'strict' | 'flexible' | 'very_flexible' };
    dining: { percentage: number; flexibility: 'strict' | 'flexible' | 'very_flexible' };
    activities: { percentage: number; flexibility: 'strict' | 'flexible' | 'very_flexible' };
    transportation: { percentage: number; flexibility: 'strict' | 'flexible' | 'very_flexible' };
    shopping: { percentage: number; flexibility: 'strict' | 'flexible' | 'very_flexible' };
  };
  splurgeCategories: PreferenceCategory[]; // Where user is willing to spend more
  saveCategories: PreferenceCategory[]; // Where user wants to economize
  dealSensitivity: 'always_look' | 'nice_to_have' | 'not_important';
}

// ============================================================================
// TIMING PREFERENCES
// ============================================================================

export type TimeOfDay =
  | 'early_morning' // 5-8am
  | 'morning' // 8-11am
  | 'midday' // 11am-2pm
  | 'afternoon' // 2-5pm
  | 'evening' // 5-8pm
  | 'night' // 8-11pm
  | 'late_night'; // 11pm-5am

export interface TimingPreferences {
  wakeUpTime: string; // HH:mm
  bedTime: string; // HH:mm
  preferredActivityTimes: Array<{ time: TimeOfDay; strength: PreferenceStrength }>;
  pacingStyle: 'packed' | 'moderate' | 'relaxed' | 'very_relaxed';
  restDaysFrequency: 'never' | 'occasionally' | 'every_few_days' | 'daily_downtime';
  spontaneityLevel: 'fully_planned' | 'mostly_planned' | 'flexible' | 'very_spontaneous';
  peakSeasonTolerance: 'avoid' | 'tolerate' | 'prefer' | 'no_preference';
}

// ============================================================================
// ACCESSIBILITY PREFERENCES
// ============================================================================

export interface AccessibilityPreferences {
  mobilityRequirements: {
    wheelchairAccessible: boolean;
    limitedWalking: boolean;
    maxStairs: number;
    elevatorRequired: boolean;
  };
  sensoryRequirements: {
    hearingAccommodations: boolean;
    visualAccommodations: boolean;
    quietEnvironments: boolean;
  };
  dietaryMedical: {
    foodAllergies: string[];
    medicationStorage: boolean;
    nearMedicalFacilities: boolean;
  };
  serviceAnimal: boolean;
}

// ============================================================================
// SOCIAL PREFERENCES
// ============================================================================

export interface SocialPreferences {
  travelStyle: 'solo' | 'couple' | 'family' | 'friends' | 'group' | 'mixed';
  socialInteraction: 'very_social' | 'moderate' | 'reserved' | 'prefer_privacy';
  localInteraction: 'immersive' | 'moderate' | 'tourist_focused';
  languageComfort: {
    languages: string[];
    needsEnglish: boolean;
    translationTools: boolean;
  };
  companionCompatibility: {
    shareAccommodation: boolean;
    shareActivities: 'all' | 'most' | 'some' | 'few';
    shareMeals: 'all' | 'most' | 'some' | 'few';
    needAloneTime: boolean;
  };
}

// ============================================================================
// PREFERENCE RECORD & SYNC
// ============================================================================

export interface PreferenceValue {
  value: any;
  strength: PreferenceStrength;
  source: PreferenceSource;
  confidence: number; // 0-1, how confident we are in this preference
  lastUpdated: string; // ISO date
  learnedFrom?: string[]; // IDs of bookings/interactions that informed this
}

export interface UserPreferences {
  id: string;
  userId: string;
  version: number;
  lastSynced: string;
  syncStatus: SyncStatus;

  dining: DiningPreferences;
  activities: ActivityPreferences;
  accommodation: AccommodationPreferences;
  transportation: TransportationPreferences;
  budget: BudgetPreferences;
  timing: TimingPreferences;
  accessibility: AccessibilityPreferences;
  social: SocialPreferences;

  // Metadata for each preference
  metadata: {
    [key: string]: PreferenceValue;
  };
}

// ============================================================================
// COMPANION & MERGE
// ============================================================================

export interface Companion {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  relationship: 'partner' | 'spouse' | 'family' | 'friend' | 'colleague' | 'other';
  preferences?: UserPreferences;
  lastTripTogether?: string;
  syncEnabled: boolean;
}

export interface PreferenceConflict {
  id: string;
  category: PreferenceCategory;
  field: string;
  displayName: string;
  userValue: any;
  userStrength: PreferenceStrength;
  companionValue: any;
  companionStrength: PreferenceStrength;
  companionName: string;
  suggestedResolution: ConflictResolution;
  resolvedValue?: any;
  resolvedBy?: 'user' | 'auto' | 'companion';
}

export interface MergedPreferences {
  id: string;
  tripId?: string;
  participants: Array<{
    userId: string;
    name: string;
    weight: number; // How much their preferences count (0-1)
  }>;
  mergedAt: string;
  conflicts: PreferenceConflict[];
  unresolvedConflicts: number;

  // The actual merged preferences
  dining: Partial<DiningPreferences>;
  activities: Partial<ActivityPreferences>;
  accommodation: Partial<AccommodationPreferences>;
  transportation: Partial<TransportationPreferences>;
  budget: Partial<BudgetPreferences>;
  timing: Partial<TimingPreferences>;
  accessibility: AccessibilityPreferences; // Always union of all requirements
  social: Partial<SocialPreferences>;
}

// ============================================================================
// SUGGESTIONS & SCORING
// ============================================================================

export interface SuggestionMatch {
  field: string;
  displayName: string;
  matchType: 'exact' | 'partial' | 'related' | 'no_match';
  userPreference: any;
  itemValue: any;
  score: number; // 0-100
  weight: number; // How important this field is
}

export interface SuggestionScore {
  itemId: string;
  itemType: 'restaurant' | 'activity' | 'hotel' | 'transport';
  overallScore: number; // 0-100
  matchBreakdown: SuggestionMatch[];
  topMatches: string[]; // Best matching preference fields
  potentialIssues: string[]; // Possible mismatches
  personalized: boolean; // Whether this was personalized
  confidence: number; // How confident we are in the score
}

export interface SuggestionSettings {
  enablePersonalization: boolean;
  strictFiltering: boolean; // Only show items that meet must_have preferences
  showScores: boolean; // Show match scores to user
  minScore: number; // Minimum score to show (0-100)
  prioritizeNewExperiences: boolean; // Prefer things user hasn't tried
  balanceCategories: boolean; // Mix of preference matches
}

// ============================================================================
// PREFERENCE LEARNING
// ============================================================================

export interface PreferenceLearningEvent {
  id: string;
  timestamp: string;
  eventType: 'booking' | 'rating' | 'search' | 'favorite' | 'skip' | 'view_time';
  itemType: 'restaurant' | 'activity' | 'hotel' | 'transport';
  itemId: string;
  itemAttributes: Record<string, any>;
  userAction: {
    type: string;
    value?: number; // e.g., rating 1-5
    duration?: number; // e.g., view time in seconds
  };
  inferredPreferences: Array<{
    category: PreferenceCategory;
    field: string;
    value: any;
    confidence: number;
  }>;
}

export interface LearningInsight {
  id: string;
  category: PreferenceCategory;
  insight: string;
  confidence: number;
  basedOn: string[]; // Event IDs
  suggestedUpdate: {
    field: string;
    currentValue: any;
    suggestedValue: any;
    reason: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'auto_applied';
}

// ============================================================================
// SYNC & EXPORT
// ============================================================================

export interface SyncRecord {
  id: string;
  timestamp: string;
  direction: 'upload' | 'download' | 'merge';
  status: 'success' | 'partial' | 'failed';
  changesApplied: number;
  conflicts: number;
  deviceId: string;
  deviceName: string;
}

export interface PreferenceExport {
  version: string;
  exportedAt: string;
  userId: string;
  preferences: UserPreferences;
  companions: Companion[];
  learningHistory: PreferenceLearningEvent[];
}

// ============================================================================
// UI STATE
// ============================================================================

export interface PreferenceSyncState {
  preferences: UserPreferences | null;
  companions: Companion[];
  mergedPreferences: MergedPreferences | null;
  conflicts: PreferenceConflict[];
  suggestionSettings: SuggestionSettings;
  learningInsights: LearningInsight[];
  syncHistory: SyncRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSyncTime: string | null;
}
