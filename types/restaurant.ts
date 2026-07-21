// Restaurant Booking Types for Paint the Town

// ============================================================================
// Booking Providers
// ============================================================================

export type ReservationProvider = 'opentable' | 'resy' | 'yelp' | 'direct';

export interface ProviderCredentials {
  provider: ReservationProvider;
  apiKey?: string;
  clientId?: string;
  isConnected: boolean;
  userToken?: string; // For user's linked account
}

// ============================================================================
// Restaurant Types
// ============================================================================

export interface Restaurant {
  id: string;
  externalIds: {
    opentable?: string;
    resy?: string;
    yelp?: string;
    google?: string;
  };

  // Basic info
  name: string;
  description?: string;
  cuisineTypes: string[];
  priceRange: 1 | 2 | 3 | 4; // $ to $$$$

  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood?: string;
  coordinates: {
    lat: number;
    lng: number;
  };

  // Contact
  phone?: string;
  website?: string;

  // Media
  photos: string[];
  coverPhoto?: string;

  // Ratings
  ratings: {
    opentable?: { score: number; reviewCount: number };
    resy?: { score: number; reviewCount: number };
    google?: { score: number; reviewCount: number };
    yelp?: { score: number; reviewCount: number };
  };
  aggregateRating?: number;

  // Features
  features: RestaurantFeature[];
  diningStyles: DiningStyle[];
  dressCode?: string;

  // Hours
  hours: OperatingHours;

  // Booking info
  acceptsReservations: boolean;
  reservationProviders: ReservationProvider[];
  walkInsOnly?: boolean;
  requiresCreditCard?: boolean;
  cancellationPolicy?: string;

  // Tags for search
  tags: string[];

  // Distance (populated during search)
  distance?: number; // miles from search location
}

export type RestaurantFeature =
  | 'outdoor_seating'
  | 'private_dining'
  | 'bar_seating'
  | 'counter_seating'
  | 'wheelchair_accessible'
  | 'parking'
  | 'valet'
  | 'wifi'
  | 'live_music'
  | 'happy_hour'
  | 'brunch'
  | 'late_night'
  | 'takeout'
  | 'delivery'
  | 'good_for_groups'
  | 'romantic'
  | 'business_dining'
  | 'dog_friendly'
  | 'vegetarian_friendly'
  | 'vegan_options'
  | 'gluten_free_options';

export type DiningStyle =
  | 'fine_dining'
  | 'casual_dining'
  | 'fast_casual'
  | 'cafe'
  | 'bar'
  | 'lounge'
  | 'bistro'
  | 'steakhouse'
  | 'seafood'
  | 'italian'
  | 'japanese'
  | 'mexican'
  | 'indian'
  | 'thai'
  | 'chinese'
  | 'french'
  | 'mediterranean'
  | 'american'
  | 'fusion';

export interface OperatingHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm
  closeTime?: string; // HH:mm
  lastSeating?: string; // HH:mm
}

// ============================================================================
// Search & Availability
// ============================================================================

export interface RestaurantSearchParams {
  // Location
  location?: {
    lat: number;
    lng: number;
  };
  city?: string;
  neighborhood?: string;
  radius?: number; // miles

  // Date/Time
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;

  // Filters
  cuisineTypes?: string[];
  priceRange?: (1 | 2 | 3 | 4)[];
  features?: RestaurantFeature[];
  diningStyles?: DiningStyle[];
  minRating?: number;

  // Sorting
  sortBy?: 'relevance' | 'rating' | 'distance' | 'price_low' | 'price_high';

  // Pagination
  page?: number;
  limit?: number;

  // Provider preference
  preferredProviders?: ReservationProvider[];
}

export interface RestaurantSearchResult {
  restaurants: RestaurantWithAvailability[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  searchId: string; // For analytics/caching
}

export interface RestaurantWithAvailability extends Restaurant {
  availability: TimeSlotGroup[];
  nextAvailable?: TimeSlot;
}

export interface TimeSlotGroup {
  provider: ReservationProvider;
  slots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  provider: ReservationProvider;
  restaurantId: string;

  dateTime: Date;
  displayTime: string; // "7:00 PM"

  partySize: number;

  // Slot details
  type: 'standard' | 'bar' | 'outdoor' | 'counter' | 'private' | 'experience';
  typeName?: string; // "Patio Dining", "Chef's Counter"

  // Pricing
  requiresDeposit: boolean;
  depositAmount?: number;
  pricePerPerson?: number; // For prix fixe or experiences

  // Availability
  isAvailable: boolean;
  spotsLeft?: number;

  // Booking token (used when confirming)
  bookingToken: string;
}

// ============================================================================
// Reservation Types
// ============================================================================

export interface ReservationRequest {
  // Slot info
  timeSlot: TimeSlot;
  restaurantId: string;

  // Guest info
  partySize: number;
  primaryGuest: GuestInfo;
  additionalGuests?: string[]; // Just names

  // Preferences
  specialRequests?: string;
  occasion?: ReservationOccasion;
  seatingPreference?: 'indoor' | 'outdoor' | 'bar' | 'any';
  highchair?: boolean;
  wheelchair?: boolean;

  // Contact
  phone: string;
  email: string;

  // Payment (if required)
  paymentMethodId?: string;

  // Opt-ins
  receiveUpdates: boolean;
  receiveMarketing: boolean;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export type ReservationOccasion =
  | 'date_night'
  | 'anniversary'
  | 'birthday'
  | 'business'
  | 'celebration'
  | 'graduation'
  | 'engagement'
  | 'wedding'
  | 'holiday'
  | 'other';

export interface Reservation {
  id: string;

  // External IDs
  providerReservationId: string;
  provider: ReservationProvider;

  // Status
  status: ReservationStatus;

  // Restaurant
  restaurant: Restaurant;

  // Details
  dateTime: Date;
  displayDate: string; // "Friday, February 14, 2025"
  displayTime: string; // "7:00 PM"
  partySize: number;

  // Guest info
  guestName: string;
  guestEmail: string;
  guestPhone: string;

  // Preferences
  specialRequests?: string;
  occasion?: ReservationOccasion;
  seatingPreference?: string;

  // Confirmation
  confirmationNumber: string;
  confirmationUrl?: string;

  // Payment
  depositPaid?: number;
  depositRefundable?: boolean;

  // Timing
  createdAt: Date;
  modifiedAt?: Date;
  cancelledAt?: Date;

  // Cancellation
  cancellationPolicy?: string;
  canCancel: boolean;
  canModify: boolean;
  cancelDeadline?: Date;

  // Integration
  addedToItinerary?: boolean;
  itineraryId?: string;
}

export type ReservationStatus =
  | 'pending' // Awaiting confirmation
  | 'confirmed' // Confirmed by restaurant
  | 'seated' // Guest has arrived
  | 'completed' // Dining completed
  | 'cancelled' // Cancelled by user
  | 'no_show' // Guest didn't show up
  | 'expired'; // Reservation time passed

// ============================================================================
// User Preferences & History
// ============================================================================

export interface DiningPreferences {
  // Favorites
  favoriteRestaurants: string[]; // Restaurant IDs
  favoriteCuisines: string[];

  // Default settings
  defaultPartySize: number;
  defaultSeatingPreference: 'indoor' | 'outdoor' | 'bar' | 'any';

  // Dietary
  dietaryRestrictions: string[];
  allergies: string[];

  // Communication
  reminderTime: number; // Hours before reservation
  receiveRecommendations: boolean;
}

export interface DiningHistory {
  reservations: Reservation[];
  visitedRestaurants: string[];
  totalReservations: number;
  totalNoShows: number;
  memberSince: Date;
}

// ============================================================================
// Constants & Helpers
// ============================================================================

export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Japanese',
  'Chinese',
  'Mexican',
  'Thai',
  'Indian',
  'French',
  'Mediterranean',
  'Korean',
  'Vietnamese',
  'Spanish',
  'Greek',
  'Middle Eastern',
  'Brazilian',
  'Peruvian',
  'Caribbean',
  'Soul Food',
  'Southern',
  'BBQ',
  'Seafood',
  'Steakhouse',
  'Sushi',
  'Pizza',
  'Tapas',
  'Farm-to-Table',
  'Vegetarian',
  'Vegan',
  'Fusion',
];

export const OCCASION_LABELS: Record<ReservationOccasion, string> = {
  date_night: 'Date Night',
  anniversary: 'Anniversary',
  birthday: 'Birthday',
  business: 'Business Meal',
  celebration: 'Celebration',
  graduation: 'Graduation',
  engagement: 'Engagement',
  wedding: 'Wedding',
  holiday: 'Holiday',
  other: 'Other',
};

export const FEATURE_LABELS: Record<RestaurantFeature, string> = {
  outdoor_seating: 'Outdoor Seating',
  private_dining: 'Private Dining',
  bar_seating: 'Bar Seating',
  counter_seating: 'Counter Seating',
  wheelchair_accessible: 'Wheelchair Accessible',
  parking: 'Parking',
  valet: 'Valet Parking',
  wifi: 'Free WiFi',
  live_music: 'Live Music',
  happy_hour: 'Happy Hour',
  brunch: 'Brunch',
  late_night: 'Late Night',
  takeout: 'Takeout',
  delivery: 'Delivery',
  good_for_groups: 'Good for Groups',
  romantic: 'Romantic',
  business_dining: 'Business Dining',
  dog_friendly: 'Dog Friendly',
  vegetarian_friendly: 'Vegetarian Friendly',
  vegan_options: 'Vegan Options',
  gluten_free_options: 'Gluten-Free Options',
};

export function formatPriceRange(range: 1 | 2 | 3 | 4): string {
  return '$'.repeat(range);
}

export function getProviderColor(provider: ReservationProvider): string {
  const colors: Record<ReservationProvider, string> = {
    opentable: '#DA3743',
    resy: '#C41230',
    yelp: '#FF1A1A',
    direct: '#6B7280',
  };
  return colors[provider];
}

export function getProviderName(provider: ReservationProvider): string {
  const names: Record<ReservationProvider, string> = {
    opentable: 'OpenTable',
    resy: 'Resy',
    yelp: 'Yelp',
    direct: 'Direct',
  };
  return names[provider];
}

export function getStatusColor(status: ReservationStatus): string {
  const colors: Record<ReservationStatus, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    seated: '#3B82F6',
    completed: '#6B7280',
    cancelled: '#EF4444',
    no_show: '#DC2626',
    expired: '#9CA3AF',
  };
  return colors[status];
}

export function getStatusLabel(status: ReservationStatus): string {
  const labels: Record<ReservationStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    seated: 'Seated',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    expired: 'Expired',
  };
  return labels[status];
}
