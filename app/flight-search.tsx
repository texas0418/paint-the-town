/* eslint-disable max-lines -- tracked in #1 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
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
  Animated,
  Dimensions,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Plane,
  ArrowRightLeft,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Clock,
  Wifi,
  Zap,
  Tv,
  Luggage,
  BriefcaseBusiness,
  X,
  Check,
  SlidersHorizontal,
  Star,
  TrendingDown,
  Shield,
  ArrowRight,
  Minus,
  Plus,
  Info,
  Sparkles,
  Circle,
  AlertCircle,
  Tag,
  RefreshCw,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  FlightSearchResult,
  FlightSearchParams,
  Airport,
  CabinClass,
  TripType,
  SortOption,
  StopFilter,
  CABIN_CLASS_CONFIG,
  POPULAR_AIRPORTS,
  formatDuration,
  formatFlightTime,
  getStopsLabel,
  searchAirports,
} from '@/types/flight';
import { generateMockFlights, AIRLINES } from '@/mocks/flights';

const { width } = Dimensions.get('window');

// ============================================================================
// Sub-components
// ============================================================================

interface FlightCardProps {
  flight: FlightSearchResult;
  onPress: () => void;
  passengers: number;
}

function FlightCard({ flight, onPress, passengers }: FlightCardProps) {
  const outbound = flight.outbound;
  const firstSeg = outbound.segments[0];
  const lastSeg = outbound.segments[outbound.segments.length - 1];

  const tagConfig: Record<string, { bg: string; color: string; label: string }> = {
    best_value: { bg: `${colors.success}15`, color: colors.success, label: 'Best Value' },
    cheapest: { bg: `${colors.primary}15`, color: colors.primary, label: 'Cheapest' },
    fastest: { bg: `${colors.warning}15`, color: colors.warning, label: 'Fastest' },
    recommended: {
      bg: `${colors.primaryLight}15`,
      color: colors.primaryLight,
      label: 'Recommended',
    },
    early_bird: { bg: '#FFF3E015', color: '#E65100', label: 'Early Bird' },
    red_eye: { bg: '#E8EAF615', color: '#283593', label: 'Red Eye' },
  };

  return (
    <Pressable style={styles.flightCard} onPress={onPress}>
      {/* Tags */}
      {flight.tags.length > 0 && (
        <View style={styles.tagRow}>
          {flight.tags.slice(0, 2).map((tag) => {
            const cfg = tagConfig[tag];
            if (!cfg) return null;
            return (
              <View key={tag} style={[styles.tag, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Main flight info */}
      <View style={styles.flightMain}>
        {/* Airline */}
        <View style={styles.airlineSection}>
          <View style={styles.airlineLogo}>
            <Plane size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.airlineName}>{firstSeg.airline.name}</Text>
            <Text style={styles.flightNumber}>{firstSeg.flightNumber}</Text>
          </View>
        </View>

        {/* Times and Route */}
        <View style={styles.routeSection}>
          <View style={styles.timeBlock}>
            <Text style={styles.time}>{formatFlightTime(firstSeg.departure.time)}</Text>
            <Text style={styles.airportCode}>{firstSeg.departure.airport.code}</Text>
          </View>

          <View style={styles.routeLine}>
            <Text style={styles.duration}>{formatDuration(outbound.totalDuration)}</Text>
            <View style={styles.lineContainer}>
              <View style={styles.line} />
              {outbound.stops > 0 && (
                <View style={styles.stopDot}>
                  <Circle size={6} color={colors.warning} fill={colors.warning} />
                </View>
              )}
              <Plane
                size={14}
                color={colors.primary}
                style={{ transform: [{ rotate: '90deg' }] }}
              />
            </View>
            <Text style={[styles.stopsText, outbound.stops === 0 && styles.nonstopText]}>
              {getStopsLabel(outbound.stops)}
              {outbound.stops > 0 && outbound.layoverDurations && (
                <Text style={styles.layoverText}>
                  {' '}
                  ({formatDuration(outbound.layoverDurations[0])})
                </Text>
              )}
            </Text>
          </View>

          <View style={styles.timeBlock}>
            <Text style={styles.time}>{formatFlightTime(lastSeg.arrival.time)}</Text>
            <Text style={styles.airportCode}>{lastSeg.arrival.airport.code}</Text>
          </View>
        </View>

        {/* Amenities */}
        <View style={styles.amenitiesRow}>
          {firstSeg.wifi && (
            <View style={styles.amenityIcon}>
              <Wifi size={12} color={colors.textTertiary} />
            </View>
          )}
          {firstSeg.power && (
            <View style={styles.amenityIcon}>
              <Zap size={12} color={colors.textTertiary} />
            </View>
          )}
          {firstSeg.entertainment && (
            <View style={styles.amenityIcon}>
              <Tv size={12} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.baggageInfo}>
            {flight.baggage.carryOn.included ? (
              <BriefcaseBusiness size={12} color={colors.success} />
            ) : (
              <BriefcaseBusiness size={12} color={colors.textTertiary} />
            )}
            <Text
              style={[
                styles.baggageText,
                flight.baggage.carryOn.included ? styles.baggageIncluded : styles.baggagePaid,
              ]}
            >
              {flight.baggage.carryOn.included ? 'Carry-on incl.' : 'No carry-on'}
            </Text>
          </View>
          {flight.fareRules.refundable && (
            <View style={styles.refundBadge}>
              <Shield size={10} color={colors.success} />
              <Text style={styles.refundText}>Refundable</Text>
            </View>
          )}
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceSection}>
        {flight.originalPrice && <Text style={styles.originalPrice}>${flight.originalPrice}</Text>}
        <Text style={styles.price}>${flight.price}</Text>
        <Text style={styles.priceLabel}>per person</Text>
        {passengers > 1 && <Text style={styles.totalLabel}>${flight.totalPrice} total</Text>}
        <Text style={styles.fareClass}>{flight.fareClass}</Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// Airport Picker Modal
// ============================================================================

interface AirportPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (airport: Airport) => void;
  title: string;
}

function AirportPicker({ visible, onClose, onSelect, title }: AirportPickerProps) {
  const [query, setQuery] = useState('');
  const results = query.length >= 2 ? searchAirports(query) : POPULAR_AIRPORTS.slice(0, 12);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <Pressable onPress={onClose}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.pickerSearch}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.pickerInput}
            placeholder="Search city or airport code..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
        {query.length < 2 && <Text style={styles.pickerSectionLabel}>Popular Airports</Text>}
        <FlatList
          data={results}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <Pressable
              style={styles.airportRow}
              onPress={() => {
                onSelect(item);
                setQuery('');
                onClose();
              }}
            >
              <View style={styles.airportIcon}>
                <Plane size={18} color={colors.primary} />
              </View>
              <View style={styles.airportInfo}>
                <Text style={styles.airportCity}>{item.city}</Text>
                <Text style={styles.airportName}>{item.name}</Text>
              </View>
              <Text style={styles.airportCodePicker}>{item.code}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={styles.emptySearchText}>No airports found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Flight Detail Modal
// ============================================================================

interface FlightDetailProps {
  visible: boolean;
  flight: FlightSearchResult | null;
  onClose: () => void;
  onBook: () => void;
  passengers: number;
}

// eslint-disable-next-line complexity -- tracked in #1
function FlightDetailModal({ visible, flight, onClose, onBook, passengers }: FlightDetailProps) {
  if (!flight) return null;

  const outbound = flight.outbound;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onClose}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.detailTitle}>Flight Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Airline Header */}
          <View style={styles.detailAirline}>
            <View style={styles.detailAirlineLogo}>
              <Plane size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.detailAirlineName}>{outbound.segments[0].airline.name}</Text>
              <View style={styles.detailFlightRow}>
                <Text style={styles.detailFlightNum}>{outbound.segments[0].flightNumber}</Text>
                {outbound.segments[0].aircraft && (
                  <Text style={styles.detailAircraft}>{outbound.segments[0].aircraft}</Text>
                )}
              </View>
            </View>
            {outbound.segments[0].airline.rating && (
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{outbound.segments[0].airline.rating}</Text>
              </View>
            )}
          </View>

          {/* Route Segments */}
          <View style={styles.segmentSection}>
            <Text style={styles.segmentSectionTitle}>Outbound Flight</Text>
            {outbound.segments.map((seg, idx) => (
              <View key={idx}>
                <View style={styles.segmentCard}>
                  <View style={styles.segmentTimeline}>
                    <View style={styles.timelineDotFilled} />
                    <View style={styles.timelineBar} />
                    <View style={styles.timelineDotFilled} />
                  </View>
                  <View style={styles.segmentDetails}>
                    <View style={styles.segmentRow}>
                      <Text style={styles.segmentTime}>{formatFlightTime(seg.departure.time)}</Text>
                      <Text style={styles.segmentAirport}>
                        {seg.departure.airport.code} - {seg.departure.airport.city}
                      </Text>
                      {seg.departure.terminal && (
                        <Text style={styles.segmentTerminal}>
                          Terminal {seg.departure.terminal}
                        </Text>
                      )}
                    </View>
                    <View style={styles.segmentDuration}>
                      <Clock size={12} color={colors.textTertiary} />
                      <Text style={styles.segmentDurationText}>{formatDuration(seg.duration)}</Text>
                    </View>
                    <View style={styles.segmentRow}>
                      <Text style={styles.segmentTime}>{formatFlightTime(seg.arrival.time)}</Text>
                      <Text style={styles.segmentAirport}>
                        {seg.arrival.airport.code} - {seg.arrival.airport.city}
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < outbound.segments.length - 1 && outbound.layoverDurations && (
                  <View style={styles.layoverCard}>
                    <Clock size={14} color={colors.warning} />
                    <Text style={styles.layoverCardText}>
                      {formatDuration(outbound.layoverDurations[idx])} layover in{' '}
                      {outbound.segments[idx].arrival.airport.city}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Amenities */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Amenities</Text>
            <View style={styles.amenityGrid}>
              {[
                { icon: Wifi, label: 'Wi-Fi', available: outbound.segments[0].wifi },
                { icon: Zap, label: 'Power Outlets', available: outbound.segments[0].power },
                { icon: Tv, label: 'Entertainment', available: outbound.segments[0].entertainment },
              ].map(({ icon: Icon, label, available }) => (
                <View
                  key={label}
                  style={[styles.amenityGridItem, !available && styles.amenityUnavailable]}
                >
                  <Icon size={18} color={available ? colors.primary : colors.textTertiary} />
                  <Text
                    style={[
                      styles.amenityGridText,
                      !available && styles.amenityGridTextUnavailable,
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Baggage */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Baggage</Text>
            <View style={styles.baggageGrid}>
              <View style={styles.baggageItem}>
                <BriefcaseBusiness
                  size={18}
                  color={flight.baggage.personal.included ? colors.success : colors.error}
                />
                <Text style={styles.baggageLabel}>Personal Item</Text>
                <Text
                  style={[
                    styles.baggageStatus,
                    { color: flight.baggage.personal.included ? colors.success : colors.error },
                  ]}
                >
                  {flight.baggage.personal.included ? 'Included' : 'Not included'}
                </Text>
              </View>
              <View style={styles.baggageItem}>
                <Luggage
                  size={18}
                  color={flight.baggage.carryOn.included ? colors.success : colors.warning}
                />
                <Text style={styles.baggageLabel}>Carry-on</Text>
                <Text
                  style={[
                    styles.baggageStatus,
                    { color: flight.baggage.carryOn.included ? colors.success : colors.warning },
                  ]}
                >
                  {flight.baggage.carryOn.included
                    ? 'Included'
                    : `$${flight.baggage.checked.fee || 35}`}
                </Text>
              </View>
              <View style={styles.baggageItem}>
                <Luggage
                  size={18}
                  color={flight.baggage.checked.included ? colors.success : colors.warning}
                />
                <Text style={styles.baggageLabel}>Checked Bag</Text>
                <Text
                  style={[
                    styles.baggageStatus,
                    { color: flight.baggage.checked.included ? colors.success : colors.warning },
                  ]}
                >
                  {flight.baggage.checked.included
                    ? `${flight.baggage.checked.pieces} bag${flight.baggage.checked.pieces > 1 ? 's' : ''} incl.`
                    : `$${flight.baggage.checked.fee || 35}/bag`}
                </Text>
              </View>
            </View>
          </View>

          {/* Fare Rules */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Fare Rules</Text>
            <View style={styles.fareRulesGrid}>
              <View style={styles.fareRule}>
                <Text style={styles.fareRuleLabel}>Changes</Text>
                <Text
                  style={[
                    styles.fareRuleValue,
                    { color: flight.fareRules.changeable ? colors.success : colors.error },
                  ]}
                >
                  {flight.fareRules.changeable
                    ? flight.fareRules.changeFee === 0
                      ? 'Free changes'
                      : `$${flight.fareRules.changeFee} fee`
                    : 'Not allowed'}
                </Text>
              </View>
              <View style={styles.fareRule}>
                <Text style={styles.fareRuleLabel}>Cancellation</Text>
                <Text
                  style={[
                    styles.fareRuleValue,
                    { color: flight.fareRules.refundable ? colors.success : colors.error },
                  ]}
                >
                  {flight.fareRules.refundable ? 'Full refund' : 'Non-refundable'}
                </Text>
              </View>
              <View style={styles.fareRule}>
                <Text style={styles.fareRuleLabel}>Seat Selection</Text>
                <Text style={styles.fareRuleValue}>
                  {flight.fareRules.seatSelection === 'included' ? 'Included' : 'Extra fee'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Booking Footer */}
        <View style={styles.bookingFooter}>
          <View style={styles.bookingPriceSection}>
            <View>
              {flight.originalPrice && (
                <Text style={styles.bookingOriginalPrice}>${flight.originalPrice}</Text>
              )}
              <Text style={styles.bookingPrice}>${flight.totalPrice}</Text>
              <Text style={styles.bookingPriceLabel}>
                {passengers > 1 ? `${passengers} passengers · incl. taxes` : 'incl. taxes & fees'}
              </Text>
            </View>
          </View>
          <Pressable style={styles.bookButton} onPress={onBook}>
            <Text style={styles.bookButtonText}>Book Flight</Text>
            <ArrowRight size={18} color={colors.textLight} />
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function FlightSearchScreen() {
  const router = useRouter();

  // Search state
  const [tripType, setTripType] = useState<TripType>('round_trip');
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState('2026-03-15');
  const [returnDate, setReturnDate] = useState('2026-03-22');
  const [passengers, setPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');

  // UI state
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showPassengers, setShowPassengers] = useState(false);
  const [showCabinPicker, setShowCabinPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightSearchResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Results state
  const [results, setResults] = useState<FlightSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter state
  const [sortBy, setSortBy] = useState<SortOption>('best');
  const [stopFilter, setStopFilter] = useState<StopFilter>('any');
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  // Swap airports
  const swapAirports = useCallback(() => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  }, [origin, destination]);

  // Search
  const handleSearch = useCallback(async () => {
    if (!origin || !destination) {
      Alert.alert('Missing Info', 'Please select both origin and destination airports.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResults = generateMockFlights(
      origin,
      destination,
      departDate,
      tripType === 'round_trip' ? returnDate : undefined,
      totalPassengers
    );

    setResults(mockResults);
    setIsSearching(false);
  }, [origin, destination, departDate, returnDate, tripType, totalPassengers]);

  // Filtered & sorted results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Stop filter
    if (stopFilter === 'nonstop') filtered = filtered.filter((f) => f.outbound.stops === 0);
    else if (stopFilter === '1_stop') filtered = filtered.filter((f) => f.outbound.stops <= 1);
    else if (stopFilter === '2_plus') filtered = filtered.filter((f) => f.outbound.stops >= 2);

    // Refundable
    if (refundableOnly) filtered = filtered.filter((f) => f.fareRules.refundable);

    // Airlines
    if (selectedAirlines.length > 0) {
      filtered = filtered.filter((f) =>
        selectedAirlines.includes(f.outbound.segments[0].airline.code)
      );
    }

    // Sort
    switch (sortBy) {
      case 'cheapest':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'fastest':
        filtered.sort((a, b) => a.outbound.totalDuration - b.outbound.totalDuration);
        break;
      case 'earliest':
        filtered.sort(
          (a, b) =>
            new Date(a.outbound.segments[0].departure.time).getTime() -
            new Date(b.outbound.segments[0].departure.time).getTime()
        );
        break;
      case 'latest':
        filtered.sort(
          (a, b) =>
            new Date(b.outbound.segments[0].departure.time).getTime() -
            new Date(a.outbound.segments[0].departure.time).getTime()
        );
        break;
      case 'best':
      default:
        filtered.sort((a, b) => b.score - a.score);
        break;
    }

    return filtered;
  }, [results, sortBy, stopFilter, refundableOnly, selectedAirlines]);

  // Available airlines in results
  const availableAirlines = useMemo(() => {
    const codes = new Set(results.map((f) => f.outbound.segments[0].airline.code));
    return Array.from(codes)
      .map((code) => AIRLINES[code])
      .filter(Boolean);
  }, [results]);

  // Book flight
  const handleBook = useCallback(() => {
    if (!selectedFlight) return;
    Alert.alert(
      'Confirm Booking',
      `Book ${selectedFlight.outbound.segments[0].airline.name} flight ${selectedFlight.outbound.segments[0].flightNumber} for $${selectedFlight.totalPrice}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            setShowDetail(false);
            Alert.alert(
              'Booking Confirmed! ✈️',
              `Your flight has been booked.\n\nConfirmation: W4N${Math.random().toString(36).substring(2, 8).toUpperCase()}\n\nCheck your Wallet for the confirmation details.`,
              [{ text: 'View Bookings', onPress: () => router.push('/(tabs)/bookings') }]
            );
          },
        },
      ]
    );
  }, [selectedFlight, router]);

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const updatePassenger = (type: 'adults' | 'children' | 'infants', delta: number) => {
    setPassengers((prev) => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, prev[type] + delta),
    }));
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Search Flights</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search Form */}
          <View style={styles.searchForm}>
            {/* Trip Type */}
            <View style={styles.tripTypeRow}>
              {(['round_trip', 'one_way'] as TripType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.tripTypeButton, tripType === type && styles.tripTypeActive]}
                  onPress={() => setTripType(type)}
                >
                  <Text
                    style={[styles.tripTypeText, tripType === type && styles.tripTypeTextActive]}
                  >
                    {type === 'round_trip' ? 'Round Trip' : 'One Way'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Origin / Destination */}
            <View style={styles.airportFields}>
              <Pressable style={styles.airportField} onPress={() => setShowOriginPicker(true)}>
                <View style={[styles.fieldIcon, { backgroundColor: `${colors.success}15` }]}>
                  <Plane
                    size={18}
                    color={colors.success}
                    style={{ transform: [{ rotate: '-45deg' }] }}
                  />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>From</Text>
                  {origin ? (
                    <Text style={styles.fieldValue}>
                      {origin.city} ({origin.code})
                    </Text>
                  ) : (
                    <Text style={styles.fieldPlaceholder}>Select origin</Text>
                  )}
                </View>
              </Pressable>

              <Pressable style={styles.swapButton} onPress={swapAirports}>
                <ArrowRightLeft size={18} color={colors.primary} />
              </Pressable>

              <Pressable style={styles.airportField} onPress={() => setShowDestPicker(true)}>
                <View style={[styles.fieldIcon, { backgroundColor: `${colors.error}15` }]}>
                  <Plane
                    size={18}
                    color={colors.error}
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>To</Text>
                  {destination ? (
                    <Text style={styles.fieldValue}>
                      {destination.city} ({destination.code})
                    </Text>
                  ) : (
                    <Text style={styles.fieldPlaceholder}>Select destination</Text>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Dates */}
            <View style={styles.dateRow}>
              <Pressable style={styles.dateField}>
                <Calendar size={18} color={colors.primary} />
                <View>
                  <Text style={styles.fieldLabel}>Depart</Text>
                  <Text style={styles.fieldValue}>{formatDateDisplay(departDate)}</Text>
                </View>
              </Pressable>
              {tripType === 'round_trip' && (
                <Pressable style={styles.dateField}>
                  <Calendar size={18} color={colors.primary} />
                  <View>
                    <Text style={styles.fieldLabel}>Return</Text>
                    <Text style={styles.fieldValue}>{formatDateDisplay(returnDate)}</Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Passengers & Cabin */}
            <View style={styles.dateRow}>
              <Pressable style={styles.dateField} onPress={() => setShowPassengers(true)}>
                <Users size={18} color={colors.primary} />
                <View>
                  <Text style={styles.fieldLabel}>Passengers</Text>
                  <Text style={styles.fieldValue}>
                    {totalPassengers} traveler{totalPassengers > 1 ? 's' : ''}
                  </Text>
                </View>
              </Pressable>
              <Pressable style={styles.dateField} onPress={() => setShowCabinPicker(true)}>
                <Sparkles size={18} color={colors.primary} />
                <View>
                  <Text style={styles.fieldLabel}>Cabin</Text>
                  <Text style={styles.fieldValue}>{CABIN_CLASS_CONFIG[cabinClass].label}</Text>
                </View>
              </Pressable>
            </View>

            {/* Search Button */}
            <Pressable
              style={[
                styles.searchButton,
                (!origin || !destination) && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <>
                  <Search size={20} color={colors.textLight} />
                  <Text style={styles.searchButtonText}>Search Flights</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Results */}
          {hasSearched && (
            <View style={styles.resultsSection}>
              {/* Results Header */}
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {filteredResults.length} flight{filteredResults.length !== 1 ? 's' : ''} found
                </Text>
                <View style={styles.resultsActions}>
                  <Pressable style={styles.sortButton} onPress={() => setShowFilters(true)}>
                    <SlidersHorizontal size={16} color={colors.primary} />
                    <Text style={styles.sortButtonText}>Filter & Sort</Text>
                  </Pressable>
                </View>
              </View>

              {/* Quick Sort Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sortChips}
              >
                {(
                  [
                    { key: 'best', label: 'Best' },
                    { key: 'cheapest', label: 'Cheapest' },
                    { key: 'fastest', label: 'Fastest' },
                    { key: 'earliest', label: 'Earliest' },
                  ] as { key: SortOption; label: string }[]
                ).map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
                    onPress={() => setSortBy(opt.key)}
                  >
                    <Text
                      style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.sortChip, stopFilter === 'nonstop' && styles.sortChipActive]}
                  onPress={() => setStopFilter(stopFilter === 'nonstop' ? 'any' : 'nonstop')}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      stopFilter === 'nonstop' && styles.sortChipTextActive,
                    ]}
                  >
                    Nonstop only
                  </Text>
                </Pressable>
              </ScrollView>

              {/* Flight Cards */}
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Searching flights...</Text>
                </View>
              ) : filteredResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Plane size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No flights match your filters</Text>
                  <Text style={styles.emptyText}>Try adjusting your filters or dates</Text>
                  <Pressable
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setStopFilter('any');
                      setRefundableOnly(false);
                      setSelectedAirlines([]);
                      setSortBy('best');
                    }}
                  >
                    <RefreshCw size={16} color={colors.primary} />
                    <Text style={styles.clearFiltersText}>Clear all filters</Text>
                  </Pressable>
                </View>
              ) : (
                filteredResults.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    passengers={totalPassengers}
                    onPress={() => {
                      setSelectedFlight(flight);
                      setShowDetail(true);
                    }}
                  />
                ))
              )}
            </View>
          )}

          {/* Pre-search state */}
          {!hasSearched && (
            <View style={styles.preSearchSection}>
              <View style={styles.preSearchIcon}>
                <Plane size={32} color={colors.primaryLight} />
              </View>
              <Text style={styles.preSearchTitle}>Find your perfect flight</Text>
              <Text style={styles.preSearchText}>
                Search across multiple airlines and compare prices, times, and amenities to find the
                best option for your trip.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <AirportPicker
        visible={showOriginPicker}
        onClose={() => setShowOriginPicker(false)}
        onSelect={setOrigin}
        title="Select Origin"
      />
      <AirportPicker
        visible={showDestPicker}
        onClose={() => setShowDestPicker(false)}
        onSelect={setDestination}
        title="Select Destination"
      />

      {/* Passengers Modal */}
      <Modal
        visible={showPassengers}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Passengers</Text>
              <Pressable onPress={() => setShowPassengers(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            {[
              { key: 'adults' as const, label: 'Adults', desc: 'Age 12+' },
              { key: 'children' as const, label: 'Children', desc: 'Age 2-11' },
              { key: 'infants' as const, label: 'Infants', desc: 'Under 2' },
            ].map(({ key, label, desc }) => (
              <View key={key} style={styles.passengerRow}>
                <View>
                  <Text style={styles.passengerLabel}>{label}</Text>
                  <Text style={styles.passengerDesc}>{desc}</Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    style={[
                      styles.stepperButton,
                      passengers[key] <= (key === 'adults' ? 1 : 0) && styles.stepperDisabled,
                    ]}
                    onPress={() => updatePassenger(key, -1)}
                  >
                    <Minus
                      size={16}
                      color={
                        passengers[key] <= (key === 'adults' ? 1 : 0)
                          ? colors.textTertiary
                          : colors.primary
                      }
                    />
                  </Pressable>
                  <Text style={styles.stepperValue}>{passengers[key]}</Text>
                  <Pressable style={styles.stepperButton} onPress={() => updatePassenger(key, 1)}>
                    <Plus size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable style={styles.sheetDoneButton} onPress={() => setShowPassengers(false)}>
              <Text style={styles.sheetDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Cabin Class Modal */}
      <Modal
        visible={showCabinPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Cabin Class</Text>
              <Pressable onPress={() => setShowCabinPicker(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            {(['economy', 'premium_economy', 'business', 'first'] as CabinClass[]).map((cls) => (
              <Pressable
                key={cls}
                style={[styles.cabinOption, cabinClass === cls && styles.cabinOptionActive]}
                onPress={() => {
                  setCabinClass(cls);
                  setShowCabinPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.cabinOptionText,
                    cabinClass === cls && styles.cabinOptionTextActive,
                  ]}
                >
                  {CABIN_CLASS_CONFIG[cls].label}
                </Text>
                {cabinClass === cls && <Check size={20} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter & Sort</Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Sort */}
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterChipGrid}>
              {(
                [
                  { key: 'best', label: 'Best Match' },
                  { key: 'cheapest', label: 'Cheapest First' },
                  { key: 'fastest', label: 'Fastest' },
                  { key: 'earliest', label: 'Earliest Departure' },
                  { key: 'latest', label: 'Latest Departure' },
                ] as { key: SortOption; label: string }[]
              ).map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.filterChip, sortBy === opt.key && styles.filterChipActive]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === opt.key && styles.filterChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Stops */}
            <Text style={styles.filterSectionTitle}>Stops</Text>
            <View style={styles.filterChipGrid}>
              {(
                [
                  { key: 'any', label: 'Any' },
                  { key: 'nonstop', label: 'Nonstop' },
                  { key: '1_stop', label: '1 Stop or Less' },
                ] as { key: StopFilter; label: string }[]
              ).map((opt) => (
                <Pressable
                  key={opt.key}
                  style={[styles.filterChip, stopFilter === opt.key && styles.filterChipActive]}
                  onPress={() => setStopFilter(opt.key)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      stopFilter === opt.key && styles.filterChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Airlines */}
            {availableAirlines.length > 0 && (
              <>
                <Text style={styles.filterSectionTitle}>Airlines</Text>
                {availableAirlines.map((airline) => (
                  <Pressable
                    key={airline.code}
                    style={styles.airlineFilterRow}
                    onPress={() => {
                      setSelectedAirlines((prev) =>
                        prev.includes(airline.code)
                          ? prev.filter((c) => c !== airline.code)
                          : [...prev, airline.code]
                      );
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selectedAirlines.includes(airline.code) && styles.checkboxActive,
                      ]}
                    >
                      {selectedAirlines.includes(airline.code) && (
                        <Check size={14} color={colors.textLight} />
                      )}
                    </View>
                    <Text style={styles.airlineFilterName}>{airline.name}</Text>
                    {airline.rating && (
                      <View style={styles.airlineRating}>
                        <Star size={12} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.airlineRatingText}>{airline.rating}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </>
            )}

            {/* Refundable Toggle */}
            <Text style={styles.filterSectionTitle}>Fare Options</Text>
            <Pressable style={styles.toggleRow} onPress={() => setRefundableOnly(!refundableOnly)}>
              <View style={styles.toggleInfo}>
                <Shield size={20} color={colors.success} />
                <View>
                  <Text style={styles.toggleLabel}>Refundable Only</Text>
                  <Text style={styles.toggleDesc}>Show only fully refundable fares</Text>
                </View>
              </View>
              <Switch
                value={refundableOnly}
                onValueChange={setRefundableOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </Pressable>
          </ScrollView>

          <View style={styles.filterFooter}>
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setSortBy('best');
                setStopFilter('any');
                setRefundableOnly(false);
                setSelectedAirlines([]);
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.applyButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.applyButtonText}>Show {filteredResults.length} Results</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Flight Detail */}
      <FlightDetailModal
        visible={showDetail}
        flight={selectedFlight}
        onClose={() => setShowDetail(false)}
        onBook={handleBook}
        passengers={totalPassengers}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  scrollContent: { flex: 1 },

  // Header
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  // Search Form
  searchForm: {
    margin: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    gap: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripTypeRow: { flexDirection: 'row', gap: 8 },
  tripTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  tripTypeActive: { backgroundColor: colors.primary },
  tripTypeText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tripTypeTextActive: { color: colors.textLight },

  // Airport Fields
  airportFields: { gap: 12, position: 'relative' },
  airportField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textTertiary, marginBottom: 2 },
  fieldValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  fieldPlaceholder: { fontSize: 16, color: colors.textTertiary },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  // Date Row
  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
  },

  // Search Button
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  searchButtonDisabled: { opacity: 0.5 },
  searchButtonText: { fontSize: 16, fontWeight: '700', color: colors.textLight },

  // Results
  resultsSection: { paddingHorizontal: 16, paddingTop: 8 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: { fontSize: 15, fontWeight: '600', color: colors.text },
  resultsActions: { flexDirection: 'row', gap: 8 },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
  },
  sortButtonText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  // Sort Chips
  sortChips: { paddingBottom: 16, gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  sortChipTextActive: { color: colors.textLight },

  // Flight Card
  flightCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '700' },
  flightMain: { gap: 12 },
  airlineSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  airlineLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineName: { fontSize: 14, fontWeight: '600', color: colors.text },
  flightNumber: { fontSize: 12, color: colors.textTertiary },

  // Route
  routeSection: { flexDirection: 'row', alignItems: 'center' },
  timeBlock: { alignItems: 'center', width: 60 },
  time: { fontSize: 18, fontWeight: '700', color: colors.text },
  airportCode: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  routeLine: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  duration: { fontSize: 11, color: colors.textTertiary, marginBottom: 4 },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 16,
  },
  line: { flex: 1, height: 1.5, backgroundColor: colors.border },
  stopDot: { marginHorizontal: -3 },
  stopsText: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  nonstopText: { color: colors.success },
  layoverText: { color: colors.textTertiary },

  // Amenities
  amenitiesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  amenityIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baggageInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  baggageText: { fontSize: 11 },
  baggageIncluded: { color: colors.success },
  baggagePaid: { color: colors.textTertiary },
  refundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: `${colors.success}10`,
  },
  refundText: { fontSize: 10, fontWeight: '600', color: colors.success },

  // Price
  priceSection: {
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: 12,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary },
  priceLabel: { fontSize: 11, color: colors.textSecondary },
  totalLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginTop: 2 },
  fareClass: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },

  // Loading
  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 15, color: colors.textSecondary },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 10,
  },
  clearFiltersText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Pre-search
  preSearchSection: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32, gap: 12 },
  preSearchIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  preSearchTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  preSearchText: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Airport Picker
  pickerContainer: { flex: 1, backgroundColor: colors.background },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  pickerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    padding: 14,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  pickerInput: { flex: 1, fontSize: 16, color: colors.text },
  pickerSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  airportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  airportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airportInfo: { flex: 1 },
  airportCity: { fontSize: 15, fontWeight: '600', color: colors.text },
  airportName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  airportCodePicker: { fontSize: 16, fontWeight: '700', color: colors.primary },
  emptySearch: { alignItems: 'center', paddingVertical: 40 },
  emptySearchText: { fontSize: 15, color: colors.textTertiary },

  // Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  passengerLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  passengerDesc: { fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: { opacity: 0.4 },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  sheetDoneButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  sheetDoneText: { fontSize: 16, fontWeight: '700', color: colors.textLight },
  cabinOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cabinOptionActive: {},
  cabinOptionText: { fontSize: 16, color: colors.text },
  cabinOptionTextActive: { fontWeight: '700', color: colors.primary },

  // Detail Modal
  detailContainer: { flex: 1, backgroundColor: colors.background },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  detailContent: { flex: 1, paddingHorizontal: 16 },
  detailAirline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailAirlineLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailAirlineName: { fontSize: 17, fontWeight: '700', color: colors.text },
  detailFlightRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  detailFlightNum: { fontSize: 13, color: colors.textSecondary },
  detailAircraft: { fontSize: 13, color: colors.textTertiary },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#92400E' },

  // Segments
  segmentSection: { marginBottom: 16 },
  segmentSectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  segmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  segmentTimeline: { alignItems: 'center', width: 20, paddingVertical: 4 },
  timelineDotFilled: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  timelineBar: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 },
  segmentDetails: { flex: 1, gap: 12 },
  segmentRow: { gap: 2 },
  segmentTime: { fontSize: 16, fontWeight: '700', color: colors.text },
  segmentAirport: { fontSize: 13, color: colors.textSecondary },
  segmentTerminal: { fontSize: 12, color: colors.textTertiary },
  segmentDuration: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  segmentDurationText: { fontSize: 12, color: colors.textTertiary },
  layoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: `${colors.warning}10`,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  layoverCardText: { fontSize: 13, color: colors.warning, fontWeight: '500' },

  // Detail Sections
  detailSection: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  detailSectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  amenityGrid: { flexDirection: 'row', gap: 12 },
  amenityGridItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: `${colors.primary}08`,
    borderRadius: 10,
  },
  amenityUnavailable: { backgroundColor: colors.surfaceSecondary, opacity: 0.5 },
  amenityGridText: { fontSize: 12, fontWeight: '500', color: colors.text },
  amenityGridTextUnavailable: { color: colors.textTertiary },
  baggageGrid: { gap: 12 },
  baggageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  baggageLabel: { flex: 1, fontSize: 14, color: colors.text },
  baggageStatus: { fontSize: 13, fontWeight: '600' },
  fareRulesGrid: { gap: 10 },
  fareRule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  fareRuleLabel: { fontSize: 14, color: colors.textSecondary },
  fareRuleValue: { fontSize: 14, fontWeight: '600', color: colors.text },

  // Booking Footer
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bookingPriceSection: {},
  bookingOriginalPrice: {
    fontSize: 13,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  bookingPrice: { fontSize: 24, fontWeight: '800', color: colors.primary },
  bookingPriceLabel: { fontSize: 12, color: colors.textSecondary },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookButtonText: { fontSize: 16, fontWeight: '700', color: colors.textLight },

  // Filter Modal
  filterContainer: { flex: 1, backgroundColor: colors.background },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  filterContent: { flex: 1, padding: 16 },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    marginTop: 20,
  },
  filterChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  filterChipTextActive: { color: colors.textLight },
  airlineFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  airlineFilterName: { flex: 1, fontSize: 15, color: colors.text },
  airlineRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  airlineRatingText: { fontSize: 13, color: colors.textSecondary },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  toggleDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  filterFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  clearButtonText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyButtonText: { fontSize: 15, fontWeight: '700', color: colors.textLight },
});
