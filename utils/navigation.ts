import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NavigationLocation {
  name: string;
  address: string;
  coordinates?: Coordinates;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  steps: RouteStep[];
  polyline?: Coordinates[];
}

// Request location permissions
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

// Get current location
export const getCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Location Permission',
        'Please enable location services to use navigation features.'
      );
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
    console.error('Error getting current location:', error);
    return null;
  }
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Format distance for display
export const formatDistance = (miles: number): string => {
  if (miles < 0.1) {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`;
  }
  return `${Math.round(miles)} mi`;
};

// Estimate travel time (rough estimate)
export const estimateTravelTime = (
  miles: number,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): string => {
  const speeds = {
    driving: 25, // mph average in city
    walking: 3, // mph
    transit: 15, // mph average
  };

  const hours = miles / speeds[mode];
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
};

// Generate mock route steps (in production, use Google Directions API)
export const generateRouteSteps = (
  origin: NavigationLocation,
  destination: NavigationLocation,
  distance: number
): RouteStep[] => {
  // Mock route steps; TODO: use Google Directions API in production
  const steps: RouteStep[] = [
    {
      instruction: `Head toward ${destination.name}`,
      distance: formatDistance(distance * 0.1),
      duration: estimateTravelTime(distance * 0.1),
      maneuver: 'straight',
    },
    {
      instruction: 'Continue on main road',
      distance: formatDistance(distance * 0.4),
      duration: estimateTravelTime(distance * 0.4),
      maneuver: 'straight',
    },
    {
      instruction: `Turn right toward ${destination.address.split(',')[0]}`,
      distance: formatDistance(distance * 0.3),
      duration: estimateTravelTime(distance * 0.3),
      maneuver: 'turn-right',
    },
    {
      instruction: `Arrive at ${destination.name}`,
      distance: formatDistance(distance * 0.2),
      duration: estimateTravelTime(distance * 0.2),
      maneuver: 'arrive',
    },
  ];

  return steps;
};

// Generate route info
export const getRouteInfo = async (
  origin: Coordinates,
  destination: Coordinates,
  originLocation: NavigationLocation,
  destLocation: NavigationLocation
): Promise<RouteInfo> => {
  const distance = calculateDistance(origin, destination);
  const duration = estimateTravelTime(distance);
  const steps = generateRouteSteps(originLocation, destLocation, distance);

  // Generate a simple polyline between points
  const polyline = generateSimplePolyline(origin, destination);

  return {
    distance: formatDistance(distance),
    duration,
    steps,
    polyline,
  };
};

// Generate simple polyline between two points
const generateSimplePolyline = (origin: Coordinates, destination: Coordinates): Coordinates[] => {
  const points: Coordinates[] = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    points.push({
      lat: origin.lat + (destination.lat - origin.lat) * ratio,
      lng: origin.lng + (destination.lng - origin.lng) * ratio,
    });
  }

  return points;
};

// Fallback to external maps app
export const openExternalMaps = (destination: NavigationLocation, origin?: Coordinates) => {
  const destCoords = destination.coordinates;

  if (!destCoords) {
    // Use address-based navigation
    const address = encodeURIComponent(destination.address || destination.name);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `google.navigation:q=${address}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${address}`,
    });

    Linking.openURL(url!);
    return;
  }

  const { lat, lng } = destCoords;

  let url: string;

  if (Platform.OS === 'ios') {
    // Apple Maps
    url = origin
      ? `maps://app?saddr=${origin.lat},${origin.lng}&daddr=${lat},${lng}`
      : `maps://app?daddr=${lat},${lng}`;
  } else {
    // Google Maps
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
};

// Travel mode icons
export const TRAVEL_MODES = {
  driving: {
    icon: '🚗',
    label: 'Drive',
  },
  walking: {
    icon: '🚶',
    label: 'Walk',
  },
  transit: {
    icon: '🚇',
    label: 'Transit',
  },
  rideshare: {
    icon: '🚕',
    label: 'Rideshare',
  },
};
