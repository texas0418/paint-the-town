// Weather Forecast Screen for Paint the Town
// Comprehensive weather overview for trip planning with alerts and daily details

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  RefreshControl,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeatherAware } from '../hooks/useWeatherAware';
import {
  DailyForecast,
  HourlyForecast,
  WeatherAlert,
  WeatherConditionType,
} from '../types/weather';

const { width } = Dimensions.get('window');

interface WeatherForecastScreenProps {
  navigation?: any;
  route?: {
    params?: {
      location?: { city: string; country: string };
      tripDates?: { start: string; end: string };
      tripName?: string;
    };
  };
}

// Weather gradient colors by condition
const WEATHER_GRADIENTS: Record<WeatherConditionType, [string, string, string]> = {
  sunny: ['#FF9500', '#FFB347', '#FFD194'],
  partly_cloudy: ['#5FA8D3', '#87CEEB', '#B8D4E8'],
  cloudy: ['#8E9AAF', '#B8C5D6', '#D1D9E6'],
  overcast: ['#6B7280', '#9CA3AF', '#D1D5DB'],
  light_rain: ['#4A6FA5', '#6B8BB7', '#8EACCD'],
  rainy: ['#374151', '#4B5563', '#6B7280'],
  heavy_rain: ['#1F2937', '#374151', '#4B5563'],
  thunderstorm: ['#1F2937', '#374151', '#4B5563'],
  snow: ['#E5E7EB', '#F3F4F6', '#FFFFFF'],
  sleet: ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
  fog: ['#D1D5DB', '#E5E7EB', '#F3F4F6'],
  mist: ['#E5E7EB', '#F3F4F6', '#FFFFFF'],
  windy: ['#60A5FA', '#93C5FD', '#BFDBFE'],
  hail: ['#6B7280', '#9CA3AF', '#D1D5DB'],
  extreme_heat: ['#DC2626', '#F87171', '#FCA5A5'],
  extreme_cold: ['#1E40AF', '#3B82F6', '#60A5FA'],
};

// Alert severity colors
const ALERT_COLORS = {
  watch: '#F59E0B',
  advisory: '#3B82F6',
  warning: '#EF4444',
  emergency: '#7F1D1D',
};

export const WeatherForecastScreen: React.FC<WeatherForecastScreenProps> = ({
  navigation,
  route,
}) => {
  const location = route?.params?.location || { city: 'Barcelona', country: 'Spain' };
  const tripDates = route?.params?.tripDates;
  const tripName = route?.params?.tripName || `Trip to ${location.city}`;

  const {
    forecast,
    isLoading,
    error,
    refresh,
    formatTemperature,
    getWeatherIcon,
    isGoodWeatherDay,
    preferences,
  } = useWeatherAware({
    location,
    startDate: tripDates?.start,
    endDate: tripDates?.end,
    autoLoad: true,
  });

  const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Calculate trip weather summary
  const weatherSummary = useMemo(() => {
    if (!forecast?.daily || forecast.daily.length === 0) return null;

    const temps = forecast.daily.map((d) => d.condition.temperature);
    const highs = forecast.daily.map((d) => d.high);
    const lows = forecast.daily.map((d) => d.low);

    const goodDays = forecast.daily.filter((d) => isGoodWeatherDay(d.date)).length;
    const rainyDays = forecast.daily.filter((d) =>
      ['light_rain', 'rainy', 'heavy_rain', 'thunderstorm'].includes(d.condition.type)
    ).length;
    const sunnyDays = forecast.daily.filter((d) =>
      ['sunny', 'partly_cloudy'].includes(d.condition.type)
    ).length;

    return {
      avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length),
      maxTemp: Math.max(...highs),
      minTemp: Math.min(...lows),
      goodDays,
      rainyDays,
      sunnyDays,
      totalDays: forecast.daily.length,
      alerts: forecast.alerts?.length || 0,
    };
  }, [forecast, isGoodWeatherDay]);

  const handleDayPress = (day: DailyForecast) => {
    setSelectedDay(day);
    setShowDayModal(true);
  };

  const handleShareForecast = async () => {
    if (!forecast || !weatherSummary) return;

    const shareText =
      `🌤️ Weather Forecast for ${tripName}\n\n` +
      `📍 ${forecast.location.name}, ${forecast.location.country}\n` +
      `📅 ${forecast.daily[0]?.date} - ${forecast.daily[forecast.daily.length - 1]?.date}\n\n` +
      `🌡️ Temperature Range: ${weatherSummary.minTemp}°C - ${weatherSummary.maxTemp}°C\n` +
      `☀️ Sunny Days: ${weatherSummary.sunnyDays}/${weatherSummary.totalDays}\n` +
      `🌧️ Rainy Days: ${weatherSummary.rainyDays}/${weatherSummary.totalDays}\n` +
      `✨ Good Activity Days: ${weatherSummary.goodDays}/${weatherSummary.totalDays}\n\n` +
      `Plan your trip with Paint the Town! 🧳`;

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Error sharing forecast:', error);
    }
  };

  // Header with overall conditions
  const renderHeader = () => {
    if (!forecast || !weatherSummary) return null;

    const dominantCondition = forecast.daily[0]?.condition.type || 'sunny';
    const gradient = WEATHER_GRADIENTS[dominantCondition] || WEATHER_GRADIENTS.sunny;

    return (
      <LinearGradient colors={gradient} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareForecast}>
            <Text style={styles.shareButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.locationIcon}>{getWeatherIcon(dominantCondition)}</Text>
          <Text style={styles.locationName}>{forecast.location.name}</Text>
          <Text style={styles.locationCountry}>{forecast.location.country}</Text>

          <View style={styles.tempRange}>
            <Text style={styles.tempRangeText}>
              {weatherSummary.minTemp}°C - {weatherSummary.maxTemp}°C
            </Text>
          </View>

          <Text style={styles.tripDates}>
            {weatherSummary.totalDays} days • {forecast.daily[0]?.date.slice(5)} to{' '}
            {forecast.daily[forecast.daily.length - 1]?.date.slice(5)}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatIcon}>☀️</Text>
            <Text style={styles.quickStatValue}>{weatherSummary.sunnyDays}</Text>
            <Text style={styles.quickStatLabel}>Sunny</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatIcon}>🌧️</Text>
            <Text style={styles.quickStatValue}>{weatherSummary.rainyDays}</Text>
            <Text style={styles.quickStatLabel}>Rainy</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStat}>
            <Text style={styles.quickStatIcon}>✨</Text>
            <Text style={styles.quickStatValue}>{weatherSummary.goodDays}</Text>
            <Text style={styles.quickStatLabel}>Good for Activities</Text>
          </View>
        </View>

        {/* Alerts Banner */}
        {weatherSummary.alerts > 0 && (
          <TouchableOpacity style={styles.alertsBanner} onPress={() => setShowAlertsModal(true)}>
            <Text style={styles.alertsBannerIcon}>⚠️</Text>
            <Text style={styles.alertsBannerText}>
              {weatherSummary.alerts} weather alert{weatherSummary.alerts > 1 ? 's' : ''} for your
              trip
            </Text>
            <Text style={styles.alertsBannerArrow}>→</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    );
  };

  // Daily forecast cards
  const renderDayCard = (day: DailyForecast, index: number) => {
    const isGood = isGoodWeatherDay(day.date);
    const date = new Date(day.date);
    const isToday = new Date().toDateString() === date.toDateString();
    const dayAlerts =
      forecast?.alerts?.filter(
        (a) => a.startTime.includes(day.date) || a.endTime.includes(day.date)
      ) || [];

    return (
      <TouchableOpacity
        key={day.date}
        style={[styles.dayCard, !isGood && styles.dayCardWarning]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.8}
      >
        <View style={styles.dayCardLeft}>
          <View style={styles.dayCardDate}>
            <Text style={styles.dayCardWeekday}>{isToday ? 'Today' : day.dayName.slice(0, 3)}</Text>
            <Text style={styles.dayCardDay}>{date.getDate()}</Text>
          </View>
        </View>

        <View style={styles.dayCardCenter}>
          <Text style={styles.dayCardIcon}>{getWeatherIcon(day.condition.type)}</Text>
          <Text style={styles.dayCardCondition}>{day.condition.description}</Text>
          {dayAlerts.length > 0 && (
            <View style={styles.dayCardAlertBadge}>
              <Text style={styles.dayCardAlertText}>⚠️ {dayAlerts.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.dayCardRight}>
          <Text style={styles.dayCardHigh}>{formatTemperature(day.high)}</Text>
          <Text style={styles.dayCardLow}>{formatTemperature(day.low)}</Text>
          <View style={styles.dayCardDetails}>
            <Text style={styles.dayCardDetail}>💧 {day.condition.humidity}%</Text>
            <Text style={styles.dayCardDetail}>🌧️ {day.condition.precipitation}%</Text>
          </View>
        </View>

        <View style={styles.dayCardArrow}>
          <Text style={styles.dayCardArrowText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Weather tips section
  const renderWeatherTips = () => {
    if (!weatherSummary) return null;

    const tips: { icon: string; tip: string; priority: 'high' | 'medium' | 'low' }[] = [];

    if (weatherSummary.rainyDays > weatherSummary.totalDays / 2) {
      tips.push({
        icon: '☂️',
        tip: 'Pack rain gear - multiple rainy days expected',
        priority: 'high',
      });
    }
    if (weatherSummary.maxTemp > 30) {
      tips.push({
        icon: '🧴',
        tip: 'High temperatures expected - bring sun protection',
        priority: 'high',
      });
    }
    if (weatherSummary.minTemp < 10) {
      tips.push({
        icon: '🧣',
        tip: 'Cool evenings expected - pack warm layers',
        priority: 'medium',
      });
    }
    if (weatherSummary.alerts > 0) {
      tips.push({
        icon: '📱',
        tip: 'Check weather alerts before outdoor activities',
        priority: 'high',
      });
    }
    if (weatherSummary.sunnyDays >= weatherSummary.totalDays * 0.7) {
      tips.push({ icon: '😎', tip: 'Great conditions for outdoor activities!', priority: 'low' });
    }

    if (tips.length === 0) {
      tips.push({ icon: '✨', tip: 'Weather looks favorable for your trip!', priority: 'low' });
    }

    return (
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Weather Tips</Text>
        {tips.map((tip, index) => (
          <View
            key={index}
            style={[
              styles.tipCard,
              tip.priority === 'high' && styles.tipCardHigh,
              tip.priority === 'low' && styles.tipCardLow,
            ]}
          >
            <Text style={styles.tipIcon}>{tip.icon}</Text>
            <Text style={styles.tipText}>{tip.tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Day detail modal
  const renderDayModal = () => {
    if (!selectedDay) return null;

    const date = new Date(selectedDay.date);
    const dayAlerts =
      forecast?.alerts?.filter(
        (a) => a.startTime.includes(selectedDay.date) || a.endTime.includes(selectedDay.date)
      ) || [];

    return (
      <Modal
        visible={showDayModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDayModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDayModal(false)}>
              <Text style={styles.modalClose}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Day Header */}
            <LinearGradient
              colors={WEATHER_GRADIENTS[selectedDay.condition.type] || WEATHER_GRADIENTS.sunny}
              style={styles.dayModalHeader}
            >
              <Text style={styles.dayModalWeekday}>{selectedDay.dayName}</Text>
              <Text style={styles.dayModalDate}>
                {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.dayModalIcon}>{getWeatherIcon(selectedDay.condition.type)}</Text>
              <Text style={styles.dayModalTemp}>
                {formatTemperature(selectedDay.condition.temperature)}
              </Text>
              <Text style={styles.dayModalDesc}>{selectedDay.condition.description}</Text>
              <Text style={styles.dayModalHighLow}>
                H: {formatTemperature(selectedDay.high)} • L: {formatTemperature(selectedDay.low)}
              </Text>
            </LinearGradient>

            {/* Weather Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>🌡️</Text>
                <Text style={styles.detailLabel}>Feels Like</Text>
                <Text style={styles.detailValue}>
                  {formatTemperature(selectedDay.condition.feelsLike)}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>💧</Text>
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{selectedDay.condition.humidity}%</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>💨</Text>
                <Text style={styles.detailLabel}>Wind</Text>
                <Text style={styles.detailValue}>
                  {selectedDay.condition.windSpeed} km/h {selectedDay.condition.windDirection}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>🌧️</Text>
                <Text style={styles.detailLabel}>Precipitation</Text>
                <Text style={styles.detailValue}>{selectedDay.condition.precipitation}%</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>☀️</Text>
                <Text style={styles.detailLabel}>UV Index</Text>
                <Text style={styles.detailValue}>{selectedDay.condition.uvIndex}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailIcon}>👁️</Text>
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>{selectedDay.condition.visibility} km</Text>
              </View>
            </View>

            {/* Sunrise/Sunset */}
            <View style={styles.sunSection}>
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌅</Text>
                <Text style={styles.sunLabel}>Sunrise</Text>
                <Text style={styles.sunTime}>{selectedDay.sunrise}</Text>
              </View>
              <View style={styles.sunDivider} />
              <View style={styles.sunItem}>
                <Text style={styles.sunIcon}>🌇</Text>
                <Text style={styles.sunLabel}>Sunset</Text>
                <Text style={styles.sunTime}>{selectedDay.sunset}</Text>
              </View>
            </View>

            {/* Hourly Forecast */}
            {selectedDay.hourlyForecast && selectedDay.hourlyForecast.length > 0 && (
              <View style={styles.hourlySection}>
                <Text style={styles.sectionTitle}>Hourly Forecast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedDay.hourlyForecast.map((hour, index) => (
                    <View key={index} style={styles.hourlyCard}>
                      <Text style={styles.hourlyTime}>{hour.time}</Text>
                      <Text style={styles.hourlyIcon}>{getWeatherIcon(hour.condition.type)}</Text>
                      <Text style={styles.hourlyTemp}>
                        {formatTemperature(hour.condition.temperature)}
                      </Text>
                      <Text style={styles.hourlyRain}>💧 {hour.condition.precipitation}%</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Day Alerts */}
            {dayAlerts.length > 0 && (
              <View style={styles.dayAlertsSection}>
                <Text style={styles.sectionTitle}>⚠️ Weather Alerts</Text>
                {dayAlerts.map((alert) => (
                  <View
                    key={alert.id}
                    style={[styles.alertCard, { borderLeftColor: ALERT_COLORS[alert.severity] }]}
                  >
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDescription}>{alert.description}</Text>
                    <Text style={styles.alertTime}>
                      {alert.startTime.split('T')[1]?.slice(0, 5)} -{' '}
                      {alert.endTime.split('T')[1]?.slice(0, 5)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Activity Recommendation */}
            <View style={styles.activityRecommendation}>
              <Text style={styles.sectionTitle}>Activity Suitability</Text>
              <View style={styles.activityTypes}>
                {[
                  {
                    type: 'Beach',
                    icon: '🏖️',
                    good: selectedDay.condition.type === 'sunny' && selectedDay.high > 24,
                  },
                  {
                    type: 'Hiking',
                    icon: '🥾',
                    good:
                      ['sunny', 'partly_cloudy', 'cloudy'].includes(selectedDay.condition.type) &&
                      selectedDay.condition.precipitation < 30,
                  },
                  {
                    type: 'Cycling',
                    icon: '🚴',
                    good:
                      selectedDay.condition.windSpeed < 30 &&
                      selectedDay.condition.precipitation < 20,
                  },
                  {
                    type: 'Sightseeing',
                    icon: '📸',
                    good: !['heavy_rain', 'thunderstorm'].includes(selectedDay.condition.type),
                  },
                  {
                    type: 'Water Sports',
                    icon: '🚤',
                    good:
                      selectedDay.condition.type === 'sunny' &&
                      selectedDay.condition.windSpeed < 25,
                  },
                  { type: 'Indoor', icon: '🏛️', good: true },
                ].map((activity) => (
                  <View
                    key={activity.type}
                    style={[
                      styles.activityTypeCard,
                      activity.good ? styles.activityGood : styles.activityBad,
                    ]}
                  >
                    <Text style={styles.activityTypeIcon}>{activity.icon}</Text>
                    <Text
                      style={[
                        styles.activityTypeLabel,
                        activity.good ? styles.activityGoodText : styles.activityBadText,
                      ]}
                    >
                      {activity.type}
                    </Text>
                    <Text style={styles.activityTypeStatus}>{activity.good ? '✓' : '✗'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Alerts modal
  const renderAlertsModal = () => (
    <Modal
      visible={showAlertsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAlertsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAlertsModal(false)}>
            <Text style={styles.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Weather Alerts</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {forecast?.alerts && forecast.alerts.length > 0 ? (
            forecast.alerts.map((alert) => (
              <View
                key={alert.id}
                style={[styles.fullAlertCard, { borderLeftColor: ALERT_COLORS[alert.severity] }]}
              >
                <View style={styles.alertHeader}>
                  <View
                    style={[
                      styles.alertSeverityBadge,
                      { backgroundColor: ALERT_COLORS[alert.severity] },
                    ]}
                  >
                    <Text style={styles.alertSeverityText}>{alert.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.alertType}>{alert.type}</Text>
                </View>
                <Text style={styles.fullAlertTitle}>{alert.title}</Text>
                <Text style={styles.fullAlertDescription}>{alert.description}</Text>
                <View style={styles.alertMeta}>
                  <Text style={styles.alertMetaItem}>📅 {alert.startTime.split('T')[0]}</Text>
                  <Text style={styles.alertMetaItem}>
                    ⏰ {alert.startTime.split('T')[1]?.slice(0, 5)} -{' '}
                    {alert.endTime.split('T')[1]?.slice(0, 5)}
                  </Text>
                </View>
                <Text style={styles.alertSource}>Source: {alert.source}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noAlerts}>
              <Text style={styles.noAlertsIcon}>✨</Text>
              <Text style={styles.noAlertsText}>No weather alerts for your trip!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>🌤️</Text>
          <Text style={styles.loadingText}>Loading weather forecast...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        <View style={styles.content}>
          {/* Daily Forecast */}
          <Text style={styles.sectionTitle}>Daily Forecast</Text>
          {forecast?.daily.map((day, index) => renderDayCard(day, index))}

          {/* Weather Tips */}
          {renderWeatherTips()}

          {/* View Activities Button */}
          <TouchableOpacity
            style={styles.viewActivitiesButton}
            onPress={() =>
              navigation?.navigate('WeatherAwareActivities', {
                location,
                tripDates,
              })
            }
          >
            <Text style={styles.viewActivitiesIcon}>🎯</Text>
            <View style={styles.viewActivitiesContent}>
              <Text style={styles.viewActivitiesTitle}>View Weather-Adjusted Activities</Text>
              <Text style={styles.viewActivitiesSubtitle}>
                See recommended activities based on the forecast
              </Text>
            </View>
            <Text style={styles.viewActivitiesArrow}>→</Text>
          </TouchableOpacity>

          {/* Packing List Button */}
          <TouchableOpacity
            style={styles.packingButton}
            onPress={() =>
              navigation?.navigate('PackingList', {
                location,
                tripDates,
              })
            }
          >
            <Text style={styles.packingIcon}>🎒</Text>
            <View style={styles.packingContent}>
              <Text style={styles.packingTitle}>Weather-Based Packing List</Text>
              <Text style={styles.packingSubtitle}>
                Get packing suggestions based on the forecast
              </Text>
            </View>
            <Text style={styles.packingArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderDayModal()}
      {renderAlertsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Header
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  locationIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  locationName: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  locationCountry: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  tempRange: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  tempRangeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  tripDates: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  alertsBannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertsBannerText: {
    flex: 1,
    color: 'white',
    fontWeight: '600',
  },
  alertsBannerArrow: {
    color: 'white',
    fontSize: 18,
  },
  // Content
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 8,
  },
  // Day Cards
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dayCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  dayCardLeft: {
    marginRight: 16,
  },
  dayCardDate: {
    alignItems: 'center',
  },
  dayCardWeekday: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dayCardDay: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  dayCardCenter: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dayCardIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  dayCardCondition: {
    fontSize: 13,
    color: '#666',
  },
  dayCardAlertBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  dayCardAlertText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  dayCardRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  dayCardHigh: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  dayCardLow: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dayCardDetails: {
    alignItems: 'flex-end',
  },
  dayCardDetail: {
    fontSize: 11,
    color: '#888',
  },
  dayCardArrow: {
    paddingLeft: 8,
  },
  dayCardArrowText: {
    fontSize: 24,
    color: '#CCC',
  },
  // Tips Section
  tipsSection: {
    marginTop: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipCardHigh: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  tipCardLow: {
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  // Action Buttons
  viewActivitiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  viewActivitiesIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  viewActivitiesContent: {
    flex: 1,
  },
  viewActivitiesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  viewActivitiesSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  viewActivitiesArrow: {
    fontSize: 24,
    color: 'white',
  },
  packingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  packingIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  packingContent: {
    flex: 1,
  },
  packingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  packingSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  packingArrow: {
    fontSize: 24,
    color: 'white',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalClose: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
  },
  // Day Modal
  dayModalHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  dayModalWeekday: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  dayModalDate: {
    fontSize: 24,
    color: 'white',
    fontWeight: '800',
    marginBottom: 16,
  },
  dayModalIcon: {
    fontSize: 72,
    marginBottom: 12,
  },
  dayModalTemp: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
  },
  dayModalDesc: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  dayModalHighLow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  detailCard: {
    width: (width - 48) / 3,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  // Sun Section
  sunSection: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sunItem: {
    flex: 1,
    alignItems: 'center',
  },
  sunIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  sunLabel: {
    fontSize: 12,
    color: '#666',
  },
  sunTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sunDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  // Hourly Section
  hourlySection: {
    padding: 16,
  },
  hourlyCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 70,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  hourlyIcon: {
    fontSize: 24,
    marginVertical: 8,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  hourlyRain: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  // Day Alerts
  dayAlertsSection: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: '#888',
  },
  // Activity Recommendation
  activityRecommendation: {
    padding: 16,
  },
  activityTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityTypeCard: {
    width: (width - 56) / 3,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  activityGood: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  activityBad: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  activityTypeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  activityTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityGoodText: {
    color: '#059669',
  },
  activityBadText: {
    color: '#9CA3AF',
  },
  activityTypeStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  // Full Alert Card (Alerts Modal)
  fullAlertCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  alertSeverityText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
  alertType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  fullAlertTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  fullAlertDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  alertMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  alertMetaItem: {
    fontSize: 12,
    color: '#888',
    marginRight: 16,
  },
  alertSource: {
    fontSize: 11,
    color: '#AAA',
    fontStyle: 'italic',
  },
  noAlerts: {
    alignItems: 'center',
    padding: 60,
  },
  noAlertsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#666',
  },
});

export default WeatherForecastScreen;
