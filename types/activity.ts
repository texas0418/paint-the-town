// Activity Booking Types for Paint the Town
// Integration with Viator, GetYourGuide, and Airbnb Experiences

// ============================================================================
// Providers
// ============================================================================

export type ActivityProvider = 'viator' | 'getyourguide' | 'airbnb_experiences' | 'direct';

export interface ProviderConfig {
  provider: ActivityProvider;
  name: string;
  color: string;
  logo?: string;
  apiAvailable: boolean;
}

export const ACTIVITY_PROVIDERS: Record<ActivityProvider, ProviderConfig> = {
  viator: {
    provider: 'viator',
    name: 'Viator',
    color: '#FF5533',
    apiAvailable: true,
  },
  getyourguide: {
    provider: 'getyourguide',
    name: 'GetYourGuide',
    color: '#FF0000',
    apiAvailable: true,
  },
  airbnb_experiences: {
    provider: 'airbnb_experiences',
    name: 'Airbnb Experiences',
    color: '#FF385C',
    apiAvailable: true,
  },
  direct: {
    provider: 'direct',
    name: 'Direct Booking',
    color: '#6B7280',
    apiAvailable: true,
  },
};

// ============================================================================
// Activity Types
// ============================================================================

export interface Activity {
  id: string;
  externalIds: {
    viator?: string;
    getyourguide?: string;
    airbnb?: string;
  };
  provider: ActivityProvider;

  // Basic info
  title: string;
  shortDescription: string;
  fullDescription?: string;
  highlights?: string[];

  // Category
  category: ActivityCategory;
  subcategories: string[];
  tags: string[];

  // Location
  location: {
    city: string;
    state?: string;
    country: string;
    address?: string;
    meetingPoint?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Media
  images: string[];
  thumbnailUrl?: string;
  videoUrl?: string;

  // Ratings
  rating: number;
  reviewCount: number;

  // Pricing
  pricing: ActivityPricing;

  // Duration
  duration: ActivityDuration;

  // Availability
  availableDays?: DayOfWeek[];
  nextAvailableDate?: string;

  // Details
  included?: string[];
  notIncluded?: string[];
  requirements?: string[];
  accessibility?: AccessibilityInfo;
  cancellationPolicy: CancellationPolicy;

  // Booking info
  instantConfirmation: boolean;
  mobileTicket: boolean;
  skipTheLine?: boolean;
  privateOption?: boolean;
  maxGroupSize?: number;
  minParticipants?: number;

  // Languages
  languages?: string[];

  // Special flags
  isBestseller?: boolean;
  isNew?: boolean;
  isLikelyToSellOut?: boolean;
  specialOffer?: SpecialOffer;
}

export type ActivityCategory =
  | 'tours'
  | 'attractions'
  | 'outdoor'
  | 'food_drink'
  | 'arts_culture'
  | 'classes'
  | 'wellness'
  | 'nightlife'
  | 'water_activities'
  | 'adventure'
  | 'transportation'
  | 'day_trips'
  | 'entertainment'
  | 'sports'
  | 'romantic';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ActivityPricing {
  currency: string;
  basePrice: number; // Per person
  retailPrice?: number; // Original price if discounted
  discountPercent?: number;
  priceType: 'per_person' | 'per_group' | 'per_unit';
  groupPrice?: number;
  childPrice?: number;
  infantPrice?: number;
  priceTiers?: PriceTier[];
}

export interface PriceTier {
  label: string;
  minAge?: number;
  maxAge?: number;
  price: number;
}

export interface ActivityDuration {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
  flexible?: boolean;
  displayText: string; // "2-3 hours", "Full day", etc.
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  serviceAnimalsAllowed: boolean;
  nearPublicTransit: boolean;
  infantsAllowed: boolean;
  notes?: string;
}

export interface CancellationPolicy {
  type: 'free' | 'moderate' | 'strict' | 'non_refundable';
  freeCancellationUntil?: number; // Hours before start
  description: string;
  refundPercent?: number;
}

export interface SpecialOffer {
  type: 'discount' | 'bundle' | 'early_bird' | 'last_minute';
  label: string;
  discountPercent?: number;
  validUntil?: string;
}

// ============================================================================
// Search Types
// ============================================================================

export interface ActivitySearchParams {
  // Location
  destination: string; // City or region
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number; // km

  // Date
  date?: string; // YYYY-MM-DD
  dateRange?: {
    start: string;
    end: string;
  };

  // Participants
  adults: number;
  children?: number;
  infants?: number;

  // Filters
  categories?: ActivityCategory[];
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number; // minutes
    max: number;
  };
  timeOfDay?: ('morning' | 'afternoon' | 'evening' | 'night')[];
  languages?: string[];
  features?: ActivityFeature[];
  minRating?: number;

  // Sorting
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity' | 'duration';

  // Pagination
  page?: number;
  limit?: number;

  // Provider preference
  providers?: ActivityProvider[];
}

export type ActivityFeature =
  | 'free_cancellation'
  | 'instant_confirmation'
  | 'mobile_ticket'
  | 'skip_the_line'
  | 'private_tour'
  | 'small_group'
  | 'pickup_included'
  | 'food_included'
  | 'wheelchair_accessible';

export interface ActivitySearchResult {
  activities: Activity[];
  totalCount: number;
  page: number;
  hasMore: boolean;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  priceRanges: { label: string; min: number; max: number; count: number }[];
  durations: { label: string; min: number; max: number; count: number }[];
}

// ============================================================================
// Availability & Booking Types
// ============================================================================

export interface AvailabilityRequest {
  activityId: string;
  provider: ActivityProvider;
  date: string;
  participants: {
    adults: number;
    children?: number;
    infants?: number;
  };
}

export interface AvailabilitySlot {
  id: string;
  startTime: string; // HH:mm
  endTime?: string;
  displayTime: string; // "9:00 AM"

  // Availability
  available: boolean;
  spotsLeft?: number;

  // Pricing for this slot
  pricing: {
    adultPrice: number;
    childPrice?: number;
    infantPrice?: number;
    totalPrice: number;
    currency: string;
  };

  // Options
  options?: SlotOption[];

  // Booking token
  bookingToken: string;
}

export interface SlotOption {
  id: string;
  name: string;
  description?: string;
  additionalPrice: number;
  selected?: boolean;
}

export interface AvailabilityResponse {
  activityId: string;
  date: string;
  slots: AvailabilitySlot[];
  nextAvailableDate?: string;
  message?: string;
}

// ============================================================================
// Booking Types
// ============================================================================

export interface ActivityBookingRequest {
  // Activity
  activityId: string;
  provider: ActivityProvider;

  // Slot
  slotId: string;
  bookingToken: string;
  date: string;
  startTime: string;

  // Participants
  participants: {
    adults: number;
    children?: number;
    infants?: number;
  };

  // Lead traveler
  leadTraveler: TravelerInfo;
  additionalTravelers?: TravelerInfo[];

  // Options
  selectedOptions?: string[];

  // Special requests
  specialRequests?: string;
  pickupLocation?: string;
  hotelName?: string;

  // Contact
  email: string;
  phone: string;

  // Payment
  paymentMethodId?: string;
}

export interface TravelerInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
}

export interface ActivityBooking {
  id: string;

  // External IDs
  providerBookingId: string;
  provider: ActivityProvider;

  // Status
  status: BookingStatus;

  // Activity
  activity: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    category: ActivityCategory;
    location: string;
    duration: string;
  };

  // Booking details
  date: string;
  displayDate: string;
  startTime: string;
  endTime?: string;

  // Participants
  participants: {
    adults: number;
    children?: number;
    infants?: number;
    total: number;
  };

  // Pricing
  pricing: {
    subtotal: number;
    fees?: number;
    taxes?: number;
    discount?: number;
    total: number;
    currency: string;
  };

  // Lead traveler
  leadTraveler: TravelerInfo;

  // Confirmation
  confirmationNumber: string;
  voucherUrl?: string;
  qrCode?: string;

  // Meeting info
  meetingPoint?: string;
  meetingInstructions?: string;
  pickupLocation?: string;
  pickupTime?: string;

  // Contact
  operatorPhone?: string;
  operatorEmail?: string;
  emergencyContact?: string;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;

  // Cancellation
  canCancel: boolean;
  cancelDeadline?: Date;
  refundAmount?: number;

  // Integration
  addedToItinerary?: boolean;
  itineraryId?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'refunded'
  | 'failed';

// ============================================================================
// Constants
// ============================================================================

export const ACTIVITY_CATEGORIES: { id: ActivityCategory; label: string; icon: string }[] = [
  { id: 'tours', label: 'Tours', icon: 'Map' },
  { id: 'attractions', label: 'Attractions', icon: 'Landmark' },
  { id: 'outdoor', label: 'Outdoor', icon: 'Mountain' },
  { id: 'food_drink', label: 'Food & Drink', icon: 'Utensils' },
  { id: 'arts_culture', label: 'Arts & Culture', icon: 'Palette' },
  { id: 'classes', label: 'Classes', icon: 'GraduationCap' },
  { id: 'wellness', label: 'Wellness', icon: 'Sparkles' },
  { id: 'nightlife', label: 'Nightlife', icon: 'Moon' },
  { id: 'water_activities', label: 'Water Activities', icon: 'Waves' },
  { id: 'adventure', label: 'Adventure', icon: 'Compass' },
  { id: 'day_trips', label: 'Day Trips', icon: 'Car' },
  { id: 'entertainment', label: 'Entertainment', icon: 'Ticket' },
  { id: 'romantic', label: 'Romantic', icon: 'Heart' },
];

export const FEATURE_LABELS: Record<ActivityFeature, string> = {
  free_cancellation: 'Free Cancellation',
  instant_confirmation: 'Instant Confirmation',
  mobile_ticket: 'Mobile Ticket',
  skip_the_line: 'Skip the Line',
  private_tour: 'Private Tour',
  small_group: 'Small Group',
  pickup_included: 'Hotel Pickup',
  food_included: 'Food Included',
  wheelchair_accessible: 'Wheelchair Accessible',
};

export const TIME_OF_DAY_OPTIONS = [
  { id: 'morning', label: 'Morning', description: '6 AM - 12 PM' },
  { id: 'afternoon', label: 'Afternoon', description: '12 PM - 5 PM' },
  { id: 'evening', label: 'Evening', description: '5 PM - 9 PM' },
  { id: 'night', label: 'Night', description: 'After 9 PM' },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDuration(duration: ActivityDuration): string {
  return duration.displayText;
}

export function getCategoryIcon(category: ActivityCategory): string {
  return ACTIVITY_CATEGORIES.find((c) => c.id === category)?.icon || 'Activity';
}

export function getCategoryLabel(category: ActivityCategory): string {
  return ACTIVITY_CATEGORIES.find((c) => c.id === category)?.label || category;
}

export function getProviderColor(provider: ActivityProvider): string {
  return ACTIVITY_PROVIDERS[provider]?.color || '#6B7280';
}

export function getProviderName(provider: ActivityProvider): string {
  return ACTIVITY_PROVIDERS[provider]?.name || 'Direct';
}

export function getCancellationLabel(policy: CancellationPolicy): string {
  switch (policy.type) {
    case 'free':
      return policy.freeCancellationUntil
        ? `Free cancellation up to ${policy.freeCancellationUntil}h before`
        : 'Free cancellation';
    case 'moderate':
      return 'Partial refund available';
    case 'strict':
      return 'Limited refund';
    case 'non_refundable':
      return 'Non-refundable';
  }
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    cancelled: '#EF4444',
    completed: '#6B7280',
    refunded: '#8B5CF6',
    failed: '#DC2626',
  };
  return colors[status];
}

export function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    refunded: 'Refunded',
    failed: 'Failed',
  };
  return labels[status];
}
