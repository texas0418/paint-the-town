/* eslint-disable max-lines -- tracked in #1 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DatePreferences,
  PartnerProfile,
  UserDateProfile,
  DateItinerary,
  DateSuggestion,
  BudgetTier,
  TripScope,
  ItineraryActivity,
} from '@/types/date-night';

interface DateNightContextType {
  // User profile
  userProfile: UserDateProfile | null;
  setUserPreferences: (preferences: DatePreferences) => void;

  // Partner management
  partners: PartnerProfile[];
  addPartner: (partner: Omit<PartnerProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePartner: (partnerId: string, updates: Partial<PartnerProfile>) => void;
  removePartner: (partnerId: string) => void;
  selectedPartner: PartnerProfile | null;
  setSelectedPartner: (partner: PartnerProfile | null) => void;

  // Itineraries
  itineraries: DateItinerary[];
  currentItinerary: DateItinerary | null;
  createItinerary: (
    itinerary: Omit<DateItinerary, 'id' | 'createdAt' | 'updatedAt'>
  ) => DateItinerary;
  updateItinerary: (itineraryId: string, updates: Partial<DateItinerary>) => void;
  deleteItinerary: (itineraryId: string) => void;
  setCurrentItinerary: (itinerary: DateItinerary | null) => void;

  // Activity management within itinerary
  addActivity: (itineraryId: string, activity: Omit<ItineraryActivity, 'id'>) => void;
  updateActivity: (
    itineraryId: string,
    activityId: string,
    updates: Partial<ItineraryActivity>
  ) => void;
  removeActivity: (itineraryId: string, activityId: string) => void;
  reorderActivities: (itineraryId: string, activityIds: string[]) => void;

  // Suggestions
  suggestions: DateSuggestion[];
  generateSuggestions: (
    partnerId: string,
    budget: BudgetTier,
    date: string,
    tripScope: TripScope
  ) => Promise<void>;
  isGenerating: boolean;

  // UI State
  isLoading: boolean;
}

const DateNightContext = createContext<DateNightContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultPreferences: DatePreferences = {
  cuisineTypes: [],
  dietaryRestrictions: ['none'],
  activityTypes: [],
  environmentPreference: 'both',
  preferredTimeOfDay: ['evening'],
  maxTravelDistance: 25,
  budgetTier: '$$',
};

// Mock suggestions data with trip scope
const mockSuggestions: DateSuggestion[] = [
  // LOCAL suggestions
  {
    id: '1',
    title: 'Romantic Dinner & Stargazing',
    description:
      'An intimate evening starting with a candlelit dinner followed by stargazing at a scenic overlook.',
    tripScope: 'local',
    activities: [
      {
        name: 'Candlelit Dinner',
        description: 'Enjoy a romantic dinner at an upscale Italian restaurant',
        type: 'dining',
        location: { name: 'La Bella Vista', address: '123 Main St' },
        startTime: '7:00 PM',
        endTime: '9:00 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Scenic Drive',
        description: 'Short drive to the overlook point',
        type: 'transportation',
        location: { name: 'Mountain View Point', address: '456 Hilltop Rd' },
        startTime: '9:15 PM',
        endTime: '9:45 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Stargazing',
        description: 'Watch the stars together with hot cocoa',
        type: 'romantic',
        location: { name: 'Mountain View Point', address: '456 Hilltop Rd' },
        startTime: '9:45 PM',
        endTime: '11:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 95,
    estimatedTotalCost: '$$$',
    estimatedDuration: '4 hours',
    tags: ['romantic', 'dinner', 'outdoor', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  },
  {
    id: '2',
    title: 'Adventure Day: Hiking & Picnic',
    description: 'An active day exploring nature trails followed by a scenic picnic lunch.',
    tripScope: 'local',
    activities: [
      {
        name: 'Morning Hike',
        description: 'Scenic trail with beautiful views',
        type: 'active',
        location: { name: 'Riverside Trail', address: 'State Park Entrance' },
        startTime: '9:00 AM',
        endTime: '12:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Gourmet Picnic',
        description: 'Pre-packed gourmet picnic basket at the overlook',
        type: 'dining',
        location: { name: 'Summit Overlook', address: 'State Park' },
        startTime: '12:00 PM',
        endTime: '1:30 PM',
        estimatedCost: '$$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 88,
    estimatedTotalCost: '$$',
    estimatedDuration: '5 hours',
    tags: ['adventure', 'outdoor', 'active', 'nature'],
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
  },
  {
    id: '3',
    title: 'Cozy Indoor Evening',
    description: 'A relaxed evening with cooking class and movie night.',
    tripScope: 'local',
    activities: [
      {
        name: 'Couples Cooking Class',
        description: 'Learn to make pasta from scratch together',
        type: 'creative',
        location: { name: 'Culinary Studio', address: '100 Chef Way' },
        startTime: '6:00 PM',
        endTime: '8:30 PM',
        estimatedCost: '$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Dessert & Movie',
        description: 'Ice cream and a movie at home',
        type: 'intimate',
        location: { name: 'Home', address: 'Your place' },
        startTime: '9:00 PM',
        endTime: '11:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 79,
    estimatedTotalCost: '$$',
    estimatedDuration: '5 hours',
    tags: ['relaxed', 'indoor', 'cooking', 'intimate'],
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  },

  {
    id: '9',
    title: 'Art Gallery Hop & Cocktails',
    description: 'Explore local art galleries followed by craft cocktails at a speakeasy.',
    tripScope: 'local',
    activities: [
      {
        name: 'Gallery Walk',
        description: 'Visit 2-3 galleries in the arts district',
        type: 'cultural',
        location: { name: 'Arts District', address: 'Downtown' },
        startTime: '4:00 PM',
        endTime: '6:30 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Speakeasy Cocktails',
        description: 'Hand-crafted cocktails at a hidden bar',
        type: 'dining',
        location: { name: 'The Hidden Door', address: '88 Vine St' },
        startTime: '7:00 PM',
        endTime: '9:00 PM',
        estimatedCost: '$$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 82,
    estimatedTotalCost: '$$',
    estimatedDuration: '5 hours',
    tags: ['art', 'cocktails', 'evening', 'cultural'],
    imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
  },
  {
    id: '10',
    title: 'Sunset Picnic in the Park',
    description: 'A simple, beautiful evening with gourmet snacks and golden-hour views.',
    tripScope: 'local',
    activities: [
      {
        name: 'Farmers Market Run',
        description: 'Pick up artisan cheeses, bread, and fruit together',
        type: 'active',
        location: { name: 'Saturday Market', address: 'City Square' },
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Sunset Picnic',
        description: 'Spread a blanket and enjoy the sunset together',
        type: 'romantic',
        location: { name: 'Lakeside Park', address: 'Lakeview Dr' },
        startTime: '5:30 PM',
        endTime: '8:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 76,
    estimatedTotalCost: '$',
    estimatedDuration: '4 hours',
    tags: ['romantic', 'outdoor', 'budget', 'sunset'],
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
  },
  {
    id: '11',
    title: 'Live Jazz & Late-Night Bites',
    description: 'An effortlessly cool evening with live music and great food.',
    tripScope: 'local',
    activities: [
      {
        name: 'Live Jazz Show',
        description: 'Intimate jazz performance at a cozy venue',
        type: 'entertainment',
        location: { name: 'Blue Note Lounge', address: '220 Music Row' },
        startTime: '8:00 PM',
        endTime: '10:00 PM',
        estimatedCost: '$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Late-Night Eats',
        description: 'Share small plates at a buzzy late-night spot',
        type: 'dining',
        location: { name: 'The Night Owl', address: '42 Market St' },
        startTime: '10:15 PM',
        endTime: '11:30 PM',
        estimatedCost: '$$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 84,
    estimatedTotalCost: '$$',
    estimatedDuration: '3.5 hours',
    tags: ['music', 'nightlife', 'food', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
  },
  {
    id: '12',
    title: 'Morning Market & Spa Day',
    description: 'Start with brunch at a local market, then unwind at a luxury spa.',
    tripScope: 'local',
    activities: [
      {
        name: 'Brunch at the Market',
        description: 'Farm-fresh brunch at the indoor food hall',
        type: 'dining',
        location: { name: 'The Grand Market', address: '15 Central Ave' },
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        estimatedCost: '$$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Couples Spa Treatment',
        description: 'Side-by-side massages and access to thermal baths',
        type: 'relaxed',
        location: { name: 'Serenity Spa', address: '300 Wellness Blvd' },
        startTime: '12:30 PM',
        endTime: '3:00 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 90,
    estimatedTotalCost: '$$$',
    estimatedDuration: '5 hours',
    tags: ['wellness', 'brunch', 'relaxation', 'daytime'],
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
  },
  {
    id: '13',
    title: 'Bookshop Date & Coffee',
    description: 'Browse a charming independent bookshop, then read together over coffee.',
    tripScope: 'local',
    activities: [
      {
        name: 'Bookshop Browsing',
        description: 'Pick a book for each other at an indie bookstore',
        type: 'creative',
        location: { name: 'The Last Bookshop', address: '77 Oak Lane' },
        startTime: '2:00 PM',
        endTime: '3:30 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Coffee & Reading',
        description: 'Cozy up with your new books at a cafe',
        type: 'intimate',
        location: { name: 'Velvet Bean Café', address: '80 Oak Lane' },
        startTime: '3:30 PM',
        endTime: '5:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
    ],
    matchScore: 72,
    estimatedTotalCost: '$',
    estimatedDuration: '3 hours',
    tags: ['relaxed', 'indoor', 'budget', 'cozy'],
    imageUrl: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800',
  },
  {
    id: '14',
    title: 'Rooftop Dinner & City Lights',
    description: 'Elegant rooftop dining with sweeping views of the skyline.',
    tripScope: 'local',
    activities: [
      {
        name: 'Rooftop Cocktail Hour',
        description: 'Sunset drinks at a rooftop bar',
        type: 'dining',
        location: { name: 'Sky Lounge', address: '1 Tower Plaza, 40th Floor' },
        startTime: '6:30 PM',
        endTime: '7:30 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Multi-Course Dinner',
        description: "Chef's tasting menu with wine pairing",
        type: 'dining',
        location: { name: 'Altitude', address: '1 Tower Plaza, 41st Floor' },
        startTime: '7:30 PM',
        endTime: '10:00 PM',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 93,
    estimatedTotalCost: '$$$$',
    estimatedDuration: '3.5 hours',
    tags: ['luxury', 'romantic', 'dining', 'views'],
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
  },

  // DOMESTIC suggestions
  {
    id: '4',
    title: 'Wine Country Weekend',
    description: 'A romantic getaway to wine country with vineyard tours and fine dining.',
    tripScope: 'domestic',
    destination: 'Napa Valley, CA',
    activities: [
      {
        name: 'Scenic Drive',
        description: 'Beautiful 2-hour drive through rolling hills',
        type: 'transportation',
        location: { name: 'Highway 29', address: 'Napa Valley', city: 'Napa', country: 'USA' },
        startTime: 'Day 1 - 9:00 AM',
        endTime: '11:00 AM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Vineyard Tour & Tasting',
        description: 'Private tour with premium wine tasting',
        type: 'cultural',
        location: {
          name: 'Silver Oak Winery',
          address: 'Oakville, CA',
          city: 'Oakville',
          country: 'USA',
        },
        startTime: '11:30 AM',
        endTime: '1:30 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Farm-to-Table Dinner',
        description: 'Gourmet dinner at a renowned restaurant',
        type: 'dining',
        location: {
          name: 'The French Laundry',
          address: 'Yountville, CA',
          city: 'Yountville',
          country: 'USA',
        },
        startTime: '7:00 PM',
        endTime: '10:00 PM',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Boutique Hotel Stay',
        description: 'Overnight at a charming boutique hotel',
        type: 'accommodation',
        location: {
          name: 'Meadowood Resort',
          address: 'St. Helena, CA',
          city: 'St. Helena',
          country: 'USA',
        },
        startTime: 'Check-in 4 PM',
        endTime: 'Next Day',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 91,
    estimatedTotalCost: '$$$$',
    estimatedDuration: '2 days',
    tags: ['wine', 'romantic', 'getaway', 'luxury', 'foodie'],
    imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800',
  },
  {
    id: '5',
    title: 'Beach Escape to Miami',
    description: 'Sun, sand, and incredible nightlife in South Beach.',
    tripScope: 'domestic',
    destination: 'Miami, FL',
    activities: [
      {
        name: 'Flight to Miami',
        description: 'Direct flight to Miami International',
        type: 'transportation',
        location: { name: 'MIA Airport', address: 'Miami, FL', city: 'Miami', country: 'USA' },
        startTime: 'Day 1 - Morning',
        endTime: 'Afternoon',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Beach Day at South Beach',
        description: 'Relax on the iconic South Beach',
        type: 'relaxed',
        location: {
          name: 'South Beach',
          address: 'Ocean Drive',
          city: 'Miami Beach',
          country: 'USA',
        },
        startTime: '2:00 PM',
        endTime: '6:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Sunset Dinner',
        description: 'Oceanfront dining with sunset views',
        type: 'dining',
        location: {
          name: 'Smith & Wollensky',
          address: 'South Pointe Park',
          city: 'Miami Beach',
          country: 'USA',
        },
        startTime: '7:30 PM',
        endTime: '10:00 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 86,
    estimatedTotalCost: '$$$',
    estimatedDuration: '3 days',
    tags: ['beach', 'relaxation', 'nightlife', 'tropical'],
    imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800',
  },

  // INTERNATIONAL suggestions
  {
    id: '15',
    title: 'Mountain Cabin Retreat',
    description: 'A cozy cabin getaway with hiking, hot tubs, and home-cooked meals.',
    tripScope: 'domestic',
    destination: 'Asheville, NC',
    activities: [
      {
        name: 'Drive to the Mountains',
        description: 'Scenic drive through the Blue Ridge',
        type: 'transportation',
        location: {
          name: 'Blue Ridge Parkway',
          address: 'Asheville, NC',
          city: 'Asheville',
          country: 'USA',
        },
        startTime: 'Day 1 - 10:00 AM',
        endTime: '1:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Waterfall Hike',
        description: 'Easy trail to a stunning waterfall',
        type: 'active',
        location: {
          name: 'Looking Glass Falls',
          address: 'Pisgah Forest',
          city: 'Brevard',
          country: 'USA',
        },
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Cabin Evening',
        description: 'Cook dinner together and relax in the hot tub',
        type: 'intimate',
        location: {
          name: 'Mountain View Cabin',
          address: 'Asheville, NC',
          city: 'Asheville',
          country: 'USA',
        },
        startTime: '6:00 PM',
        endTime: '10:00 PM',
        estimatedCost: '$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 89,
    estimatedTotalCost: '$$',
    estimatedDuration: '2 days',
    tags: ['nature', 'cozy', 'cabin', 'hiking', 'budget-friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',
  },
  {
    id: '6',
    title: 'Paris Romance Getaway',
    description: 'An unforgettable escape to the City of Love.',
    tripScope: 'international',
    destination: 'Paris, France',
    activities: [
      {
        name: 'Flight to Paris',
        description: 'Direct flight to Charles de Gaulle',
        type: 'transportation',
        location: { name: 'CDG Airport', address: 'Paris', city: 'Paris', country: 'France' },
        startTime: 'Day 1',
        endTime: 'Day 1',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Eiffel Tower Sunset',
        description: 'Private champagne experience at the summit',
        type: 'romantic',
        location: {
          name: 'Eiffel Tower',
          address: 'Champ de Mars',
          city: 'Paris',
          country: 'France',
        },
        startTime: '6:00 PM',
        endTime: '8:00 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Michelin Star Dinner',
        description: 'Exquisite French cuisine with city views',
        type: 'dining',
        location: {
          name: 'Le Jules Verne',
          address: 'Eiffel Tower',
          city: 'Paris',
          country: 'France',
        },
        startTime: '8:30 PM',
        endTime: '11:00 PM',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Seine River Cruise',
        description: 'Romantic moonlit cruise along the Seine',
        type: 'romantic',
        location: {
          name: 'Bateaux Mouches',
          address: 'Port de la Conférence',
          city: 'Paris',
          country: 'France',
        },
        startTime: 'Day 2 - 9:00 PM',
        endTime: '11:00 PM',
        estimatedCost: '$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 97,
    estimatedTotalCost: '$$$$',
    estimatedDuration: '4 days',
    tags: ['paris', 'romantic', 'luxury', 'international', 'bucket-list'],
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  },
  {
    id: '7',
    title: 'Tokyo Adventure',
    description: 'Experience the perfect blend of ancient tradition and modern wonder.',
    tripScope: 'international',
    destination: 'Tokyo, Japan',
    activities: [
      {
        name: 'Flight to Tokyo',
        description: 'Flight to Narita International Airport',
        type: 'transportation',
        location: { name: 'NRT Airport', address: 'Tokyo', city: 'Tokyo', country: 'Japan' },
        startTime: 'Day 1',
        endTime: 'Day 1',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Tsukiji Outer Market',
        description: 'Fresh sushi breakfast at the famous fish market',
        type: 'dining',
        location: { name: 'Tsukiji Market', address: 'Chuo City', city: 'Tokyo', country: 'Japan' },
        startTime: 'Day 2 - 7:00 AM',
        endTime: '9:00 AM',
        estimatedCost: '$$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Senso-ji Temple',
        description: "Visit Tokyo's oldest Buddhist temple",
        type: 'cultural',
        location: { name: 'Senso-ji', address: 'Asakusa', city: 'Tokyo', country: 'Japan' },
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Omakase Dinner',
        description: "Chef's choice sushi experience",
        type: 'dining',
        location: { name: 'Sukiyabashi Jiro', address: 'Ginza', city: 'Tokyo', country: 'Japan' },
        startTime: '7:00 PM',
        endTime: '9:00 PM',
        estimatedCost: '$$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 92,
    estimatedTotalCost: '$$$$',
    estimatedDuration: '5 days',
    tags: ['tokyo', 'cultural', 'food', 'adventure', 'international'],
    imageUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
  },
  {
    id: '8',
    title: 'Santorini Sunset Escape',
    description: 'White-washed villages and breathtaking Aegean views.',
    tripScope: 'international',
    destination: 'Santorini, Greece',
    activities: [
      {
        name: 'Flight to Santorini',
        description: 'Fly into Santorini International Airport',
        type: 'transportation',
        location: {
          name: 'JTR Airport',
          address: 'Santorini',
          city: 'Santorini',
          country: 'Greece',
        },
        startTime: 'Day 1',
        endTime: 'Day 1',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Oia Sunset',
        description: 'Watch the famous Santorini sunset',
        type: 'romantic',
        location: { name: 'Oia Castle', address: 'Oia', city: 'Santorini', country: 'Greece' },
        startTime: '6:30 PM',
        endTime: '8:00 PM',
        estimatedCost: '$',
        reservationRequired: false,
        reservationMade: false,
      },
      {
        name: 'Cliffside Dinner',
        description: 'Romantic dinner overlooking the caldera',
        type: 'dining',
        location: {
          name: 'Lycabettus Restaurant',
          address: 'Oia',
          city: 'Santorini',
          country: 'Greece',
        },
        startTime: '8:30 PM',
        endTime: '10:30 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 94,
    estimatedTotalCost: '$$$',
    estimatedDuration: '4 days',
    tags: ['greece', 'romantic', 'sunset', 'island', 'views'],
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
  },
  {
    id: '16',
    title: 'Mexico City Food & Culture',
    description: 'Vibrant street food, ancient ruins, and colorful neighborhoods.',
    tripScope: 'international',
    destination: 'Mexico City, Mexico',
    activities: [
      {
        name: 'Flight to CDMX',
        description: 'Short flight to Mexico City',
        type: 'transportation',
        location: {
          name: 'MEX Airport',
          address: 'Mexico City',
          city: 'Mexico City',
          country: 'Mexico',
        },
        startTime: 'Day 1',
        endTime: 'Day 1',
        estimatedCost: '$$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Street Food Tour',
        description: 'Guided walking tour through the best taco stands and markets',
        type: 'dining',
        location: {
          name: 'Roma Norte',
          address: 'Colonia Roma',
          city: 'Mexico City',
          country: 'Mexico',
        },
        startTime: 'Day 2 - 11:00 AM',
        endTime: '2:00 PM',
        estimatedCost: '$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Frida Kahlo Museum',
        description: 'Visit the iconic Casa Azul',
        type: 'cultural',
        location: {
          name: 'Casa Azul',
          address: 'Coyoacán',
          city: 'Mexico City',
          country: 'Mexico',
        },
        startTime: '3:00 PM',
        endTime: '5:00 PM',
        estimatedCost: '$',
        reservationRequired: true,
        reservationMade: false,
      },
      {
        name: 'Mezcal Tasting & Dinner',
        description: 'Artisanal mezcal paired with contemporary Mexican cuisine',
        type: 'dining',
        location: { name: 'Pujol', address: 'Polanco', city: 'Mexico City', country: 'Mexico' },
        startTime: '8:00 PM',
        endTime: '10:30 PM',
        estimatedCost: '$$$',
        reservationRequired: true,
        reservationMade: false,
      },
    ],
    matchScore: 88,
    estimatedTotalCost: '$$$',
    estimatedDuration: '4 days',
    tags: ['food', 'culture', 'vibrant', 'art', 'international'],
    imageUrl: 'https://images.unsplash.com/photo-1518659526054-e8afeccf030a?w=800',
  },
];

export function DateNightProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [userProfile, setUserProfile] = useState<UserDateProfile>({
    id: generateId(),
    preferences: defaultPreferences,
    partners: [],
    savedItineraries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
  const [itineraries, setItineraries] = useState<DateItinerary[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<DateItinerary | null>(null);
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);

  const setUserPreferences = useCallback((preferences: DatePreferences) => {
    setUserProfile((prev) => ({
      ...prev,
      preferences,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addPartner = useCallback(
    (partner: Omit<PartnerProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newPartner: PartnerProfile = {
        ...partner,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPartners((prev) => [...prev, newPartner]);
      return newPartner;
    },
    []
  );

  const updatePartner = useCallback((partnerId: string, updates: Partial<PartnerProfile>) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    );
  }, []);

  const removePartner = useCallback(
    (partnerId: string) => {
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(null);
      }
    },
    [selectedPartner]
  );

  const createItinerary = useCallback(
    (itinerary: Omit<DateItinerary, 'id' | 'createdAt' | 'updatedAt'>): DateItinerary => {
      const newItinerary: DateItinerary = {
        ...itinerary,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItineraries((prev) => [...prev, newItinerary]);
      return newItinerary;
    },
    []
  );

  const updateItinerary = useCallback(
    (itineraryId: string, updates: Partial<DateItinerary>) => {
      setItineraries((prev) =>
        prev.map((i) =>
          i.id === itineraryId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
        )
      );
      if (currentItinerary?.id === itineraryId) {
        setCurrentItinerary((prev) =>
          prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null
        );
      }
    },
    [currentItinerary]
  );

  const deleteItinerary = useCallback(
    (itineraryId: string) => {
      setItineraries((prev) => prev.filter((i) => i.id !== itineraryId));
      if (currentItinerary?.id === itineraryId) {
        setCurrentItinerary(null);
      }
    },
    [currentItinerary]
  );

  const addActivity = useCallback(
    (itineraryId: string, activity: Omit<ItineraryActivity, 'id'>) => {
      const newActivity: ItineraryActivity = {
        ...activity,
        id: generateId(),
      };
      setItineraries((prev) =>
        prev.map((i) =>
          i.id === itineraryId
            ? {
                ...i,
                activities: [...i.activities, newActivity],
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    },
    []
  );

  const updateActivity = useCallback(
    (itineraryId: string, activityId: string, updates: Partial<ItineraryActivity>) => {
      setItineraries((prev) =>
        prev.map((i) =>
          i.id === itineraryId
            ? {
                ...i,
                activities: i.activities.map((a) =>
                  a.id === activityId ? { ...a, ...updates } : a
                ),
                updatedAt: new Date().toISOString(),
              }
            : i
        )
      );
    },
    []
  );

  const removeActivity = useCallback((itineraryId: string, activityId: string) => {
    setItineraries((prev) =>
      prev.map((i) =>
        i.id === itineraryId
          ? {
              ...i,
              activities: i.activities.filter((a) => a.id !== activityId),
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );
  }, []);

  const reorderActivities = useCallback((itineraryId: string, activityIds: string[]) => {
    setItineraries((prev) =>
      prev.map((i) => {
        if (i.id !== itineraryId) return i;
        const reordered = activityIds
          .map((id) => i.activities.find((a) => a.id === id)!)
          .filter(Boolean);
        return { ...i, activities: reordered, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const generateSuggestions = useCallback(
    async (partnerId: string, budget: BudgetTier, date: string, tripScope: TripScope) => {
      setIsGenerating(true);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Filter suggestions by trip scope and budget (allow one tier above for variety)
      const budgetOrder = ['$', '$$', '$$$', '$$$$'];
      const maxBudgetIndex = Math.min(budgetOrder.indexOf(budget) + 1, budgetOrder.length - 1);

      const filteredSuggestions = mockSuggestions.filter(
        (s) =>
          s.tripScope === tripScope && budgetOrder.indexOf(s.estimatedTotalCost) <= maxBudgetIndex
      );

      setSuggestions(filteredSuggestions);
      setIsGenerating(false);
    },
    []
  );

  const value: DateNightContextType = {
    userProfile,
    setUserPreferences,
    partners,
    addPartner,
    updatePartner,
    removePartner,
    selectedPartner,
    setSelectedPartner,
    itineraries,
    currentItinerary,
    createItinerary,
    updateItinerary,
    deleteItinerary,
    setCurrentItinerary,
    addActivity,
    updateActivity,
    removeActivity,
    reorderActivities,
    suggestions,
    generateSuggestions,
    isGenerating,
    isLoading,
  };

  return <DateNightContext.Provider value={value}>{children}</DateNightContext.Provider>;
}

export function useDateNight() {
  const context = useContext(DateNightContext);
  if (context === undefined) {
    throw new Error('useDateNight must be used within a DateNightProvider');
  }
  return context;
}
