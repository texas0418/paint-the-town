// Paint the Town Favorite Places - Type Definitions

// ============================================================================
// PLACE TYPES
// ============================================================================

export type PlaceCategory =
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'hotel'
  | 'attraction'
  | 'museum'
  | 'park'
  | 'beach'
  | 'shopping'
  | 'viewpoint'
  | 'landmark'
  | 'entertainment'
  | 'transport'
  | 'other';

export type PriceLevel = 'free' | 'budget' | 'moderate' | 'expensive' | 'luxury';

export interface PlaceLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface PlaceContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

export interface PlaceHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  notes?: string;
  isOpen24Hours?: boolean;
}

export interface PlacePhoto {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  caption?: string;
  takenAt?: string;
  isMain?: boolean;
}

export interface PlaceVisit {
  id: string;
  date: string;
  tripId?: string;
  tripName?: string;
  rating?: number;
  notes?: string;
  photos?: string[];
  companions?: string[];
  spent?: {
    amount: number;
    currency: string;
  };
}

export interface PlaceRecommendation {
  what: string; // "Try the tiramisu"
  tip?: string; // "Ask for the secret menu"
}

// ============================================================================
// FAVORITE PLACE
// ============================================================================

export interface FavoritePlace {
  id: string;

  // Basic info
  name: string;
  category: PlaceCategory;
  description?: string;

  // Location
  location: PlaceLocation;

  // Media
  photos: PlacePhoto[];
  coverPhotoId?: string;

  // Details
  priceLevel?: PriceLevel;
  cuisineType?: string; // For restaurants
  contact?: PlaceContact;
  hours?: PlaceHours;

  // Personal data
  rating: number; // 1-5
  tags: string[];
  notes?: string;
  recommendations: PlaceRecommendation[];

  // Visit history
  visits: PlaceVisit[];
  firstVisited?: string;
  lastVisited?: string;
  visitCount: number;

  // Organization
  collectionIds: string[];
  isFavorite: boolean; // "Super favorite" / heart

  // Sharing
  isPublic: boolean;
  sharedWith?: string[];

  // Source
  source?: {
    type: 'manual' | 'google' | 'tripadvisor' | 'yelp' | 'import';
    externalId?: string;
    url?: string;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// COLLECTIONS
// ============================================================================

export interface PlaceCollection {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  color?: string;
  coverPhotoUri?: string;

  // Places
  placeIds: string[];
  placeCount: number;

  // Organization
  isDefault?: boolean; // e.g., "Want to Visit", "Been There"
  sortOrder: number;

  // Sharing
  isPublic: boolean;
  sharedWith?: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// FILTERS & SORTING
// ============================================================================

export interface PlaceFilters {
  categories?: PlaceCategory[];
  priceLevel?: PriceLevel[];
  minRating?: number;
  cities?: string[];
  countries?: string[];
  tags?: string[];
  hasPhotos?: boolean;
  hasNotes?: boolean;
  visitedInLastDays?: number;
  notVisitedInDays?: number;
  collectionId?: string;
  searchQuery?: string;
}

export type PlaceSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'rating_high'
  | 'rating_low'
  | 'recent_visit'
  | 'oldest_visit'
  | 'most_visited'
  | 'recently_added'
  | 'distance';

// ============================================================================
// QUICK ADD
// ============================================================================

export interface QuickAddPlace {
  name: string;
  category?: PlaceCategory;
  location?: Partial<PlaceLocation>;
  rating?: number;
  notes?: string;
  photoUri?: string;
  collectionId?: string;
}

// ============================================================================
// NEARBY
// ============================================================================

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  categories?: PlaceCategory[];
  limit?: number;
}

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

export interface PlaceExport {
  version: string;
  exportedAt: string;
  places: FavoritePlace[];
  collections: PlaceCollection[];
}

export interface PlaceImportResult {
  placesImported: number;
  placesSkipped: number;
  collectionsImported: number;
  errors: string[];
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface PlaceStatistics {
  totalPlaces: number;
  totalVisits: number;
  totalCollections: number;

  byCategory: Record<PlaceCategory, number>;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byRating: Record<number, number>;

  mostVisited: FavoritePlace[];
  recentlyAdded: FavoritePlace[];
  topRated: FavoritePlace[];

  averageRating: number;
  placesWithPhotos: number;
  placesWithNotes: number;
}

// ============================================================================
// UI STATE
// ============================================================================

export interface FavoritePlacesState {
  places: FavoritePlace[];
  collections: PlaceCollection[];

  // Filters & sorting
  filters: PlaceFilters;
  sortBy: PlaceSortOption;

  // UI
  selectedPlaceId: string | null;
  selectedCollectionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Location
  userLocation: PlaceLocation | null;
}

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

export interface CategoryConfig {
  id: PlaceCategory;
  name: string;
  icon: string;
  color: string;
}

export const PLACE_CATEGORIES: CategoryConfig[] = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', color: '#FF6B6B' },
  { id: 'cafe', name: 'Café', icon: '☕', color: '#C4A77D' },
  { id: 'bar', name: 'Bar', icon: '🍸', color: '#9B59B6' },
  { id: 'hotel', name: 'Hotel', icon: '🏨', color: '#3498DB' },
  { id: 'attraction', name: 'Attraction', icon: '🎡', color: '#E74C3C' },
  { id: 'museum', name: 'Museum', icon: '🏛️', color: '#8E44AD' },
  { id: 'park', name: 'Park', icon: '🌳', color: '#27AE60' },
  { id: 'beach', name: 'Beach', icon: '🏖️', color: '#F39C12' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#E91E63' },
  { id: 'viewpoint', name: 'Viewpoint', icon: '🌅', color: '#FF9800' },
  { id: 'landmark', name: 'Landmark', icon: '🗼', color: '#607D8B' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭', color: '#673AB7' },
  { id: 'transport', name: 'Transport', icon: '🚉', color: '#00BCD4' },
  { id: 'other', name: 'Other', icon: '📍', color: '#95A5A6' },
];

// ============================================================================
// PRICE LEVEL CONFIG
// ============================================================================

export const PRICE_LEVELS: { id: PriceLevel; label: string; symbol: string }[] = [
  { id: 'free', label: 'Free', symbol: '🆓' },
  { id: 'budget', label: 'Budget', symbol: '$' },
  { id: 'moderate', label: 'Moderate', symbol: '$$' },
  { id: 'expensive', label: 'Expensive', symbol: '$$$' },
  { id: 'luxury', label: 'Luxury', symbol: '$$$$' },
];
