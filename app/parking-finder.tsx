// ============================================================================
// ParkingFinder Screen for Paint the Town
// Full-featured parking search with map, list, and filters
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Clock,
  DollarSign,
  Car,
  Zap,
  Shield,
  Filter,
  List,
  Map,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  Phone,
  ExternalLink,
  Check,
  RefreshCw,
  Layers,
  ParkingCircle,
  Building2,
  CircleParking,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useParkingFinder } from '@/hooks/useParkingFinder';
import {
  ParkingLocation,
  ParkingType,
  ParkingFeature,
  ParkingSortOption,
  PARKING_TYPE_ICONS,
  PARKING_TYPE_LABELS,
  AVAILABILITY_COLORS,
  FEATURE_ICONS,
  FEATURE_LABELS,
  PARKING_FILTER_OPTIONS,
} from '@/types/parking';
import {
  getAvailabilityText,
  getAvailabilityColor,
  formatParkingHours,
  getKeyFeatures,
  formatPrice,
} from '@/utils/parkingUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// Sub-Components
// ============================================================================

interface ParkingCardProps {
  parking: ParkingLocation;
  isSelected?: boolean;
  onPress: () => void;
  onNavigate: () => void;
  estimatedCost: string;
  compact?: boolean;
}

const ParkingCard: React.FC<ParkingCardProps> = ({
  parking,
  isSelected,
  onPress,
  onNavigate,
  estimatedCost,
  compact = false,
}) => {
  const availabilityColor = getAvailabilityColor(parking.availabilityStatus);
  const keyFeatures = getKeyFeatures(parking);

  if (compact) {
    return (
      <Pressable
        style={[styles.compactCard, isSelected && styles.compactCardSelected]}
        onPress={onPress}
      >
        <View style={styles.compactHeader}>
          <Text style={styles.compactTypeIcon}>{PARKING_TYPE_ICONS[parking.type]}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>
              {parking.name}
            </Text>
            <Text style={styles.compactDistance}>{parking.distanceText}</Text>
          </View>
          <Text style={styles.compactPrice}>{parking.pricing.displayPrice}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.parkingCard, isSelected && styles.parkingCardSelected]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.typeIconContainer}>
          <Text style={styles.typeIcon}>{PARKING_TYPE_ICONS[parking.type]}</Text>
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {parking.name}
          </Text>
          <Text style={styles.cardType}>{PARKING_TYPE_LABELS[parking.type]}</Text>
        </View>
        <View style={styles.cardPriceContainer}>
          <Text style={styles.cardPrice}>{parking.pricing.displayPrice}</Text>
          {parking.pricing.dailyMax && (
            <Text style={styles.cardDailyMax}>
              Max {formatPrice(parking.pricing.dailyMax, parking.pricing.currency)}/day
            </Text>
          )}
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Navigation size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{parking.distanceText}</Text>
        </View>
        <View style={styles.infoItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{parking.walkingTime} min walk</Text>
        </View>
        <View style={[styles.availabilityBadge, { backgroundColor: `${availabilityColor}15` }]}>
          <View style={[styles.availabilityDot, { backgroundColor: availabilityColor }]} />
          <Text style={[styles.availabilityText, { color: availabilityColor }]}>
            {getAvailabilityText(parking)}
          </Text>
        </View>
      </View>

      {/* Features */}
      {keyFeatures.length > 0 && (
        <View style={styles.featuresRow}>
          {keyFeatures.map((feature) => (
            <View key={feature} style={styles.featureBadge}>
              <Text style={styles.featureIcon}>{FEATURE_ICONS[feature]}</Text>
              <Text style={styles.featureText}>{FEATURE_LABELS[feature]}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.estimatedCost}>
          <Text style={styles.estimatedLabel}>Est. total:</Text>
          <Text style={styles.estimatedValue}>{estimatedCost}</Text>
        </View>

        <View style={styles.cardActions}>
          {parking.rating && (
            <View style={styles.ratingBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{parking.rating}</Text>
            </View>
          )}
          <Pressable
            style={styles.navigateButton}
            onPress={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
          >
            <Navigation size={16} color={colors.primary} />
            <Text style={styles.navigateText}>Navigate</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

// Filter Sheet Component
interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    types: ParkingType[];
    features: ParkingFeature[];
    maxPrice?: number;
    sortBy: ParkingSortOption;
    radiusMiles: number;
    mustBeOpen: boolean;
    reservableOnly: boolean;
  };
  onUpdateFilters: (filters: any) => void;
  onToggleType: (type: ParkingType) => void;
  onToggleFeature: (feature: ParkingFeature) => void;
  onSetMaxPrice: (price?: number) => void;
  onSetSortBy: (sort: ParkingSortOption) => void;
  onSetRadius: (radius: number) => void;
  onReset: () => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  visible,
  onClose,
  filters,
  onUpdateFilters,
  onToggleType,
  onToggleFeature,
  onSetMaxPrice,
  onSetSortBy,
  onSetRadius,
  onReset,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.filterOverlay}>
        <Pressable style={styles.filterBackdrop} onPress={onClose} />
        <View style={styles.filterSheet}>
          <View style={styles.filterHandle} />

          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <Pressable onPress={onReset}>
              <Text style={styles.filterReset}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                {PARKING_FILTER_OPTIONS.sortOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.id && styles.sortOptionSelected,
                    ]}
                    onPress={() => onSetSortBy(option.id)}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sortBy === option.id && styles.sortOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {filters.sortBy === option.id && <Check size={16} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Parking Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Parking Type</Text>
              <View style={styles.typeOptions}>
                {PARKING_FILTER_OPTIONS.types.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.typeOption,
                      filters.types.includes(type.id) && styles.typeOptionSelected,
                    ]}
                    onPress={() => onToggleType(type.id)}
                  >
                    <Text style={styles.typeOptionIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.typeOptionText,
                        filters.types.includes(type.id) && styles.typeOptionTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Max Price per Hour</Text>
              <View style={styles.priceOptions}>
                {PARKING_FILTER_OPTIONS.priceRanges.map((range) => (
                  <Pressable
                    key={range.id}
                    style={[
                      styles.priceOption,
                      filters.maxPrice === range.maxHourly && styles.priceOptionSelected,
                    ]}
                    onPress={() => onSetMaxPrice(range.maxHourly)}
                  >
                    <Text
                      style={[
                        styles.priceOptionText,
                        filters.maxPrice === range.maxHourly && styles.priceOptionTextSelected,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Search Radius */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Search Radius</Text>
              <View style={styles.radiusOptions}>
                {[0.5, 1, 2, 5].map((radius) => (
                  <Pressable
                    key={radius}
                    style={[
                      styles.radiusOption,
                      filters.radiusMiles === radius && styles.radiusOptionSelected,
                    ]}
                    onPress={() => onSetRadius(radius)}
                  >
                    <Text
                      style={[
                        styles.radiusOptionText,
                        filters.radiusMiles === radius && styles.radiusOptionTextSelected,
                      ]}
                    >
                      {radius} mi
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Features */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Features</Text>
              <View style={styles.featureOptions}>
                {PARKING_FILTER_OPTIONS.features.map((feature) => (
                  <Pressable
                    key={feature.id}
                    style={[
                      styles.featureOption,
                      filters.features.includes(feature.id) && styles.featureOptionSelected,
                    ]}
                    onPress={() => onToggleFeature(feature.id)}
                  >
                    <Text style={styles.featureOptionIcon}>{feature.icon}</Text>
                    <Text
                      style={[
                        styles.featureOptionText,
                        filters.features.includes(feature.id) && styles.featureOptionTextSelected,
                      ]}
                    >
                      {feature.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quick Toggles */}
            <View style={styles.filterSection}>
              <Pressable
                style={styles.toggleOption}
                onPress={() => onUpdateFilters({ mustBeOpen: !filters.mustBeOpen })}
              >
                <Text style={styles.toggleLabel}>Open Now Only</Text>
                <View style={[styles.toggleSwitch, filters.mustBeOpen && styles.toggleSwitchOn]}>
                  <View style={[styles.toggleThumb, filters.mustBeOpen && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              <Pressable
                style={styles.toggleOption}
                onPress={() => onUpdateFilters({ reservableOnly: !filters.reservableOnly })}
              >
                <Text style={styles.toggleLabel}>Reservable Only</Text>
                <View
                  style={[styles.toggleSwitch, filters.reservableOnly && styles.toggleSwitchOn]}
                >
                  <View
                    style={[styles.toggleThumb, filters.reservableOnly && styles.toggleThumbOn]}
                  />
                </View>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.filterFooter}>
            <Pressable style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export default function ParkingFinderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    destinationName?: string;
    lat?: string;
    lng?: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const {
    isSearching,
    searchResult,
    error,
    selectedParking,
    filters,
    parkingDuration,
    searchNearby,
    searchAtLocation,
    refreshSearch,
    selectParking,
    updateFilters,
    resetFilters,
    toggleType,
    toggleFeature,
    setMaxPrice,
    setSortBy,
    setRadius,
    setParkingDuration,
    navigateToParking,
    reserveParking,
    filteredResults,
    estimatedCost,
  } = useParkingFinder();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Initial Search
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (params.lat && params.lng) {
      searchAtLocation(parseFloat(params.lat), parseFloat(params.lng), params.destinationName);
    } else {
      searchNearby();
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Map Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const focusOnParking = useCallback((parking: ParkingLocation) => {
    mapRef.current?.animateToRegion({
      latitude: parking.coordinates.lat,
      longitude: parking.coordinates.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }, []);

  const handleMarkerPress = useCallback(
    (parking: ParkingLocation) => {
      selectParking(parking);
      focusOnParking(parking);
    },
    [selectParking, focusOnParking]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Find Parking</Text>
        {params.destinationName && (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Near {params.destinationName}
          </Text>
        )}
      </View>

      <View style={styles.headerActions}>
        <Pressable
          style={[styles.viewToggle, viewMode === 'list' && styles.viewToggleActive]}
          onPress={() => setViewMode('list')}
        >
          <List size={18} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.viewToggle, viewMode === 'map' && styles.viewToggleActive]}
          onPress={() => setViewMode('map')}
        >
          <Map size={18} color={viewMode === 'map' ? colors.primary : colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      {/* Duration Picker */}
      <Pressable style={styles.durationPicker} onPress={() => setShowDurationPicker(true)}>
        <Clock size={16} color={colors.textSecondary} />
        <Text style={styles.durationText}>{parkingDuration}h</Text>
        <ChevronDown size={14} color={colors.textSecondary} />
      </Pressable>

      {/* Filter Button */}
      <Pressable
        style={[
          styles.filterButton,
          (filters.types.length > 0 || filters.features.length > 0) && styles.filterButtonActive,
        ]}
        onPress={() => setShowFilters(true)}
      >
        <Filter size={16} color={colors.textSecondary} />
        <Text style={styles.filterButtonText}>Filters</Text>
        {filters.types.length + filters.features.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {filters.types.length + filters.features.length}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Refresh */}
      <Pressable style={styles.refreshButton} onPress={refreshSearch}>
        <RefreshCw size={16} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  const renderMap = () => {
    if (!searchResult) return null;

    return (
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: searchResult.searchCenter.lat,
            longitude: searchResult.searchCenter.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {/* Destination Marker */}
          <Marker
            coordinate={{
              latitude: searchResult.searchCenter.lat,
              longitude: searchResult.searchCenter.lng,
            }}
            title={params.destinationName || 'Destination'}
          >
            <View style={styles.destinationMarker}>
              <MapPin size={20} color="#fff" />
            </View>
          </Marker>

          {/* Parking Markers */}
          {filteredResults.map((parking) => (
            <Marker
              key={parking.id}
              coordinate={{
                latitude: parking.coordinates.lat,
                longitude: parking.coordinates.lng,
              }}
              onPress={() => handleMarkerPress(parking)}
            >
              <View
                style={[
                  styles.parkingMarker,
                  selectedParking?.id === parking.id && styles.parkingMarkerSelected,
                  { borderColor: getAvailabilityColor(parking.availabilityStatus) },
                ]}
              >
                <Text style={styles.parkingMarkerPrice}>
                  ${Math.round(parking.pricing.hourlyRate || 0)}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Selected Parking Card */}
        {selectedParking && (
          <View style={styles.selectedParkingCard}>
            <ParkingCard
              parking={selectedParking}
              isSelected
              onPress={() => {
                // Open detail
              }}
              onNavigate={() => navigateToParking(selectedParking)}
              estimatedCost={estimatedCost(selectedParking).formatted}
            />
          </View>
        )}
      </View>
    );
  };

  const renderList = () => (
    <ScrollView
      style={styles.listContainer}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isSearching} onRefresh={refreshSearch} />}
    >
      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredResults.length} parking {filteredResults.length === 1 ? 'spot' : 'spots'} found
        </Text>
        <Text style={styles.resultsSortLabel}>
          Sorted by:{' '}
          {PARKING_FILTER_OPTIONS.sortOptions.find((o) => o.id === filters.sortBy)?.label}
        </Text>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refreshSearch}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {/* Loading State */}
      {isSearching && filteredResults.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding parking near you...</Text>
        </View>
      )}

      {/* Parking List */}
      {filteredResults.map((parking) => (
        <ParkingCard
          key={parking.id}
          parking={parking}
          isSelected={selectedParking?.id === parking.id}
          onPress={() => selectParking(parking)}
          onNavigate={() => navigateToParking(parking)}
          estimatedCost={estimatedCost(parking).formatted}
        />
      ))}

      {/* Empty State */}
      {!isSearching && filteredResults.length === 0 && !error && (
        <View style={styles.emptyContainer}>
          <CircleParking size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Parking Found</Text>
          <Text style={styles.emptyText}>
            Try expanding your search radius or adjusting filters
          </Text>
          <Pressable style={styles.expandButton} onPress={() => setRadius(filters.radiusMiles + 1)}>
            <Text style={styles.expandButtonText}>Expand Search</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );

  const renderDurationPicker = () => (
    <Modal
      visible={showDurationPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDurationPicker(false)}
    >
      <Pressable style={styles.durationOverlay} onPress={() => setShowDurationPicker(false)}>
        <View style={styles.durationSheet}>
          <Text style={styles.durationSheetTitle}>Parking Duration</Text>
          <View style={styles.durationOptions}>
            {[1, 2, 3, 4, 6, 8, 12, 24].map((hours) => (
              <Pressable
                key={hours}
                style={[
                  styles.durationOption,
                  parkingDuration === hours && styles.durationOptionSelected,
                ]}
                onPress={() => {
                  setParkingDuration(hours);
                  setShowDurationPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.durationOptionText,
                    parkingDuration === hours && styles.durationOptionTextSelected,
                  ]}
                >
                  {hours}h
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {renderToolbar()}

      {viewMode === 'map' ? renderMap() : renderList()}

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onUpdateFilters={updateFilters}
        onToggleType={toggleType}
        onToggleFeature={toggleFeature}
        onSetMaxPrice={setMaxPrice}
        onSetSortBy={setSortBy}
        onSetRadius={setRadius}
        onReset={resetFilters}
      />

      {renderDurationPicker()}
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  viewToggle: {
    padding: 8,
    borderRadius: 8,
  },
  viewToggleActive: {
    backgroundColor: colors.primaryLight + '20',
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  durationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },

  // List View
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  resultsSortLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Parking Card
  parkingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  parkingCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '08',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 22,
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  cardType: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardPriceContainer: {
    alignItems: 'flex-end',
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  cardDailyMax: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 4,
  },
  featureIcon: {
    fontSize: 12,
  },
  featureText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  estimatedCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  estimatedValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 8,
    gap: 4,
  },
  navigateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Compact Card
  compactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactCardSelected: {
    borderColor: colors.primary,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactTypeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  compactDistance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Map View
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  destinationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  parkingMarker: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  parkingMarkerSelected: {
    backgroundColor: colors.primaryLight + '30',
    borderColor: colors.primary,
  },
  parkingMarkerPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  selectedParkingCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },

  // Filter Sheet
  filterOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  filterHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  filterReset: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  sortOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.text,
  },
  sortOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    gap: 8,
  },
  typeOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  typeOptionIcon: {
    fontSize: 16,
  },
  typeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  typeOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  priceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  priceOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  priceOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  priceOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  radiusOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  radiusOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  featureOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    gap: 6,
  },
  featureOptionSelected: {
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  featureOptionIcon: {
    fontSize: 14,
  },
  featureOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  featureOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.text,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  filterFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Duration Picker
  durationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  durationSheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  durationSheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  durationOption: {
    width: 56,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: colors.primary,
  },
  durationOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  durationOptionTextSelected: {
    color: '#fff',
  },

  // States
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#DC2626',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  expandButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
