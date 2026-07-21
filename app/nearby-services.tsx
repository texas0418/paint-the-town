/* eslint-disable max-lines -- tracked in #1 */
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MapPin,
  Phone,
  Clock,
  Navigation,
  Hospital,
  Pill,
  Building2,
  Shield,
  X,
  ChevronRight,
  Star,
  AlertCircle,
  Globe,
  Landmark,
  Heart,
  Stethoscope,
  BadgeCheck,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

type ServiceCategory = 'all' | 'hospitals' | 'pharmacies' | 'embassies' | 'police';

interface NearbyService {
  id: string;
  name: string;
  category: 'hospital' | 'pharmacy' | 'embassy' | 'police';
  address: string;
  distance: string;
  distanceValue: number;
  phone: string;
  hours: string;
  isOpen: boolean;
  is24Hours: boolean;
  rating?: number;
  reviewCount?: number;
  services?: string[];
  website?: string;
  emergencyServices?: boolean;
  languages?: string[];
  coordinates: { lat: number; lng: number };
}

const mockServices: NearbyService[] = [
  {
    id: '1',
    name: 'Tokyo Metropolitan Hospital',
    category: 'hospital',
    address: '1-2-1 Higashiueno, Taito City, Tokyo',
    distance: '0.8 km',
    distanceValue: 0.8,
    phone: '+81-3-3821-2121',
    hours: '24/7',
    isOpen: true,
    is24Hours: true,
    rating: 4.5,
    reviewCount: 328,
    services: ['Emergency Room', 'Surgery', 'Pediatrics', 'Cardiology', 'Radiology'],
    website: 'https://tokyohospital.example.com',
    emergencyServices: true,
    languages: ['Japanese', 'English'],
    coordinates: { lat: 35.7138, lng: 139.7745 },
  },
  {
    id: '2',
    name: 'Ueno General Clinic',
    category: 'hospital',
    address: '3-15-8 Ueno, Taito City, Tokyo',
    distance: '1.2 km',
    distanceValue: 1.2,
    phone: '+81-3-3832-5555',
    hours: '8:00 AM - 8:00 PM',
    isOpen: true,
    is24Hours: false,
    rating: 4.2,
    reviewCount: 156,
    services: ['General Medicine', 'Internal Medicine', 'Vaccinations'],
    emergencyServices: false,
    languages: ['Japanese', 'English', 'Chinese'],
    coordinates: { lat: 35.7108, lng: 139.773 },
  },
  {
    id: '3',
    name: 'Sakura Pharmacy',
    category: 'pharmacy',
    address: '2-5-12 Asakusa, Taito City, Tokyo',
    distance: '0.3 km',
    distanceValue: 0.3,
    phone: '+81-3-3844-1234',
    hours: '9:00 AM - 10:00 PM',
    isOpen: true,
    is24Hours: false,
    rating: 4.7,
    reviewCount: 89,
    services: ['Prescriptions', 'OTC Medicines', 'First Aid', 'Travel Health'],
    languages: ['Japanese', 'English'],
    coordinates: { lat: 35.7148, lng: 139.7967 },
  },
  {
    id: '4',
    name: 'Matsumoto Kiyoshi Ueno',
    category: 'pharmacy',
    address: '4-8-6 Ueno, Taito City, Tokyo',
    distance: '0.5 km',
    distanceValue: 0.5,
    phone: '+81-3-3831-9999',
    hours: '24/7',
    isOpen: true,
    is24Hours: true,
    rating: 4.4,
    reviewCount: 412,
    services: ['Prescriptions', 'OTC Medicines', 'Cosmetics', 'Health Supplements'],
    website: 'https://matsukiyo.example.com',
    languages: ['Japanese', 'English'],
    coordinates: { lat: 35.7122, lng: 139.7738 },
  },
  {
    id: '5',
    name: 'United States Embassy Tokyo',
    category: 'embassy',
    address: '1-10-5 Akasaka, Minato City, Tokyo',
    distance: '5.2 km',
    distanceValue: 5.2,
    phone: '+81-3-3224-5000',
    hours: '8:30 AM - 5:30 PM (Mon-Fri)',
    isOpen: true,
    is24Hours: false,
    services: ['Passport Services', 'Visa Services', 'Citizen Services', 'Emergency Assistance'],
    website: 'https://jp.usembassy.gov',
    emergencyServices: true,
    languages: ['English', 'Japanese'],
    coordinates: { lat: 35.6696, lng: 139.7388 },
  },
  {
    id: '6',
    name: 'British Embassy Tokyo',
    category: 'embassy',
    address: '1 Ichiban-cho, Chiyoda City, Tokyo',
    distance: '4.8 km',
    distanceValue: 4.8,
    phone: '+81-3-5211-1100',
    hours: '9:00 AM - 12:30 PM, 2:00 PM - 5:00 PM (Mon-Fri)',
    isOpen: true,
    is24Hours: false,
    services: ['Passport Services', 'Visa Services', 'Notarial Services', 'Emergency Assistance'],
    website: 'https://gov.uk/world/japan',
    emergencyServices: true,
    languages: ['English', 'Japanese'],
    coordinates: { lat: 35.6873, lng: 139.7419 },
  },
  {
    id: '7',
    name: 'Canadian Embassy Tokyo',
    category: 'embassy',
    address: '7-3-38 Akasaka, Minato City, Tokyo',
    distance: '5.5 km',
    distanceValue: 5.5,
    phone: '+81-3-5412-6200',
    hours: '8:30 AM - 12:00 PM, 1:00 PM - 4:30 PM (Mon-Fri)',
    isOpen: false,
    is24Hours: false,
    services: [
      'Passport Services',
      'Visa Services',
      'Citizen Registration',
      'Emergency Assistance',
    ],
    website: 'https://canada.ca/japan',
    emergencyServices: true,
    languages: ['English', 'French', 'Japanese'],
    coordinates: { lat: 35.6712, lng: 139.7337 },
  },
  {
    id: '8',
    name: 'Ueno Police Station',
    category: 'police',
    address: '1-18-15 Ueno, Taito City, Tokyo',
    distance: '0.9 km',
    distanceValue: 0.9,
    phone: '+81-3-3847-0110',
    hours: '24/7',
    isOpen: true,
    is24Hours: true,
    services: ['Emergency Response', 'Lost & Found', 'Crime Reporting', 'Tourist Assistance'],
    emergencyServices: true,
    languages: ['Japanese', 'English'],
    coordinates: { lat: 35.7112, lng: 139.7756 },
  },
  {
    id: '9',
    name: 'Asakusa Police Box (Koban)',
    category: 'police',
    address: '2-3-1 Asakusa, Taito City, Tokyo',
    distance: '0.4 km',
    distanceValue: 0.4,
    phone: '+81-3-3841-0110',
    hours: '24/7',
    isOpen: true,
    is24Hours: true,
    services: ['Directions', 'Lost & Found', 'Minor Incidents', 'Tourist Assistance'],
    emergencyServices: true,
    languages: ['Japanese', 'English'],
    coordinates: { lat: 35.7155, lng: 139.796 },
  },
  {
    id: '10',
    name: "Saint Luke's International Hospital",
    category: 'hospital',
    address: '9-1 Akashi-cho, Chuo City, Tokyo',
    distance: '3.8 km',
    distanceValue: 3.8,
    phone: '+81-3-3541-5151',
    hours: '24/7',
    isOpen: true,
    is24Hours: true,
    rating: 4.8,
    reviewCount: 567,
    services: ['Emergency Room', 'International Services', 'Surgery', 'Oncology', 'Cardiology'],
    website: 'https://luke.example.com',
    emergencyServices: true,
    languages: ['Japanese', 'English', 'Chinese', 'Korean'],
    coordinates: { lat: 35.668, lng: 139.7728 },
  },
];

const categories = [
  { id: 'all', name: 'All', icon: MapPin },
  { id: 'hospitals', name: 'Hospitals', icon: Hospital },
  { id: 'pharmacies', name: 'Pharmacies', icon: Pill },
  { id: 'embassies', name: 'Embassies', icon: Building2 },
  { id: 'police', name: 'Police', icon: Shield },
];

const emergencyNumbers = [
  { name: 'Police', number: '110', icon: Shield, color: colors.primary },
  { name: 'Fire/Ambulance', number: '119', icon: Hospital, color: colors.error },
  { name: 'Tourist Help', number: '03-3501-0110', icon: Globe, color: colors.success },
];

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function NearbyServicesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<NearbyService | null>(null);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);

  const filteredServices = useMemo(() => {
    let services = mockServices;

    if (selectedCategory !== 'all') {
      const categoryMap: Record<ServiceCategory, string> = {
        all: '',
        hospitals: 'hospital',
        pharmacies: 'pharmacy',
        embassies: 'embassy',
        police: 'police',
      };
      services = services.filter((s) => s.category === categoryMap[selectedCategory]);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      services = services.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.address.toLowerCase().includes(query) ||
          s.services?.some((service) => service.toLowerCase().includes(query))
      );
    }

    return services.sort((a, b) => a.distanceValue - b.distanceValue);
  }, [selectedCategory, searchQuery]);

  const getCategoryIcon = useCallback((category: NearbyService['category']) => {
    switch (category) {
      case 'hospital':
        return Hospital;
      case 'pharmacy':
        return Pill;
      case 'embassy':
        return Building2;
      case 'police':
        return Shield;
      default:
        return MapPin;
    }
  }, []);

  const getCategoryColor = useCallback((category: NearbyService['category']) => {
    switch (category) {
      case 'hospital':
        return colors.error;
      case 'pharmacy':
        return colors.success;
      case 'embassy':
        return colors.primary;
      case 'police':
        return colors.primaryDark;
      default:
        return colors.textSecondary;
    }
  }, []);

  const getCategoryLabel = useCallback((category: NearbyService['category']) => {
    switch (category) {
      case 'hospital':
        return 'Hospital';
      case 'pharmacy':
        return 'Pharmacy';
      case 'embassy':
        return 'Embassy';
      case 'police':
        return 'Police';
      default:
        return '';
    }
  }, []);

  const handleCall = useCallback((phone: string) => {
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    Linking.openURL(phoneUrl).catch((err) => console.log('Error opening phone:', err));
  }, []);

  const handleDirections = useCallback((service: NearbyService) => {
    const { lat, lng } = service.coordinates;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) => console.log('Error opening maps:', err));
  }, []);

  const handleWebsite = useCallback((url: string) => {
    Linking.openURL(url).catch((err) => console.log('Error opening website:', err));
  }, []);

  const renderServiceCard = useCallback(
    (service: NearbyService) => {
      const Icon = getCategoryIcon(service.category);
      const categoryColor = getCategoryColor(service.category);

      return (
        <Pressable
          key={service.id}
          style={styles.serviceCard}
          onPress={() => setSelectedService(service)}
        >
          <View style={styles.serviceCardHeader}>
            <View style={[styles.serviceIconContainer, { backgroundColor: `${categoryColor}15` }]}>
              <Icon size={24} color={categoryColor} />
            </View>
            <View style={styles.serviceMainInfo}>
              <View style={styles.serviceNameRow}>
                <Text style={styles.serviceName} numberOfLines={1}>
                  {service.name}
                </Text>
                {service.emergencyServices && (
                  <View style={styles.emergencyBadge}>
                    <AlertCircle size={10} color={colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.categoryRow}>
                <Text style={[styles.categoryLabel, { color: categoryColor }]}>
                  {getCategoryLabel(service.category)}
                </Text>
                {service.rating && (
                  <View style={styles.ratingContainer}>
                    <Star size={12} color={colors.warning} fill={colors.warning} />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailRow}>
              <MapPin size={14} color={colors.textTertiary} />
              <Text style={styles.serviceDetailText} numberOfLines={1}>
                {service.address}
              </Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Navigation size={14} color={colors.textTertiary} />
              <Text style={styles.serviceDetailText}>{service.distance}</Text>
            </View>
            <View style={styles.serviceDetailRow}>
              <Clock size={14} color={service.isOpen ? colors.success : colors.error} />
              <Text
                style={[
                  styles.serviceDetailText,
                  { color: service.isOpen ? colors.success : colors.error },
                ]}
              >
                {service.isOpen ? (service.is24Hours ? 'Open 24/7' : 'Open now') : 'Closed'}
              </Text>
              {!service.is24Hours && <Text style={styles.hoursText}> • {service.hours}</Text>}
            </View>
          </View>

          <View style={styles.serviceActions}>
            <Pressable
              style={[styles.actionButton, styles.callButton]}
              onPress={() => handleCall(service.phone)}
            >
              <Phone size={16} color={colors.textLight} />
              <Text style={styles.callButtonText}>Call</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.directionsButton]}
              onPress={() => handleDirections(service)}
            >
              <Navigation size={16} color={colors.primary} />
              <Text style={styles.directionsButtonText}>Directions</Text>
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [getCategoryIcon, getCategoryColor, getCategoryLabel, handleCall, handleDirections]
  );

  const renderServiceDetail = useCallback(() => {
    if (!selectedService) return null;

    const Icon = getCategoryIcon(selectedService.category);
    const categoryColor = getCategoryColor(selectedService.category);

    return (
      <View style={styles.detailOverlay}>
        <Pressable style={styles.detailBackdrop} onPress={() => setSelectedService(null)} />
        <View style={styles.detailSheet}>
          <View style={styles.detailHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailIconContainer, { backgroundColor: `${categoryColor}15` }]}>
                <Icon size={32} color={categoryColor} />
              </View>
              <View style={styles.detailHeaderInfo}>
                <Text style={styles.detailName}>{selectedService.name}</Text>
                <View style={styles.detailCategoryRow}>
                  <Text style={[styles.detailCategory, { color: categoryColor }]}>
                    {getCategoryLabel(selectedService.category)}
                  </Text>
                  {selectedService.rating && (
                    <View style={styles.detailRating}>
                      <Star size={14} color={colors.warning} fill={colors.warning} />
                      <Text style={styles.detailRatingText}>
                        {selectedService.rating} ({selectedService.reviewCount} reviews)
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable style={styles.detailCloseButton} onPress={() => setSelectedService(null)}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            {selectedService.emergencyServices && (
              <View style={styles.emergencyBannerDetail}>
                <AlertCircle size={16} color={colors.error} />
                <Text style={styles.emergencyBannerText}>Emergency services available</Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <View style={styles.detailInfoRow}>
                <MapPin size={18} color={colors.textSecondary} />
                <Text style={styles.detailInfoText}>{selectedService.address}</Text>
              </View>
              <View style={styles.detailInfoRow}>
                <Phone size={18} color={colors.textSecondary} />
                <Pressable onPress={() => handleCall(selectedService.phone)}>
                  <Text style={[styles.detailInfoText, styles.linkText]}>
                    {selectedService.phone}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.detailInfoRow}>
                <Clock size={18} color={selectedService.isOpen ? colors.success : colors.error} />
                <View>
                  <Text
                    style={[
                      styles.detailInfoText,
                      { color: selectedService.isOpen ? colors.success : colors.error },
                    ]}
                  >
                    {selectedService.isOpen ? 'Open now' : 'Closed'}
                  </Text>
                  <Text style={styles.detailHoursText}>{selectedService.hours}</Text>
                </View>
              </View>
              {selectedService.website && (
                <View style={styles.detailInfoRow}>
                  <Globe size={18} color={colors.textSecondary} />
                  <Pressable onPress={() => handleWebsite(selectedService.website!)}>
                    <Text style={[styles.detailInfoText, styles.linkText]}>Visit website</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {selectedService.services && selectedService.services.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Services Available</Text>
                <View style={styles.servicesGrid}>
                  {selectedService.services.map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <BadgeCheck size={12} color={colors.success} />
                      <Text style={styles.serviceTagText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {selectedService.languages && selectedService.languages.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Languages Spoken</Text>
                <View style={styles.languagesRow}>
                  {selectedService.languages.map((lang, index) => (
                    <View key={index} style={styles.languageTag}>
                      <Text style={styles.languageTagText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailActions}>
              <Pressable
                style={[styles.detailActionButton, styles.detailCallButton]}
                onPress={() => handleCall(selectedService.phone)}
              >
                <Phone size={20} color={colors.textLight} />
                <Text style={styles.detailCallButtonText}>Call Now</Text>
              </Pressable>
              <Pressable
                style={[styles.detailActionButton, styles.detailDirectionsButton]}
                onPress={() => handleDirections(selectedService)}
              >
                <Navigation size={20} color={colors.primary} />
                <Text style={styles.detailDirectionsButtonText}>Get Directions</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }, [
    selectedService,
    getCategoryIcon,
    getCategoryColor,
    getCategoryLabel,
    handleCall,
    handleDirections,
    handleWebsite,
  ]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Nearby Services</Text>
          <View style={styles.headerSpacer} />
        </View>

        {showEmergencyBanner && (
          <View style={styles.emergencyContainer}>
            <View style={styles.emergencyHeader}>
              <AlertCircle size={16} color={colors.error} />
              <Text style={styles.emergencyTitle}>Emergency Numbers (Japan)</Text>
              <Pressable onPress={() => setShowEmergencyBanner(false)}>
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.emergencyNumbers}>
              {emergencyNumbers.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.emergencyNumber}
                  onPress={() => handleCall(item.number)}
                >
                  <View style={[styles.emergencyIconBg, { backgroundColor: `${item.color}15` }]}>
                    <item.icon size={16} color={item.color} />
                  </View>
                  <View style={styles.emergencyInfo}>
                    <Text style={styles.emergencyName}>{item.name}</Text>
                    <Text style={styles.emergencyPhone}>{item.number}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services, addresses..."
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
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id as ServiceCategory)}
            >
              <category.icon
                size={18}
                color={selectedCategory === category.id ? colors.textLight : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.servicesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.servicesListContent}
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}{' '}
              found
            </Text>
            <Text style={styles.locationText}>
              <MapPin size={12} color={colors.textTertiary} /> Tokyo, Japan
            </Text>
          </View>

          {filteredServices.length > 0 ? (
            filteredServices.map(renderServiceCard)
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MapPin size={48} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or category filter</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {selectedService && renderServiceDetail()}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerSpacer: {
    width: 40,
  },
  emergencyContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  emergencyTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  emergencyNumbers: {
    flexDirection: 'row',
    gap: 10,
  },
  emergencyNumber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  emergencyIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  emergencyPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: colors.textLight,
  },
  servicesList: {
    flex: 1,
  },
  servicesListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  locationText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceMainInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emergencyBadge: {
    backgroundColor: colors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  serviceDetails: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceDetailText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  hoursText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: colors.success,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  directionsButton: {
    backgroundColor: colors.accent,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  detailSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  detailHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  detailCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRatingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBannerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}10`,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  emergencyBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  detailSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
  },
  detailInfoText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  detailHoursText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  serviceTagText: {
    fontSize: 13,
    color: colors.text,
  },
  languagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  detailActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  detailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  detailCallButton: {
    backgroundColor: colors.success,
  },
  detailCallButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  detailDirectionsButton: {
    backgroundColor: colors.accent,
  },
  detailDirectionsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
