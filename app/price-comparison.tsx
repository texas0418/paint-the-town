/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Plane,
  Building2,
  Search,
  X,
  ChevronRight,
  Calendar,
  MapPin,
  Users,
  ArrowRightLeft,
  Filter,
  Star,
  Clock,
  Wifi,
  Coffee,
  Briefcase,
  Shield,
  Heart,
  ExternalLink,
  TrendingDown,
  Award,
  Zap,
  CheckCircle,
  SlidersHorizontal,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface Provider {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
}

interface FlightResult {
  id: string;
  type: 'flight';
  provider: Provider;
  airline: string;
  airlineLogo: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  originalPrice?: number;
  currency: string;
  class: 'economy' | 'business' | 'first';
  features: string[];
  bestDeal?: boolean;
  lowestPrice?: boolean;
  fastestRoute?: boolean;
  isSaved: boolean;
}

interface HotelResult {
  id: string;
  type: 'hotel';
  provider: Provider;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewCount: number;
  stars: number;
  price: number;
  originalPrice?: number;
  currency: string;
  pricePerNight: number;
  nights: number;
  features: string[];
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  bestDeal?: boolean;
  lowestPrice?: boolean;
  isSaved: boolean;
}

type SearchResult = FlightResult | HotelResult;

const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Skyscanner',
    logo: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100',
    rating: 4.5,
    reviewCount: 12500,
  },
  {
    id: '2',
    name: 'Kayak',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100',
    rating: 4.3,
    reviewCount: 8900,
  },
  {
    id: '3',
    name: 'Expedia',
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100',
    rating: 4.4,
    reviewCount: 15600,
  },
  {
    id: '4',
    name: 'Booking.com',
    logo: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=100',
    rating: 4.6,
    reviewCount: 25000,
  },
  {
    id: '5',
    name: 'Hotels.com',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100',
    rating: 4.2,
    reviewCount: 9800,
  },
  {
    id: '6',
    name: 'Priceline',
    logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100',
    rating: 4.1,
    reviewCount: 7500,
  },
];

const mockFlightResults: FlightResult[] = [
  {
    id: 'f1',
    type: 'flight',
    provider: mockProviders[0],
    airline: 'Delta Airlines',
    airlineLogo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=100',
    origin: 'New York (JFK)',
    destination: 'Paris (CDG)',
    departureTime: '10:30 AM',
    arrivalTime: '11:45 PM',
    duration: '7h 15m',
    stops: 0,
    price: 489,
    originalPrice: 650,
    currency: 'USD',
    class: 'economy',
    features: ['WiFi', 'Entertainment', 'Meals'],
    bestDeal: true,
    lowestPrice: true,
    isSaved: false,
  },
  {
    id: 'f2',
    type: 'flight',
    provider: mockProviders[1],
    airline: 'Air France',
    airlineLogo: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=100',
    origin: 'New York (JFK)',
    destination: 'Paris (CDG)',
    departureTime: '6:00 PM',
    arrivalTime: '7:30 AM',
    duration: '7h 30m',
    stops: 0,
    price: 520,
    originalPrice: 580,
    currency: 'USD',
    class: 'economy',
    features: ['WiFi', 'Entertainment', 'Meals', 'Extra Legroom'],
    fastestRoute: false,
    isSaved: true,
  },
  {
    id: 'f3',
    type: 'flight',
    provider: mockProviders[2],
    airline: 'United Airlines',
    airlineLogo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100',
    origin: 'New York (JFK)',
    destination: 'Paris (CDG)',
    departureTime: '8:45 PM',
    arrivalTime: '10:30 AM',
    duration: '7h 45m',
    stops: 0,
    price: 545,
    currency: 'USD',
    class: 'economy',
    features: ['WiFi', 'Entertainment'],
    isSaved: false,
  },
  {
    id: 'f4',
    type: 'flight',
    provider: mockProviders[3],
    airline: 'British Airways',
    airlineLogo: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?w=100',
    origin: 'New York (JFK)',
    destination: 'Paris (CDG)',
    departureTime: '11:00 PM',
    arrivalTime: '2:45 PM',
    duration: '9h 45m',
    stops: 1,
    price: 425,
    originalPrice: 510,
    currency: 'USD',
    class: 'economy',
    features: ['Entertainment', 'Meals'],
    isSaved: false,
  },
  {
    id: 'f5',
    type: 'flight',
    provider: mockProviders[4],
    airline: 'Lufthansa',
    airlineLogo: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=100',
    origin: 'New York (JFK)',
    destination: 'Paris (CDG)',
    departureTime: '3:30 PM',
    arrivalTime: '8:00 AM',
    duration: '10h 30m',
    stops: 1,
    price: 398,
    currency: 'USD',
    class: 'economy',
    features: ['WiFi', 'Entertainment', 'Meals'],
    isSaved: false,
  },
];

const mockHotelResults: HotelResult[] = [
  {
    id: 'h1',
    type: 'hotel',
    provider: mockProviders[3],
    name: 'Le Grand Paris Hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    location: 'Champs-Élysées, Paris',
    rating: 4.8,
    reviewCount: 2340,
    stars: 5,
    price: 1260,
    originalPrice: 1540,
    currency: 'USD',
    pricePerNight: 180,
    nights: 7,
    features: ['Pool', 'Spa', 'Restaurant', 'Gym'],
    freeCancellation: true,
    breakfastIncluded: true,
    bestDeal: true,
    lowestPrice: true,
    isSaved: false,
  },
  {
    id: 'h2',
    type: 'hotel',
    provider: mockProviders[2],
    name: 'Hotel Parisien Luxe',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    location: 'Le Marais, Paris',
    rating: 4.6,
    reviewCount: 1850,
    stars: 4,
    price: 980,
    originalPrice: 1120,
    currency: 'USD',
    pricePerNight: 140,
    nights: 7,
    features: ['Restaurant', 'Gym', 'Bar'],
    freeCancellation: true,
    breakfastIncluded: false,
    isSaved: true,
  },
  {
    id: 'h3',
    type: 'hotel',
    provider: mockProviders[4],
    name: 'Boutique Saint-Germain',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    location: 'Saint-Germain-des-Prés, Paris',
    rating: 4.5,
    reviewCount: 920,
    stars: 4,
    price: 1050,
    currency: 'USD',
    pricePerNight: 150,
    nights: 7,
    features: ['Restaurant', 'Bar', 'Rooftop'],
    freeCancellation: false,
    breakfastIncluded: true,
    isSaved: false,
  },
  {
    id: 'h4',
    type: 'hotel',
    provider: mockProviders[5],
    name: 'Montmartre View Inn',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
    location: 'Montmartre, Paris',
    rating: 4.3,
    reviewCount: 680,
    stars: 3,
    price: 630,
    originalPrice: 750,
    currency: 'USD',
    pricePerNight: 90,
    nights: 7,
    features: ['WiFi', 'Terrace'],
    freeCancellation: true,
    breakfastIncluded: false,
    isSaved: false,
  },
  {
    id: 'h5',
    type: 'hotel',
    provider: mockProviders[0],
    name: 'Paris Opera Grand',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
    location: 'Opera, Paris',
    rating: 4.7,
    reviewCount: 3200,
    stars: 5,
    price: 1680,
    currency: 'USD',
    pricePerNight: 240,
    nights: 7,
    features: ['Pool', 'Spa', 'Restaurant', 'Gym', 'Concierge'],
    freeCancellation: true,
    breakfastIncluded: true,
    isSaved: false,
  },
];

type SearchType = 'flights' | 'hotels';
type SortOption = 'price_low' | 'price_high' | 'rating' | 'duration' | 'departure';

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function PriceComparisonScreen() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<SearchType>('flights');
  const [origin, setOrigin] = useState('New York, USA');
  const [destination, setDestination] = useState('Paris, France');
  const [departureDate, setDepartureDate] = useState('Mar 15, 2024');
  const [returnDate, setReturnDate] = useState('Mar 22, 2024');
  const [travelers, setTravelers] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [flightResults, setFlightResults] = useState<FlightResult[]>(mockFlightResults);
  const [hotelResults, setHotelResults] = useState<HotelResult[]>(mockHotelResults);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('price_low');

  const [maxPrice, setMaxPrice] = useState(2000);
  const [stopsFilter, setStopsFilter] = useState<number | null>(null);
  const [starsFilter, setStarsFilter] = useState<number | null>(null);
  const [freeCancellationOnly, setFreeCancellationOnly] = useState(false);

  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: searchType === 'flights' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [searchType, tabAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('Refreshing price comparison results...');
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleSearch = () => {
    setShowSearchModal(false);
    console.log('Searching for:', {
      searchType,
      origin,
      destination,
      departureDate,
      returnDate,
      travelers,
      rooms,
    });
  };

  const handleSaveResult = (id: string, type: 'flight' | 'hotel') => {
    if (type === 'flight') {
      setFlightResults((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isSaved: !r.isSaved } : r))
      );
    } else {
      setHotelResults((prev) => prev.map((r) => (r.id === id ? { ...r, isSaved: !r.isSaved } : r)));
    }
    console.log('Toggled save for:', id);
  };

  const sortResults = <T extends SearchResult>(results: T[]): T[] => {
    const sorted = [...results];
    switch (sortBy) {
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        if (sorted[0]?.type === 'hotel') {
          return sorted.sort((a, b) => (b as HotelResult).rating - (a as HotelResult).rating);
        }
        return sorted;
      default:
        return sorted;
    }
  };

  const filterFlights = (flights: FlightResult[]): FlightResult[] => {
    return flights.filter((f) => {
      if (f.price > maxPrice) return false;
      if (stopsFilter !== null && f.stops !== stopsFilter) return false;
      return true;
    });
  };

  const filterHotels = (hotels: HotelResult[]): HotelResult[] => {
    return hotels.filter((h) => {
      if (h.price > maxPrice) return false;
      if (starsFilter !== null && h.stars !== starsFilter) return false;
      if (freeCancellationOnly && !h.freeCancellation) return false;
      return true;
    });
  };

  const getLowestPrice = (results: SearchResult[]): number => {
    if (results.length === 0) return 0;
    return Math.min(...results.map((r) => r.price));
  };

  const getHighestPrice = (results: SearchResult[]): number => {
    if (results.length === 0) return 0;
    return Math.max(...results.map((r) => r.price));
  };

  const getSavingsAmount = (results: SearchResult[]): number => {
    return results.reduce((sum, r) => {
      if (r.originalPrice) {
        return sum + (r.originalPrice - r.price);
      }
      return sum;
    }, 0);
  };

  const displayedFlights = sortResults(filterFlights(flightResults));
  const displayedHotels = sortResults(filterHotels(hotelResults));

  const renderFlightCard = (flight: FlightResult) => {
    const discount = flight.originalPrice
      ? Math.round(((flight.originalPrice - flight.price) / flight.originalPrice) * 100)
      : 0;

    return (
      <Pressable key={flight.id} style={styles.resultCard}>
        <View style={styles.cardHeader}>
          <View style={styles.providerInfo}>
            <View style={styles.providerLogo}>
              <Plane size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.providerName}>{flight.provider.name}</Text>
              <View style={styles.providerRating}>
                <Star size={10} color={colors.warning} fill={colors.warning} />
                <Text style={styles.providerRatingText}>{flight.provider.rating}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardBadges}>
            {flight.bestDeal && (
              <View style={[styles.badge, styles.badgeBest]}>
                <Award size={10} color={colors.textLight} />
                <Text style={styles.badgeText}>Best Deal</Text>
              </View>
            )}
            {flight.lowestPrice && !flight.bestDeal && (
              <View style={[styles.badge, styles.badgeLowest]}>
                <TrendingDown size={10} color={colors.textLight} />
                <Text style={styles.badgeText}>Lowest</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.flightDetails}>
          <View style={styles.flightRoute}>
            <View style={styles.flightPoint}>
              <Text style={styles.flightTime}>{flight.departureTime}</Text>
              <Text style={styles.flightCode}>{flight.origin.split('(')[1]?.replace(')', '')}</Text>
            </View>
            <View style={styles.flightLine}>
              <View style={styles.flightDot} />
              <View style={styles.flightDash} />
              {flight.stops > 0 && (
                <View style={styles.stopsIndicator}>
                  <Text style={styles.stopsText}>{flight.stops} stop</Text>
                </View>
              )}
              <View style={styles.flightDash} />
              <View style={styles.flightDot} />
            </View>
            <View style={styles.flightPoint}>
              <Text style={styles.flightTime}>{flight.arrivalTime}</Text>
              <Text style={styles.flightCode}>
                {flight.destination.split('(')[1]?.replace(')', '')}
              </Text>
            </View>
          </View>

          <View style={styles.flightMeta}>
            <View style={styles.metaItem}>
              <Clock size={12} color={colors.textTertiary} />
              <Text style={styles.metaText}>{flight.duration}</Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.airlineName}>{flight.airline}</Text>
          </View>

          <View style={styles.featuresList}>
            {flight.features.slice(0, 3).map((feature, idx) => (
              <View key={idx} style={styles.featureTag}>
                {feature === 'WiFi' && <Wifi size={10} color={colors.textSecondary} />}
                {feature === 'Meals' && <Coffee size={10} color={colors.textSecondary} />}
                {feature === 'Entertainment' && <Zap size={10} color={colors.textSecondary} />}
                {feature === 'Extra Legroom' && (
                  <Briefcase size={10} color={colors.textSecondary} />
                )}
                <Text style={styles.featureTagText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${flight.price}</Text>
              {flight.originalPrice && (
                <Text style={styles.originalPrice}>${flight.originalPrice}</Text>
              )}
            </View>
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discount}% off</Text>
              </View>
            )}
            <Text style={styles.priceNote}>per person, round trip</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable
              style={styles.saveButton}
              onPress={() => handleSaveResult(flight.id, 'flight')}
            >
              {flight.isSaved ? (
                <BookmarkCheck size={20} color={colors.primary} fill={colors.primary} />
              ) : (
                <Bookmark size={20} color={colors.textTertiary} />
              )}
            </Pressable>
            <Pressable style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Deal</Text>
              <ExternalLink size={14} color={colors.textLight} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHotelCard = (hotel: HotelResult) => {
    const discount = hotel.originalPrice
      ? Math.round(((hotel.originalPrice - hotel.price) / hotel.originalPrice) * 100)
      : 0;

    return (
      <Pressable key={hotel.id} style={styles.resultCard}>
        <View style={styles.hotelImageContainer}>
          <Image source={{ uri: hotel.image }} style={styles.hotelImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.hotelImageGradient}
          />
          <View style={styles.hotelImageOverlay}>
            <View style={styles.hotelStars}>
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} size={12} color={colors.warning} fill={colors.warning} />
              ))}
            </View>
            {hotel.bestDeal && (
              <View style={[styles.badge, styles.badgeBest]}>
                <Award size={10} color={colors.textLight} />
                <Text style={styles.badgeText}>Best Deal</Text>
              </View>
            )}
          </View>
          <Pressable
            style={styles.hotelSaveButton}
            onPress={() => handleSaveResult(hotel.id, 'hotel')}
          >
            {hotel.isSaved ? (
              <Heart size={18} color={colors.error} fill={colors.error} />
            ) : (
              <Heart size={18} color={colors.textLight} />
            )}
          </Pressable>
        </View>

        <View style={styles.hotelContent}>
          <View style={styles.cardHeader}>
            <View style={styles.providerInfo}>
              <View style={styles.providerLogo}>
                <Building2 size={16} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.providerName}>{hotel.provider.name}</Text>
                <View style={styles.providerRating}>
                  <Star size={10} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.providerRatingText}>{hotel.provider.rating}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.hotelName}>{hotel.name}</Text>

          <View style={styles.hotelLocation}>
            <MapPin size={12} color={colors.textTertiary} />
            <Text style={styles.hotelLocationText}>{hotel.location}</Text>
          </View>

          <View style={styles.hotelRating}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingValue}>{hotel.rating}</Text>
            </View>
            <Text style={styles.ratingText}>Excellent</Text>
            <Text style={styles.reviewCount}>({hotel.reviewCount.toLocaleString()} reviews)</Text>
          </View>

          <View style={styles.hotelTags}>
            {hotel.freeCancellation && (
              <View style={[styles.hotelTag, styles.hotelTagGreen]}>
                <CheckCircle size={10} color={colors.success} />
                <Text style={[styles.hotelTagText, { color: colors.success }]}>
                  Free cancellation
                </Text>
              </View>
            )}
            {hotel.breakfastIncluded && (
              <View style={[styles.hotelTag, styles.hotelTagBlue]}>
                <Coffee size={10} color={colors.primary} />
                <Text style={[styles.hotelTagText, { color: colors.primary }]}>
                  Breakfast included
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>${hotel.price}</Text>
                {hotel.originalPrice && (
                  <Text style={styles.originalPrice}>${hotel.originalPrice}</Text>
                )}
              </View>
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% off</Text>
                </View>
              )}
              <Text style={styles.priceNote}>
                ${hotel.pricePerNight}/night • {hotel.nights} nights
              </Text>
            </View>
            <Pressable style={styles.viewButton}>
              <Text style={styles.viewButtonText}>Book Now</Text>
              <ExternalLink size={14} color={colors.textLight} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={styles.headerGradient}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textLight} />
            </Pressable>
            <Text style={styles.headerTitle}>Price Comparison</Text>
            <Pressable style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
              <SlidersHorizontal size={22} color={colors.textLight} />
            </Pressable>
          </View>

          <View style={styles.tabContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [
                    {
                      translateX: tabAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (width - 48) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Pressable style={styles.tab} onPress={() => setSearchType('flights')}>
              <Plane
                size={18}
                color={searchType === 'flights' ? colors.primary : colors.textLight}
              />
              <Text style={[styles.tabText, searchType === 'flights' && styles.tabTextActive]}>
                Flights
              </Text>
            </Pressable>
            <Pressable style={styles.tab} onPress={() => setSearchType('hotels')}>
              <Building2
                size={18}
                color={searchType === 'hotels' ? colors.primary : colors.textLight}
              />
              <Text style={[styles.tabText, searchType === 'hotels' && styles.tabTextActive]}>
                Hotels
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.searchSummary} onPress={() => setShowSearchModal(true)}>
            <View style={styles.searchSummaryContent}>
              <View style={styles.searchRoute}>
                <Text style={styles.searchCity}>{origin.split(',')[0]}</Text>
                <ArrowRightLeft size={14} color={colors.accent} />
                <Text style={styles.searchCity}>{destination.split(',')[0]}</Text>
              </View>
              <View style={styles.searchMeta}>
                <Text style={styles.searchMetaText}>
                  {departureDate} - {returnDate}
                </Text>
                <Text style={styles.searchMetaDot}>•</Text>
                <Text style={styles.searchMetaText}>
                  {travelers} {travelers === 1 ? 'traveler' : 'travelers'}
                  {searchType === 'hotels' && `, ${rooms} ${rooms === 1 ? 'room' : 'rooms'}`}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.accent} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.resultsHeader}>
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {searchType === 'flights' ? displayedFlights.length : displayedHotels.length}{' '}
                results
              </Text>
              <Text style={styles.resultsRange}>
                ${getLowestPrice(searchType === 'flights' ? displayedFlights : displayedHotels)} - $
                {getHighestPrice(searchType === 'flights' ? displayedFlights : displayedHotels)}
              </Text>
            </View>
            <Pressable style={styles.sortButton}>
              <ArrowUpDown size={14} color={colors.primary} />
              <Text style={styles.sortButtonText}>
                {sortBy === 'price_low'
                  ? 'Price: Low to High'
                  : sortBy === 'price_high'
                    ? 'Price: High to Low'
                    : sortBy === 'rating'
                      ? 'Rating'
                      : 'Sort'}
              </Text>
            </Pressable>
          </View>

          {getSavingsAmount(searchType === 'flights' ? displayedFlights : displayedHotels) > 0 && (
            <View style={styles.savingsBanner}>
              <TrendingDown size={16} color={colors.success} />
              <Text style={styles.savingsBannerText}>
                Save up to $
                {getSavingsAmount(searchType === 'flights' ? displayedFlights : displayedHotels)}{' '}
                with current deals
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.scrollContent}
          >
            {searchType === 'flights' ? (
              displayedFlights.length > 0 ? (
                displayedFlights.map(renderFlightCard)
              ) : (
                <View style={styles.emptyState}>
                  <Plane size={48} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No flights found</Text>
                  <Text style={styles.emptyText}>
                    Try adjusting your filters or search criteria
                  </Text>
                </View>
              )
            ) : displayedHotels.length > 0 ? (
              displayedHotels.map(renderHotelCard)
            ) : (
              <View style={styles.emptyState}>
                <Building2 size={48} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>No hotels found</Text>
                <Text style={styles.emptyText}>Try adjusting your filters or search criteria</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Search {searchType === 'flights' ? 'Flights' : 'Hotels'}
              </Text>
              <Pressable onPress={() => setShowSearchModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            {searchType === 'flights' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>From</Text>
                <View style={styles.inputBox}>
                  <MapPin size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={origin}
                    onChangeText={setOrigin}
                    placeholder="City or airport"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {searchType === 'flights' ? 'To' : 'Destination'}
              </Text>
              <View style={styles.inputBox}>
                <MapPin size={18} color={colors.textTertiary} />
                <TextInput
                  style={styles.input}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="City or airport"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Check-in</Text>
                <View style={styles.inputBox}>
                  <Calendar size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={departureDate}
                    onChangeText={setDepartureDate}
                    placeholder="Date"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Check-out</Text>
                <View style={styles.inputBox}>
                  <Calendar size={18} color={colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    value={returnDate}
                    onChangeText={setReturnDate}
                    placeholder="Date"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Travelers</Text>
                <View style={styles.inputBox}>
                  <Users size={18} color={colors.textTertiary} />
                  <View style={styles.counterContainer}>
                    <Pressable
                      style={styles.counterButton}
                      onPress={() => setTravelers(Math.max(1, travelers - 1))}
                    >
                      <Text style={styles.counterButtonText}>-</Text>
                    </Pressable>
                    <Text style={styles.counterValue}>{travelers}</Text>
                    <Pressable
                      style={styles.counterButton}
                      onPress={() => setTravelers(travelers + 1)}
                    >
                      <Text style={styles.counterButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
              {searchType === 'hotels' && (
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Rooms</Text>
                  <View style={styles.inputBox}>
                    <Building2 size={18} color={colors.textTertiary} />
                    <View style={styles.counterContainer}>
                      <Pressable
                        style={styles.counterButton}
                        onPress={() => setRooms(Math.max(1, rooms - 1))}
                      >
                        <Text style={styles.counterButtonText}>-</Text>
                      </Pressable>
                      <Text style={styles.counterValue}>{rooms}</Text>
                      <Pressable style={styles.counterButton} onPress={() => setRooms(rooms + 1)}>
                        <Text style={styles.counterButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Search size={20} color={colors.textLight} />
              <Text style={styles.searchButtonText}>Compare Prices</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Results</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.sortOptions}>
                {(['price_low', 'price_high', 'rating'] as SortOption[]).map((option) => (
                  <Pressable
                    key={option}
                    style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
                    onPress={() => setSortBy(option)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortBy === option && styles.sortOptionTextActive,
                      ]}
                    >
                      {option === 'price_low'
                        ? 'Price: Low'
                        : option === 'price_high'
                          ? 'Price: High'
                          : 'Rating'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Max Price: ${maxPrice}</Text>
              <View style={styles.priceSlider}>
                {[500, 1000, 1500, 2000, 3000].map((price) => (
                  <Pressable
                    key={price}
                    style={[styles.priceOption, maxPrice === price && styles.priceOptionActive]}
                    onPress={() => setMaxPrice(price)}
                  >
                    <Text
                      style={[
                        styles.priceOptionText,
                        maxPrice === price && styles.priceOptionTextActive,
                      ]}
                    >
                      ${price}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {searchType === 'flights' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Stops</Text>
                <View style={styles.filterOptions}>
                  {[
                    { label: 'Any', value: null },
                    { label: 'Direct', value: 0 },
                    { label: '1 Stop', value: 1 },
                  ].map((option) => (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.filterOption,
                        stopsFilter === option.value && styles.filterOptionActive,
                      ]}
                      onPress={() => setStopsFilter(option.value)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          stopsFilter === option.value && styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {searchType === 'hotels' && (
              <>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Hotel Stars</Text>
                  <View style={styles.filterOptions}>
                    {[
                      { label: 'Any', value: null },
                      { label: '3★', value: 3 },
                      { label: '4★', value: 4 },
                      { label: '5★', value: 5 },
                    ].map((option) => (
                      <Pressable
                        key={option.label}
                        style={[
                          styles.filterOption,
                          starsFilter === option.value && styles.filterOptionActive,
                        ]}
                        onPress={() => setStarsFilter(option.value)}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            starsFilter === option.value && styles.filterOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                  style={styles.toggleOption}
                  onPress={() => setFreeCancellationOnly(!freeCancellationOnly)}
                >
                  <View style={styles.toggleInfo}>
                    <Shield size={20} color={colors.success} />
                    <Text style={styles.toggleText}>Free Cancellation Only</Text>
                  </View>
                  <View style={[styles.toggle, freeCancellationOnly && styles.toggleActive]}>
                    {freeCancellationOnly && <CheckCircle size={16} color={colors.textLight} />}
                  </View>
                </Pressable>
              </>
            )}

            <Pressable style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
              <Filter size={18} color={colors.textLight} />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textLight,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '50%',
    height: '100%',
    backgroundColor: colors.textLight,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    zIndex: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textLight,
  },
  tabTextActive: {
    color: colors.primary,
  },
  searchSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
  },
  searchSummaryContent: {
    flex: 1,
  },
  searchRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  searchCity: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  searchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchMetaText: {
    fontSize: 13,
    color: colors.accent,
  },
  searchMetaDot: {
    fontSize: 13,
    color: colors.accent,
    marginHorizontal: 6,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -10,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  resultsCount: {
    gap: 2,
  },
  resultsCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  resultsRange: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: `${colors.success}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  savingsBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  providerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  providerRatingText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeBest: {
    backgroundColor: colors.secondary,
  },
  badgeLowest: {
    backgroundColor: colors.success,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textLight,
  },
  flightDetails: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flightPoint: {
    alignItems: 'center',
  },
  flightTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  flightCode: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  flightLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  flightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  flightDash: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  stopsIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  stopsText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  flightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  metaDivider: {
    fontSize: 12,
    color: colors.textTertiary,
    marginHorizontal: 8,
  },
  airlineName: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
  },
  featureTagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceSection: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  priceNote: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  hotelImageContainer: {
    height: 160,
    position: 'relative',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  hotelImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  hotelImageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  hotelStars: {
    flexDirection: 'row',
    gap: 2,
  },
  hotelSaveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotelContent: {
    padding: 16,
    paddingTop: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  hotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  hotelLocationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  hotelRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  hotelTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  hotelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hotelTagGreen: {
    backgroundColor: `${colors.success}12`,
  },
  hotelTagBlue: {
    backgroundColor: `${colors.primary}12`,
  },
  hotelTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.textLight,
  },
  priceSlider: {
    flexDirection: 'row',
    gap: 8,
  },
  priceOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
  },
  priceOptionActive: {
    backgroundColor: colors.primary,
  },
  priceOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  priceOptionTextActive: {
    color: colors.textLight,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.textLight,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: colors.success,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
});
