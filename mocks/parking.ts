// ============================================================================
// Mock Parking Data for Paint the Town Development
// ============================================================================

import { ParkingLocation, ParkingType, AvailabilityStatus } from '../types/parking';

// Helper to create parking locations
const createParking = (
  id: string,
  name: string,
  type: ParkingType,
  overrides: Partial<ParkingLocation> = {}
): ParkingLocation => ({
  id,
  name,
  type,
  address: '',
  city: '',
  coordinates: { lat: 0, lng: 0 },
  totalSpaces: 100,
  availabilityStatus: 'available' as AvailabilityStatus,
  pricing: {
    currency: 'USD',
    hourlyRate: 5,
    dailyMax: 25,
    validationAvailable: false,
    displayPrice: '$5/hr',
    priceCategory: 'moderate',
  },
  hours: {
    monday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
    tuesday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
    wednesday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
    thursday: { isOpen: true, openTime: '06:00', closeTime: '23:00' },
    friday: { isOpen: true, openTime: '06:00', closeTime: '00:00' },
    saturday: { isOpen: true, openTime: '07:00', closeTime: '00:00' },
    sunday: { isOpen: true, openTime: '07:00', closeTime: '22:00' },
  },
  is24Hours: false,
  isOpen: true,
  features: ['covered', 'security_cameras'],
  vehicleTypes: ['car', 'suv'],
  canReserve: false,
  ...overrides,
});

// ============================================================================
// Sample Parking Near Popular Destinations
// ============================================================================

// Tokyo/Asakusa Area Parking
export const tokyoParkingLocations: ParkingLocation[] = [
  createParking('tokyo-1', 'Asakusa Parking Garage', 'garage', {
    operator: 'Times Car Park',
    address: '2-1-15 Asakusa, Taito City',
    city: 'Tokyo',
    coordinates: { lat: 35.7148, lng: 139.7946 },
    totalSpaces: 280,
    availableSpaces: 45,
    availabilityStatus: 'available',
    pricing: {
      currency: 'JPY',
      hourlyRate: 400,
      dailyMax: 2800,
      validationAvailable: true,
      validationDiscount: '1 hour free with temple visit',
      displayPrice: '¥400/hr',
      priceCategory: 'moderate',
    },
    is24Hours: true,
    features: ['indoor', 'security_cameras', 'elevator', 'handicap_accessible', 'ev_charging'],
    rating: 4.3,
    reviewCount: 156,
    phone: '+81-3-5830-1234',
    canReserve: true,
    reservationProvider: 'direct',
    heightLimit: 6.5,
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
    ],
  }),
  createParking('tokyo-2', 'Senso-ji Temple Lot', 'surface_lot', {
    address: '2-3-1 Asakusa, Taito City',
    city: 'Tokyo',
    coordinates: { lat: 35.7154, lng: 139.7966 },
    totalSpaces: 85,
    availableSpaces: 12,
    availabilityStatus: 'limited',
    pricing: {
      currency: 'JPY',
      hourlyRate: 500,
      dailyMax: 2000,
      validationAvailable: false,
      displayPrice: '¥500/hr',
      priceCategory: 'moderate',
    },
    features: ['outdoor', 'attendant', 'handicap_accessible'],
    rating: 3.8,
    reviewCount: 89,
    distance: 0.2,
    distanceText: '0.2 mi',
    walkingTime: 4,
  }),
  createParking('tokyo-3', 'ROX Parking Tower', 'garage', {
    operator: 'ROX Corporation',
    address: '1-25-15 Asakusa, Taito City',
    city: 'Tokyo',
    coordinates: { lat: 35.7136, lng: 139.7958 },
    totalSpaces: 420,
    availableSpaces: 180,
    availabilityStatus: 'available',
    pricing: {
      currency: 'JPY',
      hourlyRate: 350,
      firstHourRate: 300,
      dailyMax: 2400,
      validationAvailable: true,
      validationDiscount: '2 hours free with ¥2000 purchase',
      displayPrice: '¥350/hr',
      priceCategory: 'budget',
    },
    is24Hours: false,
    features: ['indoor', 'elevator', 'security_cameras', 'restrooms', 'car_wash'],
    rating: 4.5,
    reviewCount: 234,
    canReserve: true,
    website: 'https://rox.co.jp/parking',
  }),
  createParking('tokyo-4', 'Kaminarimon Street Parking', 'street', {
    address: 'Kaminarimon Street, Taito City',
    city: 'Tokyo',
    coordinates: { lat: 35.7108, lng: 139.7946 },
    totalSpaces: 15,
    availabilityStatus: 'unknown',
    pricing: {
      currency: 'JPY',
      hourlyRate: 300,
      dailyMax: 0, // No daily max for street
      validationAvailable: false,
      displayPrice: '¥300/hr',
      priceCategory: 'budget',
    },
    features: ['outdoor'],
    vehicleTypes: ['car'],
    notes: 'Metered parking. 2-hour limit.',
    accessInstructions: 'Pay at meter. Display receipt on dashboard.',
  }),
];

// San Francisco Area Parking
export const sfParkingLocations: ParkingLocation[] = [
  createParking('sf-1', 'Pier 39 Parking Garage', 'garage', {
    operator: 'Pier 39 Limited Partnership',
    address: 'Beach Street & The Embarcadero',
    city: 'San Francisco',
    coordinates: { lat: 37.8087, lng: -122.4098 },
    totalSpaces: 900,
    availableSpaces: 234,
    availabilityStatus: 'available',
    pricing: {
      currency: 'USD',
      hourlyRate: 8,
      firstHourRate: 10,
      dailyMax: 48,
      weekendRate: 55,
      validationAvailable: true,
      validationDiscount: '1 hour free with $25 purchase',
      displayPrice: '$8/hr',
      priceCategory: 'premium',
    },
    is24Hours: false,
    features: ['covered', 'security_cameras', 'elevator', 'handicap_accessible', 'ev_charging', 'restrooms'],
    rating: 4.1,
    reviewCount: 1245,
    phone: '+1-415-981-8030',
    website: 'https://pier39.com/parking',
    canReserve: true,
    reservationProvider: 'spothero',
    heightLimit: 6.6,
    images: [
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    ],
  }),
  createParking('sf-2', 'Fisherman\'s Wharf Garage', 'garage', {
    operator: 'SP+ Parking',
    address: '665 Beach Street',
    city: 'San Francisco',
    coordinates: { lat: 37.8072, lng: -122.4183 },
    totalSpaces: 450,
    availableSpaces: 89,
    availabilityStatus: 'limited',
    pricing: {
      currency: 'USD',
      hourlyRate: 7,
      dailyMax: 40,
      earlyBirdRate: 25,
      earlyBirdEndTime: '9:00 AM',
      eveningRate: 20,
      eveningStartTime: '4:00 PM',
      validationAvailable: false,
      displayPrice: '$7/hr',
      priceCategory: 'moderate',
    },
    features: ['covered', 'security_cameras', 'handicap_accessible'],
    rating: 3.9,
    reviewCount: 567,
    canReserve: true,
    reservationProvider: 'parkwhiz',
  }),
  createParking('sf-3', 'Ghirardelli Square Parking', 'garage', {
    address: '900 North Point Street',
    city: 'San Francisco',
    coordinates: { lat: 37.8060, lng: -122.4224 },
    totalSpaces: 280,
    availableSpaces: 45,
    availabilityStatus: 'limited',
    pricing: {
      currency: 'USD',
      hourlyRate: 9,
      dailyMax: 55,
      validationAvailable: true,
      validationDiscount: '2 hours free with validation',
      displayPrice: '$9/hr',
      priceCategory: 'premium',
    },
    features: ['indoor', 'elevator', 'security_cameras', 'handicap_accessible'],
    rating: 4.2,
    reviewCount: 389,
  }),
  createParking('sf-4', 'North Point Valet', 'valet', {
    operator: 'Luxe Valet Services',
    address: '700 North Point Street',
    city: 'San Francisco',
    coordinates: { lat: 37.8055, lng: -122.4210 },
    totalSpaces: 50,
    availabilityStatus: 'available',
    pricing: {
      currency: 'USD',
      hourlyRate: 15,
      dailyMax: 65,
      validationAvailable: false,
      displayPrice: '$15/hr',
      priceCategory: 'valet',
    },
    is24Hours: false,
    features: ['valet_available', 'attendant'],
    rating: 4.6,
    reviewCount: 123,
    phone: '+1-415-555-0123',
    notes: 'Tip included. Premium service available.',
  }),
  createParking('sf-5', 'Beach Street Meters', 'street', {
    address: 'Beach Street (Jefferson to Powell)',
    city: 'San Francisco',
    coordinates: { lat: 37.8078, lng: -122.4150 },
    totalSpaces: 25,
    availabilityStatus: 'unknown',
    pricing: {
      currency: 'USD',
      hourlyRate: 4,
      dailyMax: 0,
      validationAvailable: false,
      displayPrice: '$4/hr',
      priceCategory: 'budget',
    },
    features: ['outdoor'],
    notes: '2-hour limit. Pay via PayByPhone app or meter.',
    accessInstructions: 'Download PayByPhone app. Zone 1044.',
  }),
];

// New York City Parking
export const nycParkingLocations: ParkingLocation[] = [
  createParking('nyc-1', 'Times Square Parking', 'garage', {
    operator: 'Icon Parking',
    address: '222 W 44th Street',
    city: 'New York',
    coordinates: { lat: 40.7576, lng: -73.9857 },
    totalSpaces: 450,
    availableSpaces: 78,
    availabilityStatus: 'limited',
    pricing: {
      currency: 'USD',
      hourlyRate: 25,
      dailyMax: 65,
      eveningRate: 35,
      eveningStartTime: '6:00 PM',
      eventRate: 75,
      validationAvailable: true,
      validationDiscount: '20% off with Broadway ticket',
      displayPrice: '$25/hr',
      priceCategory: 'premium',
    },
    is24Hours: true,
    features: ['indoor', 'elevator', 'security_cameras', 'attendant', 'handicap_accessible'],
    rating: 3.7,
    reviewCount: 892,
    canReserve: true,
    reservationProvider: 'spothero',
    heightLimit: 6.4,
  }),
  createParking('nyc-2', 'Central Park South Garage', 'garage', {
    operator: 'LAZ Parking',
    address: '125 W 58th Street',
    city: 'New York',
    coordinates: { lat: 40.7658, lng: -73.9771 },
    totalSpaces: 320,
    availableSpaces: 156,
    availabilityStatus: 'available',
    pricing: {
      currency: 'USD',
      hourlyRate: 20,
      dailyMax: 55,
      validationAvailable: false,
      displayPrice: '$20/hr',
      priceCategory: 'premium',
    },
    features: ['covered', 'elevator', 'security_cameras', 'ev_charging'],
    rating: 4.0,
    reviewCount: 445,
    canReserve: true,
    reservationProvider: 'parkwhiz',
  }),
  createParking('nyc-3', 'Plaza Hotel Valet', 'valet', {
    operator: 'The Plaza Hotel',
    address: '768 5th Avenue',
    city: 'New York',
    coordinates: { lat: 40.7645, lng: -73.9744 },
    totalSpaces: 100,
    availabilityStatus: 'available',
    pricing: {
      currency: 'USD',
      hourlyRate: 45,
      dailyMax: 125,
      validationAvailable: true,
      validationDiscount: 'Complimentary for hotel guests',
      displayPrice: '$45/hr',
      priceCategory: 'valet',
    },
    features: ['valet_available', 'attendant', 'car_wash'],
    rating: 4.8,
    reviewCount: 234,
    phone: '+1-212-759-3000',
  }),
];

// Generic parking generator based on location
export const generateMockParking = (
  centerLat: number,
  centerLng: number,
  count: number = 10
): ParkingLocation[] => {
  const types: ParkingType[] = ['garage', 'surface_lot', 'street', 'valet'];
  const statuses: AvailabilityStatus[] = ['available', 'available', 'limited', 'full', 'unknown'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const distance = (Math.random() * 0.8 + 0.1).toFixed(2);
    const hourlyRate = type === 'valet' ? 15 + Math.random() * 20 : 3 + Math.random() * 12;
    
    // Random offset from center (within ~0.5 mile)
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    
    return createParking(`gen-${i}`, `Parking ${type === 'garage' ? 'Garage' : type === 'valet' ? 'Valet' : 'Lot'} ${i + 1}`, type, {
      coordinates: {
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
      },
      distance: parseFloat(distance),
      distanceText: `${distance} mi`,
      walkingTime: Math.round(parseFloat(distance) * 20),
      availabilityStatus: status,
      availableSpaces: status === 'full' ? 0 : Math.floor(Math.random() * 100) + 5,
      totalSpaces: Math.floor(Math.random() * 400) + 50,
      pricing: {
        currency: 'USD',
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        dailyMax: Math.round(hourlyRate * 6),
        validationAvailable: Math.random() > 0.6,
        displayPrice: `$${hourlyRate.toFixed(0)}/hr`,
        priceCategory: hourlyRate > 15 ? 'premium' : hourlyRate > 8 ? 'moderate' : 'budget',
      },
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 20,
      features: [
        ...(type === 'garage' ? ['covered', 'security_cameras'] : []),
        ...(Math.random() > 0.7 ? ['ev_charging'] : []),
        ...(Math.random() > 0.5 ? ['handicap_accessible'] : []),
        ...(type === 'valet' ? ['valet_available', 'attendant'] : []),
      ] as any[],
      canReserve: type !== 'street' && Math.random() > 0.4,
    });
  });
};

// Get parking for a specific city/destination
export const getParkingByDestination = (destinationName: string): ParkingLocation[] => {
  const name = destinationName.toLowerCase();
  
  if (name.includes('tokyo') || name.includes('asakusa') || name.includes('senso')) {
    return tokyoParkingLocations;
  }
  
  if (name.includes('san francisco') || name.includes('pier 39') || name.includes('fisherman')) {
    return sfParkingLocations;
  }
  
  if (name.includes('new york') || name.includes('times square') || name.includes('central park')) {
    return nycParkingLocations;
  }
  
  // Default: generate mock data
  return generateMockParking(40.7128, -74.0060, 8);
};
