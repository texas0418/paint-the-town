import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Shuffle,
  MapPin,
  Globe,
  Map,
  Navigation,
  Calendar,
  DollarSign,
  Star,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Trip, Destination, DayItinerary, Activity } from '@/types';

const { width } = Dimensions.get('window');

type TravelScope = 'local' | 'domestic' | 'international';

interface TravelScopeOption {
  id: TravelScope;
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
}

const TRAVEL_SCOPES: TravelScopeOption[] = [
  {
    id: 'local',
    name: 'Local Escape',
    description: 'Hidden gems within 2 hours',
    icon: <Navigation size={28} color={colors.textLight} />,
    gradient: [colors.success, colors.successLight] as const,
  },
  {
    id: 'domestic',
    name: 'Domestic Discovery',
    description: 'Explore your own country',
    icon: <Map size={28} color={colors.textLight} />,
    gradient: [colors.primary, colors.primaryLight] as const,
  },
  {
    id: 'international',
    name: 'International Adventure',
    description: 'Journey across borders',
    icon: <Globe size={28} color={colors.textLight} />,
    gradient: [colors.secondary, colors.secondaryLight] as const,
  },
];

const LOCAL_DESTINATIONS: Destination[] = [
  {
    id: 'local-1',
    name: 'Napa Valley',
    country: 'USA',
    description: 'World-renowned wine country with stunning vineyard views and gourmet dining.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
    rating: 4.8,
    reviewCount: 5432,
    tags: ['Wine', 'Foodie', 'Relaxation'],
    avgPrice: 200,
    currency: 'USD',
    bestSeason: 'September - November',
    coordinates: { lat: 38.2975, lng: -122.2869 },
  },
  {
    id: 'local-2',
    name: 'Big Sur',
    country: 'USA',
    description: 'Dramatic coastal cliffs, redwood forests, and breathtaking Pacific views.',
    image: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800',
    rating: 4.9,
    reviewCount: 8765,
    tags: ['Nature', 'Scenic', 'Adventure'],
    avgPrice: 180,
    currency: 'USD',
    bestSeason: 'April - October',
    coordinates: { lat: 36.2704, lng: -121.8081 },
  },
  {
    id: 'local-3',
    name: 'Sedona',
    country: 'USA',
    description: 'Red rock formations, spiritual vortexes, and world-class hiking trails.',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
    rating: 4.8,
    reviewCount: 6543,
    tags: ['Wellness', 'Hiking', 'Photography'],
    avgPrice: 160,
    currency: 'USD',
    bestSeason: 'March - May, September - November',
    coordinates: { lat: 34.8697, lng: -111.761 },
  },
  {
    id: 'local-4',
    name: 'Lake Tahoe',
    country: 'USA',
    description: 'Crystal-clear alpine lake surrounded by mountains and outdoor adventures.',
    image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=800',
    rating: 4.9,
    reviewCount: 7890,
    tags: ['Adventure', 'Nature', 'Water Sports'],
    avgPrice: 220,
    currency: 'USD',
    bestSeason: 'Year-round',
    coordinates: { lat: 39.0968, lng: -120.0324 },
  },
  {
    id: 'local-5',
    name: 'Joshua Tree',
    country: 'USA',
    description: 'Unique desert landscape with iconic trees and incredible stargazing.',
    image: 'https://images.unsplash.com/photo-1545243424-0ce743321e11?w=800',
    rating: 4.7,
    reviewCount: 4567,
    tags: ['Nature', 'Photography', 'Camping'],
    avgPrice: 120,
    currency: 'USD',
    bestSeason: 'October - May',
    coordinates: { lat: 33.8734, lng: -115.901 },
  },
];

const DOMESTIC_DESTINATIONS: Destination[] = [
  {
    id: 'domestic-1',
    name: 'New Orleans',
    country: 'USA',
    description: 'Jazz, Cajun cuisine, and vibrant culture in the heart of Louisiana.',
    image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
    rating: 4.8,
    reviewCount: 9876,
    tags: ['Music', 'Foodie', 'Nightlife'],
    avgPrice: 180,
    currency: 'USD',
    bestSeason: 'February - May',
    coordinates: { lat: 29.9511, lng: -90.0715 },
  },
  {
    id: 'domestic-2',
    name: 'Savannah',
    country: 'USA',
    description: 'Historic charm with moss-draped squares and Southern hospitality.',
    image: 'https://images.unsplash.com/photo-1597435877833-61927706f2a5?w=800',
    rating: 4.7,
    reviewCount: 5678,
    tags: ['Historical', 'Romantic', 'Architecture'],
    avgPrice: 150,
    currency: 'USD',
    bestSeason: 'March - May, September - November',
    coordinates: { lat: 32.0809, lng: -81.0912 },
  },
  {
    id: 'domestic-3',
    name: 'Portland',
    country: 'USA',
    description: 'Quirky culture, craft breweries, and stunning Pacific Northwest nature.',
    image: 'https://images.unsplash.com/photo-1566907225472-514215c9e5e9?w=800',
    rating: 4.6,
    reviewCount: 6789,
    tags: ['Foodie', 'Nature', 'Culture'],
    avgPrice: 170,
    currency: 'USD',
    bestSeason: 'June - September',
    coordinates: { lat: 45.5152, lng: -122.6784 },
  },
  {
    id: 'domestic-4',
    name: 'Austin',
    country: 'USA',
    description: 'Live music capital with incredible BBQ and a thriving tech scene.',
    image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800',
    rating: 4.7,
    reviewCount: 8765,
    tags: ['Music', 'Foodie', 'Nightlife'],
    avgPrice: 160,
    currency: 'USD',
    bestSeason: 'March - May, September - November',
    coordinates: { lat: 30.2672, lng: -97.7431 },
  },
  {
    id: 'domestic-5',
    name: 'Charleston',
    country: 'USA',
    description: 'Antebellum architecture, world-class dining, and Southern charm.',
    image: 'https://images.unsplash.com/photo-1617785366432-c4829a9b3c82?w=800',
    rating: 4.9,
    reviewCount: 7654,
    tags: ['Historical', 'Foodie', 'Romantic'],
    avgPrice: 200,
    currency: 'USD',
    bestSeason: 'March - May, September - November',
    coordinates: { lat: 32.7765, lng: -79.9311 },
  },
];

const INTERNATIONAL_DESTINATIONS: Destination[] = [
  {
    id: 'intl-1',
    name: 'Lisbon',
    country: 'Portugal',
    description: 'Colorful tiles, pastel buildings, and delicious pastéis de nata.',
    image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
    rating: 4.8,
    reviewCount: 11234,
    tags: ['Cultural', 'Foodie', 'Architecture'],
    avgPrice: 140,
    currency: 'EUR',
    bestSeason: 'March - October',
    coordinates: { lat: 38.7223, lng: -9.1393 },
  },
  {
    id: 'intl-2',
    name: 'Dubrovnik',
    country: 'Croatia',
    description: 'Ancient walled city on the Adriatic with stunning sea views.',
    image: 'https://images.unsplash.com/photo-1555990538-1e6c3c7e4121?w=800',
    rating: 4.9,
    reviewCount: 8765,
    tags: ['Historical', 'Beach', 'Photography'],
    avgPrice: 180,
    currency: 'EUR',
    bestSeason: 'May - September',
    coordinates: { lat: 42.6507, lng: 18.0944 },
  },
  {
    id: 'intl-3',
    name: 'Cartagena',
    country: 'Colombia',
    description: 'Colonial charm, Caribbean beaches, and vibrant nightlife.',
    image: 'https://images.unsplash.com/photo-1583531352515-8884af319dc1?w=800',
    rating: 4.7,
    reviewCount: 6543,
    tags: ['Beach', 'Historical', 'Nightlife'],
    avgPrice: 100,
    currency: 'USD',
    bestSeason: 'December - April',
    coordinates: { lat: 10.391, lng: -75.4794 },
  },
  {
    id: 'intl-4',
    name: 'Hoi An',
    country: 'Vietnam',
    description: 'Lantern-lit ancient town with incredible street food and tailors.',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    rating: 4.8,
    reviewCount: 9876,
    tags: ['Cultural', 'Foodie', 'Shopping'],
    avgPrice: 60,
    currency: 'USD',
    bestSeason: 'February - April',
    coordinates: { lat: 15.8801, lng: 108.338 },
  },
  {
    id: 'intl-5',
    name: 'Queenstown',
    country: 'New Zealand',
    description: 'Adventure capital surrounded by dramatic mountains and lakes.',
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
    rating: 4.9,
    reviewCount: 7654,
    tags: ['Adventure', 'Nature', 'Scenic'],
    avgPrice: 250,
    currency: 'USD',
    bestSeason: 'December - February',
    coordinates: { lat: -45.0312, lng: 168.6626 },
  },
];

const ACTIVITY_TEMPLATES = [
  { name: 'Morning Exploration', category: 'Sightseeing', time: '09:00', duration: '2 hours' },
  { name: 'Local Cuisine Experience', category: 'Dining', time: '12:00', duration: '1.5 hours' },
  { name: 'Cultural Discovery', category: 'Cultural', time: '14:30', duration: '2 hours' },
  { name: 'Sunset Experience', category: 'Entertainment', time: '18:00', duration: '2 hours' },
];

const generateTripOption = (destination: Destination, budget: number, days: number): Trip => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 7);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);

  const itinerary: DayItinerary[] = [];
  for (let day = 1; day <= days; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day - 1);

    const activities: Activity[] = ACTIVITY_TEMPLATES.slice(
      0,
      day === 1 || day === days ? 2 : 3
    ).map((template, idx) => ({
      id: `${destination.id}-day${day}-${idx}`,
      name: template.name,
      description: `Experience ${template.name.toLowerCase()} in ${destination.name}`,
      image: destination.image,
      duration: template.duration,
      price: Math.floor(budget * 0.03 * (Math.random() * 0.5 + 0.5)),
      currency: 'USD',
      category: template.category,
      rating: 4.5 + Math.random() * 0.4,
      time: template.time,
      location: destination.name,
      isBooked: false,
    }));

    itinerary.push({
      day,
      date: dayDate.toISOString().split('T')[0],
      title:
        day === 1
          ? `Arrival in ${destination.name}`
          : day === days
            ? 'Departure Day'
            : `Day ${day} Adventures`,
      activities,
    });
  }

  return {
    id: `surprise-${destination.id}-${Date.now()}`,
    destination,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    status: 'planning',
    totalBudget: budget,
    spentBudget: 0,
    currency: 'USD',
    travelers: 2,
    itinerary,
    coverImage: destination.image,
  };
};

export default function SurpriseTripScreen() {
  const router = useRouter();
  const { user, addTrip } = useApp();
  const [selectedScope, setSelectedScope] = useState<TravelScope | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripOptions, setTripOptions] = useState<Trip[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const userBudget = user.budgetRange || 'moderate';
  const budgetValues: Record<string, number> = {
    budget: 750,
    moderate: 1750,
    comfort: 3750,
    luxury: 7500,
    ultra: 15000,
  };
  const budget = budgetValues[userBudget] || 1750;

  const getDestinationsForScope = (scope: TravelScope): Destination[] => {
    switch (scope) {
      case 'local':
        return LOCAL_DESTINATIONS;
      case 'domestic':
        return DOMESTIC_DESTINATIONS;
      case 'international':
        return INTERNATIONAL_DESTINATIONS;
      default:
        return [];
    }
  };

  const getDaysForScope = (scope: TravelScope): number => {
    switch (scope) {
      case 'local':
        return 2 + Math.floor(Math.random() * 2);
      case 'domestic':
        return 4 + Math.floor(Math.random() * 3);
      case 'international':
        return 7 + Math.floor(Math.random() * 4);
      default:
        return 3;
    }
  };

  const handleGenerateOptions = async () => {
    if (!selectedScope) {
      Alert.alert('Select Travel Scope', 'Please choose where you want to explore.');
      return;
    }

    setIsGenerating(true);
    console.log('Generating surprise trip options for scope:', selectedScope);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const destinations = getDestinationsForScope(selectedScope);
    const shuffled = [...destinations].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 5);

    const options = selected.map((dest) => {
      const days = getDaysForScope(selectedScope);
      return generateTripOption(dest, budget, days);
    });

    setTripOptions(options);
    setShowOptions(true);
    setIsGenerating(false);
    console.log('Generated', options.length, 'trip options');
  };

  const handleSelectTrip = (trip: Trip) => {
    addTrip(trip);
    console.log('Selected trip:', trip.id);
    router.replace(`/trip/${trip.id}`);
  };

  const handleRefresh = () => {
    setShowOptions(false);
    setTripOptions([]);
    handleGenerateOptions();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  if (showOptions && tripOptions.length > 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={styles.headerGradient}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.resultIcon}>
                <Sparkles size={24} color={colors.textLight} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Your Options</Text>
                <Text style={styles.headerSubtitle}>Curated trips based on your budget</Text>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <X size={22} color={colors.textLight} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.optionsContent}
          >
            <View style={styles.budgetInfo}>
              <DollarSign size={16} color={colors.primary} />
              <Text style={styles.budgetText}>
                Based on your {userBudget} budget (~${budget.toLocaleString()})
              </Text>
            </View>

            {tripOptions.map((trip, index) => (
              <Pressable
                key={trip.id}
                style={styles.optionCard}
                onPress={() => handleSelectTrip(trip)}
              >
                <Image
                  source={{ uri: trip.coverImage }}
                  style={styles.optionImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.optionGradient}
                />
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>Option {index + 1}</Text>
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionName}>{trip.destination.name}</Text>
                  <View style={styles.optionLocation}>
                    <MapPin size={14} color={colors.textLight} />
                    <Text style={styles.optionCountry}>{trip.destination.country}</Text>
                  </View>
                  <View style={styles.optionDetails}>
                    <View style={styles.optionDetail}>
                      <Calendar size={14} color={colors.accent} />
                      <Text style={styles.optionDetailText}>
                        {formatDate(trip.startDate)} • {getDuration(trip.startDate, trip.endDate)}
                      </Text>
                    </View>
                    <View style={styles.optionDetail}>
                      <Star size={14} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.optionDetailText}>{trip.destination.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.optionTags}>
                    {trip.destination.tags.slice(0, 3).map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.optionTag}>
                        <Text style={styles.optionTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.optionArrow}>
                  <ChevronRight size={24} color={colors.textLight} />
                </View>
              </Pressable>
            ))}

            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={20} color={colors.primary} />
              <Text style={styles.refreshButtonText}>Generate New Options</Text>
            </Pressable>

            <View style={styles.spacer} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        style={styles.headerGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.shuffleIcon}>
              <Shuffle size={24} color={colors.textLight} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Surprise Me</Text>
              <Text style={styles.headerSubtitle}>Let us plan your next adventure</Text>
            </View>
          </View>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={22} color={colors.textLight} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>Where do you want to explore?</Text>
            <Text style={styles.introText}>
              Choose your travel scope and we&apos;ll create personalized trip options based on your
              preferences and budget.
            </Text>
          </View>

          <View style={styles.scopeOptions}>
            {TRAVEL_SCOPES.map((scope) => {
              const isSelected = selectedScope === scope.id;
              return (
                <Pressable
                  key={scope.id}
                  style={[styles.scopeCard, isSelected && styles.scopeCardSelected]}
                  onPress={() => setSelectedScope(scope.id)}
                >
                  <LinearGradient
                    colors={scope.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scopeIconContainer}
                  >
                    {scope.icon}
                  </LinearGradient>
                  <View style={styles.scopeInfo}>
                    <Text style={[styles.scopeName, isSelected && styles.scopeNameSelected]}>
                      {scope.name}
                    </Text>
                    <Text style={styles.scopeDescription}>{scope.description}</Text>
                  </View>
                  <View style={[styles.scopeRadio, isSelected && styles.scopeRadioSelected]}>
                    {isSelected && <View style={styles.scopeRadioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.budgetPreview}>
            <View style={styles.budgetPreviewIcon}>
              <DollarSign size={20} color={colors.primary} />
            </View>
            <View style={styles.budgetPreviewInfo}>
              <Text style={styles.budgetPreviewLabel}>Your Budget</Text>
              <Text style={styles.budgetPreviewValue}>
                {userBudget.charAt(0).toUpperCase() + userBudget.slice(1)} (~$
                {budget.toLocaleString()})
              </Text>
            </View>
          </View>

          <View style={styles.noteSection}>
            <Sparkles size={18} color={colors.secondaryDark} />
            <Text style={styles.noteText}>
              We&apos;ll generate 5 unique trip options tailored to your budget and travel style. Pick
              your favorite and start planning!
            </Text>
          </View>

          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.generateButton,
              (!selectedScope || isGenerating) && styles.generateButtonDisabled,
            ]}
            disabled={!selectedScope || isGenerating}
            onPress={handleGenerateOptions}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Shuffle size={20} color={colors.textLight} />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Finding Perfect Trips...' : 'Surprise Me!'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
    height: 200,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  shuffleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 20,
  },
  introSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  scopeOptions: {
    paddingHorizontal: 20,
    gap: 14,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  scopeCardSelected: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}08`,
  },
  scopeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  scopeName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  scopeNameSelected: {
    color: colors.secondaryDark,
  },
  scopeDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scopeRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeRadioSelected: {
    borderColor: colors.secondary,
  },
  scopeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  budgetPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    padding: 16,
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
  budgetPreviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetPreviewInfo: {
    marginLeft: 14,
  },
  budgetPreviewLabel: {
    fontSize: 13,
    color: colors.primaryDark,
    opacity: 0.8,
  },
  budgetPreviewValue: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.primaryDark,
    marginTop: 2,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    backgroundColor: `${colors.secondary}15`,
    borderRadius: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryDark,
  },
  spacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  generateButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textLight,
  },
  optionsContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 20,
  },
  optionsContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  budgetText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  optionCard: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  optionImage: {
    width: '100%',
    height: '100%',
  },
  optionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  optionBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  optionName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textLight,
  },
  optionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  optionCountry: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
  },
  optionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  optionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionDetailText: {
    fontSize: 13,
    color: colors.textLight,
    opacity: 0.9,
  },
  optionTags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  optionTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionTagText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textLight,
  },
  optionArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
  },
});
