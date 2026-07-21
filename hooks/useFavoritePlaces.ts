// Paint the Town Favorite Places - useFavoritePlaces Hook

import { useState, useCallback, useEffect, useMemo } from 'react';
import * as Location from 'expo-location';
import {
  FavoritePlace,
  PlaceCollection,
  PlaceCategory,
  PlaceFilters,
  PlaceSortOption,
  PlaceVisit,
  PlacePhoto,
  QuickAddPlace,
  PlaceStatistics,
  PlaceLocation,
  FavoritePlacesState,
} from '../types/places';
import { placesService } from '../services/placesService';

interface UseFavoritePlacesOptions {
  collectionId?: string;
  autoLoadLocation?: boolean;
}

// eslint-disable-next-line max-lines-per-function -- tracked in #1
export function useFavoritePlaces(options: UseFavoritePlacesOptions = {}) {
  const { collectionId, autoLoadLocation = false } = options;

  const [state, setState] = useState<FavoritePlacesState>({
    places: [],
    collections: [],
    filters: {},
    sortBy: 'recently_added',
    selectedPlaceId: null,
    selectedCollectionId: collectionId || null,
    isLoading: true,
    error: null,
    userLocation: null,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (autoLoadLocation) {
      getUserLocation();
    }
  }, [autoLoadLocation]);

  const initialize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [places, collections] = await Promise.all([
        collectionId 
          ? placesService.getPlacesInCollection(collectionId)
          : placesService.getPlaces(),
        placesService.getCollections(),
      ]);

      setState(prev => ({
        ...prev,
        places,
        collections,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load places',
      }));
    }
  }, [collectionId]);

  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setState(prev => ({
        ...prev,
        userLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      }));
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  }, []);

  // ============================================================================
  // PLACES CRUD
  // ============================================================================

  const addPlace = useCallback(async (data: QuickAddPlace): Promise<FavoritePlace | null> => {
    try {
      const place = await placesService.addPlace(data);
      setState(prev => ({
        ...prev,
        places: [place, ...prev.places],
      }));
      return place;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to add place' }));
      return null;
    }
  }, []);

  const updatePlace = useCallback(async (
    id: string,
    updates: Partial<FavoritePlace>
  ): Promise<FavoritePlace | null> => {
    try {
      const updated = await placesService.updatePlace(id, updates);
      if (updated) {
        setState(prev => ({
          ...prev,
          places: prev.places.map(p => p.id === id ? updated : p),
        }));
      }
      return updated;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update place' }));
      return null;
    }
  }, []);

  const deletePlace = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await placesService.deletePlace(id);
      if (success) {
        setState(prev => ({
          ...prev,
          places: prev.places.filter(p => p.id !== id),
          selectedPlaceId: prev.selectedPlaceId === id ? null : prev.selectedPlaceId,
        }));
      }
      return success;
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to delete place' }));
      return false;
    }
  }, []);

  const getPlace = useCallback((id: string): FavoritePlace | undefined => {
    return state.places.find(p => p.id === id);
  }, [state.places]);

  // ============================================================================
  // FAVORITES
  // ============================================================================

  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    try {
      const isFavorite = await placesService.toggleFavorite(id);
      setState(prev => ({
        ...prev,
        places: prev.places.map(p => 
          p.id === id ? { ...p, isFavorite } : p
        ),
      }));
      return isFavorite;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================================================
  // VISITS
  // ============================================================================

  const addVisit = useCallback(async (
    placeId: string,
    visit: Omit<PlaceVisit, 'id'>
  ): Promise<PlaceVisit | null> => {
    try {
      const newVisit = await placesService.addVisit(placeId, visit);
      if (newVisit) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return newVisit;
    } catch (error) {
      return null;
    }
  }, []);

  const deleteVisit = useCallback(async (
    placeId: string,
    visitId: string
  ): Promise<boolean> => {
    try {
      const success = await placesService.deleteVisit(placeId, visitId);
      if (success) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================================================
  // PHOTOS
  // ============================================================================

  const addPhoto = useCallback(async (
    placeId: string,
    photo: Omit<PlacePhoto, 'id'>
  ): Promise<PlacePhoto | null> => {
    try {
      const newPhoto = await placesService.addPhoto(placeId, photo);
      if (newPhoto) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return newPhoto;
    } catch (error) {
      return null;
    }
  }, []);

  const deletePhoto = useCallback(async (
    placeId: string,
    photoId: string
  ): Promise<boolean> => {
    try {
      const success = await placesService.deletePhoto(placeId, photoId);
      if (success) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================================================
  // COLLECTIONS
  // ============================================================================

  const createCollection = useCallback(async (
    data: Partial<PlaceCollection>
  ): Promise<PlaceCollection | null> => {
    try {
      const collection = await placesService.createCollection(data);
      setState(prev => ({
        ...prev,
        collections: [...prev.collections, collection],
      }));
      return collection;
    } catch (error) {
      return null;
    }
  }, []);

  const updateCollection = useCallback(async (
    id: string,
    updates: Partial<PlaceCollection>
  ): Promise<PlaceCollection | null> => {
    try {
      const updated = await placesService.updateCollection(id, updates);
      if (updated) {
        setState(prev => ({
          ...prev,
          collections: prev.collections.map(c => c.id === id ? updated : c),
        }));
      }
      return updated;
    } catch (error) {
      return null;
    }
  }, []);

  const deleteCollection = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await placesService.deleteCollection(id);
      if (success) {
        setState(prev => ({
          ...prev,
          collections: prev.collections.filter(c => c.id !== id),
        }));
      }
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  const addToCollection = useCallback(async (
    placeId: string,
    collectionId: string
  ): Promise<boolean> => {
    try {
      const success = await placesService.addPlaceToCollection(placeId, collectionId);
      if (success) {
        await initialize();
      }
      return success;
    } catch (error) {
      return false;
    }
  }, [initialize]);

  const removeFromCollection = useCallback(async (
    placeId: string,
    collectionId: string
  ): Promise<boolean> => {
    try {
      const success = await placesService.removePlaceFromCollection(placeId, collectionId);
      if (success) {
        await initialize();
      }
      return success;
    } catch (error) {
      return false;
    }
  }, [initialize]);

  // ============================================================================
  // TAGS
  // ============================================================================

  const addTag = useCallback(async (placeId: string, tag: string): Promise<boolean> => {
    try {
      const success = await placesService.addTag(placeId, tag);
      if (success) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  const removeTag = useCallback(async (placeId: string, tag: string): Promise<boolean> => {
    try {
      const success = await placesService.removeTag(placeId, tag);
      if (success) {
        const updated = await placesService.getPlace(placeId);
        if (updated) {
          setState(prev => ({
            ...prev,
            places: prev.places.map(p => p.id === placeId ? updated : p),
          }));
        }
      }
      return success;
    } catch (error) {
      return false;
    }
  }, []);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const setFilters = useCallback((filters: PlaceFilters) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const setSortBy = useCallback((sortBy: PlaceSortOption) => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredPlaces = useMemo(() => {
    let places = [...state.places];

    // Apply filters
    const { filters } = state;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      places = places.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.location.city?.toLowerCase().includes(query) ||
        p.location.country?.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    if (filters.categories?.length) {
      places = places.filter(p => filters.categories!.includes(p.category));
    }

    if (filters.minRating) {
      places = places.filter(p => p.rating >= filters.minRating!);
    }

    if (filters.collectionId) {
      places = places.filter(p => p.collectionIds.includes(filters.collectionId!));
    }

    // Apply sorting
    return placesService.sortPlaces(places, state.sortBy, state.userLocation || undefined);
  }, [state.places, state.filters, state.sortBy, state.userLocation]);

  const favoriteCount = useMemo(() => {
    return state.places.filter(p => p.isFavorite).length;
  }, [state.places]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    state.places.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [state.places]);

  const allCities = useMemo(() => {
    const citySet = new Set<string>();
    state.places.forEach(p => {
      if (p.location.city) citySet.add(p.location.city);
    });
    return Array.from(citySet).sort();
  }, [state.places]);

  const allCountries = useMemo(() => {
    const countrySet = new Set<string>();
    state.places.forEach(p => {
      if (p.location.country) countrySet.add(p.location.country);
    });
    return Array.from(countrySet).sort();
  }, [state.places]);

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const getStatistics = useCallback(async (): Promise<PlaceStatistics> => {
    return placesService.getStatistics();
  }, []);

  // ============================================================================
  // NEARBY
  // ============================================================================

  const findNearby = useCallback(async (
    radiusKm: number = 5,
    categories?: PlaceCategory[]
  ): Promise<FavoritePlace[]> => {
    if (!state.userLocation) {
      await getUserLocation();
    }
    
    if (!state.userLocation) return [];

    return placesService.findNearby({
      latitude: state.userLocation.latitude,
      longitude: state.userLocation.longitude,
      radiusKm,
      categories,
    });
  }, [state.userLocation, getUserLocation]);

  // ============================================================================
  // SELECTION
  // ============================================================================

  const selectPlace = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedPlaceId: id }));
  }, []);

  const selectCollection = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedCollectionId: id }));
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    ...state,
    filteredPlaces,
    favoriteCount,
    allTags,
    allCities,
    allCountries,

    // Places CRUD
    addPlace,
    updatePlace,
    deletePlace,
    getPlace,
    toggleFavorite,

    // Visits
    addVisit,
    deleteVisit,

    // Photos
    addPhoto,
    deletePhoto,

    // Collections
    createCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,

    // Tags
    addTag,
    removeTag,

    // Filtering & Sorting
    setFilters,
    setSortBy,
    clearFilters,

    // Statistics & Nearby
    getStatistics,
    findNearby,

    // Selection
    selectPlace,
    selectCollection,

    // Location
    getUserLocation,

    // Refresh
    refresh: initialize,
  };
}
