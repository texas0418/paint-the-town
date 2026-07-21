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
  Check,
  Zap,
  Shield,
  Minus,
  Plus,
  ChevronRight,
  Sparkles,
  Map,
  GraduationCap,
  UtensilsCrossed,
  Mountain,
  Palette,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { localExperiences, experienceReviews, experienceCategories } from '@/mocks/experiences';
import { LocalExperience } from '@/types';

const { width } = Dimensions.get('window');

const getCategoryIcon = (iconName: string, size: number, color: string) => {
  const icons: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles size={size} color={color} />,
    Map: <Map size={size} color={color} />,
    GraduationCap: <GraduationCap size={size} color={color} />,
    UtensilsCrossed: <UtensilsCrossed size={size} color={color} />,
    Mountain: <Mountain size={size} color={color} />,
    Heart: <Heart size={size} color={color} />,
    Palette: <Palette size={size} color={color} />,
  };
  return icons[iconName] || <Sparkles size={size} color={color} />;
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function LocalExperiencesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExperience, setSelectedExperience] = useState<LocalExperience | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(2);

  const filteredExperiences = useMemo(() => {
    let filtered = localExperiences;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.title.toLowerCase().includes(query) ||
          exp.location.city.toLowerCase().includes(query) ||
          exp.location.country.toLowerCase().includes(query) ||
          exp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((exp) => exp.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const featuredExperiences = useMemo(() => {
    return localExperiences.filter((exp) => exp.featured);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]));
  }, []);

  const openExperience = useCallback((experience: LocalExperience) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedExperience(experience);
    setSelectedDate(null);
    setSelectedTime(null);
    setGuestCount(2);
  }, []);

  const closeExperience = useCallback(() => {
    setSelectedExperience(null);
    setShowBookingModal(false);
  }, []);

  const handleBookNow = useCallback(() => {
    setShowBookingModal(true);
  }, []);

  const handleConfirmBooking = useCallback(() => {
    if (!selectedExperience || !selectedDate || !selectedTime) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setShowBookingModal(false);
    setSelectedExperience(null);

    Alert.alert(
      'Booking Confirmed! 🎉',
      `Your ${selectedExperience.title} experience has been ${selectedExperience.instantBook ? 'confirmed' : 'requested'}. Check your bookings for details.`,
      [{ text: 'Great!' }]
    );
  }, [selectedExperience, selectedDate, selectedTime]);

  const reviews = useMemo(() => {
    if (!selectedExperience) return [];
    return experienceReviews.filter((r) => r.experienceId === selectedExperience.id);
  }, [selectedExperience]);

  const renderExperienceCard = useCallback(
    (experience: LocalExperience, isLarge = false) => {
      const isFavorite = favorites.includes(experience.id);

      return (
        <Pressable
          key={experience.id}
          style={[styles.experienceCard, isLarge && styles.experienceCardLarge]}
          onPress={() => openExperience(experience)}
        >
          <View style={[styles.cardImageContainer, isLarge && styles.cardImageContainerLarge]}>
            <Image source={{ uri: experience.image }} style={styles.cardImage} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.cardGradient}
            />
            <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(experience.id)}>
              <Heart
                size={20}
                color={isFavorite ? colors.error : colors.textLight}
                fill={isFavorite ? colors.error : 'transparent'}
              />
            </Pressable>
            {experience.instantBook && (
              <View style={styles.instantBadge}>
                <Zap size={12} color={colors.warning} fill={colors.warning} />
                <Text style={styles.instantText}>Instant</Text>
              </View>
            )}
            {experience.host.superhost && (
              <View style={styles.superhostBadge}>
                <Award size={12} color={colors.secondary} />
                <Text style={styles.superhostText}>Superhost</Text>
              </View>
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.rating}>{experience.rating}</Text>
                <Text style={styles.reviewCount}>({experience.reviewCount})</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {experience.title}
            </Text>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Clock size={13} color={colors.textTertiary} />
                <Text style={styles.metaText}>{experience.duration}</Text>
              </View>
              <View style={styles.metaItem}>
                <MapPin size={13} color={colors.textTertiary} />
                <Text style={styles.metaText}>{experience.location.city}</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ${experience.price}
                <Text style={styles.priceUnit}> / person</Text>
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [favorites, openExperience, toggleFavorite]
  );

  const renderDetailModal = () => {
    if (!selectedExperience) return null;

    return (
      <Modal
        visible={!!selectedExperience}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeExperience}
      >
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedExperience.image }}
                style={styles.modalImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                style={styles.modalImageGradient}
              />
              <SafeAreaView style={styles.modalHeader} edges={['top']}>
                <Pressable style={styles.modalBackButton} onPress={closeExperience}>
                  <ChevronLeft size={24} color={colors.textLight} />
                </Pressable>
                <View style={styles.modalHeaderRight}>
                  <Pressable
                    style={styles.modalIconButton}
                    onPress={() => toggleFavorite(selectedExperience.id)}
                  >
                    <Heart
                      size={22}
                      color={colors.textLight}
                      fill={
                        favorites.includes(selectedExperience.id) ? colors.error : 'transparent'
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
              <View style={styles.hostRow}>
                <Image
                  source={{ uri: selectedExperience.host.avatar }}
                  style={styles.hostAvatar}
                  contentFit="cover"
                />
                <View style={styles.hostInfo}>
                  <Text style={styles.hostedBy}>Hosted by</Text>
                  <View style={styles.hostNameRow}>
                    <Text style={styles.hostName}>{selectedExperience.host.name}</Text>
                    {selectedExperience.host.verified && (
                      <View style={styles.verifiedBadge}>
                        <Shield size={12} color={colors.primary} fill={colors.primary} />
                      </View>
                    )}
                  </View>
                </View>
                {selectedExperience.host.superhost && (
                  <View style={styles.superhostTag}>
                    <Award size={14} color={colors.secondary} />
                    <Text style={styles.superhostTagText}>Superhost</Text>
                  </View>
                )}
              </View>

              <Text style={styles.modalTitle}>{selectedExperience.title}</Text>

              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Star size={18} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.statValue}>{selectedExperience.rating}</Text>
                  <Text style={styles.statLabel}>({selectedExperience.reviewCount} reviews)</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Clock size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{selectedExperience.duration}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Users size={18} color={colors.primary} />
                  <Text style={styles.statValue}>{selectedExperience.groupSize.max} max</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About this experience</Text>
                <Text style={styles.description}>{selectedExperience.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What&apos;s included</Text>
                <View style={styles.includedList}>
                  {selectedExperience.included.map((item, index) => (
                    <View key={index} style={styles.includedItem}>
                      <Check size={16} color={colors.success} />
                      <Text style={styles.includedText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {selectedExperience.notIncluded.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Not included</Text>
                  <View style={styles.includedList}>
                    {selectedExperience.notIncluded.map((item, index) => (
                      <View key={index} style={styles.includedItem}>
                        <X size={16} color={colors.textTertiary} />
                        <Text style={styles.notIncludedText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {selectedExperience.requirements && selectedExperience.requirements.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Requirements</Text>
                  <View style={styles.includedList}>
                    {selectedExperience.requirements.map((item, index) => (
                      <View key={index} style={styles.includedItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.requirementText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.locationCard}>
                  <MapPin size={20} color={colors.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationCity}>
                      {selectedExperience.location.city}, {selectedExperience.location.country}
                    </Text>
                    <Text style={styles.locationAddress}>
                      {selectedExperience.location.address}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.tagContainer}>
                  {selectedExperience.languages.map((lang, index) => (
                    <View key={index} style={styles.languageTag}>
                      <Text style={styles.languageText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cancellation policy</Text>
                <View style={styles.policyCard}>
                  <Text style={styles.policyTitle}>
                    {selectedExperience.cancellationPolicy.charAt(0).toUpperCase() +
                      selectedExperience.cancellationPolicy.slice(1)}
                  </Text>
                  <Text style={styles.policyDescription}>
                    {selectedExperience.cancellationPolicy === 'flexible'
                      ? 'Full refund up to 24 hours before the experience'
                      : selectedExperience.cancellationPolicy === 'moderate'
                        ? 'Full refund up to 5 days before the experience'
                        : 'Full refund up to 7 days before the experience'}
                  </Text>
                </View>
              </View>

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
                <Text style={styles.bookingPrice}>${selectedExperience.price}</Text>
                <Text style={styles.bookingPriceUnit}>/ person</Text>
              </View>
              <Pressable style={styles.bookButton} onPress={handleBookNow}>
                <Text style={styles.bookButtonText}>Book Now</Text>
                {selectedExperience.instantBook && (
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
    if (!selectedExperience || !showBookingModal) return null;

    const availability = selectedExperience.availability;
    const selectedAvailability = availability.find((a) => a.date === selectedDate);
    const totalPrice = selectedExperience.price * guestCount;

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
            <Text style={styles.bookingModalTitle}>Book Experience</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.bookingModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.bookingExperienceCard}>
              <Image
                source={{ uri: selectedExperience.image }}
                style={styles.bookingExperienceImage}
                contentFit="cover"
              />
              <View style={styles.bookingExperienceInfo}>
                <Text style={styles.bookingExperienceTitle} numberOfLines={2}>
                  {selectedExperience.title}
                </Text>
                <View style={styles.bookingExperienceMeta}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.bookingExperienceRating}>
                    {selectedExperience.rating} ({selectedExperience.reviewCount})
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bookingSection}>
              <Text style={styles.bookingSectionTitle}>Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScrollContent}
              >
                {availability.map((slot) => {
                  const date = new Date(slot.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === slot.date;

                  return (
                    <Pressable
                      key={slot.date}
                      style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                      onPress={() => {
                        setSelectedDate(slot.date);
                        setSelectedTime(null);
                      }}
                    >
                      <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>
                        {dayName}
                      </Text>
                      <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>
                        {dayNum}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                        {month}
                      </Text>
                      <Text style={[styles.spotsLeft, isSelected && styles.spotsLeftSelected]}>
                        {slot.spotsLeft} spots
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {selectedDate && selectedAvailability && (
              <View style={styles.bookingSection}>
                <Text style={styles.bookingSectionTitle}>Select Time</Text>
                <View style={styles.timeGrid}>
                  {selectedAvailability.times.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <Pressable
                        key={time}
                        style={[styles.timeCard, isSelected && styles.timeCardSelected]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Clock size={16} color={isSelected ? colors.textLight : colors.primary} />
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
              <Text style={styles.bookingSectionTitle}>Number of Guests</Text>
              <View style={styles.guestSelector}>
                <Pressable
                  style={[
                    styles.guestButton,
                    guestCount <= selectedExperience.groupSize.min && styles.guestButtonDisabled,
                  ]}
                  onPress={() =>
                    guestCount > selectedExperience.groupSize.min &&
                    setGuestCount((prev) => prev - 1)
                  }
                  disabled={guestCount <= selectedExperience.groupSize.min}
                >
                  <Minus
                    size={20}
                    color={
                      guestCount <= selectedExperience.groupSize.min
                        ? colors.textTertiary
                        : colors.primary
                    }
                  />
                </Pressable>
                <View style={styles.guestCountContainer}>
                  <Text style={styles.guestCount}>{guestCount}</Text>
                  <Text style={styles.guestLabel}>guest{guestCount !== 1 ? 's' : ''}</Text>
                </View>
                <Pressable
                  style={[
                    styles.guestButton,
                    guestCount >= selectedExperience.groupSize.max && styles.guestButtonDisabled,
                  ]}
                  onPress={() =>
                    guestCount < selectedExperience.groupSize.max &&
                    setGuestCount((prev) => prev + 1)
                  }
                  disabled={guestCount >= selectedExperience.groupSize.max}
                >
                  <Plus
                    size={20}
                    color={
                      guestCount >= selectedExperience.groupSize.max
                        ? colors.textTertiary
                        : colors.primary
                    }
                  />
                </Pressable>
              </View>
              <Text style={styles.groupSizeNote}>
                Group size: {selectedExperience.groupSize.min}-{selectedExperience.groupSize.max}{' '}
                people
              </Text>
            </View>

            <View style={styles.priceSummary}>
              <Text style={styles.priceSummaryTitle}>Price Summary</Text>
              <View style={styles.priceRow2}>
                <Text style={styles.priceRowLabel}>
                  ${selectedExperience.price} × {guestCount} guest{guestCount !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.priceRowValue}>${totalPrice}</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceRow2}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${totalPrice}</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <SafeAreaView style={styles.confirmBar} edges={['bottom']}>
            <Pressable
              style={[
                styles.confirmButton,
                (!selectedDate || !selectedTime) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime}
            >
              <Text style={styles.confirmButtonText}>
                {selectedExperience.instantBook ? 'Confirm & Pay' : 'Request to Book'}
              </Text>
              <ChevronRight size={20} color={colors.textLight} />
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
            <Text style={styles.headerTitle}>Experiences</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search experiences, cities..."
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
            {experienceCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  {getCategoryIcon(
                    cat.icon,
                    16,
                    isSelected ? colors.textLight : colors.textSecondary
                  )}
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
          {selectedCategory === 'all' && featuredExperiences.length > 0 && (
            <View style={styles.featuredSection}>
              <Text style={styles.sectionHeader}>Featured Experiences</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {featuredExperiences.map((exp) => renderExperienceCard(exp, true))}
              </ScrollView>
            </View>
          )}

          <View style={styles.allExperiences}>
            <Text style={styles.sectionHeader}>
              {selectedCategory === 'all'
                ? 'All Experiences'
                : experienceCategories.find((c) => c.id === selectedCategory)?.label ||
                  'Experiences'}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredExperiences.length} experience
              {filteredExperiences.length !== 1 ? 's' : ''} available
            </Text>
            <View style={styles.experiencesGrid}>
              {filteredExperiences.map((exp) => renderExperienceCard(exp))}
            </View>
          </View>

          {filteredExperiences.length === 0 && (
            <View style={styles.emptyState}>
              <Search size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No experiences found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your search or browse different categories
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {renderDetailModal()}
      {renderBookingModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 24,
    marginRight: 8,
    gap: 8,
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
  allExperiences: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  experiencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  experienceCard: {
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
  experienceCardLarge: {
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
  superhostBadge: {
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
  superhostText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
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
  priceRow: {
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
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
    height: 300,
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
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hostedBy: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  hostNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superhostTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  superhostTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    lineHeight: 32,
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
  includedList: {
    gap: 10,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  includedText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  notIncludedText: {
    fontSize: 15,
    color: colors.textTertiary,
    flex: 1,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.textTertiary,
    width: 16,
  },
  requirementText: {
    fontSize: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  policyCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
  bookingPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  bookingPriceUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  bookButtonText: {
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
  bookingExperienceCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bookingExperienceImage: {
    width: 100,
    height: 100,
  },
  bookingExperienceInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookingExperienceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  bookingExperienceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingExperienceRating: {
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
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
    marginBottom: 8,
  },
  dateTextSelected: {
    color: colors.textLight,
  },
  spotsLeft: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  spotsLeftSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: colors.textLight,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.borderLight,
    gap: 8,
  },
  timeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  timeTextSelected: {
    color: colors.textLight,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
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
  },
  guestLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  groupSizeNote: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
  priceSummary: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  priceRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceRowLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  priceRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
});
