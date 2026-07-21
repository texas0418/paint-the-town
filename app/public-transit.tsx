/* eslint-disable max-lines -- tracked in #1 */
import { useState, useMemo, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import {
  Train,
  Bus,
  Ship,
  Dam,
  Search,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Ticket,
  Navigation,
  RefreshCw,
  Star,
  Accessibility,
  Zap,
  Moon,
  X,
  Check,
  ArrowLeftRight,
  Circle,
  QrCode,
  Info,
  AlertCircle,
  Wallet,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import {
  TransitCity,
  TransitLine,
  TransitPass,
  TransitRoute,
  TransitStation,
  TransitType,
} from '@/types';
import {
  transitCities,
  transitLines,
  transitPasses,
  sampleRoutes,
  sampleSchedule,
  getStationsByCity,
  getLinesByCity,
  getPassesByCity,
} from '@/mocks/transit';

const { width } = Dimensions.get('window');

type TabType = 'planner' | 'lines' | 'passes' | 'schedule';

const transitTypeIcons: Record<TransitType, typeof Train> = {
  metro: Train,
  bus: Bus,
  tram: Dam,
  ferry: Ship,
  commuter_rail: Train,
  light_rail: Dam,
};

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export default function PublicTransitScreen() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<TransitCity>(transitCities[0]);
  const [activeTab, setActiveTab] = useState<TabType>('planner');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [originStation, setOriginStation] = useState<TransitStation | null>(null);
  const [destinationStation, setDestinationStation] = useState<TransitStation | null>(null);
  const [showStationPicker, setShowStationPicker] = useState<'origin' | 'destination' | null>(null);
  const [stationSearch, setStationSearch] = useState('');
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPass, setSelectedPass] = useState<TransitPass | null>(null);
  const [showPassDetails, setShowPassDetails] = useState(false);
  const [purchasedPasses, setPurchasedPasses] = useState<string[]>([]);

  const cityStations = useMemo(() => getStationsByCity(selectedCity.id), [selectedCity.id]);
  const cityLines = useMemo(() => getLinesByCity(selectedCity.id), [selectedCity.id]);
  const cityPasses = useMemo(() => getPassesByCity(selectedCity.id), [selectedCity.id]);

  const filteredStations = useMemo(() => {
    if (!stationSearch) return cityStations;
    return cityStations.filter((s) => s.name.toLowerCase().includes(stationSearch.toLowerCase()));
  }, [cityStations, stationSearch]);

  const handleSearchRoutes = useCallback(() => {
    if (!originStation || !destinationStation) {
      Alert.alert('Select Stations', 'Please select both origin and destination stations');
      return;
    }
    setIsSearching(true);
    setTimeout(() => {
      setRoutes(sampleRoutes);
      setIsSearching(false);
    }, 1000);
  }, [originStation, destinationStation]);

  const handleSwapStations = useCallback(() => {
    const temp = originStation;
    setOriginStation(destinationStation);
    setDestinationStation(temp);
  }, [originStation, destinationStation]);

  const handlePurchasePass = useCallback((pass: TransitPass) => {
    Alert.alert(
      'Purchase Pass',
      `Would you like to purchase ${pass.name} for ${pass.currency} ${pass.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            setPurchasedPasses((prev) => [...prev, pass.id]);
            setShowPassDetails(false);
            Alert.alert('Success', 'Transit pass purchased! Check your wallet for the QR code.');
          },
        },
      ]
    );
  }, []);

  const getTransitIcon = (type: TransitType) => {
    const Icon = transitTypeIcons[type];
    return Icon;
  };

  const renderCitySelector = () => (
    <Pressable style={styles.citySelector} onPress={() => setShowCityPicker(true)}>
      <Image source={{ uri: selectedCity.image }} style={styles.citySelectorImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.citySelectorGradient}
      />
      <View style={styles.citySelectorContent}>
        <View>
          <Text style={styles.citySelectorLabel}>Current City</Text>
          <Text style={styles.citySelectorName}>{selectedCity.name}</Text>
          <Text style={styles.citySelectorCountry}>{selectedCity.country}</Text>
        </View>
        <View style={styles.citySelectorChevron}>
          <ChevronDown size={24} color={colors.textLight} />
        </View>
      </View>
      <View style={styles.cityTransitTypes}>
        {selectedCity.hasMetro && (
          <View style={styles.transitTypeBadge}>
            <Train size={12} color={colors.textLight} />
          </View>
        )}
        {selectedCity.hasBus && (
          <View style={styles.transitTypeBadge}>
            <Bus size={12} color={colors.textLight} />
          </View>
        )}
        {selectedCity.hasTram && (
          <View style={styles.transitTypeBadge}>
            <Dam size={12} color={colors.textLight} />
          </View>
        )}
        {selectedCity.hasFerry && (
          <View style={styles.transitTypeBadge}>
            <Ship size={12} color={colors.textLight} />
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'planner' as TabType, label: 'Trip Planner', icon: Navigation },
        { key: 'lines' as TabType, label: 'Lines', icon: Train },
        { key: 'passes' as TabType, label: 'Passes', icon: Ticket },
        { key: 'schedule' as TabType, label: 'Schedule', icon: Clock },
      ].map((tab) => (
        <Pressable
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          onPress={() => setActiveTab(tab.key)}
        >
          <tab.icon
            size={18}
            color={activeTab === tab.key ? colors.primary : colors.textTertiary}
          />
          <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderTripPlanner = () => (
    <View style={styles.plannerContainer}>
      <View style={styles.stationInputs}>
        <Pressable style={styles.stationInput} onPress={() => setShowStationPicker('origin')}>
          <View style={[styles.stationDot, { backgroundColor: colors.success }]} />
          <View style={styles.stationInputContent}>
            <Text style={styles.stationInputLabel}>From</Text>
            <Text
              style={[styles.stationInputValue, !originStation && styles.stationInputPlaceholder]}
            >
              {originStation?.name || 'Select origin station'}
            </Text>
          </View>
        </Pressable>

        <Pressable style={styles.swapButton} onPress={handleSwapStations}>
          <ArrowLeftRight size={18} color={colors.primary} />
        </Pressable>

        <Pressable style={styles.stationInput} onPress={() => setShowStationPicker('destination')}>
          <View style={[styles.stationDot, { backgroundColor: colors.error }]} />
          <View style={styles.stationInputContent}>
            <Text style={styles.stationInputLabel}>To</Text>
            <Text
              style={[
                styles.stationInputValue,
                !destinationStation && styles.stationInputPlaceholder,
              ]}
            >
              {destinationStation?.name || 'Select destination station'}
            </Text>
          </View>
        </Pressable>
      </View>

      <Pressable style={styles.searchButton} onPress={handleSearchRoutes}>
        {isSearching ? (
          <ActivityIndicator color={colors.textLight} />
        ) : (
          <>
            <Search size={20} color={colors.textLight} />
            <Text style={styles.searchButtonText}>Find Routes</Text>
          </>
        )}
      </Pressable>

      {routes.length > 0 && (
        <View style={styles.routesContainer}>
          <Text style={styles.routesTitle}>Available Routes</Text>
          {routes.map((route) => (
            <Pressable key={route.id} style={styles.routeCard}>
              <View style={styles.routeHeader}>
                <View style={styles.routeTimes}>
                  <Text style={styles.routeTime}>{route.departureTime}</Text>
                  <ArrowRight size={16} color={colors.textTertiary} />
                  <Text style={styles.routeTime}>{route.arrivalTime}</Text>
                </View>
                <View style={styles.routeBadges}>
                  {route.isFastest && (
                    <View style={[styles.routeBadge, { backgroundColor: colors.success + '20' }]}>
                      <Zap size={12} color={colors.success} />
                      <Text style={[styles.routeBadgeText, { color: colors.success }]}>
                        Fastest
                      </Text>
                    </View>
                  )}
                  {route.isFewestTransfers && (
                    <View style={[styles.routeBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.routeBadgeText, { color: colors.primary }]}>Direct</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.routeLegs}>
                {route.legs.map((leg, index) => (
                  <View key={leg.id} style={styles.routeLeg}>
                    {leg.type === 'walk' ? (
                      <View style={styles.walkLeg}>
                        <View style={styles.walkDot} />
                        <Text style={styles.walkText}>Walk {leg.distance}</Text>
                      </View>
                    ) : (
                      <View style={styles.transitLeg}>
                        <View style={[styles.lineBadge, { backgroundColor: leg.lineColor }]}>
                          <Text style={styles.lineBadgeText}>
                            {leg.lineName?.split(' ')[1] || leg.lineName}
                          </Text>
                        </View>
                        <Text style={styles.legStops}>{leg.stops} stops</Text>
                      </View>
                    )}
                    {index < route.legs.length - 1 && (
                      <ChevronRight size={14} color={colors.textTertiary} style={styles.legArrow} />
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.routeFooter}>
                <View style={styles.routeInfo}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.routeInfoText}>{route.duration} min</Text>
                </View>
                <View style={styles.routeInfo}>
                  <RefreshCw size={14} color={colors.textSecondary} />
                  <Text style={styles.routeInfoText}>
                    {route.transfers} transfer{route.transfers !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.routeInfo}>
                  {route.isAccessible && <Accessibility size={14} color={colors.success} />}
                </View>
                <Text style={styles.routeFare}>
                  {route.currency} {route.fare.toFixed(2)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  const renderLines = () => (
    <View style={styles.linesContainer}>
      {cityLines.map((line) => {
        const Icon = getTransitIcon(line.type);
        return (
          <Pressable key={line.id} style={styles.lineCard}>
            <View style={[styles.lineColorBar, { backgroundColor: line.color }]} />
            <View style={styles.lineContent}>
              <View style={styles.lineHeader}>
                <View style={[styles.lineIcon, { backgroundColor: line.color }]}>
                  <Icon size={16} color={line.textColor} />
                </View>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>{line.name}</Text>
                  <Text style={styles.lineType}>{line.type.replace('_', ' ')}</Text>
                </View>
                <View style={styles.lineFeatures}>
                  {line.isExpress && (
                    <View style={styles.featureBadge}>
                      <Zap size={12} color={colors.warning} />
                    </View>
                  )}
                  {line.isNightService && (
                    <View style={styles.featureBadge}>
                      <Moon size={12} color={colors.primary} />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.lineDetails}>
                <View style={styles.lineDetail}>
                  <Clock size={12} color={colors.textTertiary} />
                  <Text style={styles.lineDetailText}>Every {line.frequency}</Text>
                </View>
                <View style={styles.lineDetail}>
                  <MapPin size={12} color={colors.textTertiary} />
                  <Text style={styles.lineDetailText}>{line.stations.length} stations</Text>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>
        );
      })}
    </View>
  );

  const renderPasses = () => (
    <View style={styles.passesContainer}>
      <View style={styles.passesHeader}>
        <Text style={styles.passesTitle}>Transit Passes</Text>
        <Pressable style={styles.myPassesButton}>
          <Wallet size={16} color={colors.primary} />
          <Text style={styles.myPassesText}>My Passes ({purchasedPasses.length})</Text>
        </Pressable>
      </View>

      {cityPasses.map((pass) => (
        <Pressable
          key={pass.id}
          style={styles.passCard}
          onPress={() => {
            setSelectedPass(pass);
            setShowPassDetails(true);
          }}
        >
          <View style={styles.passHeader}>
            <View style={styles.passTypeContainer}>
              <View
                style={[
                  styles.passTypeIcon,
                  {
                    backgroundColor: pass.isTouristFriendly
                      ? colors.secondary + '20'
                      : colors.primary + '20',
                  },
                ]}
              >
                <Ticket
                  size={20}
                  color={pass.isTouristFriendly ? colors.secondary : colors.primary}
                />
              </View>
              {pass.isPopular && (
                <View style={styles.popularBadge}>
                  <Star size={10} color={colors.textLight} fill={colors.textLight} />
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
            <View style={styles.passPricing}>
              {pass.originalPrice && (
                <Text style={styles.passOriginalPrice}>
                  {pass.currency} {pass.originalPrice.toFixed(2)}
                </Text>
              )}
              <Text style={styles.passPrice}>
                {pass.currency} {pass.price.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.passName}>{pass.name}</Text>
          <Text style={styles.passDescription}>{pass.description}</Text>

          <View style={styles.passFeatures}>
            {pass.validDays && (
              <View style={styles.passFeature}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.passFeatureText}>
                  {pass.validDays} day{pass.validDays > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            <View style={styles.passFeature}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text style={styles.passFeatureText}>{pass.zones}</Text>
            </View>
            {pass.isTouristFriendly && (
              <View style={[styles.passFeature, { backgroundColor: colors.secondary + '15' }]}>
                <Text style={[styles.passFeatureText, { color: colors.secondary }]}>
                  Tourist Friendly
                </Text>
              </View>
            )}
          </View>

          <View style={styles.passIncludes}>
            {pass.validTransitTypes.slice(0, 4).map((type) => {
              const Icon = getTransitIcon(type);
              return (
                <View key={type} style={styles.includeIcon}>
                  <Icon size={14} color={colors.textSecondary} />
                </View>
              );
            })}
          </View>

          {purchasedPasses.includes(pass.id) && (
            <View style={styles.purchasedBadge}>
              <Check size={14} color={colors.success} />
              <Text style={styles.purchasedText}>Purchased</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.scheduleContainer}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>Live Departures</Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <View style={styles.scheduleStation}>
        <MapPin size={18} color={colors.primary} />
        <Text style={styles.scheduleStationName}>Châtelet</Text>
        <Text style={styles.scheduleDirection}>→ La Défense</Text>
      </View>

      <View style={styles.arrivalsList}>
        {sampleSchedule.arrivals.map((arrival, index) => (
          <View key={index} style={styles.arrivalItem}>
            <View style={styles.arrivalTime}>
              <Text style={[styles.arrivalTimeText, arrival.isDelayed && styles.arrivalDelayed]}>
                {arrival.time}
              </Text>
              {arrival.isDelayed && (
                <Text style={styles.delayText}>+{arrival.delayMinutes} min</Text>
              )}
            </View>
            <Text style={styles.arrivalDestination}>{arrival.destination}</Text>
            <View style={styles.arrivalStatus}>
              {arrival.isLive ? (
                <View style={styles.liveStatus}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveStatusText}>Live</Text>
                </View>
              ) : (
                <Text style={styles.scheduledText}>Scheduled</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.refreshButton}>
        <RefreshCw size={16} color={colors.primary} />
        <Text style={styles.refreshText}>Refresh</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Public Transit',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textLight,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCitySelector()}
        {renderTabs()}

        {activeTab === 'planner' && renderTripPlanner()}
        {activeTab === 'lines' && renderLines()}
        {activeTab === 'passes' && renderPasses()}
        {activeTab === 'schedule' && renderSchedule()}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <Pressable onPress={() => setShowCityPicker(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.cityList}>
              {transitCities.map((city) => (
                <Pressable
                  key={city.id}
                  style={[styles.cityItem, selectedCity.id === city.id && styles.cityItemSelected]}
                  onPress={() => {
                    setSelectedCity(city);
                    setOriginStation(null);
                    setDestinationStation(null);
                    setRoutes([]);
                    setShowCityPicker(false);
                  }}
                >
                  <Image source={{ uri: city.image }} style={styles.cityItemImage} />
                  <View style={styles.cityItemInfo}>
                    <Text style={styles.cityItemName}>{city.name}</Text>
                    <Text style={styles.cityItemCountry}>{city.country}</Text>
                    <Text style={styles.cityItemAuthority}>{city.transitAuthority}</Text>
                  </View>
                  {selectedCity.id === city.id && <Check size={20} color={colors.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showStationPicker !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {showStationPicker === 'origin' ? 'Origin' : 'Destination'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowStationPicker(null);
                  setStationSearch('');
                }}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <Search size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stations..."
                placeholderTextColor={colors.textTertiary}
                value={stationSearch}
                onChangeText={setStationSearch}
              />
            </View>
            <ScrollView style={styles.stationList}>
              {filteredStations.map((station) => (
                <Pressable
                  key={station.id}
                  style={styles.stationItem}
                  onPress={() => {
                    if (showStationPicker === 'origin') {
                      setOriginStation(station);
                    } else {
                      setDestinationStation(station);
                    }
                    setShowStationPicker(null);
                    setStationSearch('');
                  }}
                >
                  <View style={styles.stationItemIcon}>
                    <MapPin size={18} color={colors.primary} />
                  </View>
                  <View style={styles.stationItemInfo}>
                    <Text style={styles.stationItemName}>{station.name}</Text>
                    <View style={styles.stationItemLines}>
                      {station.lines.slice(0, 5).map((line, idx) => (
                        <View key={idx} style={styles.stationLineBadge}>
                          <Text style={styles.stationLineText}>{line}</Text>
                        </View>
                      ))}
                      {station.lines.length > 5 && (
                        <Text style={styles.stationMoreLines}>+{station.lines.length - 5}</Text>
                      )}
                    </View>
                  </View>
                  {station.isHub && (
                    <View style={styles.hubBadge}>
                      <Text style={styles.hubText}>Hub</Text>
                    </View>
                  )}
                  {station.isAccessible && <Accessibility size={16} color={colors.success} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showPassDetails && selectedPass !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPass && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pass Details</Text>
                  <Pressable onPress={() => setShowPassDetails(false)}>
                    <X size={24} color={colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.passDetailsScroll}>
                  <View style={styles.passDetailsHeader}>
                    <Ticket size={32} color={colors.primary} />
                    <Text style={styles.passDetailsName}>{selectedPass.name}</Text>
                    <Text style={styles.passDetailsPrice}>
                      {selectedPass.currency} {selectedPass.price.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.passDetailsDescription}>{selectedPass.description}</Text>

                  <View style={styles.passDetailsSection}>
                    <Text style={styles.passDetailsSectionTitle}>Includes</Text>
                    {selectedPass.includes.map((item, idx) => (
                      <View key={idx} style={styles.passIncludeItem}>
                        <Check size={16} color={colors.success} />
                        <Text style={styles.passIncludeText}>{item}</Text>
                      </View>
                    ))}
                  </View>

                  {selectedPass.restrictions && selectedPass.restrictions.length > 0 && (
                    <View style={styles.passDetailsSection}>
                      <Text style={styles.passDetailsSectionTitle}>Restrictions</Text>
                      {selectedPass.restrictions.map((item, idx) => (
                        <View key={idx} style={styles.passRestrictionItem}>
                          <AlertCircle size={16} color={colors.warning} />
                          <Text style={styles.passRestrictionText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.passDetailsSection}>
                    <Text style={styles.passDetailsSectionTitle}>Valid Transport</Text>
                    <View style={styles.validTransportList}>
                      {selectedPass.validTransitTypes.map((type) => {
                        const Icon = getTransitIcon(type);
                        return (
                          <View key={type} style={styles.validTransportItem}>
                            <Icon size={18} color={colors.primary} />
                            <Text style={styles.validTransportText}>{type.replace('_', ' ')}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.activationInfo}>
                    <Info size={16} color={colors.textSecondary} />
                    <Text style={styles.activationText}>
                      Activation: {selectedPass.activationType.replace('_', ' ')}
                    </Text>
                  </View>
                </ScrollView>

                <Pressable
                  style={[
                    styles.purchaseButton,
                    purchasedPasses.includes(selectedPass.id) && styles.purchaseButtonDisabled,
                  ]}
                  onPress={() => handlePurchasePass(selectedPass)}
                  disabled={purchasedPasses.includes(selectedPass.id)}
                >
                  {purchasedPasses.includes(selectedPass.id) ? (
                    <>
                      <QrCode size={20} color={colors.textLight} />
                      <Text style={styles.purchaseButtonText}>View QR Code</Text>
                    </>
                  ) : (
                    <>
                      <Wallet size={20} color={colors.textLight} />
                      <Text style={styles.purchaseButtonText}>
                        Purchase for {selectedPass.currency} {selectedPass.price.toFixed(2)}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  citySelector: {
    height: 160,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  citySelectorImage: {
    width: '100%',
    height: '100%',
  },
  citySelectorGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  citySelectorContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  citySelectorLabel: {
    fontSize: 12,
    color: colors.textLight,
    opacity: 0.8,
  },
  citySelectorName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textLight,
  },
  citySelectorCountry: {
    fontSize: 14,
    color: colors.textLight,
    opacity: 0.9,
  },
  citySelectorChevron: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityTransitTypes: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  },
  transitTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  plannerContainer: {
    padding: 16,
  },
  stationInputs: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  stationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  stationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stationInputContent: {
    flex: 1,
  },
  stationInputLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  stationInputValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  stationInputPlaceholder: {
    color: colors.textTertiary,
    fontWeight: '400',
  },
  swapButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  routesContainer: {
    marginTop: 24,
  },
  routesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeTime: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  routeBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeLegs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  routeLeg: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkLeg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textTertiary,
  },
  walkText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transitLeg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lineBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  legStops: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  legArrow: {
    marginHorizontal: 4,
  },
  routeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  routeFare: {
    marginLeft: 'auto',
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  linesContainer: {
    padding: 16,
  },
  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  lineColorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  lineContent: {
    flex: 1,
    padding: 14,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  lineType: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  lineFeatures: {
    flexDirection: 'row',
    gap: 6,
  },
  featureBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  lineDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lineDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  passesContainer: {
    padding: 16,
  },
  passesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  myPassesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 20,
  },
  myPassesText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  passCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  passHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  passTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
  },
  passPricing: {
    alignItems: 'flex-end',
  },
  passOriginalPrice: {
    fontSize: 12,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  passPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  passName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  passDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  passFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  passFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
  },
  passFeatureText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  passIncludes: {
    flexDirection: 'row',
    gap: 8,
  },
  includeIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  purchasedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  scheduleContainer: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  scheduleStation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  scheduleStationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleDirection: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  arrivalsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  arrivalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrivalTime: {
    width: 70,
  },
  arrivalTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  arrivalDelayed: {
    color: colors.error,
  },
  delayText: {
    fontSize: 11,
    color: colors.error,
  },
  arrivalDestination: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  arrivalStatus: {
    alignItems: 'flex-end',
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveStatusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  scheduledText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cityList: {
    padding: 16,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
  },
  cityItemSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cityItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  cityItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cityItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cityItemCountry: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cityItemAuthority: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  stationList: {
    padding: 16,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  stationItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stationItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stationItemLines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  stationLineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  stationLineText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
  },
  stationMoreLines: {
    fontSize: 11,
    color: colors.textTertiary,
    alignSelf: 'center',
  },
  hubBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.warning + '20',
    borderRadius: 6,
    marginRight: 8,
  },
  hubText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },
  passDetailsScroll: {
    padding: 20,
  },
  passDetailsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  passDetailsName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  passDetailsPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  passDetailsDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  passDetailsSection: {
    marginBottom: 20,
  },
  passDetailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  passIncludeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  passIncludeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  passRestrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  passRestrictionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  validTransportList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  validTransportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 8,
  },
  validTransportText: {
    fontSize: 13,
    color: colors.text,
    textTransform: 'capitalize',
  },
  activationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    marginTop: 8,
  },
  activationText: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 14,
  },
  purchaseButtonDisabled: {
    backgroundColor: colors.success,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
});
