import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  X,
  ChevronDown,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import RestaurantCard from '@/components/RestaurantCard';
import BookingModal from '@/components/BookingModal';
import {
  RestaurantWithAvailability,
  TimeSlot,
  RestaurantSearchParams,
  CUISINE_TYPES,
  formatPriceRange,
} from '@/types/restaurant';
import { restaurantBookingService } from '@/services/restaurantBookingService';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function RestaurantSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Search params
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(
    (params.date as string) || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState((params.time as string) || '19:00');
  const [partySize, setPartySize] = useState(parseInt(params.partySize as string) || 2);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<
    'relevance' | 'rating' | 'distance' | 'price_low' | 'price_high'
  >('relevance');

  // Results
  const [restaurants, setRestaurants] = useState<RestaurantWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Booking modal
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithAvailability | null>(
    null
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Search
  const search = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      try {
        const searchParams: RestaurantSearchParams = {
          date,
          time,
          partySize,
          cuisineTypes: selectedCuisines.length > 0 ? selectedCuisines : undefined,
          priceRange:
            selectedPriceRange.length > 0 ? (selectedPriceRange as (1 | 2 | 3 | 4)[]) : undefined,
          minRating,
          sortBy,
          page: isRefresh ? 1 : page,
          limit: 20,
        };

        const result = await restaurantBookingService.searchRestaurants(searchParams);

        if (isRefresh || page === 1) {
          setRestaurants(result.restaurants);
        } else {
          setRestaurants((prev) => [...prev, ...result.restaurants]);
        }

        setHasMore(result.hasMore);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [date, time, partySize, selectedCuisines, selectedPriceRange, minRating, sortBy, page]
  );

  useEffect(() => {
    search();
  }, [date, time, partySize, selectedCuisines, selectedPriceRange, minRating, sortBy]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSelectSlot = (restaurant: RestaurantWithAvailability, slot: TimeSlot) => {
    setSelectedRestaurant(restaurant);
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const handleBookingComplete = (confirmationNumber: string) => {
    // Could navigate to confirmation screen or update itinerary
    console.log('Booking confirmed:', confirmationNumber);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
    setPage(1);
  };

  const togglePriceRange = (price: number) => {
    setSelectedPriceRange((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCuisines([]);
    setSelectedPriceRange([]);
    setMinRating(undefined);
    setSortBy('relevance');
    setPage(1);
  };

  const hasActiveFilters =
    selectedCuisines.length > 0 || selectedPriceRange.length > 0 || minRating;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Restaurant</Text>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color={hasActiveFilters ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={colors.textTertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity style={styles.quickFilter}>
          <Calendar size={14} color={colors.primary} />
          <Text style={styles.quickFilterText}>{formatDate(date)}</Text>
          <ChevronDown size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickFilter}>
          <Clock size={14} color={colors.primary} />
          <Text style={styles.quickFilterText}>{formatTime(time)}</Text>
          <ChevronDown size={14} color={colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickFilter}>
          <Users size={14} color={colors.primary} />
          <Text style={styles.quickFilterText}>{partySize} guests</Text>
          <ChevronDown size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filtersPanelHeader}>
            <Text style={styles.filtersPanelTitle}>Filters</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFilters}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Price range */}
          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.priceOptions}>
            {[1, 2, 3, 4].map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.priceOption,
                  selectedPriceRange.includes(price) && styles.priceOptionSelected,
                ]}
                onPress={() => togglePriceRange(price)}
              >
                <Text
                  style={[
                    styles.priceOptionText,
                    selectedPriceRange.includes(price) && styles.priceOptionTextSelected,
                  ]}
                >
                  {formatPriceRange(price as 1 | 2 | 3 | 4)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cuisine types */}
          <Text style={styles.filterLabel}>Cuisine</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.cuisineScroll}
          >
            {CUISINE_TYPES.slice(0, 15).map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.cuisineOption,
                  selectedCuisines.includes(cuisine) && styles.cuisineOptionSelected,
                ]}
                onPress={() => toggleCuisine(cuisine)}
              >
                <Text
                  style={[
                    styles.cuisineOptionText,
                    selectedCuisines.includes(cuisine) && styles.cuisineOptionTextSelected,
                  ]}
                >
                  {cuisine}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort by */}
          <Text style={styles.filterLabel}>Sort By</Text>
          <View style={styles.sortOptions}>
            {[
              { value: 'relevance', label: 'Best Match' },
              { value: 'rating', label: 'Highest Rated' },
              { value: 'distance', label: 'Nearest' },
              { value: 'price_low', label: 'Price: Low' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.sortOption, sortBy === option.value && styles.sortOptionSelected]}
                onPress={() => {
                  setSortBy(option.value as any);
                  setPage(1);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding restaurants...</Text>
        </View>
      ) : restaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No restaurants found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your filters or searching for a different date/time
          </Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push(`/restaurants/${item.id}`)}
              onSelectSlot={(slot) => handleSelectSlot(item, slot)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => search(true)}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && page > 1 ? (
              <ActivityIndicator style={styles.loadingMore} color={colors.primary} />
            ) : null
          }
        />
      )}

      {/* Booking Modal */}
      {selectedRestaurant && selectedSlot && (
        <BookingModal
          visible={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedRestaurant(null);
            setSelectedSlot(null);
          }}
          restaurant={selectedRestaurant}
          selectedSlot={selectedSlot}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    backgroundColor: `${colors.primary}15`,
  },
  // Search bar
  searchBar: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  // Quick filters
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  quickFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  // Filters panel
  filtersPanel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clearFilters: {
    fontSize: 14,
    color: colors.primary,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  priceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  priceOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  priceOptionTextSelected: {
    color: colors.primary,
  },
  cuisineScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  cuisineOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  cuisineOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  cuisineOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cuisineOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  // List
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  loadingMore: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
