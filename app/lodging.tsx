/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Heart,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Coffee,
  Sparkles,
  X,
  Check,
  Calendar,
  Users,
  ChevronDown,
  Building2,
  Home,
  Tent,
  Castle,
  TreePine,
  Hotel,
  Bed,
  Bath,
  Leaf,
  Zap,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { mockLodgings, lodgingProviders } from '@/mocks/lodging';
import { Lodging, LodgingType, LodgingRoom } from '@/types';

const { width } = Dimensions.get('window');

const LODGING_TYPES: { id: LodgingType; label: string; icon: typeof Hotel }[] = [
  { id: 'hotel', label: 'Hotels', icon: Hotel },
  { id: 'airbnb', label: 'Airbnb', icon: Home },
  { id: 'hostel', label: 'Hostels', icon: Bed },
  { id: 'resort', label: 'Resorts', icon: Waves },
  { id: 'villa', label: 'Villas', icon: Castle },
  { id: 'apartment', label: 'Apartments', icon: Building2 },
  { id: 'cabin', label: 'Cabins', icon: TreePine },
  { id: 'boutique', label: 'Boutique', icon: Sparkles },
];

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  WiFi: Wifi,
  Parking: Car,
  Restaurant: Utensils,
  Gym: Dumbbell,
  Pool: Waves,
  Spa: Bath,
  Breakfast: Coffee,
};

const PROVIDERS = ['All', ...lodgingProviders.map((p) => p.name)];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function LodgingScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<LodgingType[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedLodging, setSelectedLodging] = useState<Lodging | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<LodgingRoom | null>(null);
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [nights, setNights] = useState(3);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity'>(
    'popularity'
  );
  const [instantBookOnly, setInstantBookOnly] = useState(false);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);

  const filteredLodgings = useMemo(() => {
    let results = [...mockLodgings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (l) =>
          l.name.toLowerCase().includes(query) ||
          l.location.city.toLowerCase().includes(query) ||
          l.location.country.toLowerCase().includes(query)
      );
    }

    if (selectedTypes.length > 0) {
      results = results.filter((l) => selectedTypes.includes(l.type));
    }

    if (selectedProvider !== 'All') {
      results = results.filter((l) => l.provider.name === selectedProvider);
    }

    results = results.filter(
      (l) => l.minPrice >= priceRange[0] && l.minPrice <= priceRange[1]
    );

    if (instantBookOnly) {
      results = results.filter((l) => l.instantBook);
    }

    if (freeCancellationOnly) {
      results = results.filter(
        (l) =>
          l.policies.cancellation === 'free' ||
          l.policies.cancellation === 'flexible'
      );
    }

    switch (sortBy) {
      case 'price':
        results.sort((a, b) => a.minPrice - b.minPrice);
        break;
      case 'rating':
        results.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return results;
  }, [
    searchQuery,
    selectedTypes,
    selectedProvider,
    priceRange,
    sortBy,
    instantBookOnly,
    freeCancellationOnly,
  ]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const toggleType = useCallback((type: LodgingType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const openBooking = useCallback((lodging: Lodging) => {
    setSelectedLodging(lodging);
    setSelectedRoom(lodging.rooms[0]);
    setShowBookingModal(true);
  }, []);

  const handleBooking = useCallback(() => {
    if (!selectedLodging || !selectedRoom) return;

    const totalPrice = selectedRoom.pricePerNight * nights;
    const taxes = totalPrice * 0.12;
    const fees = 25;

    Alert.alert(
      'Confirm Booking',
      `Book ${selectedRoom.name} at ${selectedLodging.name} for ${nights} nights?\n\nTotal: $${(totalPrice + taxes + fees).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            setShowBookingModal(false);
            Alert.alert(
              'Booking Confirmed!',
              `Your reservation at ${selectedLodging.name} has been confirmed. Confirmation code: LDG${Date.now().toString().slice(-6)}`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }, [selectedLodging, selectedRoom, nights]);

  const getTypeIcon = (type: LodgingType) => {
    const found = LODGING_TYPES.find((t) => t.id === type);
    return found?.icon || Hotel;
  };

  const renderLodgingCard = useCallback(
    ({ item }: { item: Lodging }) => {
      const TypeIcon = getTypeIcon(item.type);
      const isFavorite = favorites.includes(item.id);

      return (
        <Pressable style={styles.lodgingCard} onPress={() => openBooking(item)}>
          <View style={styles.cardImageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.cardGradient}
            />
            <Pressable
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Heart
                size={20}
                color={isFavorite ? colors.secondary : colors.textLight}
                fill={isFavorite ? colors.secondary : 'transparent'}
              />
            </Pressable>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Sparkles size={12} color={colors.textLight} />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
            {item.isNew && (
              <View style={[styles.featuredBadge, styles.newBadge]}>
                <Text style={styles.featuredText}>New</Text>
              </View>
            )}
            {item.sustainabilityBadge && (
              <View style={styles.ecoBadge}>
                <Leaf size={14} color={colors.success} />
              </View>
            )}
            <View style={styles.typeTag}>
              <TypeIcon size={12} color={colors.textLight} />
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.starRating && (
                  <View style={styles.starRating}>
                    {[...Array(item.starRating)].map((_, i) => (
                      <Star key={i} size={10} color="#FFD700" fill="#FFD700" />
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.rating}>{item.rating}</Text>
                <Text style={styles.reviewCount}>({item.reviewCount})</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location.neighborhood
                  ? `${item.location.neighborhood}, `
                  : ''}
                {item.location.city}
              </Text>
            </View>

            <Text style={styles.shortDescription} numberOfLines={2}>
              {item.shortDescription}
            </Text>

            <View style={styles.amenitiesRow}>
              {item.featuredAmenities.slice(0, 4).map((amenity, index) => {
                const AmenityIcon = AMENITY_ICONS[amenity] || Sparkles;
                return (
                  <View key={index} style={styles.amenityChip}>
                    <AmenityIcon size={12} color={colors.textSecondary} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceContainer}>
                {item.rooms[0]?.originalPrice && (
                  <Text style={styles.originalPrice}>
                    ${item.rooms[0].originalPrice}
                  </Text>
                )}
                <Text style={styles.price}>
                  ${item.minPrice}
                  <Text style={styles.perNight}>/night</Text>
                </Text>
              </View>
              <View style={styles.cardActions}>
                {item.instantBook && (
                  <View style={styles.instantBadge}>
                    <Zap size={12} color={colors.success} />
                    <Text style={styles.instantText}>Instant</Text>
                  </View>
                )}
                <Pressable
                  style={styles.bookButton}
                  onPress={() => openBooking(item)}
                >
                  <Text style={styles.bookButtonText}>View</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [favorites, toggleFavorite, openBooking]
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filters</Text>
          <Pressable onPress={() => setShowFilters(false)}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.filterSectionTitle}>Property Type</Text>
          <View style={styles.typeGrid}>
            {LODGING_TYPES.map((type) => {
              const TypeIcon = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              return (
                <Pressable
                  key={type.id}
                  style={[
                    styles.typeButton,
                    isSelected && styles.typeButtonSelected,
                  ]}
                  onPress={() => toggleType(type.id)}
                >
                  <TypeIcon
                    size={20}
                    color={isSelected ? colors.textLight : colors.text}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      isSelected && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.filterSectionTitle}>Provider</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.providerScroll}
          >
            {PROVIDERS.map((provider) => (
              <Pressable
                key={provider}
                style={[
                  styles.providerChip,
                  selectedProvider === provider && styles.providerChipSelected,
                ]}
                onPress={() => setSelectedProvider(provider)}
              >
                <Text
                  style={[
                    styles.providerChipText,
                    selectedProvider === provider &&
                      styles.providerChipTextSelected,
                  ]}
                >
                  {provider}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            {(['popularity', 'rating', 'price'] as const).map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.sortOption,
                  sortBy === option && styles.sortOptionSelected,
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextSelected,
                  ]}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
                {sortBy === option && (
                  <Check size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Price Range (per night)</Text>
          <View style={styles.priceRangeDisplay}>
            <Text style={styles.priceRangeText}>
              ${priceRange[0]} - ${priceRange[1]}+
            </Text>
          </View>
          <View style={styles.priceButtons}>
            {[
              [0, 100],
              [100, 300],
              [300, 500],
              [500, 1000],
              [1000, 5000],
            ].map(([min, max]) => (
              <Pressable
                key={`${min}-${max}`}
                style={[
                  styles.priceButton,
                  priceRange[0] === min &&
                    priceRange[1] === max &&
                    styles.priceButtonSelected,
                ]}
                onPress={() => setPriceRange([min, max])}
              >
                <Text
                  style={[
                    styles.priceButtonText,
                    priceRange[0] === min &&
                      priceRange[1] === max &&
                      styles.priceButtonTextSelected,
                  ]}
                >
                  ${min}-{max === 5000 ? '5k+' : `$${max}`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Booking Options</Text>
          <Pressable
            style={styles.toggleOption}
            onPress={() => setInstantBookOnly(!instantBookOnly)}
          >
            <View style={styles.toggleInfo}>
              <Zap size={20} color={colors.success} />
              <View>
                <Text style={styles.toggleLabel}>Instant Book</Text>
                <Text style={styles.toggleDescription}>
                  Book without waiting for approval
                </Text>
              </View>
            </View>
            <View
              style={[styles.toggle, instantBookOnly && styles.toggleActive]}
            >
              {instantBookOnly && (
                <Check size={14} color={colors.textLight} />
              )}
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleOption}
            onPress={() => setFreeCancellationOnly(!freeCancellationOnly)}
          >
            <View style={styles.toggleInfo}>
              <Calendar size={20} color={colors.primary} />
              <View>
                <Text style={styles.toggleLabel}>Free Cancellation</Text>
                <Text style={styles.toggleDescription}>
                  Flexible or free cancellation policy
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.toggle,
                freeCancellationOnly && styles.toggleActive,
              ]}
            >
              {freeCancellationOnly && (
                <Check size={14} color={colors.textLight} />
              )}
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setSelectedTypes([]);
              setSelectedProvider('All');
              setPriceRange([0, 5000]);
              setSortBy('popularity');
              setInstantBookOnly(false);
              setFreeCancellationOnly(false);
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
          <Pressable
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>
              Show {filteredLodgings.length} Results
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderBookingModal = () => {
    if (!selectedLodging || !selectedRoom) return null;

    const roomRate = selectedRoom.pricePerNight * nights;
    const taxes = roomRate * 0.12;
    const fees = 25;
    const total = roomRate + taxes + fees;

    return (
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowBookingModal(false)}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            <Text style={styles.modalTitle}>Book Your Stay</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.bookingContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.bookingHotelCard}>
              <Image
                source={{ uri: selectedLodging.image }}
                style={styles.bookingHotelImage}
                contentFit="cover"
              />
              <View style={styles.bookingHotelInfo}>
                <Text style={styles.bookingHotelName}>
                  {selectedLodging.name}
                </Text>
                <View style={styles.bookingHotelLocation}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={styles.bookingHotelLocationText}>
                    {selectedLodging.location.city},{' '}
                    {selectedLodging.location.country}
                  </Text>
                </View>
                <View style={styles.bookingHotelRating}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.bookingRatingText}>
                    {selectedLodging.rating} ({selectedLodging.reviewCount}{' '}
                    reviews)
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.bookingSectionTitle}>Select Room</Text>
            {selectedLodging.rooms.map((room) => (
              <Pressable
                key={room.id}
                style={[
                  styles.roomOption,
                  selectedRoom?.id === room.id && styles.roomOptionSelected,
                ]}
                onPress={() => setSelectedRoom(room)}
              >
                <Image
                  source={{ uri: room.images[0] }}
                  style={styles.roomImage}
                  contentFit="cover"
                />
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomDetails}>
                    {room.bedType} • Up to {room.maxGuests} guests
                    {room.size && ` • ${room.size} ${room.sizeUnit}`}
                  </Text>
                  <View style={styles.roomAmenities}>
                    {room.amenities.slice(0, 3).map((amenity, i) => (
                      <Text key={i} style={styles.roomAmenity}>
                        {amenity}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.roomPriceRow}>
                    {room.originalPrice && (
                      <Text style={styles.roomOriginalPrice}>
                        ${room.originalPrice}
                      </Text>
                    )}
                    <Text style={styles.roomPrice}>
                      ${room.pricePerNight}/night
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedRoom?.id === room.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedRoom?.id === room.id && (
                    <Check size={14} color={colors.textLight} />
                  )}
                </View>
              </Pressable>
            ))}

            <Text style={styles.bookingSectionTitle}>Stay Details</Text>
            <View style={styles.stayDetails}>
              <View style={styles.stayDetailRow}>
                <View style={styles.stayDetailLabel}>
                  <Calendar size={18} color={colors.textSecondary} />
                  <Text style={styles.stayDetailText}>Nights</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setNights(Math.max(1, nights - 1))}
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{nights}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() => setNights(nights + 1)}
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stayDetailRow}>
                <View style={styles.stayDetailLabel}>
                  <Users size={18} color={colors.textSecondary} />
                  <Text style={styles.stayDetailText}>Adults</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      setGuests({
                        ...guests,
                        adults: Math.max(1, guests.adults - 1),
                      })
                    }
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{guests.adults}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      setGuests({ ...guests, adults: guests.adults + 1 })
                    }
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.stayDetailRow}>
                <View style={styles.stayDetailLabel}>
                  <Users size={18} color={colors.textSecondary} />
                  <Text style={styles.stayDetailText}>Children</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      setGuests({
                        ...guests,
                        children: Math.max(0, guests.children - 1),
                      })
                    }
                  >
                    <Text style={styles.stepperButtonText}>-</Text>
                  </Pressable>
                  <Text style={styles.stepperValue}>{guests.children}</Text>
                  <Pressable
                    style={styles.stepperButton}
                    onPress={() =>
                      setGuests({ ...guests, children: guests.children + 1 })
                    }
                  >
                    <Text style={styles.stepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Text style={styles.bookingSectionTitle}>Price Breakdown</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  ${selectedRoom.pricePerNight} × {nights} nights
                </Text>
                <Text style={styles.priceValue}>${roomRate.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & fees (12%)</Text>
                <Text style={styles.priceValue}>${taxes.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Service fee</Text>
                <Text style={styles.priceValue}>${fees.toFixed(2)}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>Cancellation Policy</Text>
              <Text style={styles.policyText}>
                {selectedLodging.policies.cancellationDetails ||
                  `${selectedLodging.policies.cancellation.charAt(0).toUpperCase() + selectedLodging.policies.cancellation.slice(1)} cancellation`}
              </Text>
            </View>

            {selectedLodging.host && (
              <View style={styles.hostInfo}>
                <Image
                  source={{ uri: selectedLodging.host.avatar }}
                  style={styles.hostAvatar}
                  contentFit="cover"
                />
                <View style={styles.hostDetails}>
                  <Text style={styles.hostName}>
                    Hosted by {selectedLodging.host.name}
                  </Text>
                  {selectedLodging.host.isSuperhost && (
                    <View style={styles.superhostBadge}>
                      <Sparkles size={12} color={colors.warning} />
                      <Text style={styles.superhostText}>Superhost</Text>
                    </View>
                  )}
                  <Text style={styles.hostResponse}>
                    Response rate: {selectedLodging.host.responseRate}%
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.bookingFooter}>
            <View style={styles.bookingTotalContainer}>
              <Text style={styles.bookingTotalLabel}>Total</Text>
              <Text style={styles.bookingTotalPrice}>${total.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.confirmButton} onPress={handleBooking}>
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Find Lodging</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by city, hotel, or country..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typesScrollContainer}
          contentContainerStyle={styles.typesScroll}
        >
          {LODGING_TYPES.map((type) => {
            const TypeIcon = type.icon;
            const isSelected = selectedTypes.includes(type.id);
            return (
              <Pressable
                key={type.id}
                style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                onPress={() => toggleType(type.id)}
              >
                <TypeIcon
                  size={16}
                  color={isSelected ? colors.textLight : colors.text}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    isSelected && styles.typeChipTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filteredLodgings.length} properties found
          </Text>
          <Pressable
            style={styles.sortButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
            <ChevronDown size={16} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          data={filteredLodgings}
          renderItem={renderLodgingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Hotel size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Properties Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search criteria
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      {renderFilterModal()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // FIXED: Container style for ScrollView to set height
  typesScrollContainer: {
    height: 56,
    marginBottom: 12,
  },
  // FIXED: Content container style
  typesScroll: {
    paddingLeft: 16,
    paddingRight: 32,
    gap: 8,
    alignItems: 'center',
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  typeChipTextSelected: {
    color: colors.textLight,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  lodgingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadge: {
    backgroundColor: colors.success,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  ecoBadge: {
    position: 'absolute',
    top: 12,
    left: 90,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    textTransform: 'capitalize',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitleRow: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  starRating: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  shortDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  perNight: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  instantText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: colors.textLight,
  },
  providerScroll: {
    marginTop: 4,
  },
  providerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  providerChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  providerChipTextSelected: {
    color: colors.textLight,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sortOptionSelected: {
    backgroundColor: colors.accent,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  sortOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  priceRangeDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  priceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  priceButtonTextSelected: {
    color: colors.textLight,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  bookingContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingHotelCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  bookingHotelImage: {
    width: 100,
    height: 100,
  },
  bookingHotelInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookingHotelName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bookingHotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bookingHotelLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookingHotelRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingRatingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  roomOption: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomOptionSelected: {
    borderColor: colors.primary,
  },
  roomImage: {
    width: 90,
    height: 110,
  },
  roomInfo: {
    flex: 1,
    padding: 12,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  roomDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  roomAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  roomAmenity: {
    fontSize: 10,
    color: colors.textTertiary,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roomPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomOriginalPrice: {
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    alignSelf: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stayDetails: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  stayDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stayDetailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stayDetailText: {
    fontSize: 15,
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  priceBreakdown: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  policyInfo: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  hostAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hostDetails: {
    flex: 1,
    marginLeft: 12,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  superhostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  superhostText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  hostResponse: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bookingTotalContainer: {
    flex: 1,
  },
  bookingTotalLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookingTotalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
