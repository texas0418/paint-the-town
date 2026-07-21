// Weather-Based Packing List Screen for Paint the Town
// Generates smart packing suggestions based on trip weather forecast

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWeatherAware } from '../hooks/useWeatherAware';
import { PackingSuggestion, WeatherPackingList, WeatherConditionType } from '../types/weather';
import { weatherService } from '../services/weatherService';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@w4nder/packing_lists';

interface PackingListScreenProps {
  navigation?: any;
  route?: {
    params?: {
      location?: { city: string; country: string };
      tripDates?: { start: string; end: string };
      tripName?: string;
    };
  };
}

// Additional packing items by category
const CATEGORY_ITEMS: Record<string, { icon: string; items: string[] }> = {
  clothing: {
    icon: '👕',
    items: [
      'T-shirts',
      'Pants/Shorts',
      'Underwear',
      'Socks',
      'Sleepwear',
      'Casual outfit',
      'Comfortable walking shoes',
    ],
  },
  toiletries: {
    icon: '🧴',
    items: [
      'Toothbrush & toothpaste',
      'Deodorant',
      'Shampoo & conditioner',
      'Face wash',
      'Moisturizer',
      'Razor',
      'Medications',
    ],
  },
  electronics: {
    icon: '📱',
    items: ['Phone charger', 'Power bank', 'Camera', 'Headphones', 'Travel adapter'],
  },
  documents: {
    icon: '📄',
    items: [
      'Passport/ID',
      'Travel insurance',
      'Flight tickets',
      'Hotel reservations',
      'Emergency contacts',
    ],
  },
  misc: {
    icon: '🎒',
    items: ['Day bag', 'Reusable shopping bag', 'Snacks', 'Book/E-reader', 'Travel pillow'],
  },
};

export const PackingListScreen: React.FC<PackingListScreenProps> = ({ navigation, route }) => {
  const location = route?.params?.location || { city: 'Barcelona', country: 'Spain' };
  const tripDates = route?.params?.tripDates;
  const tripName = route?.params?.tripName || `Trip to ${location.city}`;

  const { forecast, isLoading, error, refresh, formatTemperature, getWeatherIcon } =
    useWeatherAware({
      location,
      startDate: tripDates?.start,
      endDate: tripDates?.end,
      autoLoad: true,
    });

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showCategories, setShowCategories] = useState<Set<string>>(
    new Set(['weather', 'clothing', 'toiletries', 'electronics', 'documents', 'misc'])
  );
  const [isSaving, setIsSaving] = useState(false);

  // Generate weather-based packing list
  const weatherPackingList = useMemo(() => {
    if (!forecast) return null;
    return weatherService.generatePackingList(forecast);
  }, [forecast]);

  // Calculate progress
  const totalItems = useMemo(() => {
    let count = 0;
    if (weatherPackingList) {
      count += weatherPackingList.essentials.length;
      count += weatherPackingList.recommended.length;
      count += weatherPackingList.optional.length;
    }
    Object.values(CATEGORY_ITEMS).forEach((cat) => {
      count += cat.items.length;
    });
    return count;
  }, [weatherPackingList]);

  const progress = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.round((checkedItems.size / totalItems) * 100);
  }, [checkedItems.size, totalItems]);

  const toggleItem = useCallback((item: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setShowCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleShare = async () => {
    if (!weatherPackingList) return;

    let shareText = `🎒 Packing List for ${tripName}\n`;
    shareText += `📍 ${location.city}, ${location.country}\n\n`;
    shareText += `🌤️ Weather: ${weatherPackingList.weatherSummary}\n\n`;

    shareText += `☁️ Weather Essentials:\n`;
    weatherPackingList.essentials.forEach((item) => {
      const checked = checkedItems.has(item.item) ? '✅' : '⬜';
      shareText += `${checked} ${item.icon} ${item.item}\n`;
    });

    shareText += `\n👕 Clothing:\n`;
    CATEGORY_ITEMS.clothing.items.forEach((item) => {
      const checked = checkedItems.has(item) ? '✅' : '⬜';
      shareText += `${checked} ${item}\n`;
    });

    shareText += `\n📄 Documents:\n`;
    CATEGORY_ITEMS.documents.items.forEach((item) => {
      const checked = checkedItems.has(item) ? '✅' : '⬜';
      shareText += `${checked} ${item}\n`;
    });

    shareText += `\n✨ Progress: ${progress}% packed\n`;
    shareText += `\nCreated with Paint the Town 🧳`;

    try {
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Error sharing packing list:', error);
    }
  };

  const handleSaveList = async () => {
    if (!weatherPackingList) return;

    setIsSaving(true);
    try {
      const savedLists = await AsyncStorage.getItem(STORAGE_KEY);
      const lists = savedLists ? JSON.parse(savedLists) : [];

      const newList = {
        id: Date.now().toString(),
        tripName,
        location: `${location.city}, ${location.country}`,
        dates: tripDates,
        checkedItems: Array.from(checkedItems),
        createdAt: new Date().toISOString(),
        weatherSummary: weatherPackingList.weatherSummary,
      };

      lists.unshift(newList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists.slice(0, 20)));

      // Show success feedback
      alert('Packing list saved!');
    } catch (error) {
      console.error('Error saving packing list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderHeader = () => {
    if (!forecast || !weatherPackingList) return null;

    const dominantCondition = forecast.daily[0]?.condition.type || 'sunny';

    return (
      <LinearGradient colors={['#10B981', '#059669', '#047857']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveList}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? '...' : '💾 Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🎒</Text>
          <Text style={styles.headerTitle}>Packing List</Text>
          <Text style={styles.headerSubtitle}>{tripName}</Text>

          {/* Weather Summary */}
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherBadgeIcon}>{getWeatherIcon(dominantCondition)}</Text>
            <Text style={styles.weatherBadgeText}>{weatherPackingList.weatherSummary}</Text>
          </View>

          {/* Progress Ring */}
          <View style={styles.progressSection}>
            <View style={styles.progressRing}>
              <Text style={styles.progressNumber}>{progress}%</Text>
              <Text style={styles.progressLabel}>Packed</Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStat}>✅ {checkedItems.size} items packed</Text>
              <Text style={styles.progressStat}>
                📦 {totalItems - checkedItems.size} items remaining
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderWeatherItems = () => {
    if (!weatherPackingList) return null;

    const isExpanded = showCategories.has('weather');
    const allItems = [
      ...weatherPackingList.essentials,
      ...weatherPackingList.recommended,
      ...weatherPackingList.optional,
    ];

    return (
      <View style={styles.categorySection}>
        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory('weather')}>
          <View style={styles.categoryTitleRow}>
            <View style={[styles.categoryIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.categoryIcon}>🌤️</Text>
            </View>
            <View>
              <Text style={styles.categoryTitle}>Weather Essentials</Text>
              <Text style={styles.categoryCount}>
                {allItems.filter((i) => checkedItems.has(i.item)).length}/{allItems.length} packed
              </Text>
            </View>
          </View>
          <Text style={styles.categoryChevron}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryItems}>
            {/* Essentials */}
            {weatherPackingList.essentials.length > 0 && (
              <>
                <Text style={styles.priorityLabel}>🔴 Essential</Text>
                {weatherPackingList.essentials.map((item, index) => (
                  <TouchableOpacity
                    key={`essential-${index}`}
                    style={styles.packingItem}
                    onPress={() => toggleItem(item.item)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checkedItems.has(item.item) && styles.checkboxChecked,
                      ]}
                    >
                      {checkedItems.has(item.item) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemName,
                          checkedItems.has(item.item) && styles.itemNameChecked,
                        ]}
                      >
                        {item.item}
                      </Text>
                      <Text style={styles.itemReason}>{item.reason}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Recommended */}
            {weatherPackingList.recommended.length > 0 && (
              <>
                <Text style={styles.priorityLabel}>🟡 Recommended</Text>
                {weatherPackingList.recommended.map((item, index) => (
                  <TouchableOpacity
                    key={`recommended-${index}`}
                    style={styles.packingItem}
                    onPress={() => toggleItem(item.item)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checkedItems.has(item.item) && styles.checkboxChecked,
                      ]}
                    >
                      {checkedItems.has(item.item) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemName,
                          checkedItems.has(item.item) && styles.itemNameChecked,
                        ]}
                      >
                        {item.item}
                      </Text>
                      <Text style={styles.itemReason}>{item.reason}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Optional */}
            {weatherPackingList.optional.length > 0 && (
              <>
                <Text style={styles.priorityLabel}>🟢 Optional</Text>
                {weatherPackingList.optional.map((item, index) => (
                  <TouchableOpacity
                    key={`optional-${index}`}
                    style={styles.packingItem}
                    onPress={() => toggleItem(item.item)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checkedItems.has(item.item) && styles.checkboxChecked,
                      ]}
                    >
                      {checkedItems.has(item.item) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemName,
                          checkedItems.has(item.item) && styles.itemNameChecked,
                        ]}
                      >
                        {item.item}
                      </Text>
                      <Text style={styles.itemReason}>{item.reason}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = (categoryKey: string) => {
    const category = CATEGORY_ITEMS[categoryKey];
    if (!category) return null;

    const isExpanded = showCategories.has(categoryKey);
    const checkedCount = category.items.filter((i) => checkedItems.has(i)).length;

    const categoryColors: Record<string, string> = {
      clothing: '#E0E7FF',
      toiletries: '#FCE7F3',
      electronics: '#D1FAE5',
      documents: '#FEF3C7',
      misc: '#E5E7EB',
    };

    const categoryLabels: Record<string, string> = {
      clothing: 'Clothing',
      toiletries: 'Toiletries',
      electronics: 'Electronics',
      documents: 'Documents',
      misc: 'Miscellaneous',
    };

    return (
      <View key={categoryKey} style={styles.categorySection}>
        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(categoryKey)}>
          <View style={styles.categoryTitleRow}>
            <View
              style={[
                styles.categoryIconContainer,
                { backgroundColor: categoryColors[categoryKey] },
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            </View>
            <View>
              <Text style={styles.categoryTitle}>{categoryLabels[categoryKey]}</Text>
              <Text style={styles.categoryCount}>
                {checkedCount}/{category.items.length} packed
              </Text>
            </View>
          </View>
          <Text style={styles.categoryChevron}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryItems}>
            {category.items.map((item, index) => (
              <TouchableOpacity
                key={`${categoryKey}-${index}`}
                style={styles.packingItem}
                onPress={() => toggleItem(item)}
              >
                <View style={[styles.checkbox, checkedItems.has(item) && styles.checkboxChecked]}>
                  {checkedItems.has(item) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, checkedItems.has(item) && styles.itemNameChecked]}>
                    {item}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => {
          // Check all weather essentials
          if (weatherPackingList) {
            const newChecked = new Set(checkedItems);
            weatherPackingList.essentials.forEach((i) => newChecked.add(i.item));
            setCheckedItems(newChecked);
          }
        }}
      >
        <Text style={styles.quickActionIcon}>⚡</Text>
        <Text style={styles.quickActionText}>Check Weather Essentials</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickActionButton, styles.quickActionOutline]}
        onPress={() => setCheckedItems(new Set())}
      >
        <Text style={styles.quickActionIcon}>🔄</Text>
        <Text style={[styles.quickActionText, styles.quickActionTextOutline]}>Reset All</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>🎒</Text>
          <Text style={styles.loadingText}>Preparing your packing list...</Text>
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
          {renderQuickActions()}
          {renderWeatherItems()}
          {Object.keys(CATEGORY_ITEMS).map((key) => renderCategorySection(key))}

          {/* Pro Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsSectionTitle}>💡 Packing Tips</Text>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                Roll your clothes instead of folding to save space and reduce wrinkles.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                Pack a small first aid kit with basics like bandages and pain relievers.
              </Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>Keep important documents in a waterproof pouch.</Text>
            </View>
          </View>

          {/* View Forecast Button */}
          <TouchableOpacity
            style={styles.viewForecastButton}
            onPress={() =>
              navigation?.navigate('WeatherForecast', {
                location,
                tripDates,
                tripName,
              })
            }
          >
            <Text style={styles.viewForecastIcon}>🌤️</Text>
            <View style={styles.viewForecastContent}>
              <Text style={styles.viewForecastTitle}>View Full Weather Forecast</Text>
              <Text style={styles.viewForecastSubtitle}>See detailed day-by-day forecast</Text>
            </View>
            <Text style={styles.viewForecastArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Progress Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.bottomBarText}>
          {checkedItems.size} of {totalItems} items packed ({progress}%)
        </Text>
      </View>
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
    backgroundColor: '#10B981',
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
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
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
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: width - 60,
  },
  weatherBadgeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  weatherBadgeText: {
    color: 'white',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressStats: {
    flex: 1,
  },
  progressStat: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  // Content
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  quickActionOutline: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  quickActionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  quickActionTextOutline: {
    color: '#666',
  },
  // Category Section
  categorySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  categoryCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  categoryChevron: {
    fontSize: 12,
    color: '#999',
  },
  categoryItems: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priorityLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  packingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 10,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  itemReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  // Tips Section
  tipsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  tipsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // View Forecast Button
  viewForecastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  viewForecastIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  viewForecastContent: {
    flex: 1,
  },
  viewForecastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  viewForecastSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  viewForecastArrow: {
    fontSize: 24,
    color: 'white',
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 28,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  bottomBarText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});

export default PackingListScreen;
