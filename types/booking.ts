// Auto-Booking System Types for Paint the Town

// ============================================================================
// Booking Categories & Providers
// ============================================================================

export type BookingCategory =
  | 'restaurant'
  | 'concert'
  | 'theater'
  | 'movie'
  | 'flight'
  | 'hotel'
  | 'car_rental'
  | 'activity'
  | 'spa'
  | 'tour'
  | 'sports_event'
  | 'transportation'
  | 'other';

export type BookingProvider =
  // Restaurants
  | 'opentable'
  | 'resy'
  | 'yelp'
  | 'direct'
  // Entertainment
  | 'ticketmaster'
  | 'stubhub'
  | 'axs'
  | 'eventbrite'
  | 'fandango'
  // Travel
  | 'expedia'
  | 'booking_com'
  | 'airbnb'
  | 'hotels_com'
  | 'kayak'
  // Flights
  | 'google_flights'
  | 'skyscanner'
  | 'airline_direct'
  // Transportation
  | 'uber'
  | 'lyft'
  | 'enterprise'
  | 'hertz'
  // Activities
  | 'viator'
  | 'getyourguide'
  | 'airbnb_experiences'
  // Generic
  | 'manual'
  | 'phone'
  | 'email';

export type BookingStatus =
  | 'pending' // Waiting to be processed
  | 'processing' // Currently being booked
  | 'confirming' // Waiting for confirmation
  | 'confirmed' // Successfully booked
  | 'failed' // Booking failed
  | 'cancelled' // User cancelled
  | 'waitlisted' // On waitlist
  | 'requires_action' // Needs user input (e.g., select seats)
  | 'payment_required'; // Needs payment confirmation

export type PaymentStatus =
  | 'not_required'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

// ============================================================================
// Booking Request & Result
// ============================================================================

export interface BookingRequest {
  id: string;
  activityId: string;
  activityName: string;
  category: BookingCategory;
  provider: BookingProvider;
  priority: number; // 1 = highest (book first)

  // Booking details
  details: BookingDetails;

  // Payment
  estimatedCost: number;
  currency: string;
  paymentMethod?: PaymentMethodInfo;

  // Preferences
  preferences: BookingPreferences;

  // Fallbacks
  fallbackProviders?: BookingProvider[];
  allowWaitlist: boolean;
  allowAlternativeTimes: boolean;
  alternativeTimeWindow?: number; // minutes +/- from requested time
}

export interface BookingDetails {
  // Common
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration?: number; // minutes

  // Location
  venueName: string;
  venueAddress: string;
  venueId?: string; // Provider-specific ID

  // Party info
  partySize: number;
  guestNames?: string[];
  specialRequests?: string;

  // Category-specific
  restaurantDetails?: RestaurantBookingDetails;
  eventDetails?: EventBookingDetails;
  flightDetails?: FlightBookingDetails;
  hotelDetails?: HotelBookingDetails;
  carRentalDetails?: CarRentalDetails;
  activityDetails?: ActivityBookingDetails;
}

export interface RestaurantBookingDetails {
  cuisineType?: string;
  seatingPreference?: 'indoor' | 'outdoor' | 'bar' | 'private' | 'any';
  occasion?: string;
  dietaryRestrictions?: string[];
  highchair?: boolean;
  wheelchair?: boolean;
}

export interface EventBookingDetails {
  eventName: string;
  eventType: 'concert' | 'theater' | 'sports' | 'comedy' | 'other';
  performer?: string;
  seatPreference?: 'floor' | 'lower' | 'upper' | 'vip' | 'any';
  maxPricePerTicket?: number;
  accessibleSeating?: boolean;
}

export interface FlightBookingDetails {
  origin: string; // Airport code
  destination: string;
  returnDate?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  preferredAirlines?: string[];
  maxStops: number;
  baggageIncluded: boolean;
  flexibleDates: boolean;
}

export interface HotelBookingDetails {
  checkIn: string;
  checkOut: string;
  roomType: 'standard' | 'deluxe' | 'suite' | 'any';
  bedType?: 'king' | 'queen' | 'double' | 'twin' | 'any';
  amenities?: string[];
  starRating?: number;
}

export interface CarRentalDetails {
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  dropoffTime: string;
  carType: 'economy' | 'compact' | 'midsize' | 'suv' | 'luxury' | 'any';
  insuranceIncluded: boolean;
}

export interface ActivityBookingDetails {
  activityType: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any';
  equipment_included?: boolean;
  language?: string;
}

export interface BookingPreferences {
  autoConfirm: boolean; // Auto-confirm if within budget
  maxBudgetOverage: number; // Percentage over estimate allowed
  notifyOnWaitlist: boolean;
  allowPartialBooking: boolean; // Book what's available
  requireRefundable: boolean;
}

export interface PaymentMethodInfo {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

// ============================================================================
// Booking Result
// ============================================================================

export interface BookingResult {
  id: string;
  requestId: string;
  status: BookingStatus;
  provider: BookingProvider;

  // Confirmation
  confirmationNumber?: string;
  confirmationUrl?: string;

  // Actual booking details
  bookedDetails: {
    date: string;
    time: string;
    venueName: string;
    venueAddress: string;
    partySize: number;
    notes?: string;
  };

  // Payment
  paymentStatus: PaymentStatus;
  finalCost?: number;
  currency: string;
  receiptUrl?: string;

  // Tickets/vouchers
  tickets?: TicketInfo[];
  voucher?: VoucherInfo;

  // Timing
  createdAt: string;
  confirmedAt?: string;
  expiresAt?: string;

  // Issues
  error?: BookingError;
  warnings?: string[];

  // Actions needed
  requiredActions?: RequiredAction[];
}

export interface TicketInfo {
  id: string;
  type: string;
  seat?: string;
  section?: string;
  row?: string;
  barcodeUrl?: string;
  qrCodeUrl?: string;
  downloadUrl?: string;
}

export interface VoucherInfo {
  code: string;
  validFrom: string;
  validUntil: string;
  instructions: string;
  barcodeUrl?: string;
}

export interface BookingError {
  code: string;
  message: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface RequiredAction {
  type: 'select_seats' | 'confirm_payment' | 'provide_info' | 'accept_terms' | 'verify_identity';
  description: string;
  actionUrl?: string;
  deadline?: string;
}

// ============================================================================
// Booking Session
// ============================================================================

export interface BookingSession {
  id: string;
  itineraryId: string;
  itineraryName: string;

  // Status
  status: 'preparing' | 'in_progress' | 'completed' | 'failed' | 'partial' | 'cancelled';
  startedAt: string;
  completedAt?: string;

  // Requests & Results
  requests: BookingRequest[];
  results: Map<string, BookingResult>; // keyed by request ID

  // Progress
  progress: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    requiresAction: number;
  };

  // Payment summary
  paymentSummary: {
    estimatedTotal: number;
    actualTotal: number;
    currency: string;
    itemizedCosts: { name: string; cost: number }[];
  };

  // User
  userId: string;
  paymentMethodId?: string;
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  provider: BookingProvider;
  category: BookingCategory[];
  displayName: string;
  logoUrl: string;
  color: string;
  supportsInstantBooking: boolean;
  requiresAccount: boolean;
  apiAvailable: boolean;
}

export const PROVIDER_CONFIGS: Record<BookingProvider, ProviderConfig> = {
  // Restaurants
  opentable: {
    provider: 'opentable',
    category: ['restaurant'],
    displayName: 'OpenTable',
    logoUrl: 'https://example.com/opentable.png',
    color: '#DA3743',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  resy: {
    provider: 'resy',
    category: ['restaurant'],
    displayName: 'Resy',
    logoUrl: 'https://example.com/resy.png',
    color: '#C41230',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  yelp: {
    provider: 'yelp',
    category: ['restaurant', 'activity'],
    displayName: 'Yelp',
    logoUrl: 'https://example.com/yelp.png',
    color: '#FF1A1A',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: true,
  },
  // Entertainment
  ticketmaster: {
    provider: 'ticketmaster',
    category: ['concert', 'sports_event', 'theater'],
    displayName: 'Ticketmaster',
    logoUrl: 'https://example.com/ticketmaster.png',
    color: '#026CDF',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  stubhub: {
    provider: 'stubhub',
    category: ['concert', 'sports_event', 'theater'],
    displayName: 'StubHub',
    logoUrl: 'https://example.com/stubhub.png',
    color: '#3B1D5A',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  axs: {
    provider: 'axs',
    category: ['concert', 'sports_event'],
    displayName: 'AXS',
    logoUrl: 'https://example.com/axs.png',
    color: '#FF6B00',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  eventbrite: {
    provider: 'eventbrite',
    category: ['concert', 'activity', 'other'],
    displayName: 'Eventbrite',
    logoUrl: 'https://example.com/eventbrite.png',
    color: '#F05537',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  fandango: {
    provider: 'fandango',
    category: ['movie'],
    displayName: 'Fandango',
    logoUrl: 'https://example.com/fandango.png',
    color: '#FF7300',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  // Hotels
  expedia: {
    provider: 'expedia',
    category: ['hotel', 'flight', 'car_rental'],
    displayName: 'Expedia',
    logoUrl: 'https://example.com/expedia.png',
    color: '#FFCC00',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  booking_com: {
    provider: 'booking_com',
    category: ['hotel'],
    displayName: 'Booking.com',
    logoUrl: 'https://example.com/booking.png',
    color: '#003580',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  airbnb: {
    provider: 'airbnb',
    category: ['hotel', 'activity'],
    displayName: 'Airbnb',
    logoUrl: 'https://example.com/airbnb.png',
    color: '#FF5A5F',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  hotels_com: {
    provider: 'hotels_com',
    category: ['hotel'],
    displayName: 'Hotels.com',
    logoUrl: 'https://example.com/hotels.png',
    color: '#D32F2F',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  kayak: {
    provider: 'kayak',
    category: ['flight', 'hotel', 'car_rental'],
    displayName: 'Kayak',
    logoUrl: 'https://example.com/kayak.png',
    color: '#FF690F',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: true,
  },
  // Flights
  google_flights: {
    provider: 'google_flights',
    category: ['flight'],
    displayName: 'Google Flights',
    logoUrl: 'https://example.com/google-flights.png',
    color: '#4285F4',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: false,
  },
  skyscanner: {
    provider: 'skyscanner',
    category: ['flight'],
    displayName: 'Skyscanner',
    logoUrl: 'https://example.com/skyscanner.png',
    color: '#0770E3',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: true,
  },
  airline_direct: {
    provider: 'airline_direct',
    category: ['flight'],
    displayName: 'Airline Direct',
    logoUrl: 'https://example.com/airline.png',
    color: '#1A1A1A',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  // Transportation
  uber: {
    provider: 'uber',
    category: ['transportation'],
    displayName: 'Uber',
    logoUrl: 'https://example.com/uber.png',
    color: '#000000',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  lyft: {
    provider: 'lyft',
    category: ['transportation'],
    displayName: 'Lyft',
    logoUrl: 'https://example.com/lyft.png',
    color: '#FF00BF',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  enterprise: {
    provider: 'enterprise',
    category: ['car_rental'],
    displayName: 'Enterprise',
    logoUrl: 'https://example.com/enterprise.png',
    color: '#007A53',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  hertz: {
    provider: 'hertz',
    category: ['car_rental'],
    displayName: 'Hertz',
    logoUrl: 'https://example.com/hertz.png',
    color: '#FFD100',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  // Activities
  viator: {
    provider: 'viator',
    category: ['activity', 'tour'],
    displayName: 'Viator',
    logoUrl: 'https://example.com/viator.png',
    color: '#5B9F27',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  getyourguide: {
    provider: 'getyourguide',
    category: ['activity', 'tour'],
    displayName: 'GetYourGuide',
    logoUrl: 'https://example.com/gyg.png',
    color: '#FF5533',
    supportsInstantBooking: true,
    requiresAccount: false,
    apiAvailable: true,
  },
  airbnb_experiences: {
    provider: 'airbnb_experiences',
    category: ['activity', 'tour'],
    displayName: 'Airbnb Experiences',
    logoUrl: 'https://example.com/airbnb.png',
    color: '#FF5A5F',
    supportsInstantBooking: true,
    requiresAccount: true,
    apiAvailable: true,
  },
  // Manual
  direct: {
    provider: 'direct',
    category: ['restaurant', 'activity', 'other'],
    displayName: 'Direct Booking',
    logoUrl: '',
    color: '#6B7280',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: false,
  },
  manual: {
    provider: 'manual',
    category: ['restaurant', 'activity', 'other'],
    displayName: 'Manual',
    logoUrl: '',
    color: '#6B7280',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: false,
  },
  phone: {
    provider: 'phone',
    category: ['restaurant', 'activity', 'other'],
    displayName: 'Phone',
    logoUrl: '',
    color: '#6B7280',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: false,
  },
  email: {
    provider: 'email',
    category: ['restaurant', 'activity', 'other'],
    displayName: 'Email',
    logoUrl: '',
    color: '#6B7280',
    supportsInstantBooking: false,
    requiresAccount: false,
    apiAvailable: false,
  },
};

// ============================================================================
// Helpers
// ============================================================================

export function getCategoryIcon(category: BookingCategory): string {
  const icons: Record<BookingCategory, string> = {
    restaurant: 'Utensils',
    concert: 'Music',
    theater: 'Drama',
    movie: 'Film',
    flight: 'Plane',
    hotel: 'Hotel',
    car_rental: 'Car',
    activity: 'Compass',
    spa: 'Sparkles',
    tour: 'Map',
    sports_event: 'Trophy',
    transportation: 'Navigation',
    other: 'Calendar',
  };
  return icons[category];
}

export function getCategoryLabel(category: BookingCategory): string {
  const labels: Record<BookingCategory, string> = {
    restaurant: 'Restaurant',
    concert: 'Concert',
    theater: 'Theater',
    movie: 'Movie',
    flight: 'Flight',
    hotel: 'Hotel',
    car_rental: 'Car Rental',
    activity: 'Activity',
    spa: 'Spa',
    tour: 'Tour',
    sports_event: 'Sports',
    transportation: 'Transportation',
    other: 'Other',
  };
  return labels[category];
}

export function getStatusColor(status: BookingStatus): string {
  const colors: Record<BookingStatus, string> = {
    pending: '#6B7280',
    processing: '#3B82F6',
    confirming: '#8B5CF6',
    confirmed: '#10B981',
    failed: '#EF4444',
    cancelled: '#9CA3AF',
    waitlisted: '#F59E0B',
    requires_action: '#F97316',
    payment_required: '#EC4899',
  };
  return colors[status];
}

export function getStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    confirming: 'Confirming',
    confirmed: 'Confirmed',
    failed: 'Failed',
    cancelled: 'Cancelled',
    waitlisted: 'Waitlisted',
    requires_action: 'Action Needed',
    payment_required: 'Payment Required',
  };
  return labels[status];
}
