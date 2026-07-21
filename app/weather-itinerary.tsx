/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  CloudFog,
  Thermometer,
  Droplets,
  Eye,
  Sunrise,
  Sunset,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  RefreshCw,
  Calendar,
  Umbrella,
  Check,
  X,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { DailyForecast, WeatherCondition, WeatherActivity, WeatherAlertItem } from '@/types';

const { width } = Dimensions.get('window');

const mockForecasts: DailyForecast[] = [
  {
    date: '2025-01-25',
    dayName: 'Saturday',
    condition: {
      id: '1',
      type: 'sunny',
      temperature: 24,
      feelsLike: 26,
      humidity: 45,
      windSpeed: 12,
      uvIndex: 7,
      precipitation: 0,
      description: 'Clear skies with plenty of sunshine',
    },
    high: 26,
    low: 18,
    sunrise: '06:45',
    sunset: '19:30',
    hourlyForecast: [
      { time: '09:00', temperature: 20, condition: 'sunny', precipitation: 0 },
      { time: '12:00', temperature: 24, condition: 'sunny', precipitation: 0 },
      { time: '15:00', temperature: 26, condition: 'partly_cloudy', precipitation: 0 },
      { time: '18:00', temperature: 22, condition: 'partly_cloudy', precipitation: 0 },
    ],
  },
  {
    date: '2025-01-26',
    dayName: 'Sunday',
    condition: {
      id: '2',
      type: 'partly_cloudy',
      temperature: 22,
      feelsLike: 23,
      humidity: 55,
      windSpeed: 15,
      uvIndex: 5,
      precipitation: 10,
      description: 'Partly cloudy with mild temperatures',
    },
    high: 24,
    low: 17,
    sunrise: '06:46',
    sunset: '19:29',
    hourlyForecast: [
      { time: '09:00', temperature: 18, condition: 'cloudy', precipitation: 5 },
      { time: '12:00', temperature: 22, condition: 'partly_cloudy', precipitation: 10 },
      { time: '15:00', temperature: 24, condition: 'partly_cloudy', precipitation: 5 },
      { time: '18:00', temperature: 20, condition: 'cloudy', precipitation: 15 },
    ],
  },
  {
    date: '2025-01-27',
    dayName: 'Monday',
    condition: {
      id: '3',
      type: 'rainy',
      temperature: 18,
      feelsLike: 16,
      humidity: 80,
      windSpeed: 25,
      uvIndex: 2,
      precipitation: 70,
      description: 'Rain expected throughout the day',
    },
    high: 20,
    low: 15,
    sunrise: '06:47',
    sunset: '19:28',
    hourlyForecast: [
      { time: '09:00', temperature: 16, condition: 'rainy', precipitation: 60 },
      { time: '12:00', temperature: 18, condition: 'rainy', precipitation: 80 },
      { time: '15:00', temperature: 19, condition: 'rainy', precipitation: 70 },
      { time: '18:00', temperature: 17, condition: 'cloudy', precipitation: 40 },
    ],
  },
  {
    date: '2025-01-28',
    dayName: 'Tuesday',
    condition: {
      id: '4',
      type: 'stormy',
      temperature: 16,
      feelsLike: 13,
      humidity: 85,
      windSpeed: 40,
      uvIndex: 1,
      precipitation: 90,
      description: 'Thunderstorms expected - stay indoors',
    },
    high: 18,
    low: 14,
    sunrise: '06:48',
    sunset: '19:27',
    hourlyForecast: [
      { time: '09:00', temperature: 15, condition: 'stormy', precipitation: 85 },
      { time: '12:00', temperature: 16, condition: 'stormy', precipitation: 95 },
      { time: '15:00', temperature: 17, condition: 'rainy', precipitation: 75 },
      { time: '18:00', temperature: 15, condition: 'rainy', precipitation: 60 },
    ],
  },
  {
    date: '2025-01-29',
    dayName: 'Wednesday',
    condition: {
      id: '5',
      type: 'cloudy',
      temperature: 20,
      feelsLike: 19,
      humidity: 60,
      windSpeed: 18,
      uvIndex: 4,
      precipitation: 20,
      description: 'Overcast with clearing skies later',
    },
    high: 22,
    low: 16,
    sunrise: '06:49',
    sunset: '19:26',
    hourlyForecast: [
      { time: '09:00', temperature: 17, condition: 'cloudy', precipitation: 30 },
      { time: '12:00', temperature: 20, condition: 'cloudy', precipitation: 20 },
      { time: '15:00', temperature: 22, condition: 'partly_cloudy', precipitation: 10 },
      { time: '18:00', temperature: 19, condition: 'partly_cloudy', precipitation: 5 },
    ],
  },
];

const mockActivities: WeatherActivity[] = [
  {
    id: '1',
    name: 'Beach Day & Water Sports',
    description: 'Enjoy surfing, paddleboarding, and swimming at the beautiful coastline',
    category: 'water',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    duration: '4-6 hours',
    suitableWeather: ['sunny', 'partly_cloudy'],
    unsuitableWeather: ['rainy', 'stormy', 'snowy', 'foggy'],
    minTemp: 22,
    price: 45,
    currency: 'USD',
    rating: 4.8,
    location: 'Coastal Beach Resort',
    timeSlots: ['09:00', '10:00', '14:00'],
  },
  {
    id: '2',
    name: 'Mountain Hiking Trail',
    description: 'Scenic hike through lush forests with panoramic viewpoints',
    category: 'outdoor',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    duration: '3-4 hours',
    suitableWeather: ['sunny', 'partly_cloudy', 'cloudy'],
    unsuitableWeather: ['rainy', 'stormy', 'snowy'],
    minTemp: 15,
    maxTemp: 30,
    price: 25,
    currency: 'USD',
    rating: 4.9,
    location: 'National Park Entrance',
    timeSlots: ['07:00', '08:00', '09:00'],
  },
  {
    id: '3',
    name: 'Local Museum & Art Gallery',
    description: 'Explore world-class exhibits and contemporary art collections',
    category: 'cultural',
    image: 'https://images.unsplash.com/photo-1566054757965-8c4085344c96?w=800',
    duration: '2-3 hours',
    suitableWeather: [
      'sunny',
      'partly_cloudy',
      'cloudy',
      'rainy',
      'stormy',
      'snowy',
      'windy',
      'foggy',
    ],
    unsuitableWeather: [],
    price: 20,
    currency: 'USD',
    rating: 4.7,
    location: 'Downtown Cultural District',
    timeSlots: ['10:00', '13:00', '15:00'],
  },
  {
    id: '4',
    name: 'Spa & Wellness Retreat',
    description: 'Relaxing massage, thermal baths, and wellness treatments',
    category: 'relaxation',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    duration: '3-4 hours',
    suitableWeather: [
      'sunny',
      'partly_cloudy',
      'cloudy',
      'rainy',
      'stormy',
      'snowy',
      'windy',
      'foggy',
    ],
    unsuitableWeather: [],
    price: 120,
    currency: 'USD',
    rating: 4.9,
    location: 'Luxury Resort & Spa',
    timeSlots: ['09:00', '11:00', '14:00', '16:00'],
  },
  {
    id: '5',
    name: 'Cooking Class Experience',
    description: 'Learn to prepare authentic local dishes with expert chefs',
    category: 'indoor',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
    duration: '3 hours',
    suitableWeather: [
      'sunny',
      'partly_cloudy',
      'cloudy',
      'rainy',
      'stormy',
      'snowy',
      'windy',
      'foggy',
    ],
    unsuitableWeather: [],
    price: 85,
    currency: 'USD',
    rating: 4.8,
    location: 'Culinary School',
    timeSlots: ['10:00', '15:00', '18:00'],
  },
  {
    id: '6',
    name: 'Sunset Sailing Tour',
    description: 'Cruise along the coast with drinks and appetizers',
    category: 'water',
    image: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800',
    duration: '2-3 hours',
    suitableWeather: ['sunny', 'partly_cloudy'],
    unsuitableWeather: ['rainy', 'stormy', 'windy', 'foggy'],
    minTemp: 18,
    price: 95,
    currency: 'USD',
    rating: 4.9,
    location: 'Marina Harbor',
    timeSlots: ['17:00', '17:30'],
  },
  {
    id: '7',
    name: 'Indoor Rock Climbing',
    description: 'Challenge yourself at the state-of-the-art climbing facility',
    category: 'adventure',
    image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800',
    duration: '2 hours',
    suitableWeather: [
      'sunny',
      'partly_cloudy',
      'cloudy',
      'rainy',
      'stormy',
      'snowy',
      'windy',
      'foggy',
    ],
    unsuitableWeather: [],
    price: 40,
    currency: 'USD',
    rating: 4.6,
    location: 'Adventure Sports Center',
    timeSlots: ['10:00', '12:00', '14:00', '16:00', '18:00'],
  },
  {
    id: '8',
    name: 'Historical Walking Tour',
    description: 'Discover the rich history and architecture of the old town',
    category: 'cultural',
    image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
    duration: '2-3 hours',
    suitableWeather: ['sunny', 'partly_cloudy', 'cloudy'],
    unsuitableWeather: ['rainy', 'stormy', 'snowy'],
    price: 30,
    currency: 'USD',
    rating: 4.7,
    location: 'Old Town Square',
    timeSlots: ['09:00', '11:00', '14:00'],
  },
];

const mockAlerts: WeatherAlertItem[] = [
  {
    id: '1',
    type: 'storm',
    severity: 'high',
    title: 'Thunderstorm Warning',
    message:
      'Severe thunderstorms expected on Tuesday. Avoid outdoor activities and stay in safe locations.',
    date: '2025-01-28',
    affectedActivities: ['Beach Day', 'Mountain Hiking', 'Sunset Sailing'],
  },
  {
    id: '2',
    type: 'rain',
    severity: 'medium',
    title: 'Rain Advisory',
    message: 'Moderate rainfall expected Monday. Pack rain gear if going outdoors.',
    date: '2025-01-27',
    affectedActivities: ['Historical Walking Tour', 'Mountain Hiking'],
  },
];

const getWeatherIcon = (
  type: WeatherCondition['type'],
  size: number = 24,
  color: string = colors.text
) => {
  switch (type) {
    case 'sunny':
      return <Sun size={size} color={color} />;
    case 'partly_cloudy':
      return <Cloud size={size} color={color} />;
    case 'cloudy':
      return <Cloud size={size} color={color} />;
    case 'rainy':
      return <CloudRain size={size} color={color} />;
    case 'stormy':
      return <CloudLightning size={size} color={color} />;
    case 'snowy':
      return <Snowflake size={size} color={color} />;
    case 'windy':
      return <Wind size={size} color={color} />;
    case 'foggy':
      return <CloudFog size={size} color={color} />;
    default:
      return <Sun size={size} color={color} />;
  }
};

const getWeatherGradient = (type: WeatherCondition['type']): [string, string] => {
  switch (type) {
    case 'sunny':
      return ['#FF9500', '#FFB347'];
    case 'partly_cloudy':
      return ['#5FA8D3', '#87CEEB'];
    case 'cloudy':
      return ['#8E9AAF', '#B8C5D6'];
    case 'rainy':
      return ['#4A6FA5', '#6B8BB7'];
    case 'stormy':
      return ['#2C3E50', '#4A5568'];
    case 'snowy':
      return ['#E8F4F8', '#B8D4E3'];
    case 'windy':
      return ['#78909C', '#90A4AE'];
    case 'foggy':
      return ['#CFD8DC', '#ECEFF1'];
    default:
      return [colors.primary, colors.primaryLight];
  }
};

const getAlertColor = (severity: WeatherAlertItem['severity']) => {
  switch (severity) {
    case 'high':
      return colors.error;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.primaryLight;
    default:
      return colors.textSecondary;
  }
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function WeatherItineraryScreen() {
  const router = useRouter();
  const { trips } = useApp();
  const [selectedDay, setSelectedDay] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const currentTrip = trips.find((t) => t.status === 'upcoming' || t.status === 'planning');
  const destination = currentTrip?.destination.name || 'Barcelona, Spain';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const selectedForecast = mockForecasts[selectedDay];

  const getSuggestedActivities = useCallback((forecast: DailyForecast): WeatherActivity[] => {
    return mockActivities.filter((activity) => {
      const weatherSuitable = activity.suitableWeather.includes(forecast.condition.type);
      const notUnsuitable = !activity.unsuitableWeather.includes(forecast.condition.type);
      const tempSuitable =
        (!activity.minTemp || forecast.condition.temperature >= activity.minTemp) &&
        (!activity.maxTemp || forecast.condition.temperature <= activity.maxTemp);
      return weatherSuitable && notUnsuitable && tempSuitable;
    });
  }, []);

  const getAlternativeActivities = useCallback((forecast: DailyForecast): WeatherActivity[] => {
    return mockActivities.filter((activity) => {
      const isIndoor = ['indoor', 'cultural', 'relaxation'].includes(activity.category);
      return isIndoor && activity.unsuitableWeather.length === 0;
    });
  }, []);

  const suggestedActivities = useMemo(
    () => getSuggestedActivities(selectedForecast),
    [selectedForecast, getSuggestedActivities]
  );
  const alternativeActivities = useMemo(
    () => getAlternativeActivities(selectedForecast),
    [selectedForecast, getAlternativeActivities]
  );

  const dayAlerts = useMemo(
    () => mockAlerts.filter((alert) => alert.date === selectedForecast.date),
    [selectedForecast.date]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isGoodWeather = ['sunny', 'partly_cloudy'].includes(selectedForecast.condition.type);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Weather Itinerary',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient
          colors={getWeatherGradient(selectedForecast.condition.type)}
          style={styles.weatherHeader}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textLight} />
              <Text style={styles.locationText}>{destination}</Text>
            </View>

            <View style={styles.mainWeather}>
              <View style={styles.weatherIconLarge}>
                {getWeatherIcon(selectedForecast.condition.type, 64, colors.textLight)}
              </View>
              <Text style={styles.temperature}>{selectedForecast.condition.temperature}°</Text>
              <Text style={styles.weatherDescription}>
                {selectedForecast.condition.description}
              </Text>
              <View style={styles.highLow}>
                <Text style={styles.highLowText}>H: {selectedForecast.high}°</Text>
                <Text style={styles.highLowDivider}>|</Text>
                <Text style={styles.highLowText}>L: {selectedForecast.low}°</Text>
              </View>
            </View>

            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <Thermometer size={18} color={colors.textLight} />
                <Text style={styles.weatherDetailLabel}>Feels like</Text>
                <Text style={styles.weatherDetailValue}>
                  {selectedForecast.condition.feelsLike}°
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Droplets size={18} color={colors.textLight} />
                <Text style={styles.weatherDetailLabel}>Humidity</Text>
                <Text style={styles.weatherDetailValue}>
                  {selectedForecast.condition.humidity}%
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Wind size={18} color={colors.textLight} />
                <Text style={styles.weatherDetailLabel}>Wind</Text>
                <Text style={styles.weatherDetailValue}>
                  {selectedForecast.condition.windSpeed} km/h
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Umbrella size={18} color={colors.textLight} />
                <Text style={styles.weatherDetailLabel}>Rain</Text>
                <Text style={styles.weatherDetailValue}>
                  {selectedForecast.condition.precipitation}%
                </Text>
              </View>
            </View>

            <View style={styles.sunTimes}>
              <View style={styles.sunTime}>
                <Sunrise size={16} color={colors.textLight} />
                <Text style={styles.sunTimeText}>{selectedForecast.sunrise}</Text>
              </View>
              <View style={styles.sunTime}>
                <Sunset size={16} color={colors.textLight} />
                <Text style={styles.sunTimeText}>{selectedForecast.sunset}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {mockForecasts.map((forecast, index) => (
              <Pressable
                key={forecast.date}
                style={[styles.dayCard, selectedDay === index && styles.dayCardSelected]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayName, selectedDay === index && styles.dayNameSelected]}>
                  {forecast.dayName.slice(0, 3)}
                </Text>
                <Text style={[styles.dayDate, selectedDay === index && styles.dayDateSelected]}>
                  {formatDate(forecast.date)}
                </Text>
                <View style={styles.dayWeatherIcon}>
                  {getWeatherIcon(
                    forecast.condition.type,
                    24,
                    selectedDay === index ? colors.primary : colors.textSecondary
                  )}
                </View>
                <Text style={[styles.dayTemp, selectedDay === index && styles.dayTempSelected]}>
                  {forecast.high}°/{forecast.low}°
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.hourlySection}>
            <Text style={styles.sectionTitle}>Hourly Forecast</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hourlyScroll}
            >
              {selectedForecast.hourlyForecast.map((hour, index) => (
                <View key={index} style={styles.hourlyCard}>
                  <Text style={styles.hourlyTime}>{hour.time}</Text>
                  {getWeatherIcon(hour.condition, 20, colors.textSecondary)}
                  <Text style={styles.hourlyTemp}>{hour.temperature}°</Text>
                  {hour.precipitation > 0 && (
                    <View style={styles.hourlyPrecip}>
                      <Droplets size={10} color={colors.primaryLight} />
                      <Text style={styles.hourlyPrecipText}>{hour.precipitation}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {dayAlerts.length > 0 && (
            <View style={styles.alertsSection}>
              {dayAlerts.map((alert) => (
                <View
                  key={alert.id}
                  style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.severity) }]}
                >
                  <View style={styles.alertHeader}>
                    <AlertTriangle size={20} color={getAlertColor(alert.severity)} />
                    <Text style={[styles.alertTitle, { color: getAlertColor(alert.severity) }]}>
                      {alert.title}
                    </Text>
                  </View>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  {alert.affectedActivities.length > 0 && (
                    <View style={styles.affectedActivities}>
                      <Text style={styles.affectedLabel}>Affected activities:</Text>
                      <Text style={styles.affectedList}>{alert.affectedActivities.join(', ')}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.activitiesSection}>
            <View style={styles.activitiesHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {isGoodWeather ? 'Perfect Day For' : 'Recommended Activities'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {isGoodWeather
                    ? 'Great weather for outdoor adventures!'
                    : 'Weather-adjusted suggestions for you'}
                </Text>
              </View>
              {!isGoodWeather && (
                <Pressable
                  style={styles.alternativesToggle}
                  onPress={() => setShowAlternatives(!showAlternatives)}
                >
                  <RefreshCw size={16} color={colors.primary} />
                  <Text style={styles.alternativesToggleText}>
                    {showAlternatives ? 'Show All' : 'Indoor Only'}
                  </Text>
                </Pressable>
              )}
            </View>

            {(showAlternatives ? alternativeActivities : suggestedActivities).map((activity) => (
              <Pressable
                key={activity.id}
                style={styles.activityCard}
                onPress={() => console.log('Activity pressed:', activity.name)}
              >
                <Image
                  source={{ uri: activity.image }}
                  style={styles.activityImage}
                  contentFit="cover"
                />
                <View style={styles.activityContent}>
                  <View style={styles.activityTop}>
                    <View
                      style={[
                        styles.activityCategory,
                        { backgroundColor: getCategoryColor(activity.category) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityCategoryText,
                          { color: getCategoryColor(activity.category) },
                        ]}
                      >
                        {activity.category.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={styles.activityRating}>
                      <Star size={12} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.activityRatingText}>{activity.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityName}>{activity.name}</Text>
                  <Text style={styles.activityDescription} numberOfLines={2}>
                    {activity.description}
                  </Text>
                  <View style={styles.activityMeta}>
                    <View style={styles.activityMetaItem}>
                      <Clock size={14} color={colors.textTertiary} />
                      <Text style={styles.activityMetaText}>{activity.duration}</Text>
                    </View>
                    <View style={styles.activityMetaItem}>
                      <MapPin size={14} color={colors.textTertiary} />
                      <Text style={styles.activityMetaText} numberOfLines={1}>
                        {activity.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activityBottom}>
                    <Text style={styles.activityPrice}>
                      ${activity.price}
                      <Text style={styles.activityPricePer}> / person</Text>
                    </Text>
                    <View style={styles.weatherSuitability}>
                      {activity.suitableWeather.includes(selectedForecast.condition.type) ? (
                        <>
                          <Check size={14} color={colors.success} />
                          <Text style={[styles.suitabilityText, { color: colors.success }]}>
                            Ideal weather
                          </Text>
                        </>
                      ) : (
                        <>
                          <X size={14} color={colors.warning} />
                          <Text style={[styles.suitabilityText, { color: colors.warning }]}>
                            Weather may vary
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} style={styles.activityArrow} />
              </Pressable>
            ))}
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Weather Tips</Text>
            <View style={styles.tipsGrid}>
              {getWeatherTips(selectedForecast.condition.type).map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipIcon}>{tip.icon}</View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const getCategoryColor = (category: WeatherActivity['category']): string => {
  switch (category) {
    case 'outdoor':
      return colors.success;
    case 'indoor':
      return colors.primary;
    case 'water':
      return colors.accentDark;
    case 'cultural':
      return colors.secondary;
    case 'adventure':
      return colors.error;
    case 'relaxation':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
};

const getWeatherTips = (weatherType: WeatherCondition['type']) => {
  switch (weatherType) {
    case 'sunny':
      return [
        { icon: <Sun size={20} color={colors.warning} />, text: 'Apply SPF 30+ sunscreen' },
        { icon: <Droplets size={20} color={colors.accentDark} />, text: 'Stay hydrated' },
        { icon: <Eye size={20} color={colors.primary} />, text: 'Wear sunglasses' },
      ];
    case 'rainy':
    case 'stormy':
      return [
        { icon: <Umbrella size={20} color={colors.primary} />, text: 'Bring an umbrella' },
        { icon: <CloudRain size={20} color={colors.accentDark} />, text: 'Wear waterproof shoes' },
        {
          icon: <AlertTriangle size={20} color={colors.warning} />,
          text: 'Check for flash flood warnings',
        },
      ];
    case 'snowy':
      return [
        { icon: <Thermometer size={20} color={colors.accentDark} />, text: 'Dress in warm layers' },
        { icon: <Snowflake size={20} color={colors.primary} />, text: 'Watch for icy surfaces' },
        { icon: <Eye size={20} color={colors.textSecondary} />, text: 'Wear snow boots' },
      ];
    case 'windy':
      return [
        { icon: <Wind size={20} color={colors.textSecondary} />, text: 'Secure loose items' },
        { icon: <AlertTriangle size={20} color={colors.warning} />, text: 'Avoid tall structures' },
        { icon: <Eye size={20} color={colors.primary} />, text: 'Protect your eyes from debris' },
      ];
    default:
      return [
        {
          icon: <Calendar size={20} color={colors.primary} />,
          text: 'Check weather updates regularly',
        },
        {
          icon: <Umbrella size={20} color={colors.accentDark} />,
          text: 'Pack layers for changing weather',
        },
        { icon: <MapPin size={20} color={colors.secondary} />, text: 'Have backup indoor plans' },
      ];
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  weatherHeader: {
    paddingBottom: 24,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
    opacity: 0.9,
  },
  mainWeather: {
    alignItems: 'center',
    marginBottom: 24,
  },
  weatherIconLarge: {
    marginBottom: 8,
  },
  temperature: {
    fontSize: 72,
    fontWeight: '200',
    color: colors.textLight,
    lineHeight: 80,
  },
  weatherDescription: {
    fontSize: 16,
    color: colors.textLight,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
  highLow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  highLowText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textLight,
    opacity: 0.85,
  },
  highLowDivider: {
    fontSize: 15,
    color: colors.textLight,
    opacity: 0.5,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  weatherDetail: {
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailLabel: {
    fontSize: 11,
    color: colors.textLight,
    opacity: 0.75,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  sunTimes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  sunTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sunTimeText: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.85,
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
  },
  daysScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 4,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: colors.primary,
  },
  dayDate: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 10,
  },
  dayDateSelected: {
    color: colors.primary,
  },
  dayWeatherIcon: {
    marginBottom: 10,
  },
  dayTemp: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayTempSelected: {
    color: colors.primary,
  },
  hourlySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 12,
  },
  hourlyScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  hourlyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minWidth: 64,
    gap: 8,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hourlyTemp: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  hourlyPrecip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hourlyPrecipText: {
    fontSize: 10,
    color: colors.primaryLight,
  },
  alertsSection: {
    padding: 20,
    gap: 12,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  affectedActivities: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  affectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 4,
  },
  affectedList: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activitiesSection: {
    marginTop: 8,
    paddingBottom: 16,
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  alternativesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  alternativesToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  activityCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  activityImage: {
    width: 100,
    height: '100%',
    minHeight: 140,
  },
  activityContent: {
    flex: 1,
    padding: 14,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityCategory: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activityCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activityRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  activityRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityMetaText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  activityBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  activityPricePer: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textTertiary,
  },
  weatherSuitability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suitabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityArrow: {
    alignSelf: 'center',
    marginRight: 12,
  },
  tipsSection: {
    marginTop: 8,
    paddingBottom: 16,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  tipCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: (width - 52) / 2,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});
