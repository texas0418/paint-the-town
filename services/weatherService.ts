// Weather-Aware Service for Paint the Town
// Provides weather forecasts, activity assessments, and smart recommendations

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WeatherCondition,
  WeatherConditionType,
  DailyForecast,
  HourlyForecast,
  WeatherAlert,
  WeatherForecastRequest,
  WeatherForecastResponse,
  WeatherSuitability,
  WeatherSeverity,
  ActivityWeatherRequirements,
  WeatherAwareActivity,
  ActivityAdjustment,
  AdjustmentType,
  TimeSlotRecommendation,
  IndoorAlternative,
  ItineraryWeatherImpact,
  AffectedActivity,
  ItineraryRecommendation,
  WeatherPreferences,
  WeatherPackingList,
  PackingSuggestion,
  ActivityCategory,
} from '../types/weather';
import { MOCK_FORECASTS, MOCK_ACTIVITIES, INDOOR_ALTERNATIVES_MAP } from '../data/mockWeatherData';

const STORAGE_KEYS = {
  WEATHER_CACHE: '@w4nder/weather_cache',
  WEATHER_PREFERENCES: '@w4nder/weather_preferences',
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// Weather Condition Mappings
// ============================================================================

const CONDITION_SEVERITY: Record<WeatherConditionType, WeatherSeverity> = {
  sunny: 'ideal',
  partly_cloudy: 'ideal',
  cloudy: 'good',
  overcast: 'fair',
  light_rain: 'fair',
  rainy: 'poor',
  heavy_rain: 'poor',
  thunderstorm: 'dangerous',
  snow: 'poor',
  sleet: 'dangerous',
  fog: 'fair',
  mist: 'good',
  windy: 'fair',
  hail: 'dangerous',
  extreme_heat: 'dangerous',
  extreme_cold: 'dangerous',
};

const CONDITION_ICONS: Record<WeatherConditionType, string> = {
  sunny: '☀️',
  partly_cloudy: '⛅',
  cloudy: '☁️',
  overcast: '🌥️',
  light_rain: '🌦️',
  rainy: '🌧️',
  heavy_rain: '⛈️',
  thunderstorm: '🌩️',
  snow: '🌨️',
  sleet: '🌨️',
  fog: '🌫️',
  mist: '🌫️',
  windy: '💨',
  hail: '🌨️',
  extreme_heat: '🔥',
  extreme_cold: '🥶',
};

// ============================================================================
// Weather Service Class
// ============================================================================

class WeatherService {
  private cache: Map<string, { data: WeatherForecastResponse; timestamp: number }> = new Map();

  // ============================================================================
  // Forecast Fetching
  // ============================================================================

  async getWeatherForecast(request: WeatherForecastRequest): Promise<WeatherForecastResponse> {
    const cacheKey = this.getCacheKey(request);

    // Check memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Check persistent cache
    try {
      const storedCache = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
      if (storedCache) {
        const parsed = JSON.parse(storedCache);
        if (parsed[cacheKey] && Date.now() - parsed[cacheKey].timestamp < CACHE_DURATION) {
          this.cache.set(cacheKey, parsed[cacheKey]);
          return parsed[cacheKey].data;
        }
      }
    } catch (error) {
      console.error('Error reading weather cache:', error);
    }

    // Fetch new data (in production, call actual weather API)
    const forecast = await this.fetchForecast(request);

    // Update caches
    this.cache.set(cacheKey, { data: forecast, timestamp: Date.now() });
    this.persistCache();

    return forecast;
  }

  private async fetchForecast(request: WeatherForecastRequest): Promise<WeatherForecastResponse> {
    // In production, integrate with weather APIs:
    // - OpenWeatherMap
    // - WeatherAPI
    // - AccuWeather
    // - Tomorrow.io

    // Simulate API delay
    await this.delay(500);

    // Return mock data for now
    const locationName = request.location.city || 'Barcelona';
    return {
      location: {
        name: locationName,
        country: request.location.country || 'Spain',
        timezone: 'Europe/Madrid',
        coordinates: request.location.coordinates || { lat: 41.3851, lng: 2.1734 },
      },
      current: MOCK_FORECASTS[0].condition,
      daily: this.generateDailyForecasts(request.startDate, request.endDate),
      alerts: this.generateAlerts(request.startDate, request.endDate),
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    };
  }

  private generateDailyForecasts(startDate: string, endDate: string): DailyForecast[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: DailyForecast[] = [];

    let current = new Date(start);
    let index = 0;

    while (current <= end && days.length < 14) {
      const mockForecast = MOCK_FORECASTS[index % MOCK_FORECASTS.length];
      days.push({
        ...mockForecast,
        date: current.toISOString().split('T')[0],
        dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
      });
      current.setDate(current.getDate() + 1);
      index++;
    }

    return days;
  }

  private generateAlerts(startDate: string, endDate: string): WeatherAlert[] {
    // In production, these would come from the weather API
    const alerts: WeatherAlert[] = [];

    // Check if any forecast day has severe weather
    const forecasts = this.generateDailyForecasts(startDate, endDate);
    forecasts.forEach((forecast) => {
      if (
        ['thunderstorm', 'heavy_rain', 'extreme_heat', 'extreme_cold'].includes(
          forecast.condition.type
        )
      ) {
        alerts.push({
          id: `alert-${forecast.date}`,
          type:
            forecast.condition.type === 'thunderstorm'
              ? 'thunderstorm'
              : forecast.condition.type === 'extreme_heat'
                ? 'heat'
                : forecast.condition.type === 'extreme_cold'
                  ? 'cold'
                  : 'other',
          severity: 'warning',
          title: this.getAlertTitle(forecast.condition.type),
          description: this.getAlertDescription(forecast.condition.type),
          startTime: `${forecast.date}T06:00:00`,
          endTime: `${forecast.date}T22:00:00`,
          affectedAreas: ['All outdoor activities'],
          source: 'National Weather Service',
        });
      }
    });

    return alerts;
  }

  private getAlertTitle(condition: WeatherConditionType): string {
    const titles: Partial<Record<WeatherConditionType, string>> = {
      thunderstorm: 'Thunderstorm Warning',
      heavy_rain: 'Heavy Rain Advisory',
      extreme_heat: 'Excessive Heat Warning',
      extreme_cold: 'Extreme Cold Warning',
      hail: 'Hail Warning',
      snow: 'Winter Weather Advisory',
    };
    return titles[condition] || 'Weather Advisory';
  }

  private getAlertDescription(condition: WeatherConditionType): string {
    const descriptions: Partial<Record<WeatherConditionType, string>> = {
      thunderstorm: 'Severe thunderstorms expected. Avoid outdoor activities and seek shelter.',
      heavy_rain:
        'Heavy rainfall may cause flooding and poor visibility. Plan indoor alternatives.',
      extreme_heat: 'Dangerously high temperatures. Stay hydrated and limit outdoor exposure.',
      extreme_cold: 'Dangerously cold temperatures. Dress in layers and limit outdoor exposure.',
      hail: 'Hail expected. Stay indoors and protect vehicles.',
      snow: 'Significant snowfall expected. Travel may be hazardous.',
    };
    return descriptions[condition] || 'Check weather conditions before outdoor activities.';
  }

  // ============================================================================
  // Activity Weather Assessment
  // ============================================================================

  // eslint-disable-next-line complexity -- tracked in #1
  assessActivityWeather(
    activity: WeatherAwareActivity,
    forecast: DailyForecast,
    timeSlot?: string
  ): WeatherSuitability {
    const requirements = activity.weatherRequirements;
    const condition = timeSlot ? this.getHourlyCondition(forecast, timeSlot) : forecast.condition;

    let score = 100;
    const warnings: string[] = [];
    const tips: string[] = [];
    const adjustments: ActivityAdjustment[] = [];

    // Check if outdoor and weather is bad
    if (requirements.isOutdoor) {
      // Check unsuitable conditions
      if (requirements.unsuitableConditions.includes(condition.type)) {
        score -= 60;
        warnings.push(
          `${CONDITION_ICONS[condition.type]} Weather not suitable for this outdoor activity`
        );

        if (requirements.hasIndoorOption) {
          tips.push('Consider the indoor option for this activity');
        } else {
          adjustments.push({
            type: 'reschedule',
            description: 'Consider rescheduling to a day with better weather',
            icon: '📅',
            priority: 'recommended',
          });
        }
      }
      // Check suitable but not ideal
      else if (
        requirements.suitableConditions.includes(condition.type) &&
        requirements.idealConditions &&
        !requirements.idealConditions.includes(condition.type)
      ) {
        score -= 15;
        tips.push('Conditions are acceptable but not ideal');
      }
    }

    // Temperature checks
    if (requirements.minTemp !== undefined && condition.temperature < requirements.minTemp) {
      const diff = requirements.minTemp - condition.temperature;
      score -= Math.min(diff * 3, 30);
      warnings.push(
        `Temperature (${condition.temperature}°C) below recommended minimum (${requirements.minTemp}°C)`
      );
      adjustments.push({
        type: 'bring_layers',
        description: 'Dress warmly in layers',
        icon: '🧥',
        priority: 'required',
      });
    }

    if (requirements.maxTemp !== undefined && condition.temperature > requirements.maxTemp) {
      const diff = condition.temperature - requirements.maxTemp;
      score -= Math.min(diff * 3, 30);
      warnings.push(
        `Temperature (${condition.temperature}°C) above recommended maximum (${requirements.maxTemp}°C)`
      );
      adjustments.push({
        type: 'bring_water',
        description: 'Stay hydrated - bring plenty of water',
        icon: '💧',
        priority: 'required',
      });
      adjustments.push({
        type: 'bring_sunscreen',
        description: 'Apply sunscreen frequently',
        icon: '🧴',
        priority: 'required',
      });
    }

    // Wind check
    if (requirements.maxWindSpeed && condition.windSpeed > requirements.maxWindSpeed) {
      score -= 20;
      warnings.push(`Wind speeds (${condition.windSpeed} km/h) exceed safe limit`);
      if (activity.category === 'water_sports') {
        adjustments.push({
          type: 'reschedule',
          description: 'High winds make water activities dangerous',
          icon: '💨',
          priority: 'required',
        });
      }
    }

    // Precipitation check
    if (
      requirements.maxPrecipitationChance &&
      condition.precipitation > requirements.maxPrecipitationChance
    ) {
      score -= (condition.precipitation - requirements.maxPrecipitationChance) * 0.5;
      if (condition.precipitation > 50) {
        warnings.push(`${condition.precipitation}% chance of rain`);
        adjustments.push({
          type: 'bring_umbrella',
          description: 'Pack rain gear just in case',
          icon: '☂️',
          priority: condition.precipitation > 70 ? 'required' : 'recommended',
        });
      }
    }

    // UV check
    if (requirements.maxUvIndex && condition.uvIndex > requirements.maxUvIndex) {
      score -= 10;
      warnings.push(`UV index (${condition.uvIndex}) is very high`);
      adjustments.push({
        type: 'bring_hat',
        description: 'Wear a hat and protective clothing',
        icon: '🧢',
        priority: 'required',
      });
      adjustments.push({
        type: 'bring_sunscreen',
        description: 'Use SPF 50+ sunscreen',
        icon: '🧴',
        priority: 'required',
      });
    }

    // Visibility check
    if (requirements.minVisibility && condition.visibility < requirements.minVisibility) {
      score -= 25;
      warnings.push('Limited visibility may affect the experience');
    }

    // Clear skies requirement
    if (requirements.requiresClearSkies && !['sunny', 'partly_cloudy'].includes(condition.type)) {
      score -= 40;
      warnings.push('This activity requires clear skies for the best experience');
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    // Determine severity
    let severity: WeatherSeverity;
    if (score >= 80) severity = 'ideal';
    else if (score >= 60) severity = 'good';
    else if (score >= 40) severity = 'fair';
    else if (score >= 20) severity = 'poor';
    else severity = 'dangerous';

    // Get best time slots
    const bestTimeSlots = this.findBestTimeSlots(activity, forecast);

    return {
      score,
      severity,
      isRecommended: score >= 50,
      warnings,
      tips,
      adjustments,
      bestTimeSlots,
    };
  }

  private getHourlyCondition(forecast: DailyForecast, timeSlot: string): WeatherCondition {
    const hourly = forecast.hourlyForecast.find((h) => h.time === timeSlot);
    if (hourly) {
      return hourly.condition;
    }
    return forecast.condition;
  }

  private findBestTimeSlots(
    activity: WeatherAwareActivity,
    forecast: DailyForecast
  ): TimeSlotRecommendation[] {
    const recommendations: TimeSlotRecommendation[] = [];

    for (const slot of activity.availableTimeSlots) {
      const hourly = forecast.hourlyForecast.find((h) => h.time === slot);
      if (!hourly) continue;

      const miniSuitability = this.assessActivityWeather(
        activity,
        { ...forecast, condition: hourly.condition },
        slot
      );

      const endTime = this.calculateEndTime(slot, activity.duration);

      recommendations.push({
        startTime: slot,
        endTime,
        score: miniSuitability.score,
        reason: this.getTimeSlotReason(hourly.condition, miniSuitability.score),
        condition: hourly.condition,
      });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  private calculateEndTime(startTime: string, duration: { value: number; unit: string }): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (duration.unit === 'hours') {
      totalMinutes += duration.value * 60;
    } else {
      totalMinutes += duration.value;
    }

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private getTimeSlotReason(condition: WeatherCondition, score: number): string {
    if (score >= 80) {
      return `Great conditions: ${condition.temperature}°C, ${condition.description}`;
    } else if (score >= 60) {
      return `Good conditions with minor concerns`;
    } else if (score >= 40) {
      return `Acceptable but be prepared for ${condition.description.toLowerCase()}`;
    } else {
      return `Not recommended: ${condition.description}`;
    }
  }

  // ============================================================================
  // Indoor Alternatives
  // ============================================================================

  getIndoorAlternatives(activityId: string, category: ActivityCategory): IndoorAlternative[] {
    // Get pre-mapped alternatives
    const mapped = INDOOR_ALTERNATIVES_MAP[activityId] || [];

    // Also suggest general indoor activities for the category
    const categoryAlternatives = MOCK_ACTIVITIES.filter(
      (a) =>
        !a.weatherRequirements.isOutdoor &&
        (a.category === category || this.isSimilarCategory(a.category, category))
    )
      .slice(0, 3)
      .map((a) => ({
        originalActivityId: activityId,
        alternativeId: a.id,
        alternativeName: a.name,
        reason: 'Indoor alternative for bad weather',
        matchScore: this.calculateMatchScore(category, a.category),
        category: a.category,
        highlights: a.tags.slice(0, 3),
        priceComparison: 'similar' as const,
      }));

    return [...mapped, ...categoryAlternatives].slice(0, 5);
  }

  private isSimilarCategory(cat1: ActivityCategory, cat2: ActivityCategory): boolean {
    const groups: ActivityCategory[][] = [
      ['outdoor_adventure', 'hiking', 'cycling'],
      ['water_sports', 'beach'],
      ['cultural', 'sightseeing'],
      ['food_drink', 'nightlife'],
      ['wellness', 'shopping'],
    ];

    return groups.some((group) => group.includes(cat1) && group.includes(cat2));
  }

  private calculateMatchScore(original: ActivityCategory, alternative: ActivityCategory): number {
    if (original === alternative) return 100;
    if (this.isSimilarCategory(original, alternative)) return 75;
    return 50;
  }

  // ============================================================================
  // Itinerary Impact Assessment
  // ============================================================================

  async assessItineraryWeather(
    activities: WeatherAwareActivity[],
    forecast: WeatherForecastResponse
  ): Promise<ItineraryWeatherImpact[]> {
    const impacts: ItineraryWeatherImpact[] = [];

    for (const dailyForecast of forecast.daily) {
      const dayActivities = activities.filter(
        (a) => a.availableTimeSlots.length > 0 // Activities scheduled for this day
      );

      const affectedActivities: AffectedActivity[] = [];
      let dayScore = 100;

      for (const activity of dayActivities) {
        const suitability = this.assessActivityWeather(activity, dailyForecast);
        dayScore = Math.min(dayScore, suitability.score);

        if (suitability.score < 70) {
          affectedActivities.push({
            activityId: activity.id,
            activityName: activity.name,
            scheduledTime: activity.availableTimeSlots[0],
            suitability,
            alternativeActivities: this.getIndoorAlternatives(activity.id, activity.category),
            suggestedRescheduleTime: suitability.bestTimeSlots[0]?.startTime,
          });
        }
      }

      const recommendations = this.generateDayRecommendations(
        dailyForecast,
        affectedActivities,
        dayScore
      );

      impacts.push({
        date: dailyForecast.date,
        overallScore: dayScore,
        affectedActivities,
        recommendations,
        alerts: forecast.alerts.filter(
          (a) =>
            a.startTime.startsWith(dailyForecast.date) || a.endTime.startsWith(dailyForecast.date)
        ),
      });
    }

    return impacts;
  }

  private generateDayRecommendations(
    forecast: DailyForecast,
    affected: AffectedActivity[],
    dayScore: number
  ): ItineraryRecommendation[] {
    const recommendations: ItineraryRecommendation[] = [];

    // Overall day recommendation
    if (dayScore < 40) {
      recommendations.push({
        type: 'reschedule',
        priority: 'high',
        title: 'Consider Rescheduling Outdoor Activities',
        description: `Weather conditions on ${forecast.dayName} look challenging. Consider moving outdoor activities to a different day.`,
        affectedActivityIds: affected.map((a) => a.activityId),
      });
    }

    // Activity-specific recommendations
    for (const activity of affected) {
      if (activity.suitability.score < 30) {
        if (activity.alternativeActivities.length > 0) {
          recommendations.push({
            type: 'replace',
            priority: 'high',
            title: `Replace "${activity.activityName}"`,
            description: `Weather makes this activity risky. Consider "${activity.alternativeActivities[0].alternativeName}" instead.`,
            affectedActivityIds: [activity.activityId],
            suggestedAction: {
              type: 'replace_with',
              parameters: { alternativeId: activity.alternativeActivities[0].alternativeId },
            },
          });
        }
      } else if (activity.suitability.score < 60) {
        if (activity.suitability.bestTimeSlots.length > 0) {
          recommendations.push({
            type: 'reschedule',
            priority: 'medium',
            title: `Adjust Time for "${activity.activityName}"`,
            description: `Better weather expected at ${activity.suitability.bestTimeSlots[0].startTime}`,
            affectedActivityIds: [activity.activityId],
            suggestedAction: {
              type: 'move_to_time',
              parameters: { newTime: activity.suitability.bestTimeSlots[0].startTime },
            },
          });
        }
      }
    }

    // Packing recommendations
    if (forecast.condition.precipitation > 40) {
      recommendations.push({
        type: 'pack_gear',
        priority: 'medium',
        title: 'Pack Rain Gear',
        description: `${forecast.condition.precipitation}% chance of rain. Bring an umbrella and waterproof jacket.`,
        affectedActivityIds: [],
      });
    }

    if (forecast.condition.uvIndex > 6) {
      recommendations.push({
        type: 'pack_gear',
        priority: 'medium',
        title: 'Sun Protection Needed',
        description: `UV index of ${forecast.condition.uvIndex}. Bring sunscreen, hat, and sunglasses.`,
        affectedActivityIds: [],
      });
    }

    return recommendations;
  }

  // ============================================================================
  // Packing List Generation
  // ============================================================================

  generatePackingList(forecast: WeatherForecastResponse): WeatherPackingList {
    const essentials: PackingSuggestion[] = [];
    const recommended: PackingSuggestion[] = [];
    const optional: PackingSuggestion[] = [];

    // Analyze all days
    const conditions = forecast.daily.map((d) => d.condition);
    const hasRain = conditions.some((c) =>
      ['light_rain', 'rainy', 'heavy_rain', 'thunderstorm'].includes(c.type)
    );
    const hasHeat = conditions.some((c) => c.temperature > 28 || c.uvIndex > 6);
    const hasCold = conditions.some((c) => c.temperature < 15);
    const hasWind = conditions.some((c) => c.windSpeed > 25);
    const maxTemp = Math.max(...conditions.map((c) => c.temperature));
    const minTemp = Math.min(...conditions.map((c) => c.temperature));

    // Rain gear
    if (hasRain) {
      essentials.push({
        item: 'Umbrella',
        icon: '☂️',
        reason: 'Rain expected during your trip',
        priority: 'essential',
        forConditions: ['light_rain', 'rainy', 'heavy_rain', 'thunderstorm'],
      });
      essentials.push({
        item: 'Waterproof Jacket',
        icon: '🧥',
        reason: 'Stay dry during outdoor activities',
        priority: 'essential',
        forConditions: ['light_rain', 'rainy', 'heavy_rain', 'thunderstorm'],
      });
    }

    // Sun protection
    if (hasHeat) {
      essentials.push({
        item: 'Sunscreen SPF 50+',
        icon: '🧴',
        reason: `High UV index (up to ${Math.max(...conditions.map((c) => c.uvIndex))}) expected`,
        priority: 'essential',
        forConditions: ['sunny', 'partly_cloudy'],
      });
      essentials.push({
        item: 'Sunglasses',
        icon: '🕶️',
        reason: 'Protect your eyes from bright sun',
        priority: 'essential',
        forConditions: ['sunny', 'partly_cloudy'],
      });
      recommended.push({
        item: 'Wide-Brimmed Hat',
        icon: '🎩',
        reason: 'Extra sun protection for outdoor activities',
        priority: 'recommended',
        forConditions: ['sunny', 'partly_cloudy'],
      });
      essentials.push({
        item: 'Reusable Water Bottle',
        icon: '💧',
        reason: `Temperatures up to ${maxTemp}°C - stay hydrated`,
        priority: 'essential',
        forConditions: ['sunny', 'extreme_heat'],
      });
    }

    // Cold weather
    if (hasCold) {
      essentials.push({
        item: 'Warm Layers',
        icon: '🧣',
        reason: `Temperatures as low as ${minTemp}°C expected`,
        priority: 'essential',
        forConditions: ['cloudy', 'overcast', 'snow'],
      });
      if (minTemp < 10) {
        recommended.push({
          item: 'Light Jacket',
          icon: '🧥',
          reason: 'Evenings may be cool',
          priority: 'recommended',
          forConditions: ['cloudy', 'overcast'],
        });
      }
    }

    // Wind
    if (hasWind) {
      recommended.push({
        item: 'Windbreaker',
        icon: '💨',
        reason: 'Strong winds expected some days',
        priority: 'recommended',
        forConditions: ['windy'],
      });
    }

    // General items
    recommended.push({
      item: 'Comfortable Walking Shoes',
      icon: '👟',
      reason: 'Essential for exploring',
      priority: 'recommended',
      forConditions: [],
    });

    // Weather summary
    const weatherSummary = this.generateWeatherSummary(forecast, maxTemp, minTemp, hasRain);

    return {
      tripDates: {
        start: forecast.daily[0]?.date || '',
        end: forecast.daily[forecast.daily.length - 1]?.date || '',
      },
      location: forecast.location.name,
      essentials,
      recommended,
      optional,
      weatherSummary,
    };
  }

  private generateWeatherSummary(
    forecast: WeatherForecastResponse,
    maxTemp: number,
    minTemp: number,
    hasRain: boolean
  ): string {
    const days = forecast.daily.length;
    const sunnyDays = forecast.daily.filter((d) =>
      ['sunny', 'partly_cloudy'].includes(d.condition.type)
    ).length;

    let summary = `Expect temperatures between ${minTemp}°C and ${maxTemp}°C during your ${days}-day trip to ${forecast.location.name}. `;

    if (sunnyDays === days) {
      summary += 'Beautiful weather with plenty of sunshine expected!';
    } else if (sunnyDays >= days * 0.7) {
      summary += 'Mostly sunny with some clouds.';
    } else if (hasRain) {
      summary += 'Mixed conditions with some rain expected. Pack accordingly!';
    } else {
      summary += 'Variable conditions - be prepared for changing weather.';
    }

    return summary;
  }

  // ============================================================================
  // User Preferences
  // ============================================================================

  async getWeatherPreferences(): Promise<WeatherPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_PREFERENCES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading weather preferences:', error);
    }

    // Default preferences
    return {
      temperatureUnit: 'celsius',
      heatSensitivity: 'medium',
      coldSensitivity: 'medium',
      rainTolerance: 'medium',
      preferredTempRange: { min: 18, max: 28 },
      autoSuggestAlternatives: true,
      showWeatherAlerts: true,
      notifyOnSignificantChange: true,
      badWeatherPreference: 'indoor_alternatives',
    };
  }

  async saveWeatherPreferences(preferences: WeatherPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEATHER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving weather preferences:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getWeatherIcon(type: WeatherConditionType): string {
    return CONDITION_ICONS[type] || '🌡️';
  }

  getConditionSeverity(type: WeatherConditionType): WeatherSeverity {
    return CONDITION_SEVERITY[type] || 'fair';
  }

  formatTemperature(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
    if (unit === 'fahrenheit') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  }

  private getCacheKey(request: WeatherForecastRequest): string {
    const loc =
      request.location.city ||
      `${request.location.coordinates?.lat},${request.location.coordinates?.lng}`;
    return `${loc}_${request.startDate}_${request.endDate}`;
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheObj: Record<string, any> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error persisting weather cache:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  clearCache(): void {
    this.cache.clear();
    AsyncStorage.removeItem(STORAGE_KEYS.WEATHER_CACHE);
  }
}

export const weatherService = new WeatherService();
export default weatherService;
