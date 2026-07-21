// ============================================================================
// Parking Finder Types for Paint the Town
// ============================================================================

// ============================================================================
// Core Parking Types
// ============================================================================

export interface ParkingLocation {
  id: string;
  name: string;
  type: ParkingType;
  operator?: string;

  // Location
  address: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };

  // Distance (populated during search)
  distance?: number; // miles
  distanceText?: string;
  walkingTime?: number; // minutes to destination

  // Capacity & Availability
  totalSpaces: number;
  availableSpaces?: number; // Real-time if available
  availabilityStatus: AvailabilityStatus;
  lastUpdated?: Date;

  // Pricing
  pricing: ParkingPricing;

  // Hours
  hours: ParkingHours;
  is24Hours: boolean;
  isOpen: boolean;

  // Features
  features: ParkingFeature[];

  // Ratings & Reviews
  rating?: number;
  reviewCount?: number;

  // Vehicle restrictions
  heightLimit?: number; // feet
  vehicleTypes: VehicleType[];

  // Contact & Booking
  phone?: string;
  website?: string;
  appDeepLink?: string; // For parking apps like SpotHero, ParkWhiz
  reservationUrl?: string;
  canReserve: boolean;
  reservationProvider?: ReservationProvider;

  // Images
  images?: string[];

  // Special notes
  notes?: string;
  accessInstructions?: string;
}

export type ParkingType =
  | 'garage'
  | 'surface_lot'
  | 'street'
  | 'valet'
  | 'hotel'
  | 'airport'
  | 'event';

export type AvailabilityStatus =
  | 'available' // Green - plenty of spaces
  | 'limited' // Yellow - filling up
  | 'full' // Red - no spaces
  | 'unknown'; // Gray - no real-time data

export type VehicleType = 'car' | 'suv' | 'truck' | 'motorcycle' | 'rv' | 'oversized';

export type ParkingFeature =
  | 'covered'
  | 'indoor'
  | 'outdoor'
  | 'ev_charging'
  | 'handicap_accessible'
  | 'security_cameras'
  | 'attendant'
  | 'self_park'
  | 'valet_available'
  | 'restrooms'
  | 'elevator'
  | 'well_lit'
  | 'gated'
  | 'monthly_available'
  | 'oversized_ok'
  | 'motorcycle_parking'
  | 'car_wash'
  | 'shuttle';

export type ReservationProvider =
  | 'spothero'
  | 'parkwhiz'
  | 'parkme'
  | 'bestparking'
  | 'parkopedia'
  | 'direct';

// ============================================================================
// Pricing Types
// ============================================================================

export interface ParkingPricing {
  currency: string;

  // Hourly rates
  hourlyRate?: number;
  firstHourRate?: number;
  additionalHourRate?: number;

  // Flat rates
  dailyMax?: number;
  earlyBirdRate?: number; // Before certain time
  earlyBirdEndTime?: string; // e.g., "10:00 AM"
  eveningRate?: number; // After certain time
  eveningStartTime?: string; // e.g., "5:00 PM"
  weekendRate?: number;

  // Event pricing
  eventRate?: number;

  // Validation
  validationAvailable: boolean;
  validationDiscount?: string; // e.g., "2 hours free with validation"

  // Display
  displayPrice: string; // e.g., "$5/hr" or "$25/day"
  priceCategory: PriceCategory;
}

export type PriceCategory = 'budget' | 'moderate' | 'premium' | 'valet';

// ============================================================================
// Hours Types
// ============================================================================

export interface ParkingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  holidays?: string; // Special note about holidays
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // "HH:mm"
  closeTime?: string; // "HH:mm"
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export interface ParkingSearchParams {
  // Location
  coordinates: {
    lat: number;
    lng: number;
  };
  destinationName?: string;

  // Radius
  radiusMiles: number;

  // Time
  arrivalTime?: Date;
  departureTime?: Date;
  duration?: number; // hours

  // Filters
  types?: ParkingType[];
  maxPrice?: number;
  minSpaces?: number;
  features?: ParkingFeature[];
  vehicleType?: VehicleType;
  mustBeOpen?: boolean;
  reservableOnly?: boolean;

  // Sorting
  sortBy: ParkingSortOption;
}

export type ParkingSortOption = 'distance' | 'price_low' | 'price_high' | 'availability' | 'rating';

export interface ParkingSearchResult {
  locations: ParkingLocation[];
  totalCount: number;
  searchCenter: {
    lat: number;
    lng: number;
  };
  searchRadius: number;
  timestamp: Date;
}

// ============================================================================
// Filter Options (for UI)
// ============================================================================

export interface ParkingFilterOptions {
  types: {
    id: ParkingType;
    label: string;
    icon: string;
  }[];

  priceRanges: {
    id: string;
    label: string;
    maxHourly?: number;
  }[];

  features: {
    id: ParkingFeature;
    label: string;
    icon: string;
  }[];

  sortOptions: {
    id: ParkingSortOption;
    label: string;
  }[];
}

export const PARKING_FILTER_OPTIONS: ParkingFilterOptions = {
  types: [
    { id: 'garage', label: 'Parking Garage', icon: '🏢' },
    { id: 'surface_lot', label: 'Surface Lot', icon: '🅿️' },
    { id: 'street', label: 'Street Parking', icon: '🛣️' },
    { id: 'valet', label: 'Valet', icon: '🚗' },
  ],

  priceRanges: [
    { id: 'free', label: 'Free', maxHourly: 0 },
    { id: 'budget', label: 'Under $5/hr', maxHourly: 5 },
    { id: 'moderate', label: '$5-10/hr', maxHourly: 10 },
    { id: 'any', label: 'Any Price' },
  ],

  features: [
    { id: 'covered', label: 'Covered', icon: '🏠' },
    { id: 'ev_charging', label: 'EV Charging', icon: '⚡' },
    { id: 'handicap_accessible', label: 'Accessible', icon: '♿' },
    { id: 'security_cameras', label: 'Security', icon: '📹' },
    { id: 'attendant', label: 'Attendant', icon: '👤' },
    { id: 'valet_available', label: 'Valet Available', icon: '🎩' },
  ],

  sortOptions: [
    { id: 'distance', label: 'Nearest' },
    { id: 'price_low', label: 'Price: Low to High' },
    { id: 'price_high', label: 'Price: High to Low' },
    { id: 'availability', label: 'Availability' },
    { id: 'rating', label: 'Rating' },
  ],
};

// ============================================================================
// UI Component Props
// ============================================================================

export interface ParkingFinderProps {
  destination?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  onSelectParking?: (parking: ParkingLocation) => void;
  onClose?: () => void;
}

export interface ParkingCardProps {
  parking: ParkingLocation;
  isSelected?: boolean;
  onPress?: () => void;
  onNavigate?: () => void;
  onReserve?: () => void;
  compact?: boolean;
}

export interface ParkingDetailSheetProps {
  parking: ParkingLocation | null;
  visible: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  onReserve?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

export const PARKING_TYPE_ICONS: Record<ParkingType, string> = {
  garage: '🏢',
  surface_lot: '🅿️',
  street: '🛣️',
  valet: '🚗',
  hotel: '🏨',
  airport: '✈️',
  event: '🎫',
};

export const PARKING_TYPE_LABELS: Record<ParkingType, string> = {
  garage: 'Parking Garage',
  surface_lot: 'Surface Lot',
  street: 'Street Parking',
  valet: 'Valet Parking',
  hotel: 'Hotel Parking',
  airport: 'Airport Parking',
  event: 'Event Parking',
};

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  available: '#22C55E', // Green
  limited: '#F59E0B', // Amber
  full: '#EF4444', // Red
  unknown: '#9CA3AF', // Gray
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  limited: 'Limited',
  full: 'Full',
  unknown: 'Unknown',
};

export const FEATURE_LABELS: Record<ParkingFeature, string> = {
  covered: 'Covered',
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  ev_charging: 'EV Charging',
  handicap_accessible: 'Accessible',
  security_cameras: 'Security Cameras',
  attendant: 'Attendant On-Site',
  self_park: 'Self-Park',
  valet_available: 'Valet Available',
  restrooms: 'Restrooms',
  elevator: 'Elevator',
  well_lit: 'Well-Lit',
  gated: 'Gated',
  monthly_available: 'Monthly Available',
  oversized_ok: 'Oversized OK',
  motorcycle_parking: 'Motorcycle',
  car_wash: 'Car Wash',
  shuttle: 'Shuttle Service',
};

export const FEATURE_ICONS: Record<ParkingFeature, string> = {
  covered: '🏠',
  indoor: '🏢',
  outdoor: '☀️',
  ev_charging: '⚡',
  handicap_accessible: '♿',
  security_cameras: '📹',
  attendant: '👤',
  self_park: '🚗',
  valet_available: '🎩',
  restrooms: '🚻',
  elevator: '🛗',
  well_lit: '💡',
  gated: '🚧',
  monthly_available: '📅',
  oversized_ok: '🚛',
  motorcycle_parking: '🏍️',
  car_wash: '🧽',
  shuttle: '🚐',
};
