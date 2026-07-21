import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  X,
  Navigation,
  MapPin,
  Clock,
  Car,
  Footprints,
  ExternalLink,
  LocateFixed,
  Route,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MapLocation {
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

interface NavigationModalProps {
  visible: boolean;
  onClose: () => void;
  destination: MapLocation;
  origin?: MapLocation;
  activityName?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
  coordinates: { latitude: number; longitude: number }[];
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
export default function NavigationModal({
  visible,
  onClose,
  destination,
  origin,
  activityName,
}: NavigationModalProps) {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedMode, setSelectedMode] = useState<'driving' | 'walking'>('driving');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get current location when modal opens
  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Generate simple route info
      if (destination.coordinates) {
        generateRouteInfo(
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          { latitude: destination.coordinates.lat, longitude: destination.coordinates.lng }
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Calculate simple route info (distance and estimated time)
  const generateRouteInfo = (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ) => {
    // Calculate distance using Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(end.latitude - start.latitude);
    const dLon = toRad(end.longitude - start.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(start.latitude)) *
        Math.cos(toRad(end.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration (rough: 30 mph driving, 3 mph walking)
    const speed = selectedMode === 'driving' ? 30 : 3;
    const durationHours = distance / speed;
    const durationMinutes = Math.round(durationHours * 60);

    // Create a simple straight-line route with intermediate points
    const numPoints = 20;
    const coordinates = [];
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      coordinates.push({
        latitude: start.latitude + (end.latitude - start.latitude) * fraction,
        longitude: start.longitude + (end.longitude - start.longitude) * fraction,
      });
    }

    setRouteInfo({
      distance: distance < 1 ? `${Math.round(distance * 5280)} ft` : `${distance.toFixed(1)} mi`,
      duration: durationMinutes < 60 
        ? `${durationMinutes} min` 
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      coordinates,
    });
  };

  const toRad = (deg: number) => deg * (Math.PI / 180);

  // Fit map to show both markers
  const fitToMarkers = () => {
    if (!mapRef.current || !destination.coordinates) return;

    const markers = [];
    
    if (origin?.coordinates) {
      markers.push({
        latitude: origin.coordinates.lat,
        longitude: origin.coordinates.lng,
      });
    } else if (currentLocation) {
      markers.push(currentLocation);
    }

    markers.push({
      latitude: destination.coordinates.lat,
      longitude: destination.coordinates.lng,
    });

    if (markers.length > 0) {
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      });
    }
  };

  // Center on current location
  const centerOnCurrentLocation = () => {
    if (!mapRef.current || !currentLocation) return;
    
    mapRef.current.animateToRegion({
      ...currentLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  // Open in external maps app
  const openInExternalMaps = () => {
    if (!destination.coordinates) return;

    const { lat, lng } = destination.coordinates;
    const label = encodeURIComponent(destination.name);
    
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    Linking.openURL(url!);
  };

  // Get start point
  const startPoint = origin?.coordinates 
    ? { latitude: origin.coordinates.lat, longitude: origin.coordinates.lng }
    : currentLocation;

  const destinationPoint = destination.coordinates
    ? { latitude: destination.coordinates.lat, longitude: destination.coordinates.lng }
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Map View */}
        <View style={styles.mapContainer}>
          {destinationPoint ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={{
                latitude: destinationPoint.latitude,
                longitude: destinationPoint.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onMapReady={fitToMarkers}
              showsUserLocation
              showsMyLocationButton={false}
              showsCompass
              showsScale
            >
              {/* Start Marker */}
              {startPoint && (
                <Marker
                  coordinate={startPoint}
                  title={origin?.name || 'Your Location'}
                  pinColor={colors.success}
                >
                  <View style={styles.startMarker}>
                    <Navigation size={16} color={colors.textLight} />
                  </View>
                </Marker>
              )}

              {/* Destination Marker */}
              <Marker
                coordinate={destinationPoint}
                title={destination.name}
                description={destination.address}
              >
                <View style={styles.destinationMarker}>
                  <MapPin size={20} color={colors.textLight} />
                </View>
              </Marker>

              {/* Route Line */}
              {routeInfo && routeInfo.coordinates.length > 0 && (
                <Polyline
                  coordinates={routeInfo.coordinates}
                  strokeWidth={4}
                  strokeColor={colors.primary}
                  lineDashPattern={selectedMode === 'walking' ? [10, 5] : undefined}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.noLocationContainer}>
              <MapPin size={48} color={colors.textTertiary} />
              <Text style={styles.noLocationText}>
                No location coordinates available
              </Text>
            </View>
          )}

          {/* Map Controls */}
          <View style={styles.mapControls}>
            <Pressable style={styles.mapControlButton} onPress={centerOnCurrentLocation}>
              <LocateFixed size={22} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.mapControlButton} onPress={fitToMarkers}>
              <Route size={22} color={colors.primary} />
            </Pressable>
          </View>

          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />

          {/* Destination Info */}
          <View style={styles.destinationInfo}>
            <View style={styles.destinationIcon}>
              <MapPin size={24} color={colors.secondary} />
            </View>
            <View style={styles.destinationText}>
              <Text style={styles.destinationName} numberOfLines={1}>
                {activityName || destination.name}
              </Text>
              <Text style={styles.destinationAddress} numberOfLines={2}>
                {destination.address || destination.name}
              </Text>
            </View>
          </View>

          {/* Route Info */}
          {isLoadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{locationError}</Text>
              <Pressable style={styles.retryButton} onPress={getCurrentLocation}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : routeInfo ? (
            <>
              {/* Transport Mode Selector */}
              <View style={styles.modeSelector}>
                <Pressable
                  style={[
                    styles.modeButton,
                    selectedMode === 'driving' && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedMode('driving');
                    if (startPoint && destinationPoint) {
                      generateRouteInfo(startPoint, destinationPoint);
                    }
                  }}
                >
                  <Car
                    size={20}
                    color={selectedMode === 'driving' ? colors.textLight : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeText,
                      selectedMode === 'driving' && styles.modeTextActive,
                    ]}
                  >
                    Drive
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modeButton,
                    selectedMode === 'walking' && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedMode('walking');
                    if (startPoint && destinationPoint) {
                      generateRouteInfo(startPoint, destinationPoint);
                    }
                  }}
                >
                  <Footprints
                    size={20}
                    color={selectedMode === 'walking' ? colors.textLight : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modeText,
                      selectedMode === 'walking' && styles.modeTextActive,
                    ]}
                  >
                    Walk
                  </Text>
                </Pressable>
              </View>

              {/* Distance & Duration */}
              <View style={styles.routeStats}>
                <View style={styles.routeStat}>
                  <Route size={18} color={colors.primary} />
                  <Text style={styles.routeStatValue}>{routeInfo.distance}</Text>
                  <Text style={styles.routeStatLabel}>distance</Text>
                </View>
                <View style={styles.routeStatDivider} />
                <View style={styles.routeStat}>
                  <Clock size={18} color={colors.primary} />
                  <Text style={styles.routeStatValue}>{routeInfo.duration}</Text>
                  <Text style={styles.routeStatLabel}>estimated</Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.externalButton} onPress={openInExternalMaps}>
              <ExternalLink size={18} color={colors.primary} />
              <Text style={styles.externalButtonText}>Open in Maps</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  noLocationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  noLocationText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 100,
    gap: 8,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.textLight,
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.textLight,
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  destinationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destinationText: {
    flex: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  destinationAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.textLight,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  routeStat: {
    flex: 1,
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  routeStatLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  routeStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  actions: {
    gap: 12,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 16,
  },
  externalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
