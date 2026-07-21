// Paint the Town Favorite Places - Places Service

import AsyncStorage from '@react-native-async-storage/async-storage';
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
  PlaceExport,
  PlaceImportResult,
  NearbySearchParams,
  PlaceLocation,
} from '../types/places';

const STORAGE_KEYS = {
  PLACES: '@w4nder/favorite_places',
  COLLECTIONS: '@w4nder/place_collections',
  SETTINGS: '@w4nder/places_settings',
};

// Default collections
const DEFAULT_COLLECTIONS: Omit<PlaceCollection, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'want_to_visit',
    name: 'Want to Visit',
    emoji: '⭐',
    color: '#FFD700',
    placeIds: [],
    placeCount: 0,
    isDefault: true,
    sortOrder: 0,
    isPublic: false,
  },
  {
    id: 'been_there',
    name: 'Been There',
    emoji: '✅',
    color: '#34C759',
    placeIds: [],
    placeCount: 0,
    isDefault: true,
    sortOrder: 1,
    isPublic: false,
  },
  {
    id: 'favorites',
    name: 'Favorites',
    emoji: '❤️',
    color: '#FF3B30',
    placeIds: [],
    placeCount: 0,
    isDefault: true,
    sortOrder: 2,
    isPublic: false,
  },
];

class PlacesService {
  // ============================================================================
  // PLACES CRUD
  // ============================================================================

  async getPlaces(): Promise<FavoritePlace[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PLACES);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load places:', error);
      return [];
    }
  }

  async getPlace(id: string): Promise<FavoritePlace | null> {
    const places = await this.getPlaces();
    return places.find((p) => p.id === id) || null;
  }

  async savePlace(place: FavoritePlace): Promise<FavoritePlace> {
    const places = await this.getPlaces();
    const index = places.findIndex((p) => p.id === place.id);

    const now = new Date().toISOString();
    const updated = { ...place, updatedAt: now };

    if (index >= 0) {
      places[index] = updated;
    } else {
      updated.createdAt = now;
      places.unshift(updated);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(places));
    return updated;
  }

  async addPlace(data: QuickAddPlace): Promise<FavoritePlace> {
    const now = new Date().toISOString();

    const place: FavoritePlace = {
      id: `place_${Date.now()}`,
      name: data.name,
      category: data.category || 'other',
      location: {
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
        ...data.location,
      },
      photos: data.photoUri
        ? [
            {
              id: `photo_${Date.now()}`,
              uri: data.photoUri,
              isMain: true,
              takenAt: now,
            },
          ]
        : [],
      rating: data.rating || 0,
      tags: [],
      recommendations: [],
      visits: [],
      visitCount: 0,
      collectionIds: data.collectionId ? [data.collectionId] : [],
      isFavorite: false,
      isPublic: false,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    await this.savePlace(place);

    // Add to collection if specified
    if (data.collectionId) {
      await this.addPlaceToCollection(place.id, data.collectionId);
    }

    return place;
  }

  async updatePlace(id: string, updates: Partial<FavoritePlace>): Promise<FavoritePlace | null> {
    const place = await this.getPlace(id);
    if (!place) return null;

    const updated = { ...place, ...updates, updatedAt: new Date().toISOString() };
    await this.savePlace(updated);
    return updated;
  }

  async deletePlace(id: string): Promise<boolean> {
    const places = await this.getPlaces();
    const filtered = places.filter((p) => p.id !== id);

    if (filtered.length === places.length) return false;

    await AsyncStorage.setItem(STORAGE_KEYS.PLACES, JSON.stringify(filtered));

    // Remove from all collections
    const collections = await this.getCollections();
    for (const collection of collections) {
      if (collection.placeIds.includes(id)) {
        await this.removePlaceFromCollection(id, collection.id);
      }
    }

    return true;
  }

  // ============================================================================
  // VISITS
  // ============================================================================

  async addVisit(placeId: string, visit: Omit<PlaceVisit, 'id'>): Promise<PlaceVisit | null> {
    const place = await this.getPlace(placeId);
    if (!place) return null;

    const newVisit: PlaceVisit = {
      ...visit,
      id: `visit_${Date.now()}`,
    };

    const visits = [...place.visits, newVisit];
    const lastVisited = new Date(visit.date).toISOString();
    const firstVisited = place.firstVisited || lastVisited;

    await this.updatePlace(placeId, {
      visits,
      visitCount: visits.length,
      lastVisited,
      firstVisited,
    });

    return newVisit;
  }

  async updateVisit(
    placeId: string,
    visitId: string,
    updates: Partial<PlaceVisit>
  ): Promise<PlaceVisit | null> {
    const place = await this.getPlace(placeId);
    if (!place) return null;

    const visitIndex = place.visits.findIndex((v) => v.id === visitId);
    if (visitIndex < 0) return null;

    const updatedVisit = { ...place.visits[visitIndex], ...updates };
    const visits = [...place.visits];
    visits[visitIndex] = updatedVisit;

    await this.updatePlace(placeId, { visits });
    return updatedVisit;
  }

  async deleteVisit(placeId: string, visitId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;

    const visits = place.visits.filter((v) => v.id !== visitId);
    if (visits.length === place.visits.length) return false;

    // Recalculate first/last visited
    const sortedVisits = [...visits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    await this.updatePlace(placeId, {
      visits,
      visitCount: visits.length,
      firstVisited: sortedVisits[0]?.date,
      lastVisited: sortedVisits[sortedVisits.length - 1]?.date,
    });

    return true;
  }

  // ============================================================================
  // PHOTOS
  // ============================================================================

  async addPhoto(placeId: string, photo: Omit<PlacePhoto, 'id'>): Promise<PlacePhoto | null> {
    const place = await this.getPlace(placeId);
    if (!place) return null;

    const newPhoto: PlacePhoto = {
      ...photo,
      id: `photo_${Date.now()}`,
    };

    const photos = [...place.photos, newPhoto];

    // Set as main if first photo
    if (photos.length === 1) {
      newPhoto.isMain = true;
    }

    await this.updatePlace(placeId, {
      photos,
      coverPhotoId: place.coverPhotoId || newPhoto.id,
    });

    return newPhoto;
  }

  async deletePhoto(placeId: string, photoId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;

    const photos = place.photos.filter((p) => p.id !== photoId);
    if (photos.length === place.photos.length) return false;

    // Update cover photo if needed
    let coverPhotoId = place.coverPhotoId;
    if (coverPhotoId === photoId) {
      coverPhotoId = photos[0]?.id;
    }

    await this.updatePlace(placeId, { photos, coverPhotoId });
    return true;
  }

  async setCoverPhoto(placeId: string, photoId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;
    if (!place.photos.some((p) => p.id === photoId)) return false;

    await this.updatePlace(placeId, { coverPhotoId: photoId });
    return true;
  }

  // ============================================================================
  // COLLECTIONS CRUD
  // ============================================================================

  async getCollections(): Promise<PlaceCollection[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      if (!stored) {
        // Initialize with defaults
        const now = new Date().toISOString();
        const defaults = DEFAULT_COLLECTIONS.map((c) => ({
          ...c,
          createdAt: now,
          updatedAt: now,
        }));
        await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load collections:', error);
      return [];
    }
  }

  async getCollection(id: string): Promise<PlaceCollection | null> {
    const collections = await this.getCollections();
    return collections.find((c) => c.id === id) || null;
  }

  async createCollection(data: Partial<PlaceCollection>): Promise<PlaceCollection> {
    const collections = await this.getCollections();
    const now = new Date().toISOString();

    const collection: PlaceCollection = {
      id: `collection_${Date.now()}`,
      name: data.name || 'New Collection',
      emoji: data.emoji || '📁',
      color: data.color || '#667eea',
      description: data.description,
      placeIds: [],
      placeCount: 0,
      sortOrder: collections.length,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };

    collections.push(collection);
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    return collection;
  }

  async updateCollection(
    id: string,
    updates: Partial<PlaceCollection>
  ): Promise<PlaceCollection | null> {
    const collections = await this.getCollections();
    const index = collections.findIndex((c) => c.id === id);
    if (index < 0) return null;

    const updated = {
      ...collections[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    collections[index] = updated;

    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    const collections = await this.getCollections();
    const collection = collections.find((c) => c.id === id);

    if (!collection || collection.isDefault) return false;

    const filtered = collections.filter((c) => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(filtered));

    // Remove collection from all places
    const places = await this.getPlaces();
    for (const place of places) {
      if (place.collectionIds.includes(id)) {
        await this.updatePlace(place.id, {
          collectionIds: place.collectionIds.filter((cid) => cid !== id),
        });
      }
    }

    return true;
  }

  // ============================================================================
  // COLLECTION MEMBERSHIP
  // ============================================================================

  async addPlaceToCollection(placeId: string, collectionId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    const collection = await this.getCollection(collectionId);

    if (!place || !collection) return false;
    if (collection.placeIds.includes(placeId)) return true;

    // Update collection
    await this.updateCollection(collectionId, {
      placeIds: [...collection.placeIds, placeId],
      placeCount: collection.placeCount + 1,
    });

    // Update place
    await this.updatePlace(placeId, {
      collectionIds: [...place.collectionIds, collectionId],
    });

    return true;
  }

  async removePlaceFromCollection(placeId: string, collectionId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    const collection = await this.getCollection(collectionId);

    if (!place || !collection) return false;
    if (!collection.placeIds.includes(placeId)) return true;

    // Update collection
    await this.updateCollection(collectionId, {
      placeIds: collection.placeIds.filter((id) => id !== placeId),
      placeCount: Math.max(0, collection.placeCount - 1),
    });

    // Update place
    await this.updatePlace(placeId, {
      collectionIds: place.collectionIds.filter((id) => id !== collectionId),
    });

    return true;
  }

  async getPlacesInCollection(collectionId: string): Promise<FavoritePlace[]> {
    const collection = await this.getCollection(collectionId);
    if (!collection) return [];

    const places = await this.getPlaces();
    return places.filter((p) => collection.placeIds.includes(p.id));
  }

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  // eslint-disable-next-line complexity -- tracked in #1
  async filterPlaces(filters: PlaceFilters): Promise<FavoritePlace[]> {
    let places = await this.getPlaces();

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.location.city?.toLowerCase().includes(query) ||
          p.location.country?.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (filters.categories?.length) {
      places = places.filter((p) => filters.categories!.includes(p.category));
    }

    if (filters.priceLevel?.length) {
      places = places.filter((p) => p.priceLevel && filters.priceLevel!.includes(p.priceLevel));
    }

    if (filters.minRating) {
      places = places.filter((p) => p.rating >= filters.minRating!);
    }

    if (filters.cities?.length) {
      places = places.filter((p) => p.location.city && filters.cities!.includes(p.location.city));
    }

    if (filters.countries?.length) {
      places = places.filter(
        (p) => p.location.country && filters.countries!.includes(p.location.country)
      );
    }

    if (filters.tags?.length) {
      places = places.filter((p) => filters.tags!.some((t) => p.tags.includes(t)));
    }

    if (filters.hasPhotos) {
      places = places.filter((p) => p.photos.length > 0);
    }

    if (filters.hasNotes) {
      places = places.filter((p) => p.notes && p.notes.trim().length > 0);
    }

    if (filters.collectionId) {
      places = places.filter((p) => p.collectionIds.includes(filters.collectionId!));
    }

    return places;
  }

  sortPlaces(
    places: FavoritePlace[],
    sortBy: PlaceSortOption,
    userLocation?: PlaceLocation
  ): FavoritePlace[] {
    const sorted = [...places];

    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'rating_high':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'rating_low':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'recent_visit':
        return sorted.sort((a, b) => {
          if (!a.lastVisited) return 1;
          if (!b.lastVisited) return -1;
          return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime();
        });
      case 'oldest_visit':
        return sorted.sort((a, b) => {
          if (!a.firstVisited) return 1;
          if (!b.firstVisited) return -1;
          return new Date(a.firstVisited).getTime() - new Date(b.firstVisited).getTime();
        });
      case 'most_visited':
        return sorted.sort((a, b) => b.visitCount - a.visitCount);
      case 'recently_added':
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'distance':
        if (!userLocation) return sorted;
        return sorted.sort((a, b) => {
          const distA = this.calculateDistance(userLocation, a.location);
          const distB = this.calculateDistance(userLocation, b.location);
          return distA - distB;
        });
      default:
        return sorted;
    }
  }

  // ============================================================================
  // NEARBY
  // ============================================================================

  async findNearby(params: NearbySearchParams): Promise<FavoritePlace[]> {
    let places = await this.getPlaces();

    places = places.filter((p) => {
      const distance = this.calculateDistance(
        { latitude: params.latitude, longitude: params.longitude },
        p.location
      );
      return distance <= params.radiusKm;
    });

    if (params.categories?.length) {
      places = places.filter((p) => params.categories!.includes(p.category));
    }

    // Sort by distance
    places.sort((a, b) => {
      const distA = this.calculateDistance(
        { latitude: params.latitude, longitude: params.longitude },
        a.location
      );
      const distB = this.calculateDistance(
        { latitude: params.latitude, longitude: params.longitude },
        b.location
      );
      return distA - distB;
    });

    if (params.limit) {
      places = places.slice(0, params.limit);
    }

    return places;
  }

  private calculateDistance(from: Partial<PlaceLocation>, to: PlaceLocation): number {
    if (!from.latitude || !from.longitude) return Infinity;

    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const lat1 = this.toRad(from.latitude);
    const lat2 = this.toRad(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  async getStatistics(): Promise<PlaceStatistics> {
    const places = await this.getPlaces();
    const collections = await this.getCollections();

    const byCategory: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let totalRating = 0;
    let ratedCount = 0;
    let totalVisits = 0;
    let placesWithPhotos = 0;
    let placesWithNotes = 0;

    for (const place of places) {
      // Category
      byCategory[place.category] = (byCategory[place.category] || 0) + 1;

      // Country
      if (place.location.country) {
        byCountry[place.location.country] = (byCountry[place.location.country] || 0) + 1;
      }

      // City
      if (place.location.city) {
        byCity[place.location.city] = (byCity[place.location.city] || 0) + 1;
      }

      // Rating
      if (place.rating > 0) {
        byRating[Math.round(place.rating)] = (byRating[Math.round(place.rating)] || 0) + 1;
        totalRating += place.rating;
        ratedCount++;
      }

      // Visits
      totalVisits += place.visitCount;

      // Photos & notes
      if (place.photos.length > 0) placesWithPhotos++;
      if (place.notes?.trim()) placesWithNotes++;
    }

    const sortedByVisits = [...places].sort((a, b) => b.visitCount - a.visitCount);
    const sortedByDate = [...places].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sortedByRating = [...places]
      .filter((p) => p.rating > 0)
      .sort((a, b) => b.rating - a.rating);

    return {
      totalPlaces: places.length,
      totalVisits,
      totalCollections: collections.length,
      byCategory: byCategory as Record<PlaceCategory, number>,
      byCountry,
      byCity,
      byRating,
      mostVisited: sortedByVisits.slice(0, 5),
      recentlyAdded: sortedByDate.slice(0, 5),
      topRated: sortedByRating.slice(0, 5),
      averageRating: ratedCount > 0 ? totalRating / ratedCount : 0,
      placesWithPhotos,
      placesWithNotes,
    };
  }

  // ============================================================================
  // IMPORT/EXPORT
  // ============================================================================

  async exportData(): Promise<PlaceExport> {
    const places = await this.getPlaces();
    const collections = await this.getCollections();

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      places,
      collections: collections.filter((c) => !c.isDefault),
    };
  }

  async importData(data: PlaceExport): Promise<PlaceImportResult> {
    const result: PlaceImportResult = {
      placesImported: 0,
      placesSkipped: 0,
      collectionsImported: 0,
      errors: [],
    };

    // Import collections first
    for (const collection of data.collections) {
      try {
        const existing = await this.getCollection(collection.id);
        if (!existing) {
          await this.createCollection(collection);
          result.collectionsImported++;
        }
      } catch (error) {
        result.errors.push(`Failed to import collection: ${collection.name}`);
      }
    }

    // Import places
    for (const place of data.places) {
      try {
        const existing = await this.getPlace(place.id);
        if (!existing) {
          await this.savePlace(place);
          result.placesImported++;
        } else {
          result.placesSkipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to import place: ${place.name}`);
      }
    }

    return result;
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  async getAllTags(): Promise<string[]> {
    const places = await this.getPlaces();
    const tagSet = new Set<string>();

    for (const place of places) {
      place.tags.forEach((tag) => tagSet.add(tag));
    }

    return Array.from(tagSet).sort();
  }

  async addTag(placeId: string, tag: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;
    if (place.tags.includes(tag)) return true;

    await this.updatePlace(placeId, {
      tags: [...place.tags, tag],
    });
    return true;
  }

  async removeTag(placeId: string, tag: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;

    await this.updatePlace(placeId, {
      tags: place.tags.filter((t) => t !== tag),
    });
    return true;
  }

  // ============================================================================
  // FAVORITES
  // ============================================================================

  async toggleFavorite(placeId: string): Promise<boolean> {
    const place = await this.getPlace(placeId);
    if (!place) return false;

    const isFavorite = !place.isFavorite;
    await this.updatePlace(placeId, { isFavorite });

    // Add/remove from favorites collection
    const favCollection = (await this.getCollections()).find((c) => c.id === 'favorites');
    if (favCollection) {
      if (isFavorite) {
        await this.addPlaceToCollection(placeId, 'favorites');
      } else {
        await this.removePlaceFromCollection(placeId, 'favorites');
      }
    }

    return isFavorite;
  }
}

export const placesService = new PlacesService();
