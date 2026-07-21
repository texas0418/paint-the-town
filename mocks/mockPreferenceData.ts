// Paint the Town Preference Sync - Mock Data

import {
  UserPreferences,
  Companion,
  MergedPreferences,
  PreferenceConflict,
  LearningInsight,
  SyncRecord,
  PreferenceLearningEvent,
  SuggestionScore,
} from '../types/preferences';

// ============================================================================
// MOCK USER PREFERENCES
// ============================================================================

export const MOCK_USER_PREFERENCES: UserPreferences = {
  id: 'pref_user_001',
  userId: 'user_001',
  version: 5,
  lastSynced: '2026-02-04T10:30:00Z',
  syncStatus: 'synced',
  
  dining: {
    cuisineTypes: [
      { type: 'italian', strength: 'strong' },
      { type: 'japanese', strength: 'strong' },
      { type: 'mexican', strength: 'moderate' },
      { type: 'thai', strength: 'moderate' },
      { type: 'mediterranean', strength: 'slight' },
    ],
    dietaryRestrictions: [],
    diningStyles: [
      { style: 'casual', strength: 'strong' },
      { style: 'bistro', strength: 'moderate' },
      { style: 'fine_dining', strength: 'slight' },
    ],
    ambiance: [
      { type: 'lively', strength: 'strong' },
      { type: 'outdoor', strength: 'moderate' },
      { type: 'romantic', strength: 'moderate' },
    ],
    priceRange: { min: 2, max: 3, strength: 'moderate' },
    mealTimes: {
      breakfast: { preferred: true, timeRange: { start: '08:00', end: '10:00' } },
      lunch: { preferred: true, timeRange: { start: '12:30', end: '14:00' } },
      dinner: { preferred: true, timeRange: { start: '19:00', end: '21:00' } },
      brunch: { preferred: true, timeRange: { start: '10:00', end: '13:00' } },
    },
    partySize: { typical: 2, max: 6 },
    reservationPreference: 'preferred',
    specialRequests: ['Window seat preferred'],
  },
  
  activities: {
    activityTypes: [
      { type: 'sightseeing', strength: 'strong' },
      { type: 'food_drink', strength: 'strong' },
      { type: 'cultural', strength: 'moderate' },
      { type: 'hiking', strength: 'moderate' },
      { type: 'photography', strength: 'moderate' },
      { type: 'museums', strength: 'slight' },
    ],
    physicalIntensity: {
      min: 'light',
      max: 'vigorous',
      preferred: 'moderate',
    },
    duration: {
      minHours: 1,
      maxHours: 5,
      preferredHours: 2.5,
    },
    groupSizePreference: [
      { size: 'couple', strength: 'strong' },
      { size: 'small_group', strength: 'moderate' },
    ],
    indoorOutdoor: {
      indoor: 'moderate',
      outdoor: 'strong',
    },
    guidedPreference: 'either',
    advanceBooking: 'preferred',
    crowdTolerance: 'moderate',
    photoOpportunities: 'strong',
    childFriendly: false,
    petFriendly: false,
  },
  
  accommodation: {
    types: [
      { type: 'boutique_hotel', strength: 'strong' },
      { type: 'vacation_rental', strength: 'moderate' },
      { type: 'luxury_hotel', strength: 'slight' },
    ],
    starRating: { min: 4, preferred: 4 },
    mustHaveAmenities: ['wifi', 'gym'],
    niceToHaveAmenities: ['pool', 'restaurant', 'balcony'],
    location: {
      centralPreference: 'strong',
      maxDistanceFromCenter: 3,
      nearTransport: 'strong',
      quietArea: 'moderate',
    },
    roomPreferences: {
      bedType: 'king',
      minSquareMeters: 30,
      floorPreference: 'high',
      viewImportance: 'moderate',
    },
    checkInOutFlexibility: 'moderate',
  },
  
  transportation: {
    localTransport: [
      { mode: 'walking', strength: 'strong' },
      { mode: 'public_transit', strength: 'moderate' },
      { mode: 'taxi_rideshare', strength: 'moderate' },
      { mode: 'bike', strength: 'slight' },
    ],
    maxWalkingDistance: 2500,
    flightPreferences: {
      class: 'economy',
      seatPreference: 'aisle',
      directFlightsOnly: false,
      maxLayovers: 1,
      maxLayoverDuration: 3,
      preferredAirlines: ['Delta', 'JetBlue'],
      avoidAirlines: [],
    },
    carRental: {
      preferred: false,
      vehicleType: 'compact',
      automaticOnly: true,
    },
  },
  
  budget: {
    overallLevel: 'comfortable',
    dailyBudget: {
      min: 200,
      max: 400,
      currency: 'USD',
    },
    categoryBudgets: {
      accommodation: { percentage: 35, flexibility: 'flexible' },
      dining: { percentage: 30, flexibility: 'very_flexible' },
      activities: { percentage: 20, flexibility: 'flexible' },
      transportation: { percentage: 10, flexibility: 'strict' },
      shopping: { percentage: 5, flexibility: 'very_flexible' },
    },
    splurgeCategories: ['dining', 'activities'],
    saveCategories: ['transportation'],
    dealSensitivity: 'nice_to_have',
  },
  
  timing: {
    wakeUpTime: '08:00',
    bedTime: '23:00',
    preferredActivityTimes: [
      { time: 'morning', strength: 'moderate' },
      { time: 'afternoon', strength: 'strong' },
      { time: 'evening', strength: 'strong' },
    ],
    pacingStyle: 'moderate',
    restDaysFrequency: 'occasionally',
    spontaneityLevel: 'flexible',
    peakSeasonTolerance: 'tolerate',
  },
  
  accessibility: {
    mobilityRequirements: {
      wheelchairAccessible: false,
      limitedWalking: false,
      maxStairs: 100,
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
  },
  
  social: {
    travelStyle: 'couple',
    socialInteraction: 'moderate',
    localInteraction: 'immersive',
    languageComfort: {
      languages: ['English', 'Spanish'],
      needsEnglish: true,
      translationTools: true,
    },
    companionCompatibility: {
      shareAccommodation: true,
      shareActivities: 'most',
      shareMeals: 'all',
      needAloneTime: true,
    },
  },
  
  metadata: {
    'dining.cuisineTypes': {
      value: ['italian', 'japanese'],
      strength: 'strong',
      source: 'explicit',
      confidence: 1.0,
      lastUpdated: '2026-02-01T09:00:00Z',
    },
    'activities.activityTypes': {
      value: ['sightseeing', 'food_drink'],
      strength: 'strong',
      source: 'inferred',
      confidence: 0.85,
      lastUpdated: '2026-02-03T14:00:00Z',
      learnedFrom: ['booking_001', 'booking_005', 'rating_012'],
    },
  },
};

// ============================================================================
// MOCK COMPANIONS
// ============================================================================

export const MOCK_COMPANIONS: Companion[] = [
  {
    id: 'companion_001',
    name: 'Sarah',
    email: 'sarah@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    relationship: 'partner',
    lastTripTogether: '2026-01-15',
    syncEnabled: true,
    preferences: {
      id: 'pref_sarah',
      userId: 'sarah_001',
      version: 3,
      lastSynced: '2026-02-03T15:00:00Z',
      syncStatus: 'synced',
      dining: {
        cuisineTypes: [
          { type: 'japanese', strength: 'strong' },
          { type: 'vietnamese', strength: 'strong' },
          { type: 'italian', strength: 'moderate' },
          { type: 'indian', strength: 'moderate' },
        ],
        dietaryRestrictions: ['vegetarian'],
        diningStyles: [
          { style: 'casual', strength: 'strong' },
          { style: 'cafe', strength: 'strong' },
        ],
        ambiance: [
          { type: 'quiet', strength: 'strong' },
          { type: 'cozy', strength: 'moderate' },
        ],
        priceRange: { min: 2, max: 3, strength: 'moderate' },
        mealTimes: {
          breakfast: { preferred: true, timeRange: { start: '09:00', end: '10:30' } },
          lunch: { preferred: true, timeRange: { start: '13:00', end: '14:30' } },
          dinner: { preferred: true, timeRange: { start: '18:30', end: '20:30' } },
          brunch: { preferred: true, timeRange: { start: '11:00', end: '14:00' } },
        },
        partySize: { typical: 2, max: 4 },
        reservationPreference: 'always',
        specialRequests: [],
      },
      activities: {
        activityTypes: [
          { type: 'museums', strength: 'strong' },
          { type: 'spa_wellness', strength: 'strong' },
          { type: 'cultural', strength: 'moderate' },
          { type: 'shopping', strength: 'moderate' },
          { type: 'food_drink', strength: 'moderate' },
        ],
        physicalIntensity: {
          min: 'sedentary',
          max: 'moderate',
          preferred: 'light',
        },
        duration: {
          minHours: 1,
          maxHours: 3,
          preferredHours: 2,
        },
        groupSizePreference: [
          { size: 'couple', strength: 'strong' },
        ],
        indoorOutdoor: {
          indoor: 'strong',
          outdoor: 'moderate',
        },
        guidedPreference: 'guided',
        advanceBooking: 'required',
        crowdTolerance: 'avoid_crowds',
        photoOpportunities: 'moderate',
        childFriendly: false,
        petFriendly: false,
      },
      accommodation: {
        types: [
          { type: 'boutique_hotel', strength: 'strong' },
          { type: 'luxury_hotel', strength: 'moderate' },
        ],
        starRating: { min: 4, preferred: 5 },
        mustHaveAmenities: ['wifi', 'spa'],
        niceToHaveAmenities: ['pool', 'restaurant', 'room_service'],
        location: {
          centralPreference: 'strong',
          maxDistanceFromCenter: 2,
          nearTransport: 'moderate',
          quietArea: 'strong',
        },
        roomPreferences: {
          bedType: 'king',
          minSquareMeters: 35,
          floorPreference: 'high',
          viewImportance: 'strong',
        },
        checkInOutFlexibility: 'strong',
      },
      transportation: {
        localTransport: [
          { mode: 'taxi_rideshare', strength: 'strong' },
          { mode: 'walking', strength: 'moderate' },
        ],
        maxWalkingDistance: 1500,
        flightPreferences: {
          class: 'premium_economy',
          seatPreference: 'window',
          directFlightsOnly: true,
          maxLayovers: 0,
          maxLayoverDuration: 0,
          preferredAirlines: ['Delta'],
          avoidAirlines: ['Spirit'],
        },
        carRental: {
          preferred: false,
          vehicleType: 'no_preference',
          automaticOnly: true,
        },
      },
      budget: {
        overallLevel: 'comfortable',
        dailyBudget: {
          min: 250,
          max: 500,
          currency: 'USD',
        },
        categoryBudgets: {
          accommodation: { percentage: 40, flexibility: 'flexible' },
          dining: { percentage: 25, flexibility: 'flexible' },
          activities: { percentage: 20, flexibility: 'flexible' },
          transportation: { percentage: 10, flexibility: 'strict' },
          shopping: { percentage: 5, flexibility: 'very_flexible' },
        },
        splurgeCategories: ['accommodation', 'spa_wellness'],
        saveCategories: [],
        dealSensitivity: 'not_important',
      },
      timing: {
        wakeUpTime: '09:00',
        bedTime: '22:30',
        preferredActivityTimes: [
          { time: 'morning', strength: 'slight' },
          { time: 'afternoon', strength: 'strong' },
          { time: 'evening', strength: 'moderate' },
        ],
        pacingStyle: 'relaxed',
        restDaysFrequency: 'every_few_days',
        spontaneityLevel: 'mostly_planned',
        peakSeasonTolerance: 'avoid',
      },
      accessibility: {
        mobilityRequirements: {
          wheelchairAccessible: false,
          limitedWalking: false,
          maxStairs: 50,
          elevatorRequired: false,
        },
        sensoryRequirements: {
          hearingAccommodations: false,
          visualAccommodations: false,
          quietEnvironments: true,
        },
        dietaryMedical: {
          foodAllergies: ['shellfish'],
          medicationStorage: false,
          nearMedicalFacilities: false,
        },
        serviceAnimal: false,
      },
      social: {
        travelStyle: 'couple',
        socialInteraction: 'reserved',
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
          needAloneTime: true,
        },
      },
      metadata: {},
    },
  },
  {
    id: 'companion_002',
    name: 'Mike',
    email: 'mike@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    relationship: 'friend',
    lastTripTogether: '2025-11-20',
    syncEnabled: true,
    preferences: undefined, // Friend hasn't synced preferences yet
  },
  {
    id: 'companion_003',
    name: 'Emma',
    phone: '+1-555-0123',
    avatar: 'https://i.pravatar.cc/150?img=5',
    relationship: 'family',
    lastTripTogether: '2025-08-10',
    syncEnabled: false,
    preferences: undefined,
  },
];

// ============================================================================
// MOCK CONFLICTS
// ============================================================================

export const MOCK_CONFLICTS: PreferenceConflict[] = [
  {
    id: 'conflict_001',
    category: 'activities',
    field: 'physicalIntensity',
    displayName: 'Activity Intensity',
    userValue: { min: 'light', max: 'vigorous', preferred: 'moderate' },
    userStrength: 'moderate',
    companionValue: { min: 'sedentary', max: 'moderate', preferred: 'light' },
    companionStrength: 'strong',
    companionName: 'Sarah',
    suggestedResolution: 'average',
    resolvedValue: undefined,
    resolvedBy: undefined,
  },
  {
    id: 'conflict_002',
    category: 'timing',
    field: 'pacingStyle',
    displayName: 'Trip Pacing',
    userValue: 'moderate',
    userStrength: 'moderate',
    companionValue: 'relaxed',
    companionStrength: 'strong',
    companionName: 'Sarah',
    suggestedResolution: 'strongest_wins',
    resolvedValue: 'relaxed',
    resolvedBy: 'auto',
  },
  {
    id: 'conflict_003',
    category: 'dining',
    field: 'ambiance',
    displayName: 'Restaurant Ambiance',
    userValue: [{ type: 'lively', strength: 'strong' }],
    userStrength: 'strong',
    companionValue: [{ type: 'quiet', strength: 'strong' }],
    companionStrength: 'strong',
    companionName: 'Sarah',
    suggestedResolution: 'manual',
    resolvedValue: undefined,
    resolvedBy: undefined,
  },
];

// ============================================================================
// MOCK LEARNING INSIGHTS
// ============================================================================

export const MOCK_LEARNING_INSIGHTS: LearningInsight[] = [
  {
    id: 'insight_001',
    category: 'dining',
    insight: 'You\'ve booked Japanese restaurants 5 times in the last month',
    confidence: 0.9,
    basedOn: ['booking_001', 'booking_003', 'booking_007', 'booking_012', 'booking_015'],
    suggestedUpdate: {
      field: 'cuisineTypes',
      currentValue: { type: 'japanese', strength: 'strong' },
      suggestedValue: { type: 'japanese', strength: 'must_have' },
      reason: 'Based on your consistent booking pattern',
    },
    status: 'pending',
  },
  {
    id: 'insight_002',
    category: 'activities',
    insight: 'You consistently rate food tours highly (4.8 avg)',
    confidence: 0.85,
    basedOn: ['rating_001', 'rating_005', 'rating_009'],
    suggestedUpdate: {
      field: 'activityTypes',
      currentValue: { type: 'food_drink', strength: 'strong' },
      suggestedValue: { type: 'food_drink', strength: 'must_have' },
      reason: 'Based on your high ratings',
    },
    status: 'pending',
  },
  {
    id: 'insight_003',
    category: 'accommodation',
    insight: 'You prefer hotels with gym facilities',
    confidence: 0.75,
    basedOn: ['booking_hotel_001', 'booking_hotel_003'],
    suggestedUpdate: {
      field: 'mustHaveAmenities',
      currentValue: ['wifi', 'gym'],
      suggestedValue: ['wifi', 'gym'],
      reason: 'Already set - no change needed',
    },
    status: 'accepted',
  },
  {
    id: 'insight_004',
    category: 'timing',
    insight: 'You tend to skip early morning activities',
    confidence: 0.7,
    basedOn: ['skip_001', 'skip_003', 'skip_005'],
    suggestedUpdate: {
      field: 'preferredActivityTimes',
      currentValue: [{ time: 'morning', strength: 'moderate' }],
      suggestedValue: [{ time: 'morning', strength: 'slight' }],
      reason: 'Based on activity attendance patterns',
    },
    status: 'rejected',
  },
];

// ============================================================================
// MOCK SYNC HISTORY
// ============================================================================

export const MOCK_SYNC_HISTORY: SyncRecord[] = [
  {
    id: 'sync_001',
    timestamp: '2026-02-04T10:30:00Z',
    direction: 'upload',
    status: 'success',
    changesApplied: 3,
    conflicts: 0,
    deviceId: 'iphone_14_pro',
    deviceName: 'iPhone 14 Pro',
  },
  {
    id: 'sync_002',
    timestamp: '2026-02-03T18:45:00Z',
    direction: 'download',
    status: 'success',
    changesApplied: 5,
    conflicts: 1,
    deviceId: 'macbook_pro',
    deviceName: 'MacBook Pro',
  },
  {
    id: 'sync_003',
    timestamp: '2026-02-02T09:15:00Z',
    direction: 'merge',
    status: 'partial',
    changesApplied: 8,
    conflicts: 2,
    deviceId: 'ipad_air',
    deviceName: 'iPad Air',
  },
];

// ============================================================================
// MOCK ITEMS FOR SCORING
// ============================================================================

export const MOCK_RESTAURANTS = [
  {
    id: 'rest_001',
    name: 'Sakura Japanese Kitchen',
    cuisine: 'japanese',
    priceLevel: 3,
    ambiance: 'lively',
    dietaryOptions: ['vegetarian', 'gluten_free'],
    rating: 4.6,
    distance: 0.8,
  },
  {
    id: 'rest_002',
    name: 'Trattoria Roma',
    cuisine: 'italian',
    priceLevel: 2,
    ambiance: 'romantic',
    dietaryOptions: ['vegetarian'],
    rating: 4.4,
    distance: 1.2,
  },
  {
    id: 'rest_003',
    name: 'Thai Orchid',
    cuisine: 'thai',
    priceLevel: 2,
    ambiance: 'casual',
    dietaryOptions: ['vegetarian', 'vegan', 'gluten_free'],
    rating: 4.3,
    distance: 0.5,
  },
  {
    id: 'rest_004',
    name: 'The Steakhouse',
    cuisine: 'steakhouse',
    priceLevel: 4,
    ambiance: 'fine_dining',
    dietaryOptions: [],
    rating: 4.7,
    distance: 2.0,
  },
  {
    id: 'rest_005',
    name: 'Pho Palace',
    cuisine: 'vietnamese',
    priceLevel: 1,
    ambiance: 'casual',
    dietaryOptions: ['gluten_free'],
    rating: 4.5,
    distance: 0.3,
  },
];

export const MOCK_ACTIVITIES = [
  {
    id: 'act_001',
    name: 'Historic Walking Tour',
    type: 'sightseeing',
    intensity: 'moderate',
    duration: 3,
    groupSize: 'small_group',
    indoor: false,
    price: 45,
  },
  {
    id: 'act_002',
    name: 'Modern Art Museum',
    type: 'museums',
    intensity: 'sedentary',
    duration: 2,
    groupSize: 'couple',
    indoor: true,
    price: 25,
  },
  {
    id: 'act_003',
    name: 'Food & Wine Tour',
    type: 'food_drink',
    intensity: 'light',
    duration: 4,
    groupSize: 'small_group',
    indoor: false,
    price: 85,
  },
  {
    id: 'act_004',
    name: 'Mountain Hiking Trail',
    type: 'hiking',
    intensity: 'vigorous',
    duration: 6,
    groupSize: 'small_group',
    indoor: false,
    price: 0,
  },
  {
    id: 'act_005',
    name: 'Spa Day Package',
    type: 'spa_wellness',
    intensity: 'sedentary',
    duration: 4,
    groupSize: 'couple',
    indoor: true,
    price: 150,
  },
];

// ============================================================================
// MOCK LEARNING EVENTS
// ============================================================================

export const MOCK_LEARNING_EVENTS: PreferenceLearningEvent[] = [
  {
    id: 'event_001',
    timestamp: '2026-02-03T19:30:00Z',
    eventType: 'booking',
    itemType: 'restaurant',
    itemId: 'rest_001',
    itemAttributes: {
      cuisine: 'japanese',
      priceLevel: 3,
      ambiance: 'lively',
    },
    userAction: {
      type: 'booked',
    },
    inferredPreferences: [
      {
        category: 'dining',
        field: 'cuisineTypes',
        value: { type: 'japanese', strength: 'strong' },
        confidence: 0.8,
      },
    ],
  },
  {
    id: 'event_002',
    timestamp: '2026-02-02T14:00:00Z',
    eventType: 'rating',
    itemType: 'activity',
    itemId: 'act_003',
    itemAttributes: {
      type: 'food_drink',
      intensity: 'light',
      duration: 4,
    },
    userAction: {
      type: 'rated',
      value: 5,
    },
    inferredPreferences: [
      {
        category: 'activities',
        field: 'activityTypes',
        value: { type: 'food_drink', strength: 'strong' },
        confidence: 0.9,
      },
    ],
  },
  {
    id: 'event_003',
    timestamp: '2026-02-01T08:00:00Z',
    eventType: 'skip',
    itemType: 'activity',
    itemId: 'act_early_001',
    itemAttributes: {
      type: 'sightseeing',
      startTime: '07:00',
    },
    userAction: {
      type: 'skipped',
    },
    inferredPreferences: [
      {
        category: 'timing',
        field: 'preferredActivityTimes',
        value: { time: 'early_morning', strength: 'slight' },
        confidence: 0.6,
      },
    ],
  },
];

// ============================================================================
// CATEGORY METADATA
// ============================================================================

export const PREFERENCE_CATEGORIES = [
  {
    id: 'dining',
    name: 'Dining',
    icon: '🍽️',
    description: 'Restaurant types, cuisines, and dining preferences',
    fields: ['cuisineTypes', 'dietaryRestrictions', 'priceRange', 'ambiance', 'diningStyles'],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: '🎯',
    description: 'Activity types, intensity, and duration preferences',
    fields: ['activityTypes', 'physicalIntensity', 'duration', 'guidedPreference'],
  },
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: '🏨',
    description: 'Hotel types, amenities, and room preferences',
    fields: ['types', 'starRating', 'mustHaveAmenities', 'location'],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    description: 'Travel modes and flight preferences',
    fields: ['localTransport', 'flightPreferences', 'carRental'],
  },
  {
    id: 'budget',
    name: 'Budget',
    icon: '💰',
    description: 'Spending levels and budget allocation',
    fields: ['overallLevel', 'dailyBudget', 'categoryBudgets'],
  },
  {
    id: 'timing',
    name: 'Timing',
    icon: '⏰',
    description: 'Schedule preferences and trip pacing',
    fields: ['wakeUpTime', 'preferredActivityTimes', 'pacingStyle'],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    icon: '♿',
    description: 'Mobility, sensory, and medical requirements',
    fields: ['mobilityRequirements', 'sensoryRequirements', 'dietaryMedical'],
  },
  {
    id: 'social',
    name: 'Social',
    icon: '👥',
    description: 'Travel style and social preferences',
    fields: ['travelStyle', 'socialInteraction', 'companionCompatibility'],
  },
];

export const STRENGTH_LABELS: Record<string, string> = {
  must_have: 'Must Have',
  strong: 'Strong',
  moderate: 'Moderate',
  slight: 'Slight',
  neutral: 'No Preference',
};

export const STRENGTH_COLORS: Record<string, string> = {
  must_have: '#FF3B30',
  strong: '#FF9500',
  moderate: '#FFCC00',
  slight: '#34C759',
  neutral: '#8E8E93',
};

export const SOURCE_LABELS: Record<string, string> = {
  explicit: 'You set this',
  inferred: 'Learned from your activity',
  imported: 'Imported',
  companion: 'From travel companion',
  default: 'Default setting',
};
