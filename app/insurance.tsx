/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  TextInput,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import {
  Shield,
  ShieldCheck,
  ShieldPlus,
  Search,
  ChevronRight,
  Check,
  X,
  Star,
  Clock,
  Phone,
  FileText,
  Plane,
  Heart,
  Briefcase,
  AlertTriangle,
  Info,
  Filter,
  ArrowUpDown,
  Sparkles,
  Globe,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface InsurancePlan {
  id: string;
  provider: string;
  providerLogo: string;
  name: string;
  tier: 'basic' | 'standard' | 'comprehensive' | 'premium';
  price: number;
  pricePerDay: number;
  currency: string;
  rating: number;
  reviewCount: number;
  maxCoverage: number;
  medicalCoverage: number;
  tripCancellation: number;
  baggage: number;
  emergencyEvacuation: number;
  features: string[];
  exclusions: string[];
  highlights: string[];
  processingTime: string;
  support24h: boolean;
  appClaims: boolean;
  familyPlan: boolean;
  adventureSports: boolean;
  preExistingConditions: boolean;
  covidCoverage: boolean;
  popular?: boolean;
}

interface FilterOptions {
  tier: string[];
  maxPrice: number;
  minRating: number;
  features: string[];
}

const insurancePlans: InsurancePlan[] = [
  {
    id: '1',
    provider: 'TravelGuard Pro',
    providerLogo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    name: 'Essential Protection',
    tier: 'basic',
    price: 45,
    pricePerDay: 4.5,
    currency: 'USD',
    rating: 4.2,
    reviewCount: 1247,
    maxCoverage: 50000,
    medicalCoverage: 25000,
    tripCancellation: 5000,
    baggage: 1000,
    emergencyEvacuation: 50000,
    features: [
      'Medical emergency coverage',
      'Trip cancellation',
      'Lost baggage protection',
      'Emergency evacuation',
      '24/7 assistance hotline',
    ],
    exclusions: ['Pre-existing conditions', 'Adventure sports', 'Mental health treatment'],
    highlights: ['Quick approval', 'Easy claims'],
    processingTime: 'Instant',
    support24h: true,
    appClaims: true,
    familyPlan: false,
    adventureSports: false,
    preExistingConditions: false,
    covidCoverage: true,
  },
  {
    id: '2',
    provider: 'SafeJourney',
    providerLogo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=100&h=100&fit=crop',
    name: 'Explorer Plus',
    tier: 'standard',
    price: 89,
    pricePerDay: 8.9,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 3892,
    maxCoverage: 150000,
    medicalCoverage: 100000,
    tripCancellation: 10000,
    baggage: 2500,
    emergencyEvacuation: 150000,
    features: [
      'Comprehensive medical coverage',
      'Trip cancellation & interruption',
      'Lost/delayed baggage',
      'Emergency evacuation & repatriation',
      'Travel delay coverage',
      'Rental car damage',
      '24/7 global assistance',
    ],
    exclusions: ['Extreme sports', 'War zones'],
    highlights: ['Best value', 'Fast claims'],
    processingTime: 'Instant',
    support24h: true,
    appClaims: true,
    familyPlan: true,
    adventureSports: false,
    preExistingConditions: false,
    covidCoverage: true,
    popular: true,
  },
  {
    id: '3',
    provider: 'WorldCover Elite',
    providerLogo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop',
    name: 'Premium Shield',
    tier: 'comprehensive',
    price: 159,
    pricePerDay: 15.9,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 2156,
    maxCoverage: 500000,
    medicalCoverage: 300000,
    tripCancellation: 25000,
    baggage: 5000,
    emergencyEvacuation: 500000,
    features: [
      'Unlimited medical coverage',
      'Cancel for any reason (CFAR)',
      'Comprehensive baggage protection',
      'Worldwide emergency evacuation',
      'Adventure sports coverage',
      'Rental car protection',
      'Identity theft protection',
      'Concierge services',
      'Pre-existing condition waiver',
    ],
    exclusions: ['War zones', 'Professional sports'],
    highlights: ['Pre-existing coverage', 'Adventure sports'],
    processingTime: 'Instant',
    support24h: true,
    appClaims: true,
    familyPlan: true,
    adventureSports: true,
    preExistingConditions: true,
    covidCoverage: true,
  },
  {
    id: '4',
    provider: 'NomadSafe',
    providerLogo:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100&h=100&fit=crop',
    name: 'Digital Nomad',
    tier: 'premium',
    price: 199,
    pricePerDay: 6.6,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 987,
    maxCoverage: 1000000,
    medicalCoverage: 500000,
    tripCancellation: 50000,
    baggage: 10000,
    emergencyEvacuation: 1000000,
    features: [
      'Multi-trip annual coverage',
      'Remote work equipment protection',
      'Worldwide medical coverage',
      'Mental health support',
      'Telemedicine included',
      'Adventure sports premium',
      'Personal liability coverage',
      'Legal assistance abroad',
      'Pet travel coverage',
      'Flexible cancellation',
    ],
    exclusions: ['Sanctioned countries'],
    highlights: ['Annual coverage', 'Remote work friendly'],
    processingTime: 'Instant',
    support24h: true,
    appClaims: true,
    familyPlan: true,
    adventureSports: true,
    preExistingConditions: true,
    covidCoverage: true,
  },
  {
    id: '5',
    provider: 'FamilyFirst Travel',
    providerLogo:
      'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=100&h=100&fit=crop',
    name: 'Family Adventure',
    tier: 'comprehensive',
    price: 249,
    pricePerDay: 12.5,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 1543,
    maxCoverage: 750000,
    medicalCoverage: 400000,
    tripCancellation: 30000,
    baggage: 7500,
    emergencyEvacuation: 750000,
    features: [
      'Covers up to 6 family members',
      'Pediatric emergency care',
      'School/work interruption',
      'Comprehensive medical',
      'Sports & activities covered',
      'Pregnancy complications',
      'Child-friendly claims',
      'Family reunion coverage',
    ],
    exclusions: ['Extreme sports for minors'],
    highlights: ['Family coverage', 'Kids activities'],
    processingTime: 'Instant',
    support24h: true,
    appClaims: true,
    familyPlan: true,
    adventureSports: true,
    preExistingConditions: false,
    covidCoverage: true,
  },
];

const coverageCategories = [
  { id: 'all', name: 'All Plans', icon: Shield },
  { id: 'basic', name: 'Basic', icon: Shield },
  { id: 'standard', name: 'Standard', icon: ShieldCheck },
  { id: 'comprehensive', name: 'Premium', icon: ShieldPlus },
];

const featureFilters = [
  { id: 'adventureSports', label: 'Adventure Sports' },
  { id: 'preExistingConditions', label: 'Pre-existing Conditions' },
  { id: 'familyPlan', label: 'Family Plan' },
  { id: 'covidCoverage', label: 'COVID Coverage' },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function InsuranceMarketplaceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'coverage'>('rating');
  const [filters, setFilters] = useState<FilterOptions>({
    tier: [],
    maxPrice: 500,
    minRating: 0,
    features: [],
  });
  const [tripDuration, setTripDuration] = useState(10);
  const [travelers, setTravelers] = useState(1);
  const [comparePlans, setComparePlans] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const detailsAnimation = useRef(new Animated.Value(0)).current;

  const handleSelectPlan = useCallback(
    (plan: InsurancePlan) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedPlan(plan);
      Animated.spring(detailsAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    },
    [detailsAnimation]
  );

  const handleCloseDetails = useCallback(() => {
    Animated.timing(detailsAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPlan(null));
  }, [detailsAnimation]);

  const handlePurchase = useCallback(
    (plan: InsurancePlan) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const totalPrice = (plan.pricePerDay * tripDuration * travelers).toFixed(2);
      Alert.alert(
        'Confirm Purchase',
        `You're about to purchase ${plan.name} by ${plan.provider} for $${totalPrice} (${travelers} traveler${travelers > 1 ? 's' : ''}, ${tripDuration} days).`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: () => {
              Alert.alert(
                'Success!',
                'Your travel insurance has been purchased. Policy documents will be sent to your email.',
                [{ text: 'OK', onPress: () => setSelectedPlan(null) }]
              );
            },
          },
        ]
      );
    },
    [tripDuration, travelers]
  );

  const toggleCompare = useCallback((planId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setComparePlans((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((id) => id !== planId);
      }
      if (prev.length >= 3) {
        Alert.alert('Compare Limit', 'You can compare up to 3 plans at once.');
        return prev;
      }
      return [...prev, planId];
    });
  }, []);

  const filteredPlans = insurancePlans
    .filter((plan) => {
      if (selectedCategory !== 'all' && plan.tier !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          plan.name.toLowerCase().includes(query) ||
          plan.provider.toLowerCase().includes(query) ||
          plan.features.some((f) => f.toLowerCase().includes(query))
        );
      }
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every((feature) => {
          if (feature === 'adventureSports') return plan.adventureSports;
          if (feature === 'preExistingConditions') return plan.preExistingConditions;
          if (feature === 'familyPlan') return plan.familyPlan;
          if (feature === 'covidCoverage') return plan.covidCoverage;
          return true;
        });
        if (!hasAllFeatures) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.pricePerDay - b.pricePerDay;
        case 'rating':
          return b.rating - a.rating;
        case 'coverage':
          return b.maxCoverage - a.maxCoverage;
        default:
          return 0;
      }
    });

  const getTierColor = (tier: InsurancePlan['tier']) => {
    switch (tier) {
      case 'basic':
        return '#64748B';
      case 'standard':
        return colors.primary;
      case 'comprehensive':
        return colors.secondary;
      case 'premium':
        return '#8B5CF6';
      default:
        return colors.textSecondary;
    }
  };

  const getTierLabel = (tier: InsurancePlan['tier']) => {
    switch (tier) {
      case 'basic':
        return 'Basic';
      case 'standard':
        return 'Standard';
      case 'comprehensive':
        return 'Comprehensive';
      case 'premium':
        return 'Premium';
      default:
        return tier;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPlanCard = (plan: InsurancePlan) => {
    const isInCompare = comparePlans.includes(plan.id);
    const totalPrice = plan.pricePerDay * tripDuration * travelers;

    return (
      <Pressable
        key={plan.id}
        style={[styles.planCard, plan.popular && styles.popularCard]}
        onPress={() => handleSelectPlan(plan)}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Sparkles size={12} color={colors.textLight} />
            <Text style={styles.popularText}>Most Popular</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Image source={{ uri: plan.providerLogo }} style={styles.providerLogo} />
          <View style={styles.planTitleContainer}>
            <Text style={styles.providerName}>{plan.provider}</Text>
            <Text style={styles.planName}>{plan.name}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: `${getTierColor(plan.tier)}15` }]}>
            <Text style={[styles.tierText, { color: getTierColor(plan.tier) }]}>
              {getTierLabel(plan.tier)}
            </Text>
          </View>
        </View>

        <View style={styles.planRating}>
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{plan.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({plan.reviewCount.toLocaleString()} reviews)</Text>
        </View>

        <View style={styles.coverageGrid}>
          <View style={styles.coverageItem}>
            <Heart size={16} color={colors.error} />
            <Text style={styles.coverageLabel}>Medical</Text>
            <Text style={styles.coverageValue}>{formatCurrency(plan.medicalCoverage)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <X size={16} color={colors.warning} />
            <Text style={styles.coverageLabel}>Cancellation</Text>
            <Text style={styles.coverageValue}>{formatCurrency(plan.tripCancellation)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Briefcase size={16} color={colors.primary} />
            <Text style={styles.coverageLabel}>Baggage</Text>
            <Text style={styles.coverageValue}>{formatCurrency(plan.baggage)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Plane size={16} color={colors.success} />
            <Text style={styles.coverageLabel}>Evacuation</Text>
            <Text style={styles.coverageValue}>{formatCurrency(plan.emergencyEvacuation)}</Text>
          </View>
        </View>

        <View style={styles.planFeatures}>
          {plan.highlights.map((highlight, index) => (
            <View key={index} style={styles.highlightBadge}>
              <Check size={12} color={colors.success} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
          {plan.support24h && (
            <View style={styles.highlightBadge}>
              <Phone size={12} color={colors.primary} />
              <Text style={styles.highlightText}>24/7 Support</Text>
            </View>
          )}
        </View>

        <View style={styles.planFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>${plan.pricePerDay.toFixed(2)}</Text>
            <Text style={styles.priceUnit}>/day</Text>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Est. Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.planActions}>
          <Pressable
            style={[styles.compareButton, isInCompare && styles.compareButtonActive]}
            onPress={(e) => {
              e.stopPropagation();
              toggleCompare(plan.id);
            }}
          >
            <Text style={[styles.compareButtonText, isInCompare && styles.compareButtonTextActive]}>
              {isInCompare ? 'Remove' : 'Compare'}
            </Text>
          </Pressable>
          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <ChevronRight size={16} color={colors.textLight} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderPlanDetails = () => {
    if (!selectedPlan) return null;

    const totalPrice = selectedPlan.pricePerDay * tripDuration * travelers;

    return (
      <Animated.View
        style={[
          styles.detailsOverlay,
          {
            opacity: detailsAnimation,
            transform: [
              {
                translateY: detailsAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable style={styles.detailsBackdrop} onPress={handleCloseDetails} />
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsHeader}>
              <Image source={{ uri: selectedPlan.providerLogo }} style={styles.detailsLogo} />
              <View style={styles.detailsTitleContainer}>
                <Text style={styles.detailsProvider}>{selectedPlan.provider}</Text>
                <Text style={styles.detailsName}>{selectedPlan.name}</Text>
              </View>
              <Pressable style={styles.closeButton} onPress={handleCloseDetails}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.detailsRating}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.detailsRatingText}>{selectedPlan.rating.toFixed(1)}</Text>
              <Text style={styles.detailsReviewCount}>
                ({selectedPlan.reviewCount.toLocaleString()} reviews)
              </Text>
            </View>

            <View style={styles.tripConfigSection}>
              <Text style={styles.sectionTitle}>Trip Details</Text>
              <View style={styles.configRow}>
                <View style={styles.configItem}>
                  <Calendar size={18} color={colors.primary} />
                  <Text style={styles.configLabel}>Duration</Text>
                  <View style={styles.configControls}>
                    <Pressable
                      style={styles.configButton}
                      onPress={() => setTripDuration(Math.max(1, tripDuration - 1))}
                    >
                      <Text style={styles.configButtonText}>-</Text>
                    </Pressable>
                    <Text style={styles.configValue}>{tripDuration} days</Text>
                    <Pressable
                      style={styles.configButton}
                      onPress={() => setTripDuration(tripDuration + 1)}
                    >
                      <Text style={styles.configButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.configItem}>
                  <Users size={18} color={colors.primary} />
                  <Text style={styles.configLabel}>Travelers</Text>
                  <View style={styles.configControls}>
                    <Pressable
                      style={styles.configButton}
                      onPress={() => setTravelers(Math.max(1, travelers - 1))}
                    >
                      <Text style={styles.configButtonText}>-</Text>
                    </Pressable>
                    <Text style={styles.configValue}>{travelers}</Text>
                    <Pressable
                      style={styles.configButton}
                      onPress={() => setTravelers(travelers + 1)}
                    >
                      <Text style={styles.configButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.coverageSection}>
              <Text style={styles.sectionTitle}>Coverage Details</Text>
              <View style={styles.coverageDetailGrid}>
                <View style={styles.coverageDetailItem}>
                  <View style={[styles.coverageIcon, { backgroundColor: `${colors.error}15` }]}>
                    <Heart size={20} color={colors.error} />
                  </View>
                  <Text style={styles.coverageDetailLabel}>Medical Emergency</Text>
                  <Text style={styles.coverageDetailValue}>
                    {formatCurrency(selectedPlan.medicalCoverage)}
                  </Text>
                </View>
                <View style={styles.coverageDetailItem}>
                  <View style={[styles.coverageIcon, { backgroundColor: `${colors.warning}15` }]}>
                    <X size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.coverageDetailLabel}>Trip Cancellation</Text>
                  <Text style={styles.coverageDetailValue}>
                    {formatCurrency(selectedPlan.tripCancellation)}
                  </Text>
                </View>
                <View style={styles.coverageDetailItem}>
                  <View style={[styles.coverageIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Briefcase size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.coverageDetailLabel}>Baggage Protection</Text>
                  <Text style={styles.coverageDetailValue}>
                    {formatCurrency(selectedPlan.baggage)}
                  </Text>
                </View>
                <View style={styles.coverageDetailItem}>
                  <View style={[styles.coverageIcon, { backgroundColor: `${colors.success}15` }]}>
                    <Plane size={20} color={colors.success} />
                  </View>
                  <Text style={styles.coverageDetailLabel}>Emergency Evacuation</Text>
                  <Text style={styles.coverageDetailValue}>
                    {formatCurrency(selectedPlan.emergencyEvacuation)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>What&apos;s Covered</Text>
              {selectedPlan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Check size={18} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.exclusionsSection}>
              <Text style={styles.sectionTitle}>Exclusions</Text>
              {selectedPlan.exclusions.map((exclusion, index) => (
                <View key={index} style={styles.exclusionRow}>
                  <X size={18} color={colors.error} />
                  <Text style={styles.exclusionText}>{exclusion}</Text>
                </View>
              ))}
            </View>

            <View style={styles.additionalInfo}>
              <View style={styles.infoRow}>
                <Clock size={18} color={colors.textSecondary} />
                <Text style={styles.infoText}>Processing: {selectedPlan.processingTime}</Text>
              </View>
              {selectedPlan.support24h && (
                <View style={styles.infoRow}>
                  <Phone size={18} color={colors.textSecondary} />
                  <Text style={styles.infoText}>24/7 Emergency Support</Text>
                </View>
              )}
              {selectedPlan.appClaims && (
                <View style={styles.infoRow}>
                  <FileText size={18} color={colors.textSecondary} />
                  <Text style={styles.infoText}>File claims in-app</Text>
                </View>
              )}
            </View>

            <View style={styles.purchaseSection}>
              <View style={styles.totalPriceContainer}>
                <Text style={styles.totalPriceLabel}>Total Price</Text>
                <View style={styles.totalPriceRow}>
                  <Text style={styles.totalPriceValue}>${totalPrice.toFixed(2)}</Text>
                  <Text style={styles.totalPriceBreakdown}>
                    ({travelers} × ${selectedPlan.pricePerDay}/day × {tripDuration} days)
                  </Text>
                </View>
              </View>

              <Pressable style={styles.purchaseButton} onPress={() => handlePurchase(selectedPlan)}>
                <LinearGradient
                  colors={[colors.secondary, colors.secondaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.purchaseGradient}
                >
                  <ShieldCheck size={20} color={colors.textLight} />
                  <Text style={styles.purchaseButtonText}>Purchase Coverage</Text>
                </LinearGradient>
              </Pressable>

              <Text style={styles.disclaimer}>
                By purchasing, you agree to the policy terms and conditions. Coverage begins on your
                specified travel start date.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    );
  };

  const renderCompareBar = () => {
    if (comparePlans.length === 0) return null;

    return (
      <View style={styles.compareBar}>
        <View style={styles.compareInfo}>
          <Text style={styles.compareCount}>{comparePlans.length} plans selected</Text>
          <Pressable onPress={() => setComparePlans([])}>
            <Text style={styles.clearCompare}>Clear</Text>
          </Pressable>
        </View>
        <Pressable
          style={[
            styles.compareNowButton,
            comparePlans.length < 2 && styles.compareNowButtonDisabled,
          ]}
          onPress={() => {
            if (comparePlans.length >= 2) {
              setShowCompare(true);
            }
          }}
          disabled={comparePlans.length < 2}
        >
          <Text style={styles.compareNowText}>Compare Now</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Travel Insurance',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textLight,
          headerTitleStyle: { fontWeight: '600' },
        }}
      />

      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <ShieldCheck size={32} color={colors.textLight} />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Insurance Marketplace</Text>
                <Text style={styles.headerSubtitle}>Compare & purchase travel coverage</Text>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search plans or providers..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {coverageCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Icon size={16} color={isSelected ? colors.textLight : colors.primary} />
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.filtersRow}>
          <Pressable style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
            <Filter size={16} color={colors.textSecondary} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </Pressable>

          <Pressable
            style={styles.sortButton}
            onPress={() => {
              const options: Array<'price' | 'rating' | 'coverage'> = [
                'price',
                'rating',
                'coverage',
              ];
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
            }}
          >
            <ArrowUpDown size={16} color={colors.textSecondary} />
            <Text style={styles.sortButtonText}>
              Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </Pressable>
        </View>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filtersPanelTitle}>Filter by Features</Text>
            <View style={styles.featureFilters}>
              {featureFilters.map((filter) => {
                const isSelected = filters.features.includes(filter.id);
                return (
                  <Pressable
                    key={filter.id}
                    style={[styles.featureChip, isSelected && styles.featureChipSelected]}
                    onPress={() => {
                      setFilters((prev) => ({
                        ...prev,
                        features: isSelected
                          ? prev.features.filter((f) => f !== filter.id)
                          : [...prev.features, filter.id],
                      }));
                    }}
                  >
                    {isSelected && <Check size={14} color={colors.textLight} />}
                    <Text
                      style={[styles.featureChipText, isSelected && styles.featureChipTextSelected]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} available
          </Text>
        </View>

        <View style={styles.plansList}>{filteredPlans.map(renderPlanCard)}</View>

        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Why Buy Through Us?</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: `${colors.success}15` }]}>
                <ShieldCheck size={24} color={colors.success} />
              </View>
              <Text style={styles.trustItemTitle}>Verified Providers</Text>
              <Text style={styles.trustItemText}>All insurers are licensed and regulated</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: `${colors.primary}15` }]}>
                <DollarSign size={24} color={colors.primary} />
              </View>
              <Text style={styles.trustItemTitle}>Best Prices</Text>
              <Text style={styles.trustItemText}>Guaranteed lowest premiums</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: `${colors.secondary}15` }]}>
                <Clock size={24} color={colors.secondary} />
              </View>
              <Text style={styles.trustItemTitle}>Instant Coverage</Text>
              <Text style={styles.trustItemText}>Policy documents sent immediately</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={[styles.trustIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Phone size={24} color={colors.warning} />
              </View>
              <Text style={styles.trustItemTitle}>24/7 Support</Text>
              <Text style={styles.trustItemText}>Help whenever you need it</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {renderCompareBar()}
      {renderPlanDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  categoriesContainer: {
    paddingTop: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.textLight,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filtersPanel: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
  },
  filtersPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  featureFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    gap: 6,
  },
  featureChipSelected: {
    backgroundColor: colors.primary,
  },
  featureChipText: {
    fontSize: 13,
    color: colors.text,
  },
  featureChipTextSelected: {
    color: colors.textLight,
  },
  resultsInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  plansList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  planTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  planRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  reviewCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  coverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  coverageItem: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  coverageLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  coverageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  planFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: `${colors.success}10`,
    borderRadius: 16,
    gap: 4,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  priceUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  compareButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  compareButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compareButtonTextActive: {
    color: colors.primary,
  },
  viewButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  trustSection: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  trustTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trustItem: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  trustIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trustItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  trustItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  detailsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 12,
  },
  detailsHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  detailsLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
  },
  detailsTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },
  detailsProvider: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailsName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsRating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 4,
  },
  detailsRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  detailsReviewCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tripConfigSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  configRow: {
    flexDirection: 'row',
    gap: 12,
  },
  configItem: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  configLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 8,
  },
  configControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  configButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  coverageSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  coverageDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  coverageDetailItem: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  coverageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  coverageDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  coverageDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  exclusionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  exclusionText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  additionalInfo: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  purchaseSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  totalPriceContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  totalPriceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
  },
  totalPriceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  totalPriceBreakdown: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  purchaseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  disclaimer: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  compareBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  compareInfo: {
    flex: 1,
  },
  compareCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  clearCompare: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  compareNowButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  compareNowButtonDisabled: {
    backgroundColor: colors.border,
  },
  compareNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
});
