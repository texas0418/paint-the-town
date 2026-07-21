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
  Fuel,
  Users,
  Briefcase,
  X,
  Check,
  Calendar,
  ChevronDown,
  Car,
  Zap,
  Leaf,
  Settings2,
  Clock,
  Shield,
  Plus,
  Minus,
  CircleDot,
  Navigation,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  mockRentalCars,
  carRentalProviders,
  insuranceOptions,
  carExtras,
} from '@/mocks/carRentals';
import { RentalCar, CarCategory, CarInsuranceOption, CarExtra } from '@/types';

const CAR_CATEGORIES: { id: CarCategory; label: string; icon: typeof Car }[] = [
  { id: 'economy', label: 'Economy', icon: Car },
  { id: 'compact', label: 'Compact', icon: Car },
  { id: 'midsize', label: 'Midsize', icon: Car },
  { id: 'fullsize', label: 'Full Size', icon: Car },
  { id: 'suv', label: 'SUV', icon: Car },
  { id: 'luxury', label: 'Luxury', icon: Car },
  { id: 'convertible', label: 'Convertible', icon: Car },
  { id: 'minivan', label: 'Minivan', icon: Car },
  { id: 'pickup', label: 'Pickup', icon: Car },
  { id: 'electric', label: 'Electric', icon: Zap },
];

const PROVIDERS = ['All', ...carRentalProviders.map((p) => p.name)];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function CarRentalScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CarCategory[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState<RentalCar | null>(null);
  const [rentalDays, setRentalDays] = useState(3);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity'>('popularity');
  const [transmissionFilter, setTransmissionFilter] = useState<'all' | 'automatic' | 'manual'>(
    'all'
  );
  const [electricOnly, setElectricOnly] = useState(false);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<CarInsuranceOption | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{ extra: CarExtra; quantity: number }[]>([]);

  const filteredCars = useMemo(() => {
    let results = [...mockRentalCars];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.brand.toLowerCase().includes(query) ||
          c.model.toLowerCase().includes(query) ||
          c.pickupLocation.city.toLowerCase().includes(query)
      );
    }

    if (selectedCategories.length > 0) {
      results = results.filter((c) => selectedCategories.includes(c.category));
    }

    if (selectedProvider !== 'All') {
      results = results.filter((c) => c.provider.name === selectedProvider);
    }

    results = results.filter(
      (c) => c.pricePerDay >= priceRange[0] && c.pricePerDay <= priceRange[1]
    );

    if (transmissionFilter !== 'all') {
      results = results.filter((c) => c.transmission === transmissionFilter);
    }

    if (electricOnly) {
      results = results.filter((c) => c.isElectric);
    }

    if (freeCancellationOnly) {
      results = results.filter((c) => c.freeCancellation);
    }

    switch (sortBy) {
      case 'price':
        results.sort((a, b) => a.pricePerDay - b.pricePerDay);
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
    selectedCategories,
    selectedProvider,
    priceRange,
    sortBy,
    transmissionFilter,
    electricOnly,
    freeCancellationOnly,
  ]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const toggleCategory = useCallback((category: CarCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const openBooking = useCallback((car: RentalCar) => {
    setSelectedCar(car);
    setSelectedInsurance(insuranceOptions.find((i) => i.recommended) || null);
    setSelectedExtras([]);
    setShowBookingModal(true);
  }, []);

  const toggleExtra = useCallback((extra: CarExtra) => {
    setSelectedExtras((prev) => {
      const existing = prev.find((e) => e.extra.id === extra.id);
      if (existing) {
        return prev.filter((e) => e.extra.id !== extra.id);
      }
      return [...prev, { extra, quantity: 1 }];
    });
  }, []);

  const updateExtraQuantity = useCallback((extraId: string, change: number) => {
    setSelectedExtras((prev) =>
      prev.map((e) => {
        if (e.extra.id === extraId) {
          const newQty = Math.max(1, Math.min(e.extra.maxQuantity, e.quantity + change));
          return { ...e, quantity: newQty };
        }
        return e;
      })
    );
  }, []);

  const calculateTotal = useCallback(() => {
    if (!selectedCar) return { base: 0, insurance: 0, extras: 0, taxes: 0, total: 0 };

    const base = selectedCar.pricePerDay * rentalDays;
    const insurance = selectedInsurance ? selectedInsurance.pricePerDay * rentalDays : 0;
    const extras = selectedExtras.reduce(
      (sum, e) => sum + e.extra.pricePerDay * e.quantity * rentalDays,
      0
    );
    const subtotal = base + insurance + extras;
    const taxes = subtotal * 0.1;
    const total = subtotal + taxes;

    return { base, insurance, extras, taxes, total };
  }, [selectedCar, rentalDays, selectedInsurance, selectedExtras]);

  const handleBooking = useCallback(() => {
    if (!selectedCar) return;

    const { total } = calculateTotal();

    Alert.alert(
      'Confirm Booking',
      `Book ${selectedCar.name} for ${rentalDays} days?\n\nTotal: $${total.toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            setShowBookingModal(false);
            Alert.alert(
              'Booking Confirmed!',
              `Your ${selectedCar.name} rental has been confirmed.\n\nConfirmation code: CAR${Date.now().toString().slice(-6)}\n\nPick up at: ${selectedCar.pickupLocation.name}`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }, [selectedCar, rentalDays, calculateTotal]);

  const renderCarCard = useCallback(
    ({ item }: { item: RentalCar }) => {
      const isFavorite = favorites.includes(item.id);

      return (
        <Pressable style={styles.carCard} onPress={() => openBooking(item)}>
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.cardGradient}
            />
            <Pressable style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
              <Heart
                size={20}
                color={isFavorite ? colors.secondary : colors.textLight}
                fill={isFavorite ? colors.secondary : 'transparent'}
              />
            </Pressable>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Star size={12} color={colors.textLight} />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
            {item.isElectric && (
              <View style={styles.electricBadge}>
                <Leaf size={14} color={colors.success} />
              </View>
            )}
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardYear}>{item.year}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Text style={styles.rating}>{item.rating}</Text>
                <Text style={styles.reviewCount}>({item.reviewCount})</Text>
              </View>
            </View>

            <View style={styles.providerRow}>
              <Text style={styles.providerName}>{item.provider.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.locationText}>{item.pickupLocation.city}</Text>
              </View>
            </View>

            <View style={styles.specsRow}>
              <View style={styles.specItem}>
                <Users size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>{item.seats}</Text>
              </View>
              <View style={styles.specItem}>
                <Briefcase size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>{item.luggage.large + item.luggage.small}</Text>
              </View>
              <View style={styles.specItem}>
                <Settings2 size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>
                  {item.transmission === 'automatic' ? 'Auto' : 'Manual'}
                </Text>
              </View>
              <View style={styles.specItem}>
                <Fuel size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>{item.fuelType}</Text>
              </View>
            </View>

            <View style={styles.featuresRow}>
              {item.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureChip}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.priceContainer}>
                {item.originalPrice && (
                  <Text style={styles.originalPrice}>${item.originalPrice}</Text>
                )}
                <Text style={styles.price}>
                  ${item.pricePerDay}
                  <Text style={styles.perDay}>/day</Text>
                </Text>
              </View>
              <View style={styles.cardActions}>
                {item.freeCancellation && (
                  <View style={styles.freeCancelBadge}>
                    <Check size={12} color={colors.success} />
                    <Text style={styles.freeCancelText}>Free Cancel</Text>
                  </View>
                )}
                <Pressable style={styles.bookButton} onPress={() => openBooking(item)}>
                  <Text style={styles.bookButtonText}>Select</Text>
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

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.filterSectionTitle}>Car Category</Text>
          <View style={styles.categoryGrid}>
            {CAR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              const CatIcon = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                  onPress={() => toggleCategory(cat.id)}
                >
                  <CatIcon size={18} color={isSelected ? colors.textLight : colors.text} />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      isSelected && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {cat.label}
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
                    selectedProvider === provider && styles.providerChipTextSelected,
                  ]}
                >
                  {provider}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.filterSectionTitle}>Transmission</Text>
          <View style={styles.transmissionOptions}>
            {(['all', 'automatic', 'manual'] as const).map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.transmissionOption,
                  transmissionFilter === option && styles.transmissionOptionSelected,
                ]}
                onPress={() => setTransmissionFilter(option)}
              >
                <Text
                  style={[
                    styles.transmissionOptionText,
                    transmissionFilter === option && styles.transmissionOptionTextSelected,
                  ]}
                >
                  {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            {(['popularity', 'rating', 'price'] as const).map((option) => (
              <Pressable
                key={option}
                style={[styles.sortOption, sortBy === option && styles.sortOptionSelected]}
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
                {sortBy === option && <Check size={16} color={colors.primary} />}
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Price Range (per day)</Text>
          <View style={styles.priceRangeDisplay}>
            <Text style={styles.priceRangeText}>
              ${priceRange[0]} - ${priceRange[1]}+
            </Text>
          </View>
          <View style={styles.priceButtons}>
            {[
              [0, 50],
              [50, 100],
              [100, 200],
              [200, 350],
              [350, 500],
            ].map(([min, max]) => (
              <Pressable
                key={`${min}-${max}`}
                style={[
                  styles.priceButton,
                  priceRange[0] === min && priceRange[1] === max && styles.priceButtonSelected,
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
                  ${min}-${max === 500 ? '500+' : `$${max}`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Additional Options</Text>
          <Pressable style={styles.toggleOption} onPress={() => setElectricOnly(!electricOnly)}>
            <View style={styles.toggleInfo}>
              <Leaf size={20} color={colors.success} />
              <View>
                <Text style={styles.toggleLabel}>Electric Vehicles Only</Text>
                <Text style={styles.toggleDescription}>Show only zero-emission cars</Text>
              </View>
            </View>
            <View style={[styles.toggle, electricOnly && styles.toggleActive]}>
              {electricOnly && <Check size={14} color={colors.textLight} />}
            </View>
          </Pressable>

          <Pressable
            style={styles.toggleOption}
            onPress={() => setFreeCancellationOnly(!freeCancellationOnly)}
          >
            <View style={styles.toggleInfo}>
              <Shield size={20} color={colors.primary} />
              <View>
                <Text style={styles.toggleLabel}>Free Cancellation</Text>
                <Text style={styles.toggleDescription}>Only show cars with free cancellation</Text>
              </View>
            </View>
            <View style={[styles.toggle, freeCancellationOnly && styles.toggleActive]}>
              {freeCancellationOnly && <Check size={14} color={colors.textLight} />}
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            style={styles.clearButton}
            onPress={() => {
              setSelectedCategories([]);
              setSelectedProvider('All');
              setPriceRange([0, 500]);
              setSortBy('popularity');
              setTransmissionFilter('all');
              setElectricOnly(false);
              setFreeCancellationOnly(false);
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
          <Pressable style={styles.applyButton} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyButtonText}>Show {filteredCars.length} Cars</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderBookingModal = () => {
    if (!selectedCar) return null;

    const pricing = calculateTotal();

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
            <Text style={styles.modalTitle}>Book Your Car</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.bookingContent} showsVerticalScrollIndicator={false}>
            <View style={styles.bookingCarCard}>
              <Image
                source={{ uri: selectedCar.image }}
                style={styles.bookingCarImage}
                contentFit="cover"
              />
              <View style={styles.bookingCarInfo}>
                <Text style={styles.bookingCarName}>{selectedCar.name}</Text>
                <Text style={styles.bookingCarDetails}>
                  {selectedCar.brand} {selectedCar.model} • {selectedCar.year}
                </Text>
                <View style={styles.bookingCarSpecs}>
                  <View style={styles.specItem}>
                    <Users size={12} color={colors.textSecondary} />
                    <Text style={styles.specText}>{selectedCar.seats}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Settings2 size={12} color={colors.textSecondary} />
                    <Text style={styles.specText}>{selectedCar.transmission}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationItem}>
                <View style={styles.locationIcon}>
                  <CircleDot size={16} color={colors.primary} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Pick-up</Text>
                  <Text style={styles.locationName}>{selectedCar.pickupLocation.name}</Text>
                  <Text style={styles.locationAddress}>{selectedCar.pickupLocation.address}</Text>
                </View>
              </View>
              <View style={styles.locationDivider} />
              <View style={styles.locationItem}>
                <View style={styles.locationIcon}>
                  <Navigation size={16} color={colors.secondary} />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationLabel}>Drop-off</Text>
                  <Text style={styles.locationName}>{selectedCar.dropoffLocation.name}</Text>
                  <Text style={styles.locationAddress}>{selectedCar.dropoffLocation.address}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.bookingSectionTitle}>Rental Duration</Text>
            <View style={styles.durationCard}>
              <View style={styles.durationInfo}>
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.durationText}>
                  {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setRentalDays(Math.max(1, rentalDays - 1))}
                >
                  <Minus size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>{rentalDays}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setRentalDays(Math.min(30, rentalDays + 1))}
                >
                  <Plus size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.bookingSectionTitle}>Protection Plan</Text>
            {insuranceOptions.map((insurance) => (
              <Pressable
                key={insurance.id}
                style={[
                  styles.insuranceOption,
                  selectedInsurance?.id === insurance.id && styles.insuranceOptionSelected,
                ]}
                onPress={() => setSelectedInsurance(insurance)}
              >
                <View style={styles.insuranceHeader}>
                  <View style={styles.insuranceInfo}>
                    <Text style={styles.insuranceName}>{insurance.name}</Text>
                    {insurance.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.insurancePrice}>${insurance.pricePerDay}/day</Text>
                </View>
                <Text style={styles.insuranceDescription}>{insurance.description}</Text>
                <View style={styles.coverageList}>
                  {insurance.coverage.slice(0, 3).map((item, idx) => (
                    <View key={idx} style={styles.coverageItem}>
                      <Check size={12} color={colors.success} />
                      <Text style={styles.coverageText}>{item}</Text>
                    </View>
                  ))}
                </View>
                <View
                  style={[
                    styles.radioButton,
                    selectedInsurance?.id === insurance.id && styles.radioButtonSelected,
                  ]}
                >
                  {selectedInsurance?.id === insurance.id && (
                    <Check size={14} color={colors.textLight} />
                  )}
                </View>
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.insuranceOption,
                styles.noInsuranceOption,
                !selectedInsurance && styles.insuranceOptionSelected,
              ]}
              onPress={() => setSelectedInsurance(null)}
            >
              <View style={styles.insuranceHeader}>
                <Text style={styles.insuranceName}>No Protection</Text>
                <Text style={styles.insurancePrice}>$0/day</Text>
              </View>
              <Text style={styles.insuranceDescription}>I&apos;ll take the risk - not recommended</Text>
              <View style={[styles.radioButton, !selectedInsurance && styles.radioButtonSelected]}>
                {!selectedInsurance && <Check size={14} color={colors.textLight} />}
              </View>
            </Pressable>

            <Text style={styles.bookingSectionTitle}>Extras</Text>
            {carExtras.map((extra) => {
              const selected = selectedExtras.find((e) => e.extra.id === extra.id);
              return (
                <Pressable
                  key={extra.id}
                  style={[styles.extraOption, selected && styles.extraOptionSelected]}
                  onPress={() => toggleExtra(extra)}
                >
                  <View style={styles.extraInfo}>
                    <Text style={styles.extraName}>{extra.name}</Text>
                    <Text style={styles.extraDescription}>{extra.description}</Text>
                  </View>
                  <View style={styles.extraPriceSection}>
                    <Text style={styles.extraPrice}>${extra.pricePerDay}/day</Text>
                    {selected && (
                      <View style={styles.extraQuantity}>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => updateExtraQuantity(extra.id, -1)}
                        >
                          <Minus size={14} color={colors.text} />
                        </Pressable>
                        <Text style={styles.quantityText}>{selected.quantity}</Text>
                        <Pressable
                          style={styles.quantityButton}
                          onPress={() => updateExtraQuantity(extra.id, 1)}
                        >
                          <Plus size={14} color={colors.text} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                    {selected && <Check size={14} color={colors.textLight} />}
                  </View>
                </Pressable>
              );
            })}

            <Text style={styles.bookingSectionTitle}>Price Breakdown</Text>
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  ${selectedCar.pricePerDay} × {rentalDays} days
                </Text>
                <Text style={styles.priceValue}>${pricing.base.toFixed(2)}</Text>
              </View>
              {selectedInsurance && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{selectedInsurance.name}</Text>
                  <Text style={styles.priceValue}>${pricing.insurance.toFixed(2)}</Text>
                </View>
              )}
              {pricing.extras > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Extras</Text>
                  <Text style={styles.priceValue}>${pricing.extras.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Taxes & fees (10%)</Text>
                <Text style={styles.priceValue}>${pricing.taxes.toFixed(2)}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${pricing.total.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.policyInfo}>
              <View style={styles.policyItem}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.policyText}>
                  Pick-up: {selectedCar.pickupLocation.hours.weekday}
                </Text>
              </View>
              {selectedCar.freeCancellation && (
                <View style={styles.policyItem}>
                  <Shield size={16} color={colors.success} />
                  <Text style={styles.policyText}>
                    Free cancellation {selectedCar.cancellationDeadline}
                  </Text>
                </View>
              )}
              <View style={styles.policyItem}>
                <Fuel size={16} color={colors.textSecondary} />
                <Text style={styles.policyText}>{selectedCar.policies.fuelPolicy}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bookingFooter}>
            <View style={styles.bookingTotalContainer}>
              <Text style={styles.bookingTotalLabel}>Total</Text>
              <Text style={styles.bookingTotalPrice}>${pricing.total.toFixed(2)}</Text>
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
          <Text style={styles.headerTitle}>Car Rental</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by car, brand, or location..."
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
          <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <SlidersHorizontal size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScrollContainer}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CAR_CATEGORIES.slice(0, 6).map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            const CatIcon = cat.icon;
            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => toggleCategory(cat.id)}
              >
                <CatIcon size={16} color={isSelected ? colors.textLight : colors.text} />
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filteredCars.length} cars available</Text>
          <Pressable style={styles.sortButton} onPress={() => setShowFilters(true)}>
            <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
            <ChevronDown size={16} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          data={filteredCars}
          renderItem={renderCarCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Car size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Cars Found</Text>
              <Text style={styles.emptyText}>Try adjusting your filters or search criteria</Text>
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
    fontWeight: '700' as const,
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
  categoriesScrollContainer: {
    height: 56,
    marginBottom: 12,
  },
  // FIXED: Content container style
  categoriesScroll: {
    paddingLeft: 16,
    paddingRight: 32,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  categoryChipTextSelected: {
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
    fontWeight: '600' as const,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  carCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    height: 160,
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
  featuredText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  electricBadge: {
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
  categoryTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    color: colors.text,
  },
  cardYear: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  specsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  featureChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
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
    fontWeight: '700' as const,
    color: colors.text,
  },
  perDay: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeCancelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeCancelText: {
    fontSize: 10,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
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
  categoryButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  categoryButtonTextSelected: {
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
    fontWeight: '600' as const,
    color: colors.text,
  },
  providerChipTextSelected: {
    color: colors.textLight,
  },
  transmissionOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  transmissionOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  transmissionOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  transmissionOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  transmissionOptionTextSelected: {
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
    fontWeight: '600' as const,
    color: colors.primary,
  },
  priceRangeDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  priceRangeText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  bookingContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCarCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  bookingCarImage: {
    width: 120,
    height: 100,
  },
  bookingCarInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  bookingCarName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 2,
  },
  bookingCarDetails: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bookingCarSpecs: {
    flexDirection: 'row',
    gap: 12,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  locationDivider: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 15,
    marginVertical: 8,
  },
  bookingSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  durationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  insuranceOption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  insuranceOptionSelected: {
    borderColor: colors.primary,
  },
  noInsuranceOption: {
    backgroundColor: colors.surfaceSecondary,
  },
  insuranceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  insuranceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insuranceName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  recommendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  insurancePrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  insuranceDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  coverageList: {
    gap: 4,
  },
  coverageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverageText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  radioButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  extraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  extraOptionSelected: {
    borderColor: colors.primary,
  },
  extraInfo: {
    flex: 1,
  },
  extraName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  extraDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  extraPriceSection: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  extraPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  extraQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    fontWeight: '600' as const,
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
    fontWeight: '700' as const,
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  policyInfo: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    gap: 10,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  policyText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
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
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
    color: colors.textLight,
  },
});
