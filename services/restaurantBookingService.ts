// Restaurant Booking Service for Paint the Town
// Integrates with OpenTable, Resy, and direct booking

import { Alert, Linking, Platform } from 'react-native';
import {
  Restaurant,
  RestaurantSearchParams,
  RestaurantSearchResult,
  RestaurantWithAvailability,
  TimeSlot,
  TimeSlotGroup,
  ReservationProvider,
  ReservationRequest,
  Reservation,
  ReservationStatus,
  DiningPreferences,
  getProviderName,
} from '@/types/restaurant';

// ============================================================================
// Configuration
// ============================================================================

interface ProviderConfig {
  provider: ReservationProvider;
  apiBaseUrl: string;
  apiKey?: string;
  clientId?: string;
  isEnabled: boolean;
}

const PROVIDER_CONFIGS: Record<ReservationProvider, ProviderConfig> = {
  opentable: {
    provider: 'opentable',
    apiBaseUrl: 'https://platform.opentable.com/v1',
    apiKey: process.env.EXPO_PUBLIC_OPENTABLE_API_KEY,
    clientId: process.env.EXPO_PUBLIC_OPENTABLE_CLIENT_ID,
    isEnabled: true,
  },
  resy: {
    provider: 'resy',
    apiBaseUrl: 'https://api.resy.com/v4',
    apiKey: process.env.EXPO_PUBLIC_RESY_API_KEY,
    isEnabled: true,
  },
  yelp: {
    provider: 'yelp',
    apiBaseUrl: 'https://api.yelp.com/v3',
    apiKey: process.env.EXPO_PUBLIC_YELP_API_KEY,
    isEnabled: false,
  },
  direct: {
    provider: 'direct',
    apiBaseUrl: '',
    isEnabled: true,
  },
};

// ============================================================================
// Restaurant Booking Service
// ============================================================================

class RestaurantBookingService {
  private reservations: Map<string, Reservation> = new Map();
  private listeners: Map<string, (reservations: Reservation[]) => void> = new Map();

  // ============================================================================
  // Search Restaurants
  // ============================================================================

  async searchRestaurants(params: RestaurantSearchParams): Promise<RestaurantSearchResult> {
    const results: RestaurantWithAvailability[] = [];

    // In production, call actual APIs
    // For now, use mock data that simulates real responses

    try {
      // Search OpenTable
      if (this.isProviderEnabled('opentable')) {
        const otResults = await this.searchOpenTable(params);
        results.push(...otResults);
      }

      // Search Resy
      if (this.isProviderEnabled('resy')) {
        const resyResults = await this.searchResy(params);
        // Merge or add restaurants
        for (const restaurant of resyResults) {
          const existing = results.find(
            (r) => r.name === restaurant.name && r.address === restaurant.address
          );
          if (existing) {
            // Merge availability from Resy
            existing.availability.push(...restaurant.availability);
            if (restaurant.externalIds.resy) {
              existing.externalIds.resy = restaurant.externalIds.resy;
            }
          } else {
            results.push(restaurant);
          }
        }
      }

      // Sort results
      this.sortResults(results, params.sortBy || 'relevance');

      // Paginate
      const page = params.page || 1;
      const limit = params.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      return {
        restaurants: paginatedResults,
        totalCount: results.length,
        page,
        hasMore: startIndex + limit < results.length,
        searchId: `search-${Date.now()}`,
      };
    } catch (error) {
      console.error('Restaurant search failed:', error);
      // Return mock data as fallback
      return this.getMockSearchResults(params);
    }
  }

  // ============================================================================
  // OpenTable Integration
  // ============================================================================

  private async searchOpenTable(
    params: RestaurantSearchParams
  ): Promise<RestaurantWithAvailability[]> {
    const config = PROVIDER_CONFIGS.opentable;

    // In production, this would call the real OpenTable API:
    // POST https://platform.opentable.com/v1/availability
    // Headers: Authorization: Bearer {apiKey}
    // Body: { datetime, party_size, lat, lng, etc. }

    // For demo, return mock data
    return this.getMockOpenTableResults(params);
  }

  private getMockOpenTableResults(params: RestaurantSearchParams): RestaurantWithAvailability[] {
    const mockRestaurants = MOCK_RESTAURANTS.filter((r) =>
      r.reservationProviders.includes('opentable')
    );

    return mockRestaurants.map((restaurant) => ({
      ...restaurant,
      availability: [
        {
          provider: 'opentable',
          slots: this.generateMockTimeSlots('opentable', restaurant.id, params),
        },
      ],
    }));
  }

  // ============================================================================
  // Resy Integration
  // ============================================================================

  private async searchResy(params: RestaurantSearchParams): Promise<RestaurantWithAvailability[]> {
    const config = PROVIDER_CONFIGS.resy;

    // In production, this would call the real Resy API:
    // GET https://api.resy.com/v4/find
    // Headers: Authorization: ResyAPI api_key="{apiKey}"
    // Params: lat, long, day, party_size, etc.

    // For demo, return mock data
    return this.getMockResyResults(params);
  }

  private getMockResyResults(params: RestaurantSearchParams): RestaurantWithAvailability[] {
    const mockRestaurants = MOCK_RESTAURANTS.filter((r) => r.reservationProviders.includes('resy'));

    return mockRestaurants.map((restaurant) => ({
      ...restaurant,
      availability: [
        {
          provider: 'resy',
          slots: this.generateMockTimeSlots('resy', restaurant.id, params),
        },
      ],
    }));
  }

  // ============================================================================
  // Get Availability for Specific Restaurant
  // ============================================================================

  async getRestaurantAvailability(
    restaurantId: string,
    date: string,
    partySize: number,
    providers?: ReservationProvider[]
  ): Promise<TimeSlotGroup[]> {
    const availability: TimeSlotGroup[] = [];
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    const providersToCheck = providers || restaurant.reservationProviders;

    for (const provider of providersToCheck) {
      if (!this.isProviderEnabled(provider)) continue;

      const slots = this.generateMockTimeSlots(provider, restaurantId, {
        date,
        time: '18:00',
        partySize,
      });

      availability.push({ provider, slots });
    }

    return availability;
  }

  // ============================================================================
  // Make Reservation
  // ============================================================================

  async makeReservation(request: ReservationRequest): Promise<Reservation> {
    const { timeSlot, restaurantId, primaryGuest, partySize } = request;

    // Find restaurant
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);
    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // In production, call the appropriate provider API:
    // OpenTable: POST https://platform.opentable.com/v1/reservations
    // Resy: POST https://api.resy.com/v4/book

    // Simulate API delay
    await this.delay(1500);

    // Simulate occasional failure
    if (Math.random() < 0.1) {
      throw new Error('This time slot is no longer available. Please select another time.');
    }

    // Create reservation
    const reservation: Reservation = {
      id: `res-${Date.now()}`,
      providerReservationId: `${timeSlot.provider.toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      provider: timeSlot.provider,
      status: 'confirmed',

      restaurant,

      dateTime: timeSlot.dateTime,
      displayDate: this.formatDisplayDate(timeSlot.dateTime),
      displayTime: timeSlot.displayTime,
      partySize,

      guestName: `${primaryGuest.firstName} ${primaryGuest.lastName}`,
      guestEmail: primaryGuest.email,
      guestPhone: primaryGuest.phone,

      specialRequests: request.specialRequests,
      occasion: request.occasion,
      seatingPreference: request.seatingPreference,

      confirmationNumber: this.generateConfirmationNumber(timeSlot.provider),
      confirmationUrl: `https://${timeSlot.provider}.com/confirmation/${Date.now()}`,

      depositPaid: timeSlot.depositAmount,
      depositRefundable: true,

      createdAt: new Date(),

      cancellationPolicy: 'Free cancellation up to 2 hours before reservation',
      canCancel: true,
      canModify: true,
      cancelDeadline: new Date(timeSlot.dateTime.getTime() - 2 * 60 * 60 * 1000),
    };

    // Store reservation
    this.reservations.set(reservation.id, reservation);
    this.notifyListeners();

    return reservation;
  }

  // ============================================================================
  // Manage Reservations
  // ============================================================================

  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).sort(
      (a, b) => b.dateTime.getTime() - a.dateTime.getTime()
    );
  }

  async getReservation(id: string): Promise<Reservation | null> {
    return this.reservations.get(id) || null;
  }

  async cancelReservation(id: string): Promise<boolean> {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.canCancel) {
      throw new Error('This reservation cannot be cancelled');
    }

    // In production, call provider API to cancel
    await this.delay(1000);

    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.canCancel = false;
    reservation.canModify = false;

    this.reservations.set(id, reservation);
    this.notifyListeners();

    return true;
  }

  async modifyReservation(
    id: string,
    updates: { date?: string; time?: string; partySize?: number }
  ): Promise<Reservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (!reservation.canModify) {
      throw new Error('This reservation cannot be modified');
    }

    // In production, call provider API to modify
    await this.delay(1000);

    if (updates.date || updates.time) {
      const dateStr = updates.date || reservation.dateTime.toISOString().split('T')[0];
      const timeStr = updates.time || reservation.displayTime;
      const [hours, minutes] = this.parseTime(timeStr);
      const newDateTime = new Date(dateStr);
      newDateTime.setHours(hours, minutes, 0, 0);

      reservation.dateTime = newDateTime;
      reservation.displayDate = this.formatDisplayDate(newDateTime);
      reservation.displayTime = timeStr;
    }

    if (updates.partySize) {
      reservation.partySize = updates.partySize;
    }

    reservation.modifiedAt = new Date();
    this.reservations.set(id, reservation);
    this.notifyListeners();

    return reservation;
  }

  // ============================================================================
  // Deep Links to Provider Apps
  // ============================================================================

  async openInProviderApp(
    provider: ReservationProvider,
    restaurantId: string,
    date?: string,
    time?: string,
    partySize?: number
  ): Promise<boolean> {
    let url: string;

    switch (provider) {
      case 'opentable':
        // OpenTable deep link
        url = `opentable://restaurant/${restaurantId}`;
        if (date && time && partySize) {
          url += `?date=${date}&time=${time}&partySize=${partySize}`;
        }
        break;

      case 'resy':
        // Resy deep link
        url = `resy://restaurant/${restaurantId}`;
        if (date && partySize) {
          url += `?date=${date}&seats=${partySize}`;
        }
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
      const webUrl = this.getProviderWebUrl(provider, restaurantId, date, time, partySize);
      await Linking.openURL(webUrl);
      return true;
    }
  }

  private getProviderWebUrl(
    provider: ReservationProvider,
    restaurantId: string,
    date?: string,
    time?: string,
    partySize?: number
  ): string {
    switch (provider) {
      case 'opentable':
        let otUrl = `https://www.opentable.com/r/${restaurantId}`;
        if (date && time && partySize) {
          otUrl += `?dateTime=${date}T${time}&partySize=${partySize}`;
        }
        return otUrl;

      case 'resy':
        let resyUrl = `https://resy.com/cities/venue/${restaurantId}`;
        if (date && partySize) {
          resyUrl += `?date=${date}&seats=${partySize}`;
        }
        return resyUrl;

      default:
        return '';
    }
  }

  // ============================================================================
  // Subscription
  // ============================================================================

  subscribe(id: string, callback: (reservations: Reservation[]) => void) {
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  private notifyListeners() {
    const reservations = Array.from(this.reservations.values());
    this.listeners.forEach((callback) => callback(reservations));
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private isProviderEnabled(provider: ReservationProvider): boolean {
    return PROVIDER_CONFIGS[provider]?.isEnabled ?? false;
  }

  private sortResults(results: RestaurantWithAvailability[], sortBy: string) {
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => (b.aggregateRating || 0) - (a.aggregateRating || 0));
        break;
      case 'distance':
        results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'price_low':
        results.sort((a, b) => a.priceRange - b.priceRange);
        break;
      case 'price_high':
        results.sort((a, b) => b.priceRange - a.priceRange);
        break;
      default:
        // Relevance: combination of rating, availability, and distance
        results.sort((a, b) => {
          const aScore = (a.aggregateRating || 0) * 10 + a.availability.length - (a.distance || 0);
          const bScore = (b.aggregateRating || 0) * 10 + b.availability.length - (b.distance || 0);
          return bScore - aScore;
        });
    }
  }

  private generateMockTimeSlots(
    provider: ReservationProvider,
    restaurantId: string,
    params: { date: string; time: string; partySize: number }
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const baseHour = parseInt(params.time.split(':')[0]);

    // Generate slots around requested time
    const times = [-1, -0.5, 0, 0.5, 1, 1.5, 2].map((offset) => {
      const hour = baseHour + offset;
      const minutes = offset % 1 === 0 ? '00' : '30';
      return `${Math.floor(hour)}:${minutes}`;
    });

    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      if (hours < 11 || hours > 22) continue; // Skip unrealistic times

      const dateTime = new Date(params.date);
      dateTime.setHours(hours, minutes, 0, 0);

      // Random availability (80% chance available)
      const isAvailable = Math.random() > 0.2;

      slots.push({
        id: `slot-${provider}-${restaurantId}-${time.replace(':', '')}`,
        provider,
        restaurantId,
        dateTime,
        displayTime: this.formatTime(hours, minutes),
        partySize: params.partySize,
        type: 'standard',
        requiresDeposit: false,
        isAvailable,
        spotsLeft: isAvailable ? Math.floor(Math.random() * 5) + 1 : 0,
        bookingToken: `token-${Date.now()}-${Math.random()}`,
      });
    }

    return slots.filter((s) => s.isAvailable);
  }

  private formatTime(hours: number, minutes: number): string {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private parseTime(timeStr: string): [number, number] {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return [18, 0];

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return [hours, minutes];
  }

  private generateConfirmationNumber(provider: ReservationProvider): string {
    const prefix = provider === 'opentable' ? 'OT' : provider === 'resy' ? 'RY' : 'W4';
    return `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Mock search results for demo
  private getMockSearchResults(params: RestaurantSearchParams): RestaurantSearchResult {
    return {
      restaurants: MOCK_RESTAURANTS.map((r) => ({
        ...r,
        availability: [
          {
            provider: 'opentable' as ReservationProvider,
            slots: this.generateMockTimeSlots('opentable', r.id, params),
          },
          {
            provider: 'resy' as ReservationProvider,
            slots: this.generateMockTimeSlots('resy', r.id, params),
          },
        ],
      })),
      totalCount: MOCK_RESTAURANTS.length,
      page: 1,
      hasMore: false,
      searchId: `mock-${Date.now()}`,
    };
  }
}

// ============================================================================
// Mock Restaurant Data
// ============================================================================

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    externalIds: { opentable: 'ot-123', resy: 'resy-456' },
    name: 'Aria',
    description: 'Upscale New American cuisine in an elegant setting',
    cuisineTypes: ['American', 'Contemporary', 'Farm-to-Table'],
    priceRange: 4,
    address: '490 East Paces Ferry Rd NE',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30305',
    neighborhood: 'Buckhead',
    coordinates: { lat: 33.8406, lng: -84.378 },
    phone: '(404) 233-7673',
    website: 'https://aria-atl.com',
    photos: ['https://example.com/aria1.jpg'],
    coverPhoto: 'https://example.com/aria1.jpg',
    ratings: {
      opentable: { score: 4.8, reviewCount: 1247 },
      google: { score: 4.7, reviewCount: 892 },
    },
    aggregateRating: 4.8,
    features: ['private_dining', 'valet', 'romantic', 'business_dining'],
    diningStyles: ['fine_dining', 'american'],
    dressCode: 'Business Casual',
    hours: {
      monday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '17:30', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '17:00', closeTime: '23:00' },
      sunday: { isOpen: false },
    },
    acceptsReservations: true,
    reservationProviders: ['opentable', 'resy'],
    tags: ['fine dining', 'special occasion', 'date night', 'buckhead'],
  },
  {
    id: 'rest-2',
    externalIds: { opentable: 'ot-234', resy: 'resy-567' },
    name: 'Bacchanalia',
    description: 'James Beard Award-winning contemporary American restaurant',
    cuisineTypes: ['American', 'Contemporary', 'Seasonal'],
    priceRange: 4,
    address: '1460 Ellsworth Industrial Blvd NW',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30318',
    neighborhood: 'Westside',
    coordinates: { lat: 33.8021, lng: -84.4231 },
    phone: '(404) 365-0410',
    website: 'https://starprovisions.com/bacchanalia',
    photos: ['https://example.com/bacchanalia1.jpg'],
    coverPhoto: 'https://example.com/bacchanalia1.jpg',
    ratings: {
      opentable: { score: 4.9, reviewCount: 2103 },
      resy: { score: 4.8, reviewCount: 1567 },
    },
    aggregateRating: 4.9,
    features: ['private_dining', 'parking', 'romantic', 'wheelchair_accessible'],
    diningStyles: ['fine_dining', 'american', 'farm-to-table'],
    dressCode: 'Smart Casual',
    hours: {
      monday: { isOpen: false },
      tuesday: { isOpen: true, openTime: '18:00', closeTime: '21:30' },
      wednesday: { isOpen: true, openTime: '18:00', closeTime: '21:30' },
      thursday: { isOpen: true, openTime: '18:00', closeTime: '21:30' },
      friday: { isOpen: true, openTime: '18:00', closeTime: '22:00' },
      saturday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      sunday: { isOpen: false },
    },
    acceptsReservations: true,
    reservationProviders: ['opentable', 'resy'],
    requiresCreditCard: true,
    cancellationPolicy: 'Credit card required. $50 per person charge for no-shows.',
    tags: ['james beard', 'special occasion', 'tasting menu', 'westside'],
  },
  {
    id: 'rest-3',
    externalIds: { opentable: 'ot-345' },
    name: 'Staplehouse',
    description: 'Creative tasting menus in a casual, community-focused space',
    cuisineTypes: ['American', 'Contemporary', 'Tasting Menu'],
    priceRange: 3,
    address: '541 Edgewood Ave SE',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30312',
    neighborhood: 'Old Fourth Ward',
    coordinates: { lat: 33.7554, lng: -84.3687 },
    phone: '(404) 524-5005',
    website: 'https://staplehouse.com',
    photos: ['https://example.com/staplehouse1.jpg'],
    coverPhoto: 'https://example.com/staplehouse1.jpg',
    ratings: {
      opentable: { score: 4.7, reviewCount: 987 },
      google: { score: 4.6, reviewCount: 654 },
    },
    aggregateRating: 4.7,
    features: ['counter_seating', 'vegetarian_friendly', 'romantic'],
    diningStyles: ['fine_dining', 'american'],
    hours: {
      monday: { isOpen: false },
      tuesday: { isOpen: false },
      wednesday: { isOpen: true, openTime: '18:00', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '18:00', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '18:00', closeTime: '22:30' },
      saturday: { isOpen: true, openTime: '18:00', closeTime: '22:30' },
      sunday: { isOpen: false },
    },
    acceptsReservations: true,
    reservationProviders: ['opentable'],
    tags: ['tasting menu', 'creative', 'old fourth ward', 'intimate'],
  },
  {
    id: 'rest-4',
    externalIds: { resy: 'resy-678' },
    name: 'Lazy Betty',
    description: 'Inventive tasting menus in a sleek, intimate setting',
    cuisineTypes: ['American', 'Contemporary', 'Tasting Menu'],
    priceRange: 4,
    address: '1530 DeKalb Ave NE',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30307',
    neighborhood: 'Candler Park',
    coordinates: { lat: 33.7623, lng: -84.3389 },
    phone: '(404) 975-3692',
    website: 'https://lazybettyatl.com',
    photos: ['https://example.com/lazybetty1.jpg'],
    coverPhoto: 'https://example.com/lazybetty1.jpg',
    ratings: {
      resy: { score: 4.9, reviewCount: 1432 },
      google: { score: 4.8, reviewCount: 876 },
    },
    aggregateRating: 4.9,
    features: ['counter_seating', 'private_dining', 'romantic', 'vegetarian_friendly'],
    diningStyles: ['fine_dining', 'american'],
    hours: {
      monday: { isOpen: false },
      tuesday: { isOpen: false },
      wednesday: { isOpen: true, openTime: '17:30', closeTime: '21:30' },
      thursday: { isOpen: true, openTime: '17:30', closeTime: '21:30' },
      friday: { isOpen: true, openTime: '17:00', closeTime: '22:00' },
      saturday: { isOpen: true, openTime: '17:00', closeTime: '22:00' },
      sunday: { isOpen: false },
    },
    acceptsReservations: true,
    reservationProviders: ['resy'],
    requiresCreditCard: true,
    cancellationPolicy: '$75 per person for cancellations within 48 hours',
    tags: ['tasting menu', 'michelin', 'special occasion', 'candler park'],
  },
  {
    id: 'rest-5',
    externalIds: { opentable: 'ot-456', resy: 'resy-789' },
    name: 'Miller Union',
    description: 'Southern farm-to-table cuisine in a converted warehouse',
    cuisineTypes: ['Southern', 'American', 'Farm-to-Table'],
    priceRange: 3,
    address: '999 Brady Ave NW',
    city: 'Atlanta',
    state: 'GA',
    zipCode: '30318',
    neighborhood: 'Westside',
    coordinates: { lat: 33.7891, lng: -84.4156 },
    phone: '(678) 733-8550',
    website: 'https://millerunion.com',
    photos: ['https://example.com/millerunion1.jpg'],
    coverPhoto: 'https://example.com/millerunion1.jpg',
    ratings: {
      opentable: { score: 4.6, reviewCount: 1876 },
      resy: { score: 4.7, reviewCount: 1234 },
    },
    aggregateRating: 4.7,
    features: ['outdoor_seating', 'brunch', 'vegetarian_friendly', 'gluten_free_options'],
    diningStyles: ['casual_dining', 'american', 'southern'],
    hours: {
      monday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      tuesday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      wednesday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      thursday: { isOpen: true, openTime: '17:30', closeTime: '22:00' },
      friday: { isOpen: true, openTime: '17:30', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '10:30', closeTime: '23:00' },
      sunday: { isOpen: true, openTime: '10:30', closeTime: '14:30' },
    },
    acceptsReservations: true,
    reservationProviders: ['opentable', 'resy'],
    tags: ['farm to table', 'southern', 'brunch', 'westside', 'date night'],
  },
];

// Export singleton
export const restaurantBookingService = new RestaurantBookingService();
