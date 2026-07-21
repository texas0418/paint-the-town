// Activity Booking Service for Paint the Town
// Integrates with Viator, GetYourGuide, and Airbnb Experiences

import { Alert, Linking, Platform } from 'react-native';
import {
  Activity,
  ActivityProvider,
  ActivitySearchParams,
  ActivitySearchResult,
  AvailabilityRequest,
  AvailabilityResponse,
  AvailabilitySlot,
  ActivityBookingRequest,
  ActivityBooking,
  BookingStatus,
  ActivityCategory,
  getProviderName,
  formatPrice,
} from '@/types/activity';

// ============================================================================
// Configuration
// ============================================================================

interface ProviderAPIConfig {
  provider: ActivityProvider;
  baseUrl: string;
  apiKey?: string;
  isEnabled: boolean;
}

const API_CONFIGS: Record<ActivityProvider, ProviderAPIConfig> = {
  viator: {
    provider: 'viator',
    baseUrl: 'https://api.viator.com/partner',
    apiKey: process.env.EXPO_PUBLIC_VIATOR_API_KEY,
    isEnabled: true,
  },
  getyourguide: {
    provider: 'getyourguide',
    baseUrl: 'https://api.getyourguide.com/1',
    apiKey: process.env.EXPO_PUBLIC_GETYOURGUIDE_API_KEY,
    isEnabled: true,
  },
  airbnb_experiences: {
    provider: 'airbnb_experiences',
    baseUrl: 'https://api.airbnb.com/v2',
    apiKey: process.env.EXPO_PUBLIC_AIRBNB_API_KEY,
    isEnabled: true,
  },
  direct: {
    provider: 'direct',
    baseUrl: '',
    isEnabled: true,
  },
};

// ============================================================================
// Activity Booking Service
// ============================================================================

class ActivityBookingService {
  private bookings: Map<string, ActivityBooking> = new Map();
  private favorites: Set<string> = new Set();
  private listeners: Map<string, (bookings: ActivityBooking[]) => void> = new Map();

  // ============================================================================
  // Search Activities
  // ============================================================================

  async searchActivities(params: ActivitySearchParams): Promise<ActivitySearchResult> {
    const results: Activity[] = [];

    try {
      // Search each enabled provider
      const providers = params.providers || ['viator', 'getyourguide', 'airbnb_experiences'];

      const searchPromises = providers.map(async (provider) => {
        if (!this.isProviderEnabled(provider)) return [];

        switch (provider) {
          case 'viator':
            return this.searchViator(params);
          case 'getyourguide':
            return this.searchGetYourGuide(params);
          case 'airbnb_experiences':
            return this.searchAirbnbExperiences(params);
          default:
            return [];
        }
      });

      const providerResults = await Promise.all(searchPromises);

      // Merge and deduplicate results
      for (const activities of providerResults) {
        for (const activity of activities) {
          const existing = results.find(
            (a) => a.title === activity.title && a.location.city === activity.location.city
          );
          if (!existing) {
            results.push(activity);
          }
        }
      }

      // Sort results
      this.sortActivities(results, params.sortBy || 'relevance');

      // Paginate
      const page = params.page || 1;
      const limit = params.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      return {
        activities: paginatedResults,
        totalCount: results.length,
        page,
        hasMore: startIndex + limit < results.length,
      };
    } catch (error) {
      console.error('Activity search failed:', error);
      return this.getMockSearchResults(params);
    }
  }

  // ============================================================================
  // Viator Integration
  // ============================================================================

  private async searchViator(params: ActivitySearchParams): Promise<Activity[]> {
    // In production, call the real Viator Partner API:
    // POST https://api.viator.com/partner/products/search
    // Headers: exp-api-key: {apiKey}
    // Body: { destId, startDate, endDate, topX, ... }

    // For demo, return mock data
    return this.getMockViatorResults(params);
  }

  private getMockViatorResults(params: ActivitySearchParams): Activity[] {
    return MOCK_ACTIVITIES.filter(
      (a) =>
        a.provider === 'viator' &&
        (!params.categories ||
          params.categories.length === 0 ||
          params.categories.includes(a.category))
    );
  }

  // ============================================================================
  // GetYourGuide Integration
  // ============================================================================

  private async searchGetYourGuide(params: ActivitySearchParams): Promise<Activity[]> {
    // In production, call the real GetYourGuide API:
    // GET https://api.getyourguide.com/1/tours
    // Headers: X-Access-Token: {apiKey}
    // Params: q, location_id, date, cnt_language, currency, ...

    // For demo, return mock data
    return this.getMockGetYourGuideResults(params);
  }

  private getMockGetYourGuideResults(params: ActivitySearchParams): Activity[] {
    return MOCK_ACTIVITIES.filter(
      (a) =>
        a.provider === 'getyourguide' &&
        (!params.categories ||
          params.categories.length === 0 ||
          params.categories.includes(a.category))
    );
  }

  // ============================================================================
  // Airbnb Experiences Integration
  // ============================================================================

  private async searchAirbnbExperiences(params: ActivitySearchParams): Promise<Activity[]> {
    // Airbnb Experiences API (if available)
    // For demo, return mock data
    return this.getMockAirbnbResults(params);
  }

  private getMockAirbnbResults(params: ActivitySearchParams): Activity[] {
    return MOCK_ACTIVITIES.filter(
      (a) =>
        a.provider === 'airbnb_experiences' &&
        (!params.categories ||
          params.categories.length === 0 ||
          params.categories.includes(a.category))
    );
  }

  // ============================================================================
  // Get Activity Details
  // ============================================================================

  async getActivityDetails(
    activityId: string,
    provider: ActivityProvider
  ): Promise<Activity | null> {
    // In production, fetch from provider API
    const activity = MOCK_ACTIVITIES.find((a) => a.id === activityId);
    return activity || null;
  }

  // ============================================================================
  // Get Availability
  // ============================================================================

  async getAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    const { activityId, provider, date, participants } = request;

    // In production, call provider API:
    // Viator: POST /partner/availability/check
    // GetYourGuide: GET /tours/{id}/availabilities

    // Simulate API delay
    await this.delay(800);

    // Generate mock availability
    const slots = this.generateMockSlots(activityId, date, participants);

    return {
      activityId,
      date,
      slots,
      nextAvailableDate: slots.length === 0 ? this.getNextDate(date) : undefined,
    };
  }

  private generateMockSlots(
    activityId: string,
    date: string,
    participants: { adults: number; children?: number; infants?: number }
  ): AvailabilitySlot[] {
    const activity = MOCK_ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) return [];

    const slots: AvailabilitySlot[] = [];
    const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '17:00', '18:00'];

    for (const time of times) {
      // Random availability (75% chance available)
      const available = Math.random() > 0.25;
      const spotsLeft = available ? Math.floor(Math.random() * 8) + 2 : 0;

      const adultPrice = activity.pricing.basePrice;
      const childPrice = activity.pricing.childPrice || adultPrice * 0.7;
      const totalPrice =
        participants.adults * adultPrice + (participants.children || 0) * childPrice;

      slots.push({
        id: `slot-${activityId}-${time.replace(':', '')}`,
        startTime: time,
        displayTime: this.formatTime(time),
        available,
        spotsLeft: available ? spotsLeft : undefined,
        pricing: {
          adultPrice,
          childPrice,
          infantPrice: 0,
          totalPrice,
          currency: activity.pricing.currency,
        },
        bookingToken: `token-${Date.now()}-${Math.random()}`,
      });
    }

    return slots.filter((s) => s.available);
  }

  // ============================================================================
  // Book Activity
  // ============================================================================

  async bookActivity(request: ActivityBookingRequest): Promise<ActivityBooking> {
    const { activityId, provider, date, startTime, participants, leadTraveler } = request;

    // Find activity
    const activity = MOCK_ACTIVITIES.find((a) => a.id === activityId);
    if (!activity) {
      throw new Error('Activity not found');
    }

    // In production, call provider API:
    // Viator: POST /partner/bookings
    // GetYourGuide: POST /bookings

    // Simulate API delay
    await this.delay(1500);

    // Simulate occasional failure (10%)
    if (Math.random() < 0.1) {
      throw new Error('This time slot is no longer available. Please select another time.');
    }

    // Calculate pricing
    const adultPrice = activity.pricing.basePrice;
    const childPrice = activity.pricing.childPrice || adultPrice * 0.7;
    const subtotal = participants.adults * adultPrice + (participants.children || 0) * childPrice;
    const fees = subtotal * 0.05;
    const total = subtotal + fees;

    // Create booking
    const booking: ActivityBooking = {
      id: `booking-${Date.now()}`,
      providerBookingId: `${provider.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      provider,
      status: 'confirmed',

      activity: {
        id: activity.id,
        title: activity.title,
        thumbnailUrl: activity.thumbnailUrl,
        category: activity.category,
        location: `${activity.location.city}, ${activity.location.country}`,
        duration: activity.duration.displayText,
      },

      date,
      displayDate: this.formatDisplayDate(date),
      startTime,
      endTime: this.calculateEndTime(startTime, activity.duration),

      participants: {
        adults: participants.adults,
        children: participants.children,
        infants: participants.infants,
        total: participants.adults + (participants.children || 0) + (participants.infants || 0),
      },

      pricing: {
        subtotal,
        fees,
        total,
        currency: activity.pricing.currency,
      },

      leadTraveler,

      confirmationNumber: this.generateConfirmationNumber(provider),
      voucherUrl: `https://${provider}.com/voucher/${Date.now()}`,
      qrCode: `data:image/png;base64,${Math.random().toString(36)}`,

      meetingPoint: activity.location.meetingPoint || activity.location.address,
      meetingInstructions:
        'Please arrive 15 minutes before the start time. Look for the guide holding a sign with your name.',

      operatorPhone: '+1 (555) 123-4567',
      operatorEmail: `support@${provider}.com`,

      createdAt: new Date(),
      confirmedAt: new Date(),

      canCancel: activity.cancellationPolicy.type !== 'non_refundable',
      cancelDeadline: activity.cancellationPolicy.freeCancellationUntil
        ? new Date(
            new Date(date).getTime() -
              activity.cancellationPolicy.freeCancellationUntil * 60 * 60 * 1000
          )
        : undefined,
    };

    // Store booking
    this.bookings.set(booking.id, booking);
    this.notifyListeners();

    return booking;
  }

  // ============================================================================
  // Manage Bookings
  // ============================================================================

  async getBookings(): Promise<ActivityBooking[]> {
    return Array.from(this.bookings.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getBooking(id: string): Promise<ActivityBooking | null> {
    return this.bookings.get(id) || null;
  }

  async cancelBooking(id: string): Promise<boolean> {
    const booking = this.bookings.get(id);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.canCancel) {
      throw new Error('This booking cannot be cancelled');
    }

    // In production, call provider API to cancel
    await this.delay(1000);

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.canCancel = false;

    // Calculate refund
    const now = new Date();
    if (booking.cancelDeadline && now < booking.cancelDeadline) {
      booking.refundAmount = booking.pricing.total;
      booking.status = 'refunded';
    }

    this.bookings.set(id, booking);
    this.notifyListeners();

    return true;
  }

  // ============================================================================
  // Favorites
  // ============================================================================

  toggleFavorite(activityId: string): boolean {
    if (this.favorites.has(activityId)) {
      this.favorites.delete(activityId);
      return false;
    } else {
      this.favorites.add(activityId);
      return true;
    }
  }

  isFavorite(activityId: string): boolean {
    return this.favorites.has(activityId);
  }

  getFavorites(): string[] {
    return Array.from(this.favorites);
  }

  // ============================================================================
  // Deep Links
  // ============================================================================

  async openInProviderApp(provider: ActivityProvider, activityId: string): Promise<boolean> {
    let url: string;

    switch (provider) {
      case 'viator':
        url = `viator://activity/${activityId}`;
        break;
      case 'getyourguide':
        url = `getyourguide://tour/${activityId}`;
        break;
      case 'airbnb_experiences':
        url = `airbnb://experiences/${activityId}`;
        break;
      default:
        return false;
    }

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fall back to web
      const webUrl = this.getProviderWebUrl(provider, activityId);
      await Linking.openURL(webUrl);
      return true;
    }
  }

  private getProviderWebUrl(provider: ActivityProvider, activityId: string): string {
    switch (provider) {
      case 'viator':
        return `https://www.viator.com/tours/${activityId}`;
      case 'getyourguide':
        return `https://www.getyourguide.com/activity/${activityId}`;
      case 'airbnb_experiences':
        return `https://www.airbnb.com/experiences/${activityId}`;
      default:
        return '';
    }
  }

  // ============================================================================
  // Subscription
  // ============================================================================

  subscribe(id: string, callback: (bookings: ActivityBooking[]) => void) {
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  private notifyListeners() {
    const bookings = Array.from(this.bookings.values());
    this.listeners.forEach((callback) => callback(bookings));
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private isProviderEnabled(provider: ActivityProvider): boolean {
    return API_CONFIGS[provider]?.isEnabled ?? false;
  }

  private sortActivities(activities: Activity[], sortBy: string) {
    switch (sortBy) {
      case 'price_low':
        activities.sort((a, b) => a.pricing.basePrice - b.pricing.basePrice);
        break;
      case 'price_high':
        activities.sort((a, b) => b.pricing.basePrice - a.pricing.basePrice);
        break;
      case 'rating':
        activities.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        activities.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'duration':
        activities.sort((a, b) => a.duration.value - b.duration.value);
        break;
      default:
        // Relevance: combination of rating and popularity
        activities.sort((a, b) => {
          const aScore = a.rating * 10 + Math.log10(a.reviewCount + 1) * 5;
          const bScore = b.rating * 10 + Math.log10(b.reviewCount + 1) * 5;
          return bScore - aScore;
        });
    }
  }

  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private calculateEndTime(startTime: string, duration: { value: number; unit: string }): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (duration.unit === 'hours') {
      totalMinutes += duration.value * 60;
    } else if (duration.unit === 'minutes') {
      totalMinutes += duration.value;
    }

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private getNextDate(currentDate: string): string {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  }

  private generateConfirmationNumber(provider: ActivityProvider): string {
    const prefix = provider === 'viator' ? 'VT' : provider === 'getyourguide' ? 'GYG' : 'ABX';
    return `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Mock results fallback
  private getMockSearchResults(params: ActivitySearchParams): ActivitySearchResult {
    let activities = [...MOCK_ACTIVITIES];

    // Filter by category
    if (params.categories && params.categories.length > 0) {
      activities = activities.filter((a) => params.categories!.includes(a.category));
    }

    // Filter by price
    if (params.priceRange) {
      activities = activities.filter(
        (a) =>
          a.pricing.basePrice >= params.priceRange!.min &&
          a.pricing.basePrice <= params.priceRange!.max
      );
    }

    // Sort
    this.sortActivities(activities, params.sortBy || 'relevance');

    return {
      activities,
      totalCount: activities.length,
      page: 1,
      hasMore: false,
    };
  }
}

// ============================================================================
// Mock Activity Data
// ============================================================================

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    externalIds: { viator: 'v-12345' },
    provider: 'viator',
    title: 'Atlanta City Sightseeing Tour',
    shortDescription: "Explore Atlanta's most iconic landmarks on this comprehensive city tour.",
    fullDescription: 'Discover the best of Atlanta on this guided sightseeing tour...',
    highlights: [
      'See the Martin Luther King Jr. National Historic Site',
      'Visit the Georgia Aquarium',
      'Photo stop at Centennial Olympic Park',
      'Drive through historic neighborhoods',
    ],
    category: 'tours',
    subcategories: ['city_tours', 'sightseeing'],
    tags: ['bestseller', 'family-friendly', 'guided'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      meetingPoint: 'Centennial Olympic Park',
      coordinates: { lat: 33.7603, lng: -84.393 },
    },
    images: ['https://example.com/atlanta-tour.jpg'],
    thumbnailUrl: 'https://example.com/atlanta-tour-thumb.jpg',
    rating: 4.7,
    reviewCount: 1256,
    pricing: {
      currency: 'USD',
      basePrice: 65,
      retailPrice: 79,
      discountPercent: 18,
      priceType: 'per_person',
      childPrice: 45,
    },
    duration: {
      value: 4,
      unit: 'hours',
      displayText: '4 hours',
    },
    included: ['Professional guide', 'Air-conditioned vehicle', 'Hotel pickup'],
    notIncluded: ['Food and drinks', 'Gratuities'],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 24,
      description: 'Free cancellation up to 24 hours before the experience starts',
    },
    instantConfirmation: true,
    mobileTicket: true,
    skipTheLine: false,
    maxGroupSize: 14,
    languages: ['English', 'Spanish'],
    isBestseller: true,
  },
  {
    id: 'act-2',
    externalIds: { getyourguide: 'gyg-67890' },
    provider: 'getyourguide',
    title: 'Couples Cooking Class: Southern Cuisine',
    shortDescription:
      'Learn to cook authentic Southern dishes together in this hands-on cooking class.',
    category: 'classes',
    subcategories: ['cooking', 'food_experience'],
    tags: ['romantic', 'couples', 'hands-on'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      address: '123 Peachtree St NE',
      coordinates: { lat: 33.7537, lng: -84.3863 },
    },
    images: ['https://example.com/cooking-class.jpg'],
    thumbnailUrl: 'https://example.com/cooking-class-thumb.jpg',
    rating: 4.9,
    reviewCount: 342,
    pricing: {
      currency: 'USD',
      basePrice: 125,
      priceType: 'per_person',
    },
    duration: {
      value: 3,
      unit: 'hours',
      displayText: '3 hours',
    },
    included: ['All ingredients', 'Wine pairing', 'Recipe booklet', 'Aprons to take home'],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 48,
      description: 'Free cancellation up to 48 hours before',
    },
    instantConfirmation: true,
    mobileTicket: true,
    maxGroupSize: 12,
    languages: ['English'],
    specialOffer: {
      type: 'discount',
      label: '15% off for couples',
      discountPercent: 15,
    },
  },
  {
    id: 'act-3',
    externalIds: { viator: 'v-23456' },
    provider: 'viator',
    title: 'Sunset Wine Tasting in North Georgia',
    shortDescription: 'Enjoy award-winning wines with stunning mountain views at sunset.',
    category: 'food_drink',
    subcategories: ['wine', 'tasting'],
    tags: ['romantic', 'scenic', 'wine'],
    location: {
      city: 'Dahlonega',
      state: 'GA',
      country: 'USA',
      meetingPoint: 'Pickup from Atlanta hotels',
      coordinates: { lat: 34.5329, lng: -83.9849 },
    },
    images: ['https://example.com/wine-tour.jpg'],
    thumbnailUrl: 'https://example.com/wine-tour-thumb.jpg',
    rating: 4.8,
    reviewCount: 567,
    pricing: {
      currency: 'USD',
      basePrice: 149,
      priceType: 'per_person',
    },
    duration: {
      value: 6,
      unit: 'hours',
      displayText: '6 hours',
    },
    included: [
      'Round-trip transportation',
      'Visits to 3 wineries',
      'All tastings',
      'Cheese & charcuterie',
    ],
    notIncluded: ['Additional wine purchases'],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 24,
      description: 'Free cancellation up to 24 hours before',
    },
    instantConfirmation: true,
    mobileTicket: true,
    privateOption: true,
    maxGroupSize: 8,
    minParticipants: 2,
    languages: ['English'],
  },
  {
    id: 'act-4',
    externalIds: { airbnb: 'abx-11111' },
    provider: 'airbnb_experiences',
    title: 'Street Art Walking Tour in Little Five Points',
    shortDescription: "Discover Atlanta's vibrant street art scene with a local artist guide.",
    category: 'arts_culture',
    subcategories: ['street_art', 'walking_tour'],
    tags: ['local', 'art', 'neighborhood'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      meetingPoint: 'The Vortex Bar & Grill',
      coordinates: { lat: 33.7668, lng: -84.3497 },
    },
    images: ['https://example.com/street-art.jpg'],
    thumbnailUrl: 'https://example.com/street-art-thumb.jpg',
    rating: 4.95,
    reviewCount: 189,
    pricing: {
      currency: 'USD',
      basePrice: 45,
      priceType: 'per_person',
    },
    duration: {
      value: 2.5,
      unit: 'hours',
      displayText: '2.5 hours',
    },
    included: ['Expert local guide', 'History & stories behind the art'],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 24,
      description: 'Cancel up to 24 hours before for a full refund',
    },
    instantConfirmation: true,
    mobileTicket: true,
    maxGroupSize: 10,
    languages: ['English'],
    isNew: true,
  },
  {
    id: 'act-5',
    externalIds: { getyourguide: 'gyg-33333' },
    provider: 'getyourguide',
    title: 'Georgia Aquarium VIP Experience',
    shortDescription: "Skip the lines and go behind the scenes at the world's largest aquarium.",
    category: 'attractions',
    subcategories: ['aquarium', 'vip'],
    tags: ['skip-the-line', 'family-friendly', 'vip'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      address: '225 Baker St NW',
      coordinates: { lat: 33.7634, lng: -84.3951 },
    },
    images: ['https://example.com/aquarium.jpg'],
    thumbnailUrl: 'https://example.com/aquarium-thumb.jpg',
    rating: 4.6,
    reviewCount: 2341,
    pricing: {
      currency: 'USD',
      basePrice: 89,
      retailPrice: 110,
      discountPercent: 19,
      priceType: 'per_person',
      childPrice: 69,
    },
    duration: {
      value: 4,
      unit: 'hours',
      displayText: '4 hours',
    },
    included: ['Skip-the-line entry', 'Behind-the-scenes tour', 'Dolphin encounter'],
    cancellationPolicy: {
      type: 'moderate',
      description: '50% refund if cancelled 48+ hours before',
      refundPercent: 50,
    },
    instantConfirmation: true,
    mobileTicket: true,
    skipTheLine: true,
    maxGroupSize: 15,
    languages: ['English'],
    isBestseller: true,
    accessibility: {
      wheelchairAccessible: true,
      serviceAnimalsAllowed: true,
      nearPublicTransit: true,
      infantsAllowed: true,
    },
  },
  {
    id: 'act-6',
    externalIds: { viator: 'v-44444' },
    provider: 'viator',
    title: 'Romantic Helicopter Tour Over Atlanta',
    shortDescription: 'Soar above the Atlanta skyline on this unforgettable helicopter experience.',
    category: 'romantic',
    subcategories: ['helicopter', 'scenic_flight'],
    tags: ['romantic', 'luxury', 'unforgettable'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      meetingPoint: 'PDK Airport',
      coordinates: { lat: 33.8756, lng: -84.302 },
    },
    images: ['https://example.com/helicopter.jpg'],
    thumbnailUrl: 'https://example.com/helicopter-thumb.jpg',
    rating: 4.9,
    reviewCount: 156,
    pricing: {
      currency: 'USD',
      basePrice: 299,
      priceType: 'per_person',
    },
    duration: {
      value: 30,
      unit: 'minutes',
      displayText: '30 minutes',
    },
    included: ['30-minute helicopter flight', 'Professional pilot', 'Champagne toast'],
    cancellationPolicy: {
      type: 'moderate',
      freeCancellationUntil: 72,
      description: 'Full refund if cancelled 72+ hours before',
    },
    instantConfirmation: true,
    mobileTicket: true,
    privateOption: true,
    maxGroupSize: 3,
    languages: ['English'],
    isLikelyToSellOut: true,
  },
  {
    id: 'act-7',
    externalIds: { airbnb: 'abx-55555' },
    provider: 'airbnb_experiences',
    title: 'Pottery Date Night for Two',
    shortDescription: 'Create your own pottery piece together in this intimate hands-on workshop.',
    category: 'classes',
    subcategories: ['pottery', 'workshop'],
    tags: ['romantic', 'creative', 'couples'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      address: '456 Edgewood Ave SE',
      coordinates: { lat: 33.7544, lng: -84.3697 },
    },
    images: ['https://example.com/pottery.jpg'],
    thumbnailUrl: 'https://example.com/pottery-thumb.jpg',
    rating: 4.97,
    reviewCount: 234,
    pricing: {
      currency: 'USD',
      basePrice: 95,
      priceType: 'per_person',
    },
    duration: {
      value: 2,
      unit: 'hours',
      displayText: '2 hours',
    },
    included: [
      'All materials',
      'Expert instruction',
      'Wine & snacks',
      'Glazing & firing',
      'Shipping of finished pieces',
    ],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 24,
      description: 'Full refund up to 24 hours before',
    },
    instantConfirmation: true,
    mobileTicket: true,
    maxGroupSize: 8,
    languages: ['English'],
  },
  {
    id: 'act-8',
    externalIds: { getyourguide: 'gyg-66666' },
    provider: 'getyourguide',
    title: 'Kayak Tour on the Chattahoochee River',
    shortDescription: 'Paddle through scenic waterways just outside Atlanta.',
    category: 'outdoor',
    subcategories: ['kayaking', 'nature'],
    tags: ['outdoor', 'adventure', 'nature'],
    location: {
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      meetingPoint: 'Chattahoochee Nature Center',
      coordinates: { lat: 33.9498, lng: -84.4268 },
    },
    images: ['https://example.com/kayak.jpg'],
    thumbnailUrl: 'https://example.com/kayak-thumb.jpg',
    rating: 4.7,
    reviewCount: 423,
    pricing: {
      currency: 'USD',
      basePrice: 75,
      priceType: 'per_person',
      childPrice: 55,
    },
    duration: {
      value: 3,
      unit: 'hours',
      displayText: '3 hours',
    },
    included: ['Kayak & paddle', 'Life jacket', 'Guide', 'Snacks & water'],
    notIncluded: ['Transportation to meeting point'],
    requirements: ['Must be able to swim', 'Minimum age 10 years'],
    cancellationPolicy: {
      type: 'free',
      freeCancellationUntil: 24,
      description: 'Free cancellation up to 24 hours before',
    },
    instantConfirmation: true,
    mobileTicket: true,
    maxGroupSize: 12,
    minParticipants: 2,
    languages: ['English'],
  },
];

// Export singleton
export const activityBookingService = new ActivityBookingService();
