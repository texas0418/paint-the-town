// ============================================================================
// Parking Finder Utilities for Paint the Town
// ============================================================================

import { Linking, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  ParkingLocation,
  ParkingSearchParams,
  ParkingSearchResult,
  ParkingSortOption,
  ParkingType,
  ParkingFeature,
  AvailabilityStatus,
  AVAILABILITY_COLORS,
  PARKING_TYPE_LABELS,
} from '../types/parking';
import { generateMockParking, getParkingByDestination } from '../mocks/parking';

// ============================================================================
// Location & Permission
// ============================================================================

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

/**
 * Get current user location
 */
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Location Required', 'Please enable location services to find parking near you.');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

// ============================================================================
// Distance Calculations
// ============================================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const toRad = (deg: number): number => deg * (Math.PI / 180);

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  }
  if (miles < 1) {
    return `${((miles * 5280) / 100).toFixed(0)}00 ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

/**
 * Estimate walking time in minutes
 */
export function estimateWalkingTime(miles: number): number {
  // Average walking speed: 3 mph
  return Math.round((miles / 3) * 60);
}

// ============================================================================
// Search & Filter
// ============================================================================

/**
 * Search for nearby parking locations
 * In production, this would call a real API (Google Places, ParkWhiz, SpotHero, etc.)
 */
export async function searchParking(params: ParkingSearchParams): Promise<ParkingSearchResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Get mock parking data based on destination or generate
  let locations: ParkingLocation[];

  if (params.destinationName) {
    locations = getParkingByDestination(params.destinationName);
  } else {
    locations = generateMockParking(params.coordinates.lat, params.coordinates.lng, 15);
  }

  // Calculate distances
  locations = locations.map((loc) => ({
    ...loc,
    distance: calculateDistance(
      params.coordinates.lat,
      params.coordinates.lng,
      loc.coordinates.lat,
      loc.coordinates.lng
    ),
  }));

  // Add formatted distance and walking time
  locations = locations.map((loc) => ({
    ...loc,
    distanceText: formatDistance(loc.distance!),
    walkingTime: estimateWalkingTime(loc.distance!),
  }));

  // Apply filters
  locations = applyFilters(locations, params);

  // Apply sorting
  locations = sortParkingLocations(locations, params.sortBy);

  // Filter by radius
  locations = locations.filter((loc) => (loc.distance || 0) <= params.radiusMiles);

  return {
    locations,
    totalCount: locations.length,
    searchCenter: params.coordinates,
    searchRadius: params.radiusMiles,
    timestamp: new Date(),
  };
}

/**
 * Apply search filters to parking locations
 */
function applyFilters(
  locations: ParkingLocation[],
  params: ParkingSearchParams
): ParkingLocation[] {
  let filtered = [...locations];

  // Filter by type
  if (params.types && params.types.length > 0) {
    filtered = filtered.filter((loc) => params.types!.includes(loc.type));
  }

  // Filter by max price
  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((loc) => (loc.pricing.hourlyRate || 0) <= params.maxPrice!);
  }

  // Filter by minimum available spaces
  if (params.minSpaces !== undefined) {
    filtered = filtered.filter(
      (loc) => loc.availableSpaces === undefined || loc.availableSpaces >= params.minSpaces!
    );
  }

  // Filter by features
  if (params.features && params.features.length > 0) {
    filtered = filtered.filter((loc) =>
      params.features!.every((feature) => loc.features.includes(feature))
    );
  }

  // Filter by vehicle type
  if (params.vehicleType) {
    filtered = filtered.filter((loc) => loc.vehicleTypes.includes(params.vehicleType!));
  }

  // Filter by open status
  if (params.mustBeOpen) {
    filtered = filtered.filter((loc) => loc.isOpen);
  }

  // Filter by reservable
  if (params.reservableOnly) {
    filtered = filtered.filter((loc) => loc.canReserve);
  }

  return filtered;
}

/**
 * Sort parking locations
 */
function sortParkingLocations(
  locations: ParkingLocation[],
  sortBy: ParkingSortOption
): ParkingLocation[] {
  const sorted = [...locations];

  switch (sortBy) {
    case 'distance':
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    case 'price_low':
      return sorted.sort((a, b) => (a.pricing.hourlyRate || 0) - (b.pricing.hourlyRate || 0));

    case 'price_high':
      return sorted.sort((a, b) => (b.pricing.hourlyRate || 0) - (a.pricing.hourlyRate || 0));

    case 'availability':
      const statusOrder: Record<AvailabilityStatus, number> = {
        available: 0,
        limited: 1,
        unknown: 2,
        full: 3,
      };
      return sorted.sort(
        (a, b) => statusOrder[a.availabilityStatus] - statusOrder[b.availabilityStatus]
      );

    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    default:
      return sorted;
  }
}

// ============================================================================
// Pricing Helpers
// ============================================================================

/**
 * Calculate estimated parking cost
 */
export function calculateParkingCost(
  parking: ParkingLocation,
  durationHours: number
): { cost: number; formatted: string } {
  const { pricing } = parking;
  let cost = 0;

  if (pricing.dailyMax && durationHours >= 8) {
    // Use daily max for long stays
    cost = pricing.dailyMax;
  } else if (pricing.hourlyRate) {
    // Calculate hourly
    if (pricing.firstHourRate && durationHours >= 1) {
      cost = pricing.firstHourRate;
      const additionalHours = Math.ceil(durationHours - 1);
      cost += additionalHours * (pricing.additionalHourRate || pricing.hourlyRate);
    } else {
      cost = Math.ceil(durationHours) * pricing.hourlyRate;
    }

    // Cap at daily max if applicable
    if (pricing.dailyMax && cost > pricing.dailyMax) {
      cost = pricing.dailyMax;
    }
  }

  return {
    cost,
    formatted: `${pricing.currency === 'USD' ? '$' : pricing.currency}${cost.toFixed(2)}`,
  };
}

/**
 * Format price display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  }
  if (currency === 'JPY') {
    return `¥${Math.round(amount)}`;
  }
  if (currency === 'EUR') {
    return `€${amount.toFixed(2)}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

// ============================================================================
// Navigation & Directions
// ============================================================================

/**
 * Open directions to parking location in maps app
 */
export function openParkingDirections(
  parking: ParkingLocation,
  origin?: { lat: number; lng: number }
): void {
  const { lat, lng } = parking.coordinates;
  const label = encodeURIComponent(parking.name);

  let url: string;

  if (Platform.OS === 'ios') {
    url = origin
      ? `maps://app?saddr=${origin.lat},${origin.lng}&daddr=${lat},${lng}&q=${label}`
      : `maps://app?daddr=${lat},${lng}&q=${label}`;
  } else {
    url = origin
      ? `google.navigation:q=${lat},${lng}&origin=${origin.lat},${origin.lng}`
      : `google.navigation:q=${lat},${lng}`;
  }

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to web
      const webUrl = origin
        ? `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(webUrl);
    }
  });
}

/**
 * Open parking reservation URL/app
 */
export function openParkingReservation(parking: ParkingLocation): void {
  if (parking.reservationUrl) {
    Linking.openURL(parking.reservationUrl);
    return;
  }

  if (parking.appDeepLink) {
    Linking.canOpenURL(parking.appDeepLink).then((supported) => {
      if (supported) {
        Linking.openURL(parking.appDeepLink!);
      } else if (parking.website) {
        Linking.openURL(parking.website);
      }
    });
    return;
  }

  // Open provider website/app
  if (parking.reservationProvider) {
    const providerUrls: Record<string, string> = {
      spothero: 'https://spothero.com',
      parkwhiz: 'https://parkwhiz.com',
      parkme: 'https://parkme.com',
      bestparking: 'https://bestparking.com',
      parkopedia: 'https://parkopedia.com',
    };

    const url = providerUrls[parking.reservationProvider];
    if (url) {
      Linking.openURL(url);
    }
  } else if (parking.website) {
    Linking.openURL(parking.website);
  }
}

/**
 * Call parking location
 */
export function callParking(parking: ParkingLocation): void {
  if (parking.phone) {
    Linking.openURL(`tel:${parking.phone.replace(/[^+\d]/g, '')}`);
  }
}

// ============================================================================
// Availability Helpers
// ============================================================================

/**
 * Get availability status color
 */
export function getAvailabilityColor(status: AvailabilityStatus): string {
  return AVAILABILITY_COLORS[status];
}

/**
 * Get availability display text
 */
export function getAvailabilityText(parking: ParkingLocation): string {
  if (parking.availableSpaces !== undefined) {
    if (parking.availableSpaces === 0) {
      return 'Full';
    }
    return `${parking.availableSpaces} spots`;
  }

  switch (parking.availabilityStatus) {
    case 'available':
      return 'Available';
    case 'limited':
      return 'Limited';
    case 'full':
      return 'Full';
    default:
      return 'Check availability';
  }
}

// ============================================================================
// Hours Helpers
// ============================================================================

/**
 * Check if parking is currently open
 */
export function isParkingOpen(parking: ParkingLocation): boolean {
  if (parking.is24Hours) return true;

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[now.getDay()] as keyof typeof parking.hours;
  const dayHours = parking.hours[dayName];

  if (!dayHours || !dayHours.isOpen) return false;
  if (!dayHours.openTime || !dayHours.closeTime) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = dayHours.openTime.split(':').map(Number);
  const [closeHour, closeMin] = dayHours.closeTime.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  let closeMinutes = closeHour * 60 + closeMin;

  // Handle midnight crossing
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60;
  }

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

/**
 * Format hours for display
 */
export function formatParkingHours(parking: ParkingLocation): string {
  if (parking.is24Hours) return 'Open 24 Hours';

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[now.getDay()] as keyof typeof parking.hours;
  const dayHours = parking.hours[dayName];

  if (!dayHours || !dayHours.isOpen) return 'Closed Today';
  if (!dayHours.openTime || !dayHours.closeTime) return 'Hours vary';

  return `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`;
}

function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return minutes === 0
    ? `${hour12} ${period}`
    : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ============================================================================
// Feature Helpers
// ============================================================================

/**
 * Get key features for display (top 3-4 most relevant)
 */
export function getKeyFeatures(parking: ParkingLocation): ParkingFeature[] {
  const priority: ParkingFeature[] = [
    'ev_charging',
    'covered',
    'handicap_accessible',
    'valet_available',
    'security_cameras',
    'attendant',
    'elevator',
  ];

  const keyFeatures: ParkingFeature[] = [];

  for (const feature of priority) {
    if (parking.features.includes(feature)) {
      keyFeatures.push(feature);
      if (keyFeatures.length >= 4) break;
    }
  }

  return keyFeatures;
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Get parking type label
 */
export function getParkingTypeLabel(type: ParkingType): string {
  return PARKING_TYPE_LABELS[type];
}
