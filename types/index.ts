/* eslint-disable max-lines -- tracked in #1 */
export interface TravelPreference {
  id: string;
  name: string;
  icon: string;
  selected: boolean;
}

export interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface BudgetRange {
  id: string;
  label: string;
  min: number;
  max: number | null;
  icon: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  avgPrice: number;
  currency: string;
  bestSeason: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  accessibility?: AccessibilityInfo;
  sustainabilityScore?: number;
}

export interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  hearingAssistance: boolean;
  visualAssistance: boolean;
  mobilitySupport: boolean;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  image: string;
  duration: string;
  price: number;
  currency: string;
  category: string;
  rating: number;
  time: string;
  location: string;
  isBooked: boolean;
  bookingId?: string;
  accessibility?: AccessibilityInfo;
  ecoFriendly?: boolean;
}

export interface DayItinerary {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: 'organizer' | 'member';
  preferences: string[];
  hasAccepted: boolean;
}

export interface GroupVote {
  id: string;
  activityId: string;
  activityName: string;
  votes: { memberId: string; vote: 'yes' | 'no' | 'maybe' }[];
  deadline: string;
  status: 'active' | 'completed';
}

export interface TripGroup {
  id: string;
  name: string;
  members: GroupMember[];
  votes: GroupVote[];
  chatEnabled: boolean;
  budgetPool?: number;
  splitMethod: 'equal' | 'custom';
}

export interface Trip {
  id: string;
  destination: Destination;
  startDate: string;
  endDate: string;
  status: 'planning' | 'upcoming' | 'ongoing' | 'completed';
  totalBudget: number;
  spentBudget: number;
  currency: string;
  travelers: number;
  itinerary: DayItinerary[];
  coverImage: string;
  bookings?: Booking[];
  group?: TripGroup;
  isDateMode?: boolean;
  expenses?: Expense[];
  carbonFootprint?: number;
  photos?: TripPhoto[];
  notes?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport' | 'insurance' | 'event';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  name: string;
  description: string;
  image?: string;
  startDate: string;
  endDate?: string;
  time?: string;
  location: string;
  price: number;
  currency: string;
  confirmationCode?: string;
  provider?: string;
  details?: FlightDetails | HotelDetails | RestaurantDetails | TransportDetails | EventDetails;
}

export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
  };
  class: 'economy' | 'business' | 'first';
  baggage?: string;
}

export interface HotelDetails {
  checkIn: string;
  checkOut: string;
  roomType: string;
  amenities: string[];
  address: string;
  phone?: string;
}

export interface RestaurantDetails {
  cuisine: string;
  reservationTime: string;
  partySize: number;
  specialRequests?: string;
  phone?: string;
}

export interface TransportDetails {
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  driverName?: string;
  driverPhone?: string;
  licensePlate?: string;
}

export interface Expense {
  id: string;
  tripId: string;
  category: 'food' | 'transport' | 'accommodation' | 'activities' | 'shopping' | 'other';
  amount: number;
  currency: string;
  description: string;
  date: string;
  paidBy?: string;
  splitWith?: string[];
  receipt?: string;
}

export interface TripPhoto {
  id: string;
  uri: string;
  date: string;
  location?: string;
  activityId?: string;
  caption?: string;
}

export interface Notification {
  id: string;
  type: 'booking' | 'reminder' | 'alert' | 'group' | 'reward' | 'promo';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  tripId?: string;
  bookingId?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'creditCard' | 'other';
  memberId: string;
  points: number;
  tier?: string;
  icon?: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'upgrade' | 'freebie' | 'experience';
  image?: string;
  expiryDate?: string;
  isRedeemed: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  travelStyle: string;
  budgetRange: string;
  preferences: string[];
  tripsCompleted: number;
  countriesVisited: number;
  memberSince: string;
  loyaltyPrograms?: LoyaltyProgram[];
  rewardPoints: number;
  subscriptionTier: 'free' | 'standard' | 'premium' | 'family';
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  emergencyContacts?: EmergencyContact[];
  languagePreference?: string;
  carbonOffsetEnabled?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export interface FoodPreference {
  id: string;
  name: string;
  icon: string;
  emoji: string;
}

export interface OnboardingData {
  travelStyle: string | null;
  budgetRange: string | null;
  preferences: string[];
  foodPreferences: string[];
}

export interface DatePlanIdea {
  id: string;
  name: string;
  description: string;
  category: 'romantic' | 'adventure' | 'cultural' | 'foodie' | 'relaxation';
  duration: string;
  priceRange: string;
  image: string;
  activities: string[];
  surpriseEnabled?: boolean;
}

export interface WeatherAlert {
  id: string;
  location: string;
  type: 'rain' | 'storm' | 'heat' | 'cold' | 'snow';
  severity: 'low' | 'medium' | 'high';
  message: string;
  startTime: string;
  endTime: string;
  alternativeActivities?: string[];
}

export interface TravelInsurance {
  id: string;
  provider: string;
  policyNumber: string;
  coverageType: 'basic' | 'standard' | 'comprehensive';
  startDate: string;
  endDate: string;
  emergencyPhone: string;
  coveredItems: string[];
  claimUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'standard' | 'premium' | 'family';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  maxTrips?: number;
  maxGroupSize?: number;
  prioritySupport: boolean;
  adsEnabled: boolean;
  conciergeAccess: boolean;
  insuranceIncluded: boolean;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'itinerary' | 'vote';
  attachmentId?: string;
}

export interface LocalInsiderTip {
  id: string;
  destinationId: string;
  title: string;
  description: string;
  category: 'food' | 'activity' | 'transport' | 'safety' | 'culture';
  author: string;
  authorImage?: string;
  rating: number;
  image?: string;
}

export interface CarbonFootprint {
  tripId: string;
  flights: number;
  accommodation: number;
  transport: number;
  activities: number;
  total: number;
  offsetCost: number;
  isOffset: boolean;
}

export interface BucketListItem {
  id: string;
  destinationId: string;
  destination: Destination;
  addedAt: string;
  targetDate?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  estimatedBudget?: number;
  savingsGoal?: number;
  currentSavings?: number;
  isVisited: boolean;
  visitedDate?: string;
  tags?: string[];
}

export interface LocalExperience {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: 'tours' | 'classes' | 'food_drink' | 'adventure' | 'wellness' | 'art_culture';
  image: string;
  images: string[];
  price: number;
  currency: string;
  duration: string;
  groupSize: { min: number; max: number };
  rating: number;
  reviewCount: number;
  host: ExperienceHost;
  location: {
    city: string;
    country: string;
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  included: string[];
  notIncluded: string[];
  requirements?: string[];
  languages: string[];
  availability: ExperienceAvailability[];
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  instantBook: boolean;
  featured: boolean;
  tags: string[];
}

export interface ExperienceHost {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: string;
  yearsHosting: number;
  verified: boolean;
  superhost: boolean;
}

export interface ExperienceAvailability {
  date: string;
  times: string[];
  spotsLeft: number;
}

export interface ExperienceReview {
  id: string;
  experienceId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export interface ExperienceBooking {
  id: string;
  experienceId: string;
  experience: LocalExperience;
  date: string;
  time: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  bookedAt: string;
  specialRequests?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  priceRange: 1 | 2 | 3 | 4;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  website?: string;
  hours: RestaurantHours;
  features: string[];
  dietaryOptions: string[];
  dressCode?: string;
  reservationRequired: boolean;
  instantBook: boolean;
  popularDishes: string[];
  averagePrice: number;
  currency: string;
  coordinates?: { lat: number; lng: number };
  featured: boolean;
  michelinStars?: number;
}

export interface RestaurantHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface RestaurantReview {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
  helpful: number;
}

export interface RestaurantReservation {
  id: string;
  restaurantId: string;
  restaurant: Restaurant;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  bookedAt: string;
  specialRequests?: string;
  occasion?: string;
  confirmationCode?: string;
}

export interface WeatherCondition {
  id: string;
  type: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'windy' | 'foggy';
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  precipitation: number;
  description: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  hourlyForecast: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  condition: WeatherCondition['type'];
  precipitation: number;
}

export interface WeatherActivity {
  id: string;
  name: string;
  description: string;
  category: 'outdoor' | 'indoor' | 'water' | 'cultural' | 'adventure' | 'relaxation';
  image: string;
  duration: string;
  suitableWeather: WeatherCondition['type'][];
  unsuitableWeather: WeatherCondition['type'][];
  minTemp?: number;
  maxTemp?: number;
  price: number;
  currency: string;
  rating: number;
  location: string;
  timeSlots: string[];
}

export interface WeatherItinerary {
  id: string;
  tripId?: string;
  destination: string;
  startDate: string;
  endDate: string;
  forecasts: DailyForecast[];
  suggestedActivities: {
    date: string;
    activities: WeatherActivity[];
    alternativeActivities: WeatherActivity[];
  }[];
  weatherAlerts: WeatherAlertItem[];
}

export interface WeatherAlertItem {
  id: string;
  type: 'rain' | 'storm' | 'heat' | 'cold' | 'snow' | 'wind' | 'uv';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  date: string;
  affectedActivities: string[];
}

export interface PhotoJournalEntry {
  id: string;
  tripId?: string;
  tripName?: string;
  imageUri: string;
  caption: string;
  note: string;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  date: string;
  tags: string[];
  isFavorite: boolean;
  weather?: string;
  mood?: 'happy' | 'excited' | 'relaxed' | 'adventurous' | 'romantic' | 'peaceful';
}

export interface PhotoJournal {
  entries: PhotoJournalEntry[];
  totalPhotos: number;
  totalLocations: number;
  tripsDocumented: number;
}

export interface FeedUser {
  id: string;
  name: string;
  avatar: string;
  username: string;
  isFollowing: boolean;
  isVerified?: boolean;
}

export interface FeedComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface FeedPost {
  id: string;
  user: FeedUser;
  type: 'trip' | 'photo' | 'tip' | 'milestone';
  destination: string;
  country: string;
  images: string[];
  caption: string;
  likes: number;
  comments: FeedComment[];
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  tripDates?: {
    start: string;
    end: string;
  };
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

export interface SafetyAlert {
  id: string;
  type:
    | 'advisory'
    | 'emergency'
    | 'protest'
    | 'natural_disaster'
    | 'health'
    | 'crime'
    | 'terrorism';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    city?: string;
    country: string;
    region?: string;
    coordinates?: { lat: number; lng: number };
  };
  issuedAt: string;
  updatedAt: string;
  expiresAt?: string;
  source: string;
  affectedAreas: string[];
  recommendations: string[];
  isActive: boolean;
  isRead: boolean;
  relatedTripId?: string;
}

export interface SafetySubscription {
  id: string;
  country: string;
  city?: string;
  isActive: boolean;
  notificationsEnabled: boolean;
}

export interface EmergencyService {
  id: string;
  country: string;
  police: string;
  ambulance: string;
  fire: string;
  tourist: string;
  embassy?: string;
}

export interface TravelDocument {
  id: string;
  type:
    | 'passport'
    | 'visa'
    | 'insurance'
    | 'boarding_pass'
    | 'vaccination'
    | 'drivers_license'
    | 'id_card'
    | 'other';
  name: string;
  documentNumber?: string;
  issuingCountry?: string;
  issueDate?: string;
  expiryDate?: string;
  imageUri?: string;
  notes?: string;
  tripId?: string;
  isExpiringSoon?: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PassportDocument extends TravelDocument {
  type: 'passport';
  firstName: string;
  lastName: string;
  nationality: string;
  birthDate?: string;
  placeOfBirth?: string;
  sex?: 'M' | 'F' | 'X';
}

export interface VisaDocument extends TravelDocument {
  type: 'visa';
  visaType: 'tourist' | 'business' | 'work' | 'student' | 'transit' | 'other';
  destinationCountry: string;
  entries: 'single' | 'double' | 'multiple';
  duration?: string;
}

export interface InsuranceDocument extends TravelDocument {
  type: 'insurance';
  provider: string;
  policyNumber: string;
  coverageType: string;
  emergencyPhone?: string;
  coveredPersons?: string[];
}

export interface BoardingPassDocument extends TravelDocument {
  type: 'boarding_pass';
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  seat?: string;
  gate?: string;
  boardingGroup?: string;
  confirmationCode?: string;
}

export interface VaccinationDocument extends TravelDocument {
  type: 'vaccination';
  vaccineName: string;
  manufacturer?: string;
  doseNumber?: number;
  totalDoses?: number;
  administeredBy?: string;
  lotNumber?: string;
}

// Event & Entertainment Types
export type EventCategory =
  | 'concert'
  | 'theater'
  | 'sports'
  | 'comedy'
  | 'festival'
  | 'exhibition'
  | 'cinema'
  | 'opera'
  | 'ballet'
  | 'musical'
  | 'conference'
  | 'workshop';

export interface EventVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  coordinates?: { lat: number; lng: number };
  amenities: string[];
  parkingAvailable: boolean;
  accessibilityFeatures: string[];
  images: string[];
}

export interface EventPerformer {
  id: string;
  name: string;
  type: 'artist' | 'band' | 'team' | 'speaker' | 'company' | 'troupe';
  image: string;
  genre?: string;
  bio?: string;
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    spotify?: string;
  };
}

export interface EventTicketTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  available: number;
  maxPerOrder: number;
  benefits: string[];
  section?: string;
  row?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  subcategory?: string;
  image: string;
  images: string[];
  venue: EventVenue;
  performers: EventPerformer[];
  startDateTime: string;
  endDateTime?: string;
  doorsOpen?: string;
  ticketTiers: EventTicketTier[];
  minPrice: number;
  maxPrice: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  ageRestriction?: string;
  dressCode?: string;
  tags: string[];
  isSoldOut: boolean;
  isFeatured: boolean;
  refundPolicy: 'full' | 'partial' | 'none';
  provider: EventProvider;
}

export interface EventProvider {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface EventDetails {
  eventId: string;
  category: EventCategory;
  venue: {
    name: string;
    address: string;
    city: string;
  };
  performers: string[];
  ticketTier: string;
  section?: string;
  row?: string;
  seat?: string;
  doorsOpen?: string;
  ageRestriction?: string;
  barcode?: string;
  transferable: boolean;
}

export interface EventBooking {
  id: string;
  eventId: string;
  event: Event;
  tickets: {
    tierId: string;
    tierName: string;
    quantity: number;
    price: number;
    section?: string;
    row?: string;
    seats?: string[];
  }[];
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  bookedAt: string;
  confirmationCode: string;
  barcode?: string;
  transferable: boolean;
  attendees?: {
    name: string;
    email?: string;
  }[];
}

export interface EventReview {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  photos?: string[];
}

// Sports-specific types
export interface SportsEvent extends Event {
  category: 'sports';
  sportType:
    | 'football'
    | 'basketball'
    | 'baseball'
    | 'soccer'
    | 'hockey'
    | 'tennis'
    | 'golf'
    | 'boxing'
    | 'mma'
    | 'racing'
    | 'other';
  homeTeam?: EventPerformer;
  awayTeam?: EventPerformer;
  league?: string;
  season?: string;
}

// Concert-specific types
export interface ConcertEvent extends Event {
  category: 'concert';
  genre: string;
  tourName?: string;
  openingActs?: EventPerformer[];
  setlistPreview?: string[];
}

// Theater-specific types
export interface TheaterEvent extends Event {
  category: 'theater' | 'musical' | 'opera' | 'ballet';
  playwright?: string;
  director?: string;
  runtime?: string;
  intermissions?: number;
  language?: string;
  subtitles?: string[];
}

// Festival-specific types
export interface FestivalEvent extends Event {
  category: 'festival';
  festivalType: 'music' | 'food' | 'film' | 'art' | 'cultural' | 'tech';
  lineup: EventPerformer[];
  stages?: string[];
  campingAvailable?: boolean;
  multiDay: boolean;
  dayPasses: boolean;
}

// Search & Filter types for events
export interface EventSearchFilters {
  query?: string;
  categories?: EventCategory[];
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  location?: {
    city?: string;
    country?: string;
    radius?: number;
    coordinates?: { lat: number; lng: number };
  };
  performers?: string[];
  venues?: string[];
  sortBy?: 'date' | 'price' | 'popularity' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

// Lodging Types
export type LodgingType =
  | 'hotel'
  | 'airbnb'
  | 'hostel'
  | 'resort'
  | 'villa'
  | 'apartment'
  | 'boutique'
  | 'motel'
  | 'guesthouse'
  | 'cabin';

export interface LodgingAmenity {
  id: string;
  name: string;
  icon: string;
  category: 'essential' | 'comfort' | 'entertainment' | 'safety' | 'accessibility';
}

export interface LodgingHost {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  responseRate: number;
  responseTime: string;
  isSuperhost: boolean;
  joinedYear: number;
  languages: string[];
  bio?: string;
}

export interface LodgingRoom {
  id: string;
  name: string;
  description: string;
  bedType: string;
  beds: number;
  maxGuests: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm';
  images: string[];
  pricePerNight: number;
  originalPrice?: number;
  currency: string;
  amenities: string[];
  available: boolean;
  quantity: number;
}

export interface LodgingPolicy {
  checkIn: { from: string; to: string };
  checkOut: { from: string; to: string };
  cancellation: 'free' | 'flexible' | 'moderate' | 'strict' | 'non_refundable';
  cancellationDetails?: string;
  houseRules: string[];
  petPolicy: 'allowed' | 'not_allowed' | 'on_request';
  smokingPolicy: 'allowed' | 'not_allowed' | 'designated_areas';
  childPolicy: 'welcome' | 'not_suitable' | 'on_request';
  minimumStay?: number;
  maximumStay?: number;
}

export interface LodgingProvider {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface Lodging {
  id: string;
  name: string;
  type: LodgingType;
  description: string;
  shortDescription: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  starRating?: number;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    neighborhood?: string;
    distanceToCenter?: string;
  };
  rooms: LodgingRoom[];
  amenities: string[];
  featuredAmenities: string[];
  policies: LodgingPolicy;
  host?: LodgingHost;
  provider: LodgingProvider;
  minPrice: number;
  maxPrice: number;
  currency: string;
  instantBook: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sustainabilityBadge?: boolean;
  tags: string[];
  languages: string[];
  nearbyAttractions?: { name: string; distance: string }[];
}

export interface LodgingReview {
  id: string;
  lodgingId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userCountry?: string;
  rating: number;
  categories?: {
    cleanliness?: number;
    accuracy?: number;
    checkIn?: number;
    communication?: number;
    location?: number;
    value?: number;
  };
  comment: string;
  date: string;
  stayDate?: string;
  roomType?: string;
  tripType?: 'business' | 'leisure' | 'family' | 'solo' | 'couple';
  helpful: number;
  photos?: string[];
  response?: {
    from: string;
    message: string;
    date: string;
  };
}

export interface LodgingBooking {
  id: string;
  lodgingId: string;
  lodging: Lodging;
  roomId: string;
  room: LodgingRoom;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: {
    adults: number;
    children: number;
    infants?: number;
  };
  totalPrice: number;
  priceBreakdown: {
    roomRate: number;
    taxes: number;
    fees: number;
    discount?: number;
  };
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  bookedAt: string;
  confirmationCode: string;
  specialRequests?: string;
  guestDetails?: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod?: string;
}

export interface LodgingSearchFilters {
  query?: string;
  types?: LodgingType[];
  dateRange?: {
    checkIn: string;
    checkOut: string;
  };
  guests?: {
    adults: number;
    children: number;
    rooms: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  starRating?: number[];
  amenities?: string[];
  location?: {
    city?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
    radius?: number;
  };
  instantBook?: boolean;
  freeCancellation?: boolean;
  sortBy?: 'price' | 'rating' | 'distance' | 'popularity' | 'newest';
  sortOrder?: 'asc' | 'desc';
}

// Car Rental Types
export type CarCategory =
  | 'economy'
  | 'compact'
  | 'midsize'
  | 'fullsize'
  | 'suv'
  | 'luxury'
  | 'convertible'
  | 'minivan'
  | 'pickup'
  | 'electric';

export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';

export type TransmissionType = 'automatic' | 'manual';

export interface CarRentalProvider {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  supportEmail?: string;
  supportPhone?: string;
  rating: number;
  reviewCount: number;
}

export interface CarFeature {
  id: string;
  name: string;
  icon: string;
  included: boolean;
  price?: number;
}

export interface CarInsuranceOption {
  id: string;
  name: string;
  description: string;
  coverage: string[];
  pricePerDay: number;
  recommended: boolean;
}

export interface CarRentalLocation {
  id: string;
  name: string;
  type: 'airport' | 'city' | 'hotel' | 'train_station';
  address: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  hours: {
    weekday: string;
    weekend: string;
  };
  afterHoursPickup: boolean;
}

export interface RentalCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: CarCategory;
  image: string;
  images: string[];
  seats: number;
  doors: number;
  luggage: {
    large: number;
    small: number;
  };
  transmission: TransmissionType;
  fuelType: FuelType;
  fuelPolicy: 'full_to_full' | 'prepaid' | 'pay_on_return';
  mileage: 'unlimited' | number;
  features: string[];
  provider: CarRentalProvider;
  pickupLocation: CarRentalLocation;
  dropoffLocation: CarRentalLocation;
  pricePerDay: number;
  originalPrice?: number;
  totalPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  freeCancellation: boolean;
  cancellationDeadline?: string;
  instantConfirmation: boolean;
  deposit: number;
  minimumAge: number;
  insuranceOptions: CarInsuranceOption[];
  extras: CarExtra[];
  policies: CarRentalPolicies;
  isFeatured: boolean;
  isElectric: boolean;
  co2Emission?: number;
  tags: string[];
}

export interface CarExtra {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  maxQuantity: number;
  icon: string;
}

export interface CarRentalPolicies {
  minimumRentalDays: number;
  maximumRentalDays: number;
  youngDriverFee?: { age: number; feePerDay: number };
  additionalDriverFee?: number;
  crossBorderAllowed: boolean;
  crossBorderFee?: number;
  oneWayAllowed: boolean;
  oneWayFee?: number;
  fuelPolicy: string;
  mileagePolicy: string;
  lateFee?: number;
}

export interface CarRentalBooking {
  id: string;
  carId: string;
  car: RentalCar;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupLocation: CarRentalLocation;
  dropoffLocation: CarRentalLocation;
  days: number;
  drivers: {
    primary: {
      name: string;
      email: string;
      phone: string;
      licenseNumber: string;
      licenseCountry: string;
      age: number;
    };
    additional?: {
      name: string;
      licenseNumber: string;
    }[];
  };
  insurance?: CarInsuranceOption;
  extras: { extra: CarExtra; quantity: number }[];
  priceBreakdown: {
    baseRate: number;
    insurance: number;
    extras: number;
    taxes: number;
    fees: number;
    discount?: number;
  };
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  bookedAt: string;
  confirmationCode: string;
  flightNumber?: string;
  specialRequests?: string;
}

export interface CarRentalReview {
  id: string;
  carId: string;
  providerId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  categories?: {
    vehicle: number;
    service: number;
    value: number;
    cleanliness: number;
  };
  comment: string;
  date: string;
  rentalDate: string;
  carCategory: CarCategory;
  helpful: number;
  photos?: string[];
}

export interface CarRentalSearchFilters {
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  dropoffDate?: string;
  dropoffTime?: string;
  categories?: CarCategory[];
  transmission?: TransmissionType[];
  fuelType?: FuelType[];
  priceRange?: { min: number; max: number };
  providers?: string[];
  features?: string[];
  freeCancellation?: boolean;
  unlimitedMileage?: boolean;
  electricOnly?: boolean;
  sortBy?: 'price' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Public Transit Types
export type TransitType = 'metro' | 'bus' | 'tram' | 'ferry' | 'commuter_rail' | 'light_rail';

export interface TransitCity {
  id: string;
  name: string;
  country: string;
  image: string;
  transitAuthority: string;
  website?: string;
  currency: string;
  timezone: string;
  hasMetro: boolean;
  hasBus: boolean;
  hasTram: boolean;
  hasFerry: boolean;
  hasCommuterRail: boolean;
}

export interface TransitLine {
  id: string;
  cityId: string;
  name: string;
  shortName: string;
  type: TransitType;
  color: string;
  textColor: string;
  stations: TransitStation[];
  frequency: string;
  operatingHours: {
    weekday: { start: string; end: string };
    weekend: { start: string; end: string };
  };
  isExpress?: boolean;
  isNightService?: boolean;
}

export interface TransitStation {
  id: string;
  name: string;
  code?: string;
  coordinates?: { lat: number; lng: number };
  lines: string[];
  amenities: string[];
  isAccessible: boolean;
  isHub: boolean;
  zone?: number;
  exits?: string[];
}

export interface TransitPass {
  id: string;
  cityId: string;
  name: string;
  description: string;
  type: 'single' | 'day' | 'multi_day' | 'weekly' | 'monthly' | 'tourist';
  duration?: string;
  validDays?: number;
  zones: string;
  price: number;
  originalPrice?: number;
  currency: string;
  includes: string[];
  restrictions?: string[];
  isPopular: boolean;
  isTouristFriendly: boolean;
  validTransitTypes: TransitType[];
  activationType: 'immediate' | 'first_use' | 'selected_date';
}

export interface TransitRoute {
  id: string;
  origin: TransitStation;
  destination: TransitStation;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  transfers: number;
  fare: number;
  currency: string;
  legs: TransitRouteLeg[];
  isAccessible: boolean;
  isFastest: boolean;
  isFewestTransfers: boolean;
}

export interface TransitRouteLeg {
  id: string;
  type: TransitType | 'walk';
  line?: TransitLine;
  lineColor?: string;
  lineName?: string;
  origin: { name: string; time: string };
  destination: { name: string; time: string };
  duration: number;
  stops?: number;
  distance?: string;
  instructions?: string;
  platform?: string;
}

export interface TransitSchedule {
  lineId: string;
  stationId: string;
  direction: string;
  arrivals: {
    time: string;
    destination: string;
    isDelayed: boolean;
    delayMinutes?: number;
    platform?: string;
    isLive: boolean;
  }[];
}

export interface TransitPassPurchase {
  id: string;
  passId: string;
  pass: TransitPass;
  purchaseDate: string;
  activationDate?: string;
  expiryDate?: string;
  status: 'active' | 'pending' | 'expired' | 'used';
  qrCode?: string;
  confirmationCode: string;
  price: number;
  currency: string;
}

export interface TransitSearchFilters {
  cityId?: string;
  transitTypes?: TransitType[];
  accessible?: boolean;
  preferFewerTransfers?: boolean;
  departureTime?: string;
  arrivalTime?: string;
}

// Live Trip Sharing Types
export interface LiveSharingContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  relationship: 'family' | 'friend' | 'emergency' | 'other';
  isActive: boolean;
  canSeeLocation: boolean;
  canSeeItinerary: boolean;
  notifyOnArrival: boolean;
  notifyOnDeparture: boolean;
  addedAt: string;
}

export interface LocationUpdate {
  id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  city?: string;
  country?: string;
  batteryLevel?: number;
}

export interface SafetyCheckIn {
  id: string;
  sessionId: string;
  timestamp: string;
  status: 'safe' | 'need_help' | 'emergency';
  message?: string;
  location?: LocationUpdate;
  acknowledgedBy?: string[];
}

export interface LiveSharingSession {
  id: string;
  tripId?: string;
  tripName?: string;
  status: 'active' | 'paused' | 'ended';
  startedAt: string;
  endedAt?: string;
  expiresAt?: string;
  shareLink?: string;
  contacts: LiveSharingContact[];
  currentLocation?: LocationUpdate;
  locationHistory: LocationUpdate[];
  checkIns: SafetyCheckIn[];
  settings: LiveSharingSettings;
  lastUpdated: string;
}

export interface LiveSharingSettings {
  updateFrequency: 'realtime' | 'every_5_min' | 'every_15_min' | 'every_30_min' | 'hourly';
  shareSpeed: boolean;
  shareBattery: boolean;
  shareItinerary: boolean;
  autoCheckInInterval?: number;
  lowBatteryAlert: boolean;
  lowBatteryThreshold: number;
  geofenceAlerts: boolean;
  nightModeEnabled: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
}

export interface Geofence {
  id: string;
  sessionId: string;
  name: string;
  type: 'hotel' | 'airport' | 'attraction' | 'custom';
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
  isActive: boolean;
}

export interface EmergencyAlert {
  id: string;
  sessionId: string;
  type: 'sos' | 'medical' | 'security' | 'accident' | 'other';
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: string;
  location: LocationUpdate;
  message?: string;
  respondedBy?: {
    contactId: string;
    contactName: string;
    respondedAt: string;
  }[];
  resolvedAt?: string;
  resolvedBy?: string;
}

// Trip Templates Types
export type TripTemplateCategory =
  | 'romantic'
  | 'adventure'
  | 'family'
  | 'cultural'
  | 'relaxation'
  | 'foodie'
  | 'budget'
  | 'luxury'
  | 'solo'
  | 'accessible';

export interface TemplateActivity {
  id: string;
  name: string;
  description: string;
  duration: string;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'flexible';
  category: string;
  estimatedCost: number;
  currency: string;
  isOptional: boolean;
  accessibilityFeatures?: string[];
  alternativeOptions?: string[];
}

export interface TemplateDayPlan {
  day: number;
  theme: string;
  activities: TemplateActivity[];
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  tips?: string[];
}

export interface TripTemplate {
  id: string;
  name: string;
  destination: Destination;
  description: string;
  shortDescription: string;
  category: TripTemplateCategory;
  tags: string[];
  image: string;
  images: string[];
  duration: number;
  durationUnit: 'days' | 'weeks';
  estimatedBudget: {
    min: number;
    max: number;
    currency: string;
  };
  bestFor: string[];
  bestSeason: string;
  dayPlans: TemplateDayPlan[];
  highlights: string[];
  included: string[];
  notIncluded: string[];
  packingEssentials: string[];
  localTips: string[];
  accessibilityScore: number;
  accessibilityFeatures: string[];
  rating: number;
  reviewCount: number;
  usageCount: number;
  isFeatured: boolean;
  isNew: boolean;
  createdBy: 'official' | 'community';
  author?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
  tripDate?: string;
  photos?: string[];
  helpful: number;
}

export interface TemplateSearchFilters {
  query?: string;
  categories?: TripTemplateCategory[];
  destinations?: string[];
  duration?: { min: number; max: number };
  budget?: { min: number; max: number };
  accessibilityFeatures?: string[];
  sortBy?: 'rating' | 'popularity' | 'newest' | 'budget';
  sortOrder?: 'asc' | 'desc';
}

// Accessibility Settings Types
// AR City Guide Types
export interface ARLandmark {
  id: string;
  name: string;
  type:
    | 'monument'
    | 'museum'
    | 'church'
    | 'palace'
    | 'bridge'
    | 'square'
    | 'park'
    | 'tower'
    | 'statue'
    | 'theater'
    | 'fountain'
    | 'gate';
  description: string;
  shortDescription: string;
  image: string;
  images: string[];
  coordinates: { lat: number; lng: number };
  city: string;
  country: string;
  yearBuilt?: string;
  architect?: string;
  style?: string;
  facts: string[];
  audioGuideAvailable: boolean;
  visitDuration: string;
  entryFee?: { amount: number; currency: string };
  openingHours?: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  bearing?: number;
  tags: string[];
  accessibility: {
    wheelchairAccessible: boolean;
    audioDescription: boolean;
    signLanguageTours: boolean;
  };
}

export interface ARScanResult {
  landmarkId: string;
  confidence: number;
  timestamp: string;
}

export interface ARCityGuideSettings {
  showDistanceOverlay: boolean;
  showDirectionArrows: boolean;
  autoScan: boolean;
  voiceNarration: boolean;
  preferredLanguage: string;
  maxScanDistance: number;
}

export interface AccessibilitySettings {
  visualAssistance: {
    enabled: boolean;
    largeText: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
    screenReaderOptimized: boolean;
  };
  hearingAssistance: {
    enabled: boolean;
    visualAlerts: boolean;
    captionsPreferred: boolean;
  };
  mobilityAssistance: {
    enabled: boolean;
    wheelchairAccessRequired: boolean;
    limitedWalkingDistance: boolean;
    maxWalkingDistance?: number;
    elevatorRequired: boolean;
    groundFloorPreferred: boolean;
  };
  cognitiveAssistance: {
    enabled: boolean;
    simplifiedInterface: boolean;
    extraReminders: boolean;
    detailedInstructions: boolean;
  };
  dietaryNeeds: {
    enabled: boolean;
    restrictions: string[];
    allergies: string[];
    preferences: string[];
  };
  communicationPreferences: {
    preferredLanguage: string;
    needsTranslationAssist: boolean;
    signLanguageInterpreter: boolean;
  };
  emergencyInfo: {
    medicalConditions: string[];
    medications: string[];
    bloodType?: string;
    emergencyInstructions?: string;
  };
}
export * from './flight';
