/* eslint-disable max-lines -- tracked in #1 */
// Activity Adjustment Screen for Paint the Town
// Shows detailed weather impacts on a specific activity with smart adjustments and alternatives

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWeatherAware } from '../hooks/useWeatherAware';
import {
  WeatherAwareActivity,
  WeatherSuitability,
  IndoorAlternative,
  ActivityAdjustment,
  TimeSlotRecommendation,
  WeatherConditionType,
} from '../types/weather';
import { MOCK_ACTIVITIES, INDOOR_ALTERNATIVES_MAP } from '../mocks/mockWeatherData';

const { width } = Dimensions.get('window');

interface ActivityAdjustmentScreenProps {
  navigation?: any;
  route?: {
    params?: {
      activityId: string;
      date: string;
      location?: { city: string; country: string };
    };
  };
}

// Severity colors and gradients
const SEVERITY_COLORS = {
  ideal: '#10B981',
  good: '#3B82F6',
  fair: '#F59E0B',
  poor: '#EF4444',
  dangerous: '#7F1D1D',
};

const SEVERITY_GRADIENTS: Record<string, [string, string, string]> = {
  ideal: ['#10B981', '#059669', '#047857'],
  good: ['#3B82F6', '#2563EB', '#1D4ED8'],
  fair: ['#F59E0B', '#D97706', '#B45309'],
  poor: ['#EF4444', '#DC2626', '#B91C1C'],
  dangerous: ['#7F1D1D', '#991B1B', '#B91C1C'],
};

// Adjustment icons by type
const ADJUSTMENT_ICONS: Record<string, string> = {
  bring_umbrella: '☂️',
  bring_sunscreen: '🧴',
  bring_layers: '🧣',
  bring_water: '💧',
  bring_hat: '🎩',
  wear_sturdy_shoes: '👟',
  arrive_early: '⏰',
  check_conditions: '📱',
  book_indoor_backup: '🏠',
  reschedule: '📅',
  modify_route: '🗺️',
  shorten_duration: '⏱️',
  change_time: '🕐',
};

// Priority colors
const PRIORITY_COLORS = {
  required: '#EF4444',
  recommended: '#F59E0B',
  optional: '#3B82F6',
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export const ActivityAdjustmentScreen: React.FC<ActivityAdjustmentScreenProps> = ({
  navigation,
  route,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const activityId = route?.params?.activityId;
  const selectedDate = route?.params?.date || new Date().toISOString().split('T')[0];
  const location = route?.params?.location || { city: 'Barcelona', country: 'Spain' };

  const {
    forecast,
    isLoading,
    error,
    refresh,
    assessActivity,
    getIndoorAlternatives,
    getDayForecast,
    formatTemperature,
    getWeatherIcon,
  } = useWeatherAware({
    location,
    autoLoad: true,
  });

  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showAlternativesModal, setShowAlternativesModal] = useState(false);

  // Get activity data
  const activity = useMemo(() => {
    return MOCK_ACTIVITIES.find((a) => a.id === activityId) || MOCK_ACTIVITIES[0];
  }, [activityId]);

  // Get weather assessment
  const suitability = useMemo(() => {
    if (!activity) return null;
    return assessActivity(activity, selectedDate);
  }, [activity, selectedDate, assessActivity]);

  // Get day forecast
  const dayForecast = useMemo(() => {
    return getDayForecast(selectedDate);
  }, [selectedDate, getDayForecast]);

  // Get indoor alternatives
  const alternatives = useMemo(() => {
    if (!activity) return [];
    return getIndoorAlternatives(activity.id);
  }, [activity, getIndoorAlternatives]);

  const handleShare = async () => {
    if (!activity || !suitability) return;

    const shareText =
      `🏃 Activity Weather Check\n\n` +
      `📍 ${activity.name}\n` +
      `📅 ${selectedDate}\n` +
      `🌡️ Weather: ${dayForecast?.condition.description || 'Unknown'}\n\n` +
      `📊 Suitability Score: ${suitability.score}/100\n` +
      `${suitability.isRecommended ? '✅ Recommended' : '⚠️ Not Ideal'}\n\n` +
      (suitability.adjustments.length > 0
        ? `🎯 Tips:\n${suitability.adjustments.map((a) => `• ${a.description}`).join('\n')}\n\n`
        : '') +
      `Plan your activities with Paint the Town! 🧳`;

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBookActivity = () => {
    if (!suitability?.isRecommended) {
      Alert.alert(
        'Weather Advisory',
        'The weather conditions are not ideal for this activity. Would you like to proceed anyway or see alternatives?',
        [
          { text: 'See Alternatives', onPress: () => setShowAlternativesModal(true) },
          {
            text: 'Proceed Anyway',
            onPress: () => {
              // Navigate to booking
              navigation?.navigate('ActivityBooking', {
                activityId: activity?.id,
                date: selectedDate,
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation?.navigate('ActivityBooking', { activityId: activity?.id, date: selectedDate });
    }
  };

  const renderHeader = () => {
    if (!activity || !suitability) return null;

    const gradient = SEVERITY_GRADIENTS[suitability.severity] || SEVERITY_GRADIENTS.fair;
    const categoryIcons: Record<string, string> = {
      beach: '🏖️',
      hiking: '🥾',
      cultural: '🎨',
      water_sports: '🚤',
      food_drink: '🍷',
      cycling: '🚴',
      wellness: '🧘',
      sightseeing: '📸',
      nightlife: '🎭',
      outdoor_adventure: '⛰️',
      wildlife: '🦁',
      sports: '⚽',
      shopping: '🛍️',
      winter_sports: '⛷️',
    };

    return (
      <LinearGradient colors={gradient} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>{categoryIcons[activity.category] || '✨'}</Text>
          </View>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.activityCategory}>
            {activity.category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Text>

          {/* Suitability Score Circle */}
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{suitability.score}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>

          <View
            style={[
              styles.recommendationBadge,
              suitability.isRecommended ? styles.badgeGood : styles.badgeWarning,
            ]}
          >
            <Text style={styles.recommendationText}>
              {suitability.isRecommended ? '✓ Recommended Today' : '⚠️ Not Ideal Today'}
            </Text>
          </View>
        </View>

        {/* Weather Snapshot */}
        {dayForecast && (
          <View style={styles.weatherSnapshot}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>{getWeatherIcon(dayForecast.condition.type)}</Text>
              <Text style={styles.weatherValue}>
                {formatTemperature(dayForecast.condition.temperature)}
              </Text>
            </View>
            <View style={styles.weatherDivider} />
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>💧</Text>
              <Text style={styles.weatherValue}>{dayForecast.condition.humidity}%</Text>
            </View>
            <View style={styles.weatherDivider} />
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>🌧️</Text>
              <Text style={styles.weatherValue}>{dayForecast.condition.precipitation}%</Text>
            </View>
            <View style={styles.weatherDivider} />
            <View style={styles.weatherItem}>
              <Text style={styles.weatherIcon}>💨</Text>
              <Text style={styles.weatherValue}>{dayForecast.condition.windSpeed}km/h</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    );
  };

  const renderWarnings = () => {
    if (!suitability || suitability.warnings.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Weather Warnings</Text>
        <View style={styles.warningsCard}>
          {suitability.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningDot}>•</Text>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderAdjustments = () => {
    if (!suitability || suitability.adjustments.length === 0) return null;

    // Group by priority
    const required = suitability.adjustments.filter((a) => a.priority === 'required');
    const recommended = suitability.adjustments.filter((a) => a.priority === 'recommended');
    const optional = suitability.adjustments.filter((a) => a.priority === 'optional');

    const renderAdjustmentGroup = (items: ActivityAdjustment[], title: string, color: string) => {
      if (items.length === 0) return null;

      return (
        <>
          <Text style={[styles.adjustmentGroupTitle, { color }]}>{title}</Text>
          {items.map((adjustment, index) => (
            <View key={index} style={styles.adjustmentCard}>
              <View style={styles.adjustmentIconContainer}>
                <Text style={styles.adjustmentIcon}>
                  {ADJUSTMENT_ICONS[adjustment.type] || adjustment.icon}
                </Text>
              </View>
              <View style={styles.adjustmentContent}>
                <Text style={styles.adjustmentDescription}>{adjustment.description}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: color }]}>
                <Text style={styles.priorityBadgeText}>{adjustment.priority.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </>
      );
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Recommended Adjustments</Text>
        {renderAdjustmentGroup(required, 'Required', PRIORITY_COLORS.required)}
        {renderAdjustmentGroup(recommended, 'Recommended', PRIORITY_COLORS.recommended)}
        {renderAdjustmentGroup(optional, 'Optional', PRIORITY_COLORS.optional)}
      </View>
    );
  };

  const renderBestTimeSlots = () => {
    if (!suitability || suitability.bestTimeSlots.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⏰ Best Time Slots</Text>
          <TouchableOpacity onPress={() => setShowTimeSlotModal(true)}>
            <Text style={styles.seeAllLink}>See all →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeSlotsScroll}
        >
          {suitability.bestTimeSlots.slice(0, 4).map((slot, index) => {
            const scoreColor =
              slot.score >= 80 ? '#10B981' : slot.score >= 60 ? '#F59E0B' : '#EF4444';

            return (
              <View key={index} style={styles.timeSlotCard}>
                <View style={[styles.timeSlotScore, { backgroundColor: scoreColor }]}>
                  <Text style={styles.timeSlotScoreText}>{slot.score}</Text>
                </View>
                <Text style={styles.timeSlotTime}>
                  {slot.startTime} - {slot.endTime}
                </Text>
                <Text style={styles.timeSlotWeather}>
                  {getWeatherIcon(slot.condition.type)}{' '}
                  {formatTemperature(slot.condition.temperature)}
                </Text>
                <Text style={styles.timeSlotReason} numberOfLines={2}>
                  {slot.reason}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderAlternatives = () => {
    if (alternatives.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏠 Indoor Alternatives</Text>
          <TouchableOpacity onPress={() => setShowAlternativesModal(true)}>
            <Text style={styles.seeAllLink}>See all →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionSubtitle}>
          If weather doesn&apos;t cooperate, try these similar experiences
        </Text>

        {alternatives.slice(0, 2).map((alt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.alternativeCard}
            onPress={() =>
              navigation?.navigate('ActivityAdjustment', {
                activityId: alt.alternativeId,
                date: selectedDate,
                location,
              })
            }
          >
            <View style={styles.alternativeHeader}>
              <Text style={styles.alternativeName}>{alt.alternativeName}</Text>
              <View style={styles.matchScoreBadge}>
                <Text style={styles.matchScoreText}>{alt.matchScore}% match</Text>
              </View>
            </View>
            <Text style={styles.alternativeReason}>{alt.reason}</Text>
            <View style={styles.alternativeHighlights}>
              {alt.highlights.map((highlight, i) => (
                <View key={i} style={styles.highlightChip}>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </View>
            <View style={styles.alternativeFooter}>
              <Text style={styles.priceComparison}>
                {alt.priceComparison === 'cheaper'
                  ? '💚 Cheaper'
                  : alt.priceComparison === 'similar'
                    ? '🔵 Similar price'
                    : '🔴 More expensive'}
              </Text>
              <Text style={styles.viewArrow}>View →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTips = () => {
    if (!suitability || suitability.tips.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
        <View style={styles.tipsCard}>
          {suitability.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Text style={styles.tipBullet}>💡</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Time Slots Modal
  const renderTimeSlotModal = () => (
    <Modal
      visible={showTimeSlotModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTimeSlotModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTimeSlotModal(false)}>
            <Text style={styles.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Best Time Slots</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>
            Optimal times for {activity?.name} on {selectedDate}
          </Text>

          {suitability?.bestTimeSlots.map((slot, index) => {
            const scoreColor =
              slot.score >= 80 ? '#10B981' : slot.score >= 60 ? '#F59E0B' : '#EF4444';

            return (
              <View key={index} style={styles.fullTimeSlotCard}>
                <View style={styles.timeSlotRow}>
                  <View style={[styles.bigScore, { backgroundColor: scoreColor }]}>
                    <Text style={styles.bigScoreText}>{slot.score}</Text>
                  </View>
                  <View style={styles.timeSlotDetails}>
                    <Text style={styles.timeSlotTimeText}>
                      {slot.startTime} - {slot.endTime}
                    </Text>
                    <View style={styles.timeSlotWeatherRow}>
                      <Text style={styles.timeSlotWeatherIcon}>
                        {getWeatherIcon(slot.condition.type)}
                      </Text>
                      <Text style={styles.timeSlotWeatherText}>
                        {formatTemperature(slot.condition.temperature)} •{' '}
                        {slot.condition.description}
                      </Text>
                    </View>
                    <Text style={styles.timeSlotReasonFull}>{slot.reason}</Text>
                  </View>
                </View>
                <View style={styles.timeSlotConditions}>
                  <View style={styles.conditionItem}>
                    <Text style={styles.conditionLabel}>Rain</Text>
                    <Text style={styles.conditionValue}>{slot.condition.precipitation}%</Text>
                  </View>
                  <View style={styles.conditionItem}>
                    <Text style={styles.conditionLabel}>Wind</Text>
                    <Text style={styles.conditionValue}>{slot.condition.windSpeed}km/h</Text>
                  </View>
                  <View style={styles.conditionItem}>
                    <Text style={styles.conditionLabel}>UV</Text>
                    <Text style={styles.conditionValue}>{slot.condition.uvIndex}</Text>
                  </View>
                  <View style={styles.conditionItem}>
                    <Text style={styles.conditionLabel}>Humidity</Text>
                    <Text style={styles.conditionValue}>{slot.condition.humidity}%</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // Alternatives Modal
  const renderAlternativesModal = () => (
    <Modal
      visible={showAlternativesModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAlternativesModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAlternativesModal(false)}>
            <Text style={styles.modalClose}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Indoor Alternatives</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>Weather-proof alternatives to {activity?.name}</Text>

          {alternatives.map((alt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fullAlternativeCard}
              onPress={() => {
                setShowAlternativesModal(false);
                navigation?.navigate('ActivityAdjustment', {
                  activityId: alt.alternativeId,
                  date: selectedDate,
                  location,
                });
              }}
            >
              <View style={styles.fullAltHeader}>
                <View>
                  <Text style={styles.fullAltName}>{alt.alternativeName}</Text>
                  <Text style={styles.fullAltCategory}>
                    {alt.category.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.fullMatchBadge}>
                  <Text style={styles.fullMatchText}>{alt.matchScore}%</Text>
                  <Text style={styles.fullMatchLabel}>match</Text>
                </View>
              </View>

              <Text style={styles.fullAltReason}>{alt.reason}</Text>

              <View style={styles.fullAltHighlights}>
                {alt.highlights.map((highlight, i) => (
                  <View key={i} style={styles.fullHighlightChip}>
                    <Text style={styles.fullHighlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.fullAltFooter}>
                <View
                  style={[
                    styles.priceBadge,
                    alt.priceComparison === 'cheaper' && styles.priceCheaper,
                    alt.priceComparison === 'more_expensive' && styles.priceMore,
                  ]}
                >
                  <Text style={styles.priceText}>
                    {alt.priceComparison === 'cheaper'
                      ? '↓ Cheaper'
                      : alt.priceComparison === 'similar'
                        ? '≈ Similar'
                        : '↑ More'}
                  </Text>
                </View>
                <Text style={styles.selectText}>Select →</Text>
              </View>
            </TouchableOpacity>
          ))}

          {alternatives.length === 0 && (
            <View style={styles.noAlternatives}>
              <Text style={styles.noAltIcon}>🏠</Text>
              <Text style={styles.noAltText}>No indoor alternatives available</Text>
              <Text style={styles.noAltSubtext}>
                This activity is suitable for the current weather conditions
              </Text>
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
          <Text style={styles.loadingText}>Analyzing weather impact...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Activity not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}

        <View style={styles.content}>
          {renderWarnings()}
          {renderAdjustments()}
          {renderBestTimeSlots()}
          {renderAlternatives()}
          {renderTips()}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, !suitability?.isRecommended && styles.actionButtonWarning]}
          onPress={handleBookActivity}
        >
          <Text style={styles.actionButtonText}>
            {suitability?.isRecommended ? 'Book This Activity' : 'Proceed with Caution'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderTimeSlotModal()}
      {renderAlternativesModal()}
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
    marginBottom: 20,
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
    width: 44,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 20,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  activityIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconText: {
    fontSize: 36,
  },
  activityName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  activityCategory: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  scoreCircle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
  },
  scoreLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  recommendationBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeGood: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  recommendationText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  weatherSnapshot: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
  },
  weatherItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  weatherIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  weatherValue: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  weatherDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  // Content
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginTop: -8,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Warnings
  warningsCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  warningDot: {
    color: '#EF4444',
    fontSize: 16,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  // Adjustments
  adjustmentGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  adjustmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  adjustmentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adjustmentIcon: {
    fontSize: 24,
  },
  adjustmentContent: {
    flex: 1,
  },
  adjustmentDescription: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'white',
  },
  // Time Slots
  timeSlotsScroll: {
    paddingRight: 16,
  },
  timeSlotCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeSlotScore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotScoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  timeSlotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  timeSlotWeather: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  timeSlotReason: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  // Alternatives
  alternativeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  matchScoreBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  alternativeReason: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  alternativeHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  highlightChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 11,
    color: '#666',
  },
  alternativeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceComparison: {
    fontSize: 12,
    color: '#666',
  },
  viewArrow: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Tips
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tipBullet: {
    fontSize: 14,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonWarning: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  // Modal
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
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  // Full Time Slot Card
  fullTimeSlotCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bigScore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bigScoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
  },
  timeSlotDetails: {
    flex: 1,
  },
  timeSlotTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  timeSlotWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeSlotWeatherIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeSlotWeatherText: {
    fontSize: 13,
    color: '#666',
  },
  timeSlotReasonFull: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  timeSlotConditions: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
  },
  conditionItem: {
    flex: 1,
    alignItems: 'center',
  },
  conditionLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  conditionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  // Full Alternative Card
  fullAlternativeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fullAltHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fullAltName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  fullAltCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  fullMatchBadge: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  fullMatchText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  fullMatchLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  fullAltReason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  fullAltHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  fullHighlightChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  fullHighlightText: {
    fontSize: 12,
    color: '#666',
  },
  fullAltFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceCheaper: {
    backgroundColor: '#D1FAE5',
  },
  priceMore: {
    backgroundColor: '#FEE2E2',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  noAlternatives: {
    alignItems: 'center',
    padding: 40,
  },
  noAltIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noAltText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  noAltSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ActivityAdjustmentScreen;
