// useWeatherAware Hook for Paint the Town
// Provides weather data and activity recommendations in React components

import { useState, useEffect, useCallback, useMemo } from 'react';
import weatherService from '../services/weatherService';
import {
  WeatherForecastResponse,
  WeatherForecastRequest,
  DailyForecast,
  WeatherCondition,
  WeatherAlert,
  WeatherSuitability,
  WeatherAwareActivity,
  ItineraryWeatherImpact,
  IndoorAlternative,
  WeatherPreferences,
  WeatherPackingList,
  ActivityAdjustment,
} from '../types/weather';
import { MOCK_ACTIVITIES } from '../data/mockWeatherData';

interface UseWeatherAwareOptions {
  location?: {
    coordinates?: { lat: number; lng: number };
    city?: string;
    country?: string;
  };
  startDate?: string;
  endDate?: string;
  autoLoad?: boolean;
}

interface UseWeatherAwareReturn {
  // State
  forecast: WeatherForecastResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Current conditions
  currentConditions: WeatherCondition | null;
  todayForecast: DailyForecast | null;
  alerts: WeatherAlert[];
  
  // Preferences
  preferences: WeatherPreferences | null;
  updatePreferences: (prefs: Partial<WeatherPreferences>) => Promise<void>;
  
  // Actions
  loadForecast: (request?: WeatherForecastRequest) => Promise<void>;
  refresh: () => Promise<void>;
  clearCache: () => void;
  
  // Activity assessment
  assessActivity: (activity: WeatherAwareActivity, date?: string, time?: string) => WeatherSuitability | null;
  getActivitiesForDate: (date: string) => WeatherAwareActivity[];
  getSuitableActivities: (date: string) => WeatherAwareActivity[];
  getIndoorAlternatives: (activityId: string) => IndoorAlternative[];
  
  // Itinerary assessment
  assessItinerary: (activities: WeatherAwareActivity[]) => Promise<ItineraryWeatherImpact[]>;
  
  // Recommendations
  getBestTimeSlots: (activity: WeatherAwareActivity, date: string) => { time: string; score: number; reason: string }[];
  getPackingList: () => WeatherPackingList | null;
  getAdjustmentsForDay: (date: string) => ActivityAdjustment[];
  
  // Helpers
  formatTemperature: (celsius: number) => string;
  getWeatherIcon: (type: string) => string;
  getDayForecast: (date: string) => DailyForecast | null;
  isGoodWeatherDay: (date: string) => boolean;
}

export function useWeatherAware(options: UseWeatherAwareOptions = {}): UseWeatherAwareReturn {
  const { location, startDate, endDate, autoLoad = true } = options;

  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<WeatherPreferences | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Auto-load forecast if enabled
  useEffect(() => {
    if (autoLoad && location) {
      loadForecast();
    }
  }, [autoLoad, location?.city, location?.coordinates?.lat, location?.coordinates?.lng]);

  const loadPreferences = async () => {
    const prefs = await weatherService.getWeatherPreferences();
    setPreferences(prefs);
  };

  const updatePreferences = async (updates: Partial<WeatherPreferences>) => {
    if (!preferences) return;
    const newPrefs = { ...preferences, ...updates };
    await weatherService.saveWeatherPreferences(newPrefs);
    setPreferences(newPrefs);
  };

  const loadForecast = useCallback(async (request?: WeatherForecastRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const forecastRequest: WeatherForecastRequest = request || {
        location: location || { city: 'Barcelona', country: 'Spain' },
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        includeHourly: true,
        includeAlerts: true,
      };

      const data = await weatherService.getWeatherForecast(forecastRequest);
      setForecast(data);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather forecast');
    } finally {
      setIsLoading(false);
    }
  }, [location, startDate, endDate]);

  const refresh = useCallback(async () => {
    weatherService.clearCache();
    await loadForecast();
  }, [loadForecast]);

  const clearCache = useCallback(() => {
    weatherService.clearCache();
  }, []);

  // Current conditions
  const currentConditions = useMemo(() => {
    return forecast?.current || null;
  }, [forecast]);

  const todayForecast = useMemo(() => {
    if (!forecast) return null;
    const today = new Date().toISOString().split('T')[0];
    return forecast.daily.find(d => d.date === today) || forecast.daily[0] || null;
  }, [forecast]);

  const alerts = useMemo(() => {
    return forecast?.alerts || [];
  }, [forecast]);

  // Get forecast for a specific date
  const getDayForecast = useCallback((date: string): DailyForecast | null => {
    if (!forecast) return null;
    return forecast.daily.find(d => d.date === date) || null;
  }, [forecast]);

  // Assess activity weather suitability
  const assessActivity = useCallback((
    activity: WeatherAwareActivity,
    date?: string,
    time?: string
  ): WeatherSuitability | null => {
    if (!forecast) return null;

    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayForecast = getDayForecast(targetDate);
    
    if (!dayForecast) return null;

    return weatherService.assessActivityWeather(activity, dayForecast, time);
  }, [forecast, getDayForecast]);

  // Get all activities available for a date
  const getActivitiesForDate = useCallback((date: string): WeatherAwareActivity[] => {
    // In production, this would filter based on actual bookings/availability
    return MOCK_ACTIVITIES;
  }, []);

  // Get activities suitable for the weather on a given date
  const getSuitableActivities = useCallback((date: string): WeatherAwareActivity[] => {
    const dayForecast = getDayForecast(date);
    if (!dayForecast) return [];

    return MOCK_ACTIVITIES.filter(activity => {
      const suitability = weatherService.assessActivityWeather(activity, dayForecast);
      return suitability.isRecommended;
    }).sort((a, b) => {
      const suitA = weatherService.assessActivityWeather(a, dayForecast);
      const suitB = weatherService.assessActivityWeather(b, dayForecast);
      return suitB.score - suitA.score;
    });
  }, [getDayForecast]);

  // Get indoor alternatives for an activity
  const getIndoorAlternatives = useCallback((activityId: string): IndoorAlternative[] => {
    const activity = MOCK_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return [];
    return weatherService.getIndoorAlternatives(activityId, activity.category);
  }, []);

  // Assess full itinerary
  const assessItinerary = useCallback(async (
    activities: WeatherAwareActivity[]
  ): Promise<ItineraryWeatherImpact[]> => {
    if (!forecast) return [];
    return weatherService.assessItineraryWeather(activities, forecast);
  }, [forecast]);

  // Get best time slots for an activity on a given date
  const getBestTimeSlots = useCallback((
    activity: WeatherAwareActivity,
    date: string
  ): { time: string; score: number; reason: string }[] => {
    const dayForecast = getDayForecast(date);
    if (!dayForecast) return [];

    const suitability = weatherService.assessActivityWeather(activity, dayForecast);
    return suitability.bestTimeSlots.map(slot => ({
      time: slot.startTime,
      score: slot.score,
      reason: slot.reason,
    }));
  }, [getDayForecast]);

  // Generate packing list based on forecast
  const getPackingList = useCallback((): WeatherPackingList | null => {
    if (!forecast) return null;
    return weatherService.generatePackingList(forecast);
  }, [forecast]);

  // Get weather adjustments for a specific day
  const getAdjustmentsForDay = useCallback((date: string): ActivityAdjustment[] => {
    const dayForecast = getDayForecast(date);
    if (!dayForecast) return [];

    const adjustments: ActivityAdjustment[] = [];
    const condition = dayForecast.condition;

    // Rain gear
    if (condition.precipitation > 40) {
      adjustments.push({
        type: 'bring_umbrella',
        description: `${condition.precipitation}% chance of rain`,
        icon: '☂️',
        priority: condition.precipitation > 70 ? 'required' : 'recommended',
      });
    }

    // Sun protection
    if (condition.uvIndex > 6) {
      adjustments.push({
        type: 'bring_sunscreen',
        description: `UV index ${condition.uvIndex} - high sun exposure`,
        icon: '🧴',
        priority: 'required',
      });
      adjustments.push({
        type: 'bring_hat',
        description: 'Protect yourself from the sun',
        icon: '🧢',
        priority: 'recommended',
      });
    }

    // Temperature adjustments
    if (condition.temperature > 28) {
      adjustments.push({
        type: 'bring_water',
        description: `High temperature (${condition.temperature}°C) - stay hydrated`,
        icon: '💧',
        priority: 'required',
      });
    }

    if (condition.temperature < 15) {
      adjustments.push({
        type: 'bring_layers',
        description: `Cool weather (${condition.temperature}°C) - dress warmly`,
        icon: '🧥',
        priority: 'required',
      });
    }

    // Wind
    if (condition.windSpeed > 30) {
      adjustments.push({
        type: 'check_conditions',
        description: `Strong winds (${condition.windSpeed} km/h) may affect outdoor activities`,
        icon: '💨',
        priority: 'recommended',
      });
    }

    return adjustments;
  }, [getDayForecast]);

  // Check if it's a good weather day
  const isGoodWeatherDay = useCallback((date: string): boolean => {
    const dayForecast = getDayForecast(date);
    if (!dayForecast) return false;

    const goodConditions = ['sunny', 'partly_cloudy', 'cloudy'];
    return (
      goodConditions.includes(dayForecast.condition.type) &&
      dayForecast.condition.precipitation < 30 &&
      dayForecast.condition.temperature >= 15 &&
      dayForecast.condition.temperature <= 32
    );
  }, [getDayForecast]);

  // Format temperature based on preferences
  const formatTemperature = useCallback((celsius: number): string => {
    const unit = preferences?.temperatureUnit || 'celsius';
    return weatherService.formatTemperature(celsius, unit);
  }, [preferences]);

  // Get weather icon
  const getWeatherIcon = useCallback((type: string): string => {
    return weatherService.getWeatherIcon(type as any);
  }, []);

  return {
    // State
    forecast,
    isLoading,
    error,
    lastUpdated,
    
    // Current conditions
    currentConditions,
    todayForecast,
    alerts,
    
    // Preferences
    preferences,
    updatePreferences,
    
    // Actions
    loadForecast,
    refresh,
    clearCache,
    
    // Activity assessment
    assessActivity,
    getActivitiesForDate,
    getSuitableActivities,
    getIndoorAlternatives,
    
    // Itinerary assessment
    assessItinerary,
    
    // Recommendations
    getBestTimeSlots,
    getPackingList,
    getAdjustmentsForDay,
    
    // Helpers
    formatTemperature,
    getWeatherIcon,
    getDayForecast,
    isGoodWeatherDay,
  };
}

export default useWeatherAware;
