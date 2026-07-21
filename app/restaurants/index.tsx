/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  Star,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  Heart,
  Share2,
  Phone,
  Globe,
  Utensils,
  DollarSign,
  ChevronRight,
  Zap,
  Award,
  Leaf,
  Calendar,
  Minus,
  Plus,
  Check,
  Filter,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import {
  restaurants,
  restaurantReviews,
  cuisineCategories,
  timeSlots,
  occasions,
} from '@/mocks/restaurants';
import { Restaurant } from '@/types';

const { width } = Dimensions.get('window');

const getPriceLabel = (priceRange: number) => {
  return '$'.repeat(priceRange);
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function RestaurantsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<number[]>([1, 2, 3, 4]);

  const getAvailableDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const availableDates = getAvailableDates();

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rest) =>
          rest.name.toLowerCase().includes(query) ||
          rest.city.toLowerCase().includes(query) ||
          rest.country.toLowerCase().includes(query) ||
          rest.cuisine.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (selectedCuisine !== 'all') {
      filtered = filtered.filter((rest) =>
        rest.cuisine.some((c) => c.toLowerCase().includes(selectedCuisine.toLowerCase()))
      );
    }

    filtered = filtered.filter((rest) => priceFilter.includes(rest.priceRange));

    return filtered;
  }, [searchQuery, selectedCuisine, priceFilter]);

  const featuredRestaurants = useMemo(() => {
    return restaurants.filter((rest) => rest.featured);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]));
  }, []);

  const openRestaurant = useCallback((restaurant: Restaurant) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedRestaurant(restaurant);
    setSelectedDate(null);
    setSelectedTime(null);
    setPartySize(2);
    setSelectedOccasion(null);
    setSpecialRequests('');
  }, []);

  const closeRestaurant = useCallback(() => {
    setSelectedRestaurant(null);
    setShowBookingModal(false);
  }, []);

  const handleReserveNow = useCallback(() => {
    setShowBookingModal(true);
  }, []);

  const handleConfirmReservation = useCallback(() => {
    if (!selectedRestaurant || !selectedDate || !selectedTime) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setShowBookingModal(false);
    setSelectedRestaurant(null);

    Alert.alert(
      'Reservation Confirmed! 🍽️',
      `Your table at ${selectedRestaurant.name} has been ${selectedRestaurant.instantBook ? 'confirmed' : 'requested'} for ${partySize} guests on ${new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${selectedTime}.`,
      [{ text: 'Great!' }]
    );
  }, [selectedRestaurant, selectedDate, selectedTime, partySize]);

  const reviews = useMemo(() => {
    if (!selectedRestaurant) return [];
    return restaurantReviews.filter((r) => r.restaurantId === selectedRestaurant.id);
  }, [selectedRestaurant]);

  const togglePriceFilter = useCallback((price: number) => {
    setPriceFilter((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price].sort()
    );
  }, []);

  const renderRestaurantCard = useCallback(
    (restaurant: Restaurant, isLarge = false) => {
      const isFavorite = favorites.includes(restaurant.id);

      return (
        <Pressable
          key={restaurant.id}
          style={[styles.restaurantCard, isLarge && styles.restaurantCardLarge]}
          onPress={() => openRestaurant(restaurant)}
        >
          <View style={[styles.cardImageContainer, isLarge && styles.cardImageContainerLarge]}>
            <Image source={{ uri: restaurant.image }} style={styles.cardImage} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.cardGradient}
            />
            <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(restaurant.id)}>
              <Heart
                size={20}
                color={isFavorite ? colors.error : colors.textLight}
                fill={isFavorite ? colors.error : 'transparent'}
              />
            </Pressable>
            {restaurant.instantBook && (
              <View style={styles.instantBadge}>
                <Zap size={12} color={colors.warning} fill={colors.warning} />
                <Text style={styles.instantText}>Instant</Text>
              </View>
            )}
            {restaurant.michelinStars && restaurant.michelinStars > 0 && (
              <View style={styles.michelinBadge}>
                <Star size={12} color="#E4002B" fill="#E4002B" />
                <Text style={styles.michelinText}>
                  {restaurant.michelinStars} Star{restaurant.michelinStars > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.rating}>{restaurant.rating}</Text>
                <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
              </View>
              <Text style={styles.priceRange}>{getPriceLabel(restaurant.priceRange)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <Text style={styles.cuisineText} numberOfLines={1}>
              {restaurant.cuisine.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(' • ')}
            </Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.textTertiary} />
                <Text style={styles.metaText}>{restaurant.city}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [favorites, openRestaurant, toggleFavorite]
  );

  const renderDetailModal = () => {
    if (!selectedRestaurant) return null;

    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as keyof typeof selectedRestaurant.hours;
    const todayHours = selectedRestaurant.hours[today];

    return (
      <Modal
        visible={!!selectedRestaurant}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeRestaurant}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedRestaurant.image }}
                style={styles.modalImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                style={styles.modalImageGradient}
              />
              <SafeAreaView style={styles.modalHeader} edges={['top']}>
                <Pressable style={styles.modalBackButton} onPress={closeRestaurant}>
                  <ChevronLeft size={24} color={colors.textLight} />
                </Pressable>
                <View style={styles.modalHeaderRight}>
                  <Pressable
                    style={styles.modalIconButton}
                    onPress={() => toggleFavorite(selectedRestaurant.id)}
                  >
                    <Heart
                      size={22}
                      color={colors.textLight}
                      fill={
                        favorites.includes(selectedRestaurant.id) ? colors.error : 'transparent'
                      }
                    />
                  </Pressable>
                  <Pressable style={styles.modalIconButton}>
                    <Share2 size={22} color={colors.textLight} />
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.restaurantHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.modalTitle}>{selectedRestaurant.name}</Text>
                  {selectedRestaurant.michelinStars && selectedRestaurant.michelinStars > 0 && (
                    <View style={styles.michelinTag}>
                      {Array.from({ length: selectedRestaurant.michelinStars }).map((_, i) => (
                        <Star key={i} size={14} color="#E4002B" fill="#E4002B" />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.cuisineLabel}>
                  {selectedRestaurant.cuisine
                    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
                    .join(' • ')}
                </Text>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Star size={18} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.statValue}>{selectedRestaurant.rating}</Text>
                  <Text style={styles.statLabel}>({selectedRestaurant.reviewCount})</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <DollarSign size={18} color={colors.success} />
                  <Text style={styles.statValue}>
                    {getPriceLabel(selectedRestaurant.priceRange)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Utensils size={18} color={colors.primary} />
                  <Text style={styles.statValue}>~${selectedRestaurant.averagePrice}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{selectedRestaurant.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular Dishes</Text>
                <View style={styles.tagContainer}>
                  {selectedRestaurant.popularDishes.map((dish, index) => (
                    <View key={index} style={styles.dishTag}>
                      <Text style={styles.dishText}>{dish}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location & Hours</Text>
                <View style={styles.locationCard}>
                  <MapPin size={20} color={colors.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationCity}>
                      {selectedRestaurant.city}, {selectedRestaurant.country}
                    </Text>
                    <Text style={styles.locationAddress}>{selectedRestaurant.address}</Text>
                  </View>
                </View>
                <View style={styles.hoursCard}>
                  <Clock size={20} color={colors.primary} />
                  <View style={styles.hoursInfo}>
                    <Text style={styles.hoursLabel}>Today</Text>
                    <Text style={styles.hoursValue}>{todayHours}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact</Text>
                <View style={styles.contactRow}>
                  <Pressable style={styles.contactButton}>
                    <Phone size={20} color={colors.primary} />
                    <Text style={styles.contactText}>Call</Text>
                  </Pressable>
                  {selectedRestaurant.website && (
                    <Pressable style={styles.contactButton}>
                      <Globe size={20} color={colors.primary} />
                      <Text style={styles.contactText}>Website</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featureGrid}>
                  {selectedRestaurant.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Check size={16} color={colors.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dietary Options</Text>
                <View style={styles.tagContainer}>
                  {selectedRestaurant.dietaryOptions.map((option, index) => (
                    <View key={index} style={styles.dietaryTag}>
                      <Leaf size={14} color={colors.success} />
                      <Text style={styles.dietaryText}>{option}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {selectedRestaurant.dressCode && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dress Code</Text>
                  <Text style={styles.dressCode}>{selectedRestaurant.dressCode}</Text>
                </View>
              )}

              {reviews.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  {reviews.slice(0, 3).map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{ uri: review.userAvatar }}
                          style={styles.reviewAvatar}
                          contentFit="cover"
                        />
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>{review.userName}</Text>
                          <Text style={styles.reviewDate}>{review.date}</Text>
                        </View>
                        <View style={styles.reviewRating}>
                          <Star size={14} color={colors.warning} fill={colors.warning} />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ height: 120 }} />
            </View>
          </ScrollView>

          <SafeAreaView style={styles.bookingBar} edges={['bottom']}>
            <View style={styles.bookingBarContent}>
              <View style={styles.priceInfo}>
                <Text style={styles.avgPrice}>~${selectedRestaurant.averagePrice}</Text>
                <Text style={styles.avgPriceUnit}>/ person</Text>
              </View>
              <Pressable style={styles.reserveButton} onPress={handleReserveNow}>
                <Text style={styles.reserveButtonText}>Reserve Table</Text>
                {selectedRestaurant.instantBook && (
                  <Zap size={16} color={colors.textLight} fill={colors.textLight} />
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  const renderBookingModal = () => {
    if (!selectedRestaurant || !showBookingModal) return null;

    return (
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.bookingModalContainer} edges={['top']}>
          <View style={styles.bookingModalHeader}>
            <Pressable onPress={() => setShowBookingModal(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.bookingModalTitle}>Reserve a Table</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.bookingModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.bookingRestaurantCard}>
              <Image
                source={{ uri: selectedRestaurant.image }}
                style={styles.bookingRestaurantImage}
                contentFit="cover"
              />
              <View style={styles.bookingRestaurantInfo}>
                <Text style={styles.bookingRestaurantTitle} numberOfLines={2}>
                  {selectedRestaurant.name}
                </Text>
                <View style={styles.bookingRestaurantMeta}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.bookingRestaurantRating}>
                    {selectedRestaurant.rating} ({selectedRestaurant.reviewCount})
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Party Size</Text>
              <View style={styles.guestSelector}>
                <Pressable
                  style={[styles.guestButton, partySize <= 1 && styles.guestButtonDisabled]}
                  onPress={() => partySize > 1 && setPartySize((prev) => prev - 1)}
                  disabled={partySize <= 1}
                >
                  <Minus size={20} color={partySize <= 1 ? colors.textTertiary : colors.primary} />
                </Pressable>
                <View style={styles.guestCountContainer}>
                  <Users size={24} color={colors.primary} />
                  <Text style={styles.guestCount}>{partySize}</Text>
                  <Text style={styles.guestLabel}>guest{partySize !== 1 ? 's' : ''}</Text>
                </View>
                <Pressable
                  style={[styles.guestButton, partySize >= 20 && styles.guestButtonDisabled]}
                  onPress={() => partySize < 20 && setPartySize((prev) => prev + 1)}
                  disabled={partySize >= 20}
                >
                  <Plus size={20} color={partySize >= 20 ? colors.textTertiary : colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScrollContent}
              >
                {availableDates.map((dateStr) => {
                  const date = new Date(dateStr);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <Pressable
                      key={dateStr}
                      style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      onPress={() => setSelectedDate(dateStr)}
                    >
                      <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                        {isToday ? 'Today' : dayName}
                      </Text>
                      <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>
                        {dayNum}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                        {month}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedDate && (
              <View style={styles.bookingSection}>
                <Text style={styles.bookingSectionTitle}>Select Time</Text>
                <View style={styles.timeGrid}>
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <Pressable
                        key={time}
                        style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Occasion (Optional)</Text>
              <View style={styles.occasionGrid}>
                {occasions.map((occasion) => {
                  const isSelected = selectedOccasion === occasion;
                  return (
                    <Pressable
                      key={occasion}
                      style={[styles.occasionCard, isSelected && styles.occasionCardSelected]}
                      onPress={() => setSelectedOccasion(isSelected ? null : occasion)}
                    >
                      <Text
                        style={[styles.occasionText, isSelected && styles.occasionTextSelected]}
                      >
                        {occasion}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Special Requests (Optional)</Text>
              <TextInput
                style={styles.specialRequestsInput}
                placeholder="Allergies, dietary restrictions, seating preferences..."
                placeholderTextColor={colors.textTertiary}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <SafeAreaView style={styles.confirmBar} edges={['bottom']}>
            <Pressable
              style={[
                styles.confirmButton,
                (!selectedDate || !selectedTime) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmReservation}
              disabled={!selectedDate || !selectedTime}
            >
              <Calendar size={20} color={colors.textLight} />
              <Text style={styles.confirmButtonText}>
                {selectedRestaurant.instantBook ? 'Confirm Reservation' : 'Request Reservation'}
              </Text>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderFiltersModal = () => {
    return (
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filtersContainer} edges={['top']}>
          <View style={styles.filtersHeader}>
            <Pressable onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.filtersTitle}>Filters</Text>
            <Pressable onPress={() => setPriceFilter([1, 2, 3, 4])}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.filtersContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceFilterGrid}>
                {[1, 2, 3, 4].map((price) => {
                  const isSelected = priceFilter.includes(price);
                  return (
                    <Pressable
                      key={price}
                      style={[styles.priceFilterCard, isSelected && styles.priceFilterCardSelected]}
                      onPress={() => togglePriceFilter(price)}
                    >
                      <Text
                        style={[
                          styles.priceFilterText,
                          isSelected && styles.priceFilterTextSelected,
                        ]}
                      >
                        {getPriceLabel(price)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <SafeAreaView style={styles.applyFiltersBar} edges={['bottom']}>
            <Pressable style={styles.applyFiltersButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyFiltersText}>
                Show {filteredRestaurants.length} Restaurants
              </Text>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Restaurants</Text>
            <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
              <Filter size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants, cuisines, cities..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {cuisineCategories.map((cat) => {
              const isSelected = selectedCuisine === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setSelectedCuisine(cat.id)}
                >
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedCuisine === 'all' && featuredRestaurants.length > 0 && (
            <View style={styles.featuredSection}>
              <Text style={styles.sectionHeader}>Featured Restaurants</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {featuredRestaurants.map((rest) => renderRestaurantCard(rest, true))}
              </ScrollView>
            </View>
          )}

          <View style={styles.allRestaurants}>
            <Text style={styles.sectionHeader}>
              {selectedCuisine === 'all'
                ? 'All Restaurants'
                : cuisineCategories.find((c) => c.id === selectedCuisine)?.label || 'Restaurants'}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredRestaurants.length} restaurant
              {filteredRestaurants.length !== 1 ? 's' : ''} available
            </Text>
            <View style={styles.restaurantsGrid}>
              {filteredRestaurants.map((rest) => renderRestaurantCard(rest))}
            </View>
          </View>

          {filteredRestaurants.length === 0 && (
            <View style={styles.emptyState}>
              <Utensils size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or browse different cuisines
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {renderDetailModal()}
      {renderBookingModal()}
      {renderFiltersModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoriesScroll: {
    marginTop: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.textLight,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  featuredSection: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  featuredScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  allRestaurants: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  restaurantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  restaurantCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantCardLarge: {
    width: width - 80,
  },
  cardImageContainer: {
    height: 130,
    position: 'relative',
  },
  cardImageContainerLarge: {
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  instantText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  michelinBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  michelinText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E4002B',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  priceRange: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cuisineText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalImageContainer: {
    height: 280,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderRight: {
    flexDirection: 'row',
    gap: 12,
  },
  modalIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
  },
  restaurantHeader: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  michelinTag: {
    flexDirection: 'row',
    gap: 2,
  },
  cuisineLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dishTag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dishText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  hoursInfo: {
    flex: 1,
  },
  hoursLabel: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  hoursValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  featureGrid: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
  },
  dietaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dietaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
  dressCode: {
    fontSize: 15,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bookingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bookingBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  avgPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  avgPriceUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  bookingModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bookingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  bookingModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bookingModalContent: {
    flex: 1,
    padding: 20,
  },
  bookingRestaurantCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bookingRestaurantImage: {
    width: 100,
    height: 100,
  },
  bookingRestaurantInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookingRestaurantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bookingRestaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingRestaurantRating: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookingSection: {
    marginBottom: 24,
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guestButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonDisabled: {
    opacity: 0.5,
  },
  guestCountContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestCount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  guestLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dateScrollContent: {
    gap: 12,
  },
  dateCard: {
    width: 80,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  dateCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    marginBottom: 4,
  },
  dateDayNum: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 2,
  },
  dateTextSelected: {
    color: colors.textLight,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  timeCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.textLight,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  occasionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  occasionCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}15`,
  },
  occasionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  occasionTextSelected: {
    color: colors.secondary,
  },
  specialRequestsInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 100,
  },
  confirmBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  filtersContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  filtersContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  priceFilterGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priceFilterCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  priceFilterCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.accent,
  },
  priceFilterText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  priceFilterTextSelected: {
    color: colors.primary,
  },
  applyFiltersBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
});
