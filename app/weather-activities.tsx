/* eslint-disable max-lines -- tracked in #1 */
// Weather-Aware Activities Screen for Paint the Town
// Shows activities adjusted based on weather forecast

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeatherAware } from '../hooks/useWeatherAware';
import {
  WeatherAwareActivity,
  WeatherSuitability,
  DailyForecast,
  IndoorAlternative,
  ActivityAdjustment,
  WeatherConditionType,
} from '../types/weather';
import { MOCK_ACTIVITIES } from '../mocks/mockWeatherData';

const { width } = Dimensions.get('window');

interface WeatherAwareActivitiesScreenProps {
  navigation?: any;
  route?: {
    params?: {
      location?: { city: string; country: string };
      tripDates?: { start: string; end: string };
    };
  };
}

// Weather gradient colors
const WEATHER_GRADIENTS: Record<WeatherConditionType, [string, string]> = {
  sunny: ['#FF9500', '#FFB347'],
  partly_cloudy: ['#5FA8D3', '#87CEEB'],
  cloudy: ['#8E9AAF', '#B8C5D6'],
  overcast: ['#6B7280', '#9CA3AF'],
  light_rain: ['#4A6FA5', '#6B8BB7'],
  rainy: ['#374151', '#4B5563'],
  heavy_rain: ['#1F2937', '#374151'],
  thunderstorm: ['#1F2937', '#374151'],
  snow: ['#E5E7EB', '#D1D5DB'],
  sleet: ['#9CA3AF', '#D1D5DB'],
  fog: ['#D1D5DB', '#E5E7EB'],
  mist: ['#E5E7EB', '#F3F4F6'],
  windy: ['#60A5FA', '#93C5FD'],
  hail: ['#6B7280', '#9CA3AF'],
  extreme_heat: ['#DC2626', '#F87171'],
  extreme_cold: ['#1E40AF', '#3B82F6'],
};

// Severity colors
const SEVERITY_COLORS = {
  ideal: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  poor: '#EF4444',
  dangerous: '#7F1D1D',
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export const WeatherAwareActivitiesScreen: React.FC<WeatherAwareActivitiesScreenProps> = ({
  navigation,
  route,
}) => {
  const location = route?.params?.location || { city: 'Barcelona', country: 'Spain' };
  const tripDates = route?.params?.tripDates;

  const {
    forecast,
    isLoading,
    error,
    refresh,
    assessActivity,
    getSuitableActivities,
    getIndoorAlternatives,
    getDayForecast,
    getAdjustmentsForDay,
    formatTemperature,
    getWeatherIcon,
    isGoodWeatherDay,
  } = useWeatherAware({
    location,
    startDate: tripDates?.start,
    endDate: tripDates?.end,
    autoLoad: true,
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedActivity, setSelectedActivity] = useState<WeatherAwareActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showFilter, setShowFilter] = useState<'all' | 'suitable' | 'indoor'>('suitable');

  // Get forecast for selected date
  const selectedForecast = useMemo(() => {
    return getDayForecast(selectedDate);
  }, [selectedDate, getDayForecast]);

  // Get activities based on filter
  const displayActivities = useMemo(() => {
    if (!selectedForecast) return [];

    switch (showFilter) {
      case 'suitable':
        return getSuitableActivities(selectedDate);
      case 'indoor':
        return MOCK_ACTIVITIES.filter((a) => !a.weatherRequirements.isOutdoor);
      default:
        return MOCK_ACTIVITIES;
    }
  }, [selectedDate, showFilter, selectedForecast, getSuitableActivities]);

  // Get adjustments for the day
  const dayAdjustments = useMemo(() => {
    return getAdjustmentsForDay(selectedDate);
  }, [selectedDate, getAdjustmentsForDay]);

  const handleActivityPress = (activity: WeatherAwareActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const renderDateSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.dateSelectorContent}
    >
      {forecast?.daily.map((day, index) => {
        const isSelected = selectedDate === day.date;
        const isGood = isGoodWeatherDay(day.date);
        const date = new Date(day.date);

        return (
          <TouchableOpacity
            key={day.date}
            style={[styles.dateCard, isSelected && styles.dateCardSelected]}
            onPress={() => setSelectedDate(day.date)}
          >
            <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
              {index === 0 ? 'Today' : day.dayName.slice(0, 3)}
            </Text>
            <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
              {date.getDate()}
            </Text>
            <Text style={styles.dateWeatherIcon}>{getWeatherIcon(day.condition.type)}</Text>
            <Text style={[styles.dateTemp, isSelected && styles.dateTextSelected]}>
              {formatTemperature(day.high)}
            </Text>
            {!isGood && (
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>⚠️</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderWeatherHeader = () => {
    if (!selectedForecast) return null;

    const gradient = WEATHER_GRADIENTS[selectedForecast.condition.type] || WEATHER_GRADIENTS.sunny;

    return (
      <LinearGradient colors={gradient} style={styles.weatherHeader}>
        <View style={styles.weatherMain}>
          <Text style={styles.weatherIcon}>{getWeatherIcon(selectedForecast.condition.type)}</Text>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTemp}>
              {formatTemperature(selectedForecast.condition.temperature)}
            </Text>
            <Text style={styles.weatherDesc}>{selectedForecast.condition.description}</Text>
            <Text style={styles.weatherHighLow}>
              H: {formatTemperature(selectedForecast.high)} • L:{' '}
              {formatTemperature(selectedForecast.low)}
            </Text>
          </View>
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailIcon}>💧</Text>
            <Text style={styles.weatherDetailValue}>{selectedForecast.condition.humidity}%</Text>
            <Text style={styles.weatherDetailLabel}>Humidity</Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailIcon}>💨</Text>
            <Text style={styles.weatherDetailValue}>
              {selectedForecast.condition.windSpeed} km/h
            </Text>
            <Text style={styles.weatherDetailLabel}>Wind</Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailIcon}>☀️</Text>
            <Text style={styles.weatherDetailValue}>{selectedForecast.condition.uvIndex}</Text>
            <Text style={styles.weatherDetailLabel}>UV Index</Text>
          </View>
          <View style={styles.weatherDetailItem}>
            <Text style={styles.weatherDetailIcon}>🌧️</Text>
            <Text style={styles.weatherDetailValue}>
              {selectedForecast.condition.precipitation}%
            </Text>
            <Text style={styles.weatherDetailLabel}>Rain</Text>
          </View>
        </View>

        {dayAdjustments.length > 0 && (
          <View style={styles.adjustmentsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dayAdjustments.map((adj, index) => (
                <View key={index} style={styles.adjustmentPill}>
                  <Text style={styles.adjustmentIcon}>{adj.icon}</Text>
                  <Text style={styles.adjustmentText}>{adj.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </LinearGradient>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      {[
        {
          key: 'suitable',
          label: '✨ Recommended',
          count: getSuitableActivities(selectedDate).length,
        },
        {
          key: 'indoor',
          label: '🏠 Indoor',
          count: MOCK_ACTIVITIES.filter((a) => !a.weatherRequirements.isOutdoor).length,
        },
        { key: 'all', label: '📋 All', count: MOCK_ACTIVITIES.length },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.filterTab, showFilter === tab.key && styles.filterTabActive]}
          onPress={() => setShowFilter(tab.key as any)}
        >
          <Text
            style={[styles.filterTabText, showFilter === tab.key && styles.filterTabTextActive]}
          >
            {tab.label}
          </Text>
          <View
            style={[styles.filterTabBadge, showFilter === tab.key && styles.filterTabBadgeActive]}
          >
            <Text
              style={[
                styles.filterTabBadgeText,
                showFilter === tab.key && styles.filterTabBadgeTextActive,
              ]}
            >
              {tab.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // eslint-disable-next-line complexity -- tracked in #1
  const renderActivityCard = (activity: WeatherAwareActivity) => {
    const suitability = assessActivity(activity, selectedDate);
    const severityColor = suitability ? SEVERITY_COLORS[suitability.severity] : '#6B7280';

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => handleActivityPress(activity)}
        activeOpacity={0.9}
      >
        <View style={styles.activityImageContainer}>
          <View
            style={[styles.activityImagePlaceholder, { backgroundColor: severityColor + '20' }]}
          >
            <Text style={styles.activityCategoryIcon}>
              {activity.category === 'beach'
                ? '🏖️'
                : activity.category === 'hiking'
                  ? '🥾'
                  : activity.category === 'cultural'
                    ? '🎨'
                    : activity.category === 'water_sports'
                      ? '🚤'
                      : activity.category === 'food_drink'
                        ? '🍷'
                        : activity.category === 'cycling'
                          ? '🚴'
                          : activity.category === 'wellness'
                            ? '🧘'
                            : activity.category === 'sightseeing'
                              ? '📸'
                              : activity.category === 'nightlife'
                                ? '🎭'
                                : '✨'}
            </Text>
          </View>
          {suitability && (
            <View style={[styles.suitabilityBadge, { backgroundColor: severityColor }]}>
              <Text style={styles.suitabilityScore}>{suitability.score}</Text>
            </View>
          )}
        </View>

        <View style={styles.activityContent}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityName} numberOfLines={1}>
              {activity.name}
            </Text>
            <Text style={styles.activityPrice}>€{activity.price}</Text>
          </View>

          <Text style={styles.activityDescription} numberOfLines={2}>
            {activity.description}
          </Text>

          <View style={styles.activityMeta}>
            <View style={styles.activityMetaItem}>
              <Text style={styles.activityMetaIcon}>⏱️</Text>
              <Text style={styles.activityMetaText}>
                {activity.duration.value} {activity.duration.unit}
              </Text>
            </View>
            <View style={styles.activityMetaItem}>
              <Text style={styles.activityMetaIcon}>📍</Text>
              <Text style={styles.activityMetaText} numberOfLines={1}>
                {activity.location.name}
              </Text>
            </View>
          </View>

          {suitability && suitability.warnings.length > 0 && (
            <View style={styles.warningsContainer}>
              {suitability.warnings.slice(0, 2).map((warning, index) => (
                <Text key={index} style={styles.warningText} numberOfLines={1}>
                  {warning}
                </Text>
              ))}
            </View>
          )}

          {suitability && suitability.adjustments.length > 0 && (
            <View style={styles.adjustmentsContainer}>
              {suitability.adjustments.slice(0, 3).map((adj, index) => (
                <View key={index} style={styles.adjustmentChip}>
                  <Text style={styles.adjustmentChipIcon}>{adj.icon}</Text>
                </View>
              ))}
              {suitability.adjustments.length > 3 && (
                <Text style={styles.moreAdjustments}>+{suitability.adjustments.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityModal = () => {
    if (!selectedActivity) return null;

    const suitability = assessActivity(selectedActivity, selectedDate);
    const alternatives = getIndoorAlternatives(selectedActivity.id);
    const severityColor = suitability ? SEVERITY_COLORS[suitability.severity] : '#6B7280';

    return (
      <Modal
        visible={showActivityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActivityModal(false)}>
              <Text style={styles.modalClose}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Activity Header */}
            <View style={styles.modalActivityHeader}>
              <Text style={styles.modalActivityName}>{selectedActivity.name}</Text>
              <Text style={styles.modalActivityDesc}>{selectedActivity.description}</Text>
            </View>

            {/* Weather Suitability */}
            {suitability && (
              <View style={styles.suitabilitySection}>
                <View style={styles.suitabilityHeader}>
                  <View style={[styles.suitabilityCircle, { backgroundColor: severityColor }]}>
                    <Text style={styles.suitabilityCircleText}>{suitability.score}</Text>
                  </View>
                  <View style={styles.suitabilityInfo}>
                    <Text style={[styles.suitabilitySeverity, { color: severityColor }]}>
                      {suitability.severity.charAt(0).toUpperCase() + suitability.severity.slice(1)}{' '}
                      Conditions
                    </Text>
                    <Text style={styles.suitabilityRecommended}>
                      {suitability.isRecommended ? '✅ Recommended' : '⚠️ Consider alternatives'}
                    </Text>
                  </View>
                </View>

                {suitability.warnings.length > 0 && (
                  <View style={styles.warningsSection}>
                    <Text style={styles.warningSectionTitle}>⚠️ Weather Concerns</Text>
                    {suitability.warnings.map((warning, index) => (
                      <Text key={index} style={styles.warningItem}>
                        {warning}
                      </Text>
                    ))}
                  </View>
                )}

                {suitability.adjustments.length > 0 && (
                  <View style={styles.adjustmentsSection}>
                    <Text style={styles.adjustmentsSectionTitle}>📝 Recommendations</Text>
                    {suitability.adjustments.map((adj, index) => (
                      <View key={index} style={styles.adjustmentItem}>
                        <Text style={styles.adjustmentItemIcon}>{adj.icon}</Text>
                        <View style={styles.adjustmentItemContent}>
                          <Text style={styles.adjustmentItemTitle}>
                            {adj.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Text>
                          <Text style={styles.adjustmentItemDesc}>{adj.description}</Text>
                        </View>
                        <View
                          style={[
                            styles.adjustmentPriority,
                            {
                              backgroundColor:
                                adj.priority === 'required'
                                  ? '#EF4444'
                                  : adj.priority === 'recommended'
                                    ? '#F59E0B'
                                    : '#10B981',
                            },
                          ]}
                        >
                          <Text style={styles.adjustmentPriorityText}>{adj.priority}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {suitability.bestTimeSlots.length > 0 && (
                  <View style={styles.timeSlotsSection}>
                    <Text style={styles.timeSlotsSectionTitle}>🕐 Best Times</Text>
                    {suitability.bestTimeSlots.map((slot, index) => (
                      <View key={index} style={styles.timeSlotItem}>
                        <Text style={styles.timeSlotTime}>{slot.startTime}</Text>
                        <View style={styles.timeSlotInfo}>
                          <View
                            style={[
                              styles.timeSlotScore,
                              { backgroundColor: `rgba(16, 185, 129, ${slot.score / 100})` },
                            ]}
                          >
                            <Text style={styles.timeSlotScoreText}>{slot.score}</Text>
                          </View>
                          <Text style={styles.timeSlotReason}>{slot.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Indoor Alternatives */}
            {alternatives.length > 0 && selectedActivity.weatherRequirements.isOutdoor && (
              <View style={styles.alternativesSection}>
                <Text style={styles.alternativesSectionTitle}>🏠 Indoor Alternatives</Text>
                {alternatives.map((alt, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.alternativeItem}
                    onPress={() => {
                      const altActivity = MOCK_ACTIVITIES.find((a) => a.id === alt.alternativeId);
                      if (altActivity) {
                        setSelectedActivity(altActivity);
                      }
                    }}
                  >
                    <View style={styles.alternativeHeader}>
                      <Text style={styles.alternativeName}>{alt.alternativeName}</Text>
                      <View style={styles.alternativeScore}>
                        <Text style={styles.alternativeScoreText}>{alt.matchScore}% match</Text>
                      </View>
                    </View>
                    <Text style={styles.alternativeReason}>{alt.reason}</Text>
                    <View style={styles.alternativeHighlights}>
                      {alt.highlights.map((h, i) => (
                        <View key={i} style={styles.alternativeHighlight}>
                          <Text style={styles.alternativeHighlightText}>{h}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Book Button */}
            <TouchableOpacity
              style={[styles.bookButton, !suitability?.isRecommended && styles.bookButtonWarning]}
              onPress={() => {
                Alert.alert(
                  suitability?.isRecommended ? 'Book Activity' : 'Weather Warning',
                  suitability?.isRecommended
                    ? 'Proceeding to booking...'
                    : 'Weather conditions may not be ideal. Do you want to proceed anyway?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Proceed', onPress: () => console.log('Booking...') },
                  ]
                );
              }}
            >
              <Text style={styles.bookButtonText}>
                {suitability?.isRecommended ? 'Book Now' : 'Book Anyway'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
        stickyHeaderIndices={[2]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Weather-Aware Activities</Text>
          <Text style={styles.headerSubtitle}>
            {location.city}, {location.country}
          </Text>
        </View>

        {/* Date Selector */}
        {renderDateSelector()}

        {/* Weather Header */}
        {renderWeatherHeader()}

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Activities List */}
        <View style={styles.activitiesContainer}>
          {displayActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌧️</Text>
              <Text style={styles.emptyTitle}>No suitable activities</Text>
              <Text style={styles.emptySubtitle}>
                Weather conditions may not be ideal for outdoor activities today. Try viewing indoor
                options!
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowFilter('indoor')}>
                <Text style={styles.emptyButtonText}>Show Indoor Activities</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayActivities.map((activity) => (
              <View key={activity.id}>{renderActivityCard(activity)}</View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {renderActivityModal()}
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateCard: {
    width: 70,
    padding: 12,
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateTextSelected: {
    color: 'white',
  },
  dateWeatherIcon: {
    fontSize: 20,
    marginVertical: 4,
  },
  dateTemp: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  dateBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  dateBadgeText: {
    fontSize: 10,
  },
  weatherHeader: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherIcon: {
    fontSize: 64,
    marginRight: 16,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
  },
  weatherDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  weatherHighLow: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
  },
  weatherDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherDetailIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  weatherDetailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  adjustmentsBar: {
    marginTop: 16,
  },
  adjustmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  adjustmentIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  adjustmentText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
  },
  filterTabBadge: {
    marginLeft: 6,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterTabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  filterTabBadgeTextActive: {
    color: 'white',
  },
  activitiesContainer: {
    padding: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityImageContainer: {
    width: 100,
    height: 140,
    position: 'relative',
  },
  activityImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCategoryIcon: {
    fontSize: 36,
  },
  suitabilityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitabilityScore: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
  },
  activityContent: {
    flex: 1,
    padding: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  activityPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B82F6',
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  activityMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  activityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  activityMetaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  activityMetaText: {
    fontSize: 11,
    color: '#666',
  },
  warningsContainer: {
    marginBottom: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#EF4444',
  },
  adjustmentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustmentChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  adjustmentChipIcon: {
    fontSize: 12,
  },
  moreAdjustments: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  modalClose: {
    fontSize: 16,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalActivityHeader: {
    marginBottom: 20,
  },
  modalActivityName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalActivityDesc: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  suitabilitySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  suitabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suitabilityCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  suitabilityCircleText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  suitabilityInfo: {
    flex: 1,
  },
  suitabilitySeverity: {
    fontSize: 18,
    fontWeight: '700',
  },
  suitabilityRecommended: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  warningsSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  warningSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 4,
  },
  adjustmentsSection: {
    marginBottom: 16,
  },
  adjustmentsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  adjustmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  adjustmentItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  adjustmentItemContent: {
    flex: 1,
  },
  adjustmentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  adjustmentItemDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  adjustmentPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adjustmentPriorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
  },
  timeSlotsSection: {
    marginTop: 16,
  },
  timeSlotsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    width: 60,
  },
  timeSlotInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSlotScore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timeSlotScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  timeSlotReason: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  alternativesSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alternativesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  alternativeItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alternativeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  alternativeScore: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alternativeScoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  alternativeReason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  alternativeHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  alternativeHighlight: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  alternativeHighlightText: {
    fontSize: 11,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonWarning: {
    backgroundColor: '#F59E0B',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default WeatherAwareActivitiesScreen;
