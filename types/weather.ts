// Weather-Aware Activity Types for Paint the Town
// Defines weather conditions, activity requirements, and smart adjustments

// ============================================================================
// Weather Condition Types
// ============================================================================

export type WeatherConditionType =
  | 'sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'light_rain'
  | 'rainy'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'snow'
  | 'sleet'
  | 'fog'
  | 'mist'
  | 'windy'
  | 'hail'
  | 'extreme_heat'
  | 'extreme_cold';

export type WeatherSeverity = 'ideal' | 'good' | 'fair' | 'poor' | 'dangerous';

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

// ============================================================================
// Weather Data Structures
// ============================================================================

export interface WeatherCondition {
  type: WeatherConditionType;
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // Percentage
  windSpeed: number; // km/h
  windDirection: string;
  uvIndex: number;
  visibility: number; // km
  precipitation: number; // Percentage chance
  precipitationAmount?: number; // mm
  cloudCover: number; // Percentage
  pressure: number; // hPa
  description: string;
  icon: string;
}

export interface HourlyForecast {
  time: string; // HH:mm
  timestamp: number;
  condition: WeatherCondition;
  sunrise?: string;
  sunset?: string;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  dayName: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  moonPhase: string;
  hourlyForecast: HourlyForecast[];
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedAreas: string[];
  source: string;
}

export type AlertType =
  | 'thunderstorm'
  | 'tornado'
  | 'hurricane'
  | 'flood'
  | 'heat'
  | 'cold'
  | 'wind'
  | 'fog'
  | 'snow'
  | 'ice'
  | 'air_quality'
  | 'uv'
  | 'fire'
  | 'other';

export type AlertSeverity = 'watch' | 'advisory' | 'warning' | 'emergency';

// ============================================================================
// Activity Weather Requirements
// ============================================================================

export interface ActivityWeatherRequirements {
  // Temperature range
  minTemp?: number;
  maxTemp?: number;
  idealTempMin?: number;
  idealTempMax?: number;

  // Weather conditions
  suitableConditions: WeatherConditionType[];
  unsuitableConditions: WeatherConditionType[];
  idealConditions?: WeatherConditionType[];

  // Wind
  maxWindSpeed?: number;

  // Rain/Precipitation
  maxPrecipitationChance?: number;

  // UV
  maxUvIndex?: number;

  // Visibility
  minVisibility?: number;

  // Time of day preferences
  preferredTimeOfDay?: TimeOfDay[];

  // Seasonal
  seasonalAvailability?: ('spring' | 'summer' | 'fall' | 'winter')[];

  // Indoor/Outdoor
  isOutdoor: boolean;
  hasIndoorOption: boolean;
  coveredArea?: boolean; // Partially covered (like a covered terrace)

  // Special requirements
  requiresDryGround?: boolean; // e.g., hiking trails
  requiresClearSkies?: boolean; // e.g., stargazing
  requiresDaylight?: boolean;
  affectedByTides?: boolean;
}

export interface WeatherSuitability {
  score: number; // 0-100
  severity: WeatherSeverity;
  isRecommended: boolean;
  warnings: string[];
  tips: string[];
  adjustments: ActivityAdjustment[];
  bestTimeSlots: TimeSlotRecommendation[];
  alternativeDate?: string;
}

export interface ActivityAdjustment {
  type: AdjustmentType;
  description: string;
  icon: string;
  priority: 'required' | 'recommended' | 'optional';
}

export type AdjustmentType =
  | 'bring_umbrella'
  | 'bring_sunscreen'
  | 'bring_layers'
  | 'bring_water'
  | 'bring_hat'
  | 'wear_sturdy_shoes'
  | 'arrive_early'
  | 'check_conditions'
  | 'book_indoor_backup'
  | 'reschedule'
  | 'modify_route'
  | 'shorten_duration'
  | 'change_time';

export interface TimeSlotRecommendation {
  startTime: string;
  endTime: string;
  score: number;
  reason: string;
  condition: WeatherCondition;
}

// ============================================================================
// Weather-Adjusted Activity
// ============================================================================

export interface WeatherAwareActivity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  image: string;

  // Location
  location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
    indoor: boolean;
  };

  // Timing
  duration: { value: number; unit: 'minutes' | 'hours' };
  availableTimeSlots: string[];

  // Weather
  weatherRequirements: ActivityWeatherRequirements;
  currentSuitability?: WeatherSuitability;

  // Pricing
  price: number;
  currency: string;

  // Meta
  rating: number;
  reviewCount: number;
  tags: string[];

  // Booking
  bookingRequired: boolean;
  provider?: string;
  bookingUrl?: string;
}

export type ActivityCategory =
  | 'outdoor_adventure'
  | 'water_sports'
  | 'hiking'
  | 'cycling'
  | 'beach'
  | 'sightseeing'
  | 'cultural'
  | 'food_drink'
  | 'wellness'
  | 'nightlife'
  | 'shopping'
  | 'sports'
  | 'photography'
  | 'wildlife'
  | 'winter_sports';

// ============================================================================
// Indoor Alternatives
// ============================================================================

export interface IndoorAlternative {
  originalActivityId: string;
  alternativeId: string;
  alternativeName: string;
  reason: string;
  matchScore: number; // How well it matches the original activity's intent
  category: ActivityCategory;
  highlights: string[];
  priceComparison: 'cheaper' | 'similar' | 'more_expensive';
}

// ============================================================================
// Weather Impact Assessment
// ============================================================================

export interface ItineraryWeatherImpact {
  date: string;
  overallScore: number;
  affectedActivities: AffectedActivity[];
  recommendations: ItineraryRecommendation[];
  alerts: WeatherAlert[];
}

export interface AffectedActivity {
  activityId: string;
  activityName: string;
  scheduledTime: string;
  suitability: WeatherSuitability;
  alternativeActivities: IndoorAlternative[];
  suggestedRescheduleTime?: string;
}

export interface ItineraryRecommendation {
  type: 'reorder' | 'reschedule' | 'replace' | 'cancel' | 'add_backup' | 'pack_gear';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedActivityIds: string[];
  suggestedAction?: SuggestedAction;
}

export interface SuggestedAction {
  type: 'swap_activities' | 'move_to_time' | 'replace_with' | 'add_activity';
  parameters: Record<string, any>;
}

// ============================================================================
// User Weather Preferences
// ============================================================================

export interface WeatherPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';

  // Comfort thresholds
  heatSensitivity: 'low' | 'medium' | 'high'; // How much heat affects them
  coldSensitivity: 'low' | 'medium' | 'high';
  rainTolerance: 'low' | 'medium' | 'high'; // Willingness to do activities in rain

  // Preferred conditions
  preferredTempRange: { min: number; max: number };

  // Auto-adjustment settings
  autoSuggestAlternatives: boolean;
  showWeatherAlerts: boolean;
  notifyOnSignificantChange: boolean;

  // Activity preferences in bad weather
  badWeatherPreference: 'indoor_alternatives' | 'reschedule' | 'proceed_anyway';
}

// ============================================================================
// Weather Forecast Request/Response
// ============================================================================

export interface WeatherForecastRequest {
  location: {
    coordinates?: { lat: number; lng: number };
    city?: string;
    country?: string;
  };
  startDate: string;
  endDate: string;
  includeHourly: boolean;
  includeAlerts: boolean;
}

export interface WeatherForecastResponse {
  location: {
    name: string;
    country: string;
    timezone: string;
    coordinates: { lat: number; lng: number };
  };
  current: WeatherCondition;
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  lastUpdated: string;
  source: string;
}

// ============================================================================
// Packing Suggestions
// ============================================================================

export interface PackingSuggestion {
  item: string;
  icon: string;
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
  forConditions: WeatherConditionType[];
}

export interface WeatherPackingList {
  tripDates: { start: string; end: string };
  location: string;
  essentials: PackingSuggestion[];
  recommended: PackingSuggestion[];
  optional: PackingSuggestion[];
  weatherSummary: string;
}
