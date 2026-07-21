// Paint the Town Favorite Places - Favorite Places Screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritePlaces } from '../hooks/useFavoritePlaces';
import { FavoritePlace, PlaceCategory, PLACE_CATEGORIES } from '../types/places';

interface FavoritePlacesScreenProps {
  navigation?: any;
  route?: { params?: { collectionId?: string } };
}

// eslint-disable-next-line complexity -- tracked in #1
const FavoritePlacesScreen: React.FC<FavoritePlacesScreenProps> = ({ navigation, route }) => {
  const collectionId = route?.params?.collectionId;

  const {
    filteredPlaces,
    collections,
    filters,
    sortBy,
    isLoading,
    setFilters,
    setSortBy,
    toggleFavorite,
    deletePlace,
    refresh,
  } = useFavoritePlaces({ collectionId });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setFilters({ ...filters, searchQuery: query || undefined });
    },
    [filters, setFilters]
  );

  const handleCategoryFilter = useCallback(
    (category: PlaceCategory | null) => {
      setSelectedCategory(category);
      setFilters({
        ...filters,
        categories: category ? [category] : undefined,
      });
    },
    [filters, setFilters]
  );

  const handleToggleFavorite = useCallback(
    async (place: FavoritePlace) => {
      await toggleFavorite(place.id);
    },
    [toggleFavorite]
  );

  const handleDeletePlace = useCallback(
    (place: FavoritePlace) => {
      Alert.alert('Delete Place', `Are you sure you want to delete "${place.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePlace(place.id),
        },
      ]);
    },
    [deletePlace]
  );

  const getCategoryInfo = (categoryId: PlaceCategory) => {
    return (
      PLACE_CATEGORIES.find((c) => c.id === categoryId) ||
      PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1]
    );
  };

  const currentCollection = useMemo(() => {
    if (!collectionId) return null;
    return collections.find((c) => c.id === collectionId);
  }, [collectionId, collections]);

  const formatVisitInfo = (place: FavoritePlace): string => {
    if (place.visitCount === 0) return 'Not visited yet';
    if (place.visitCount === 1) return 'Visited once';
    return `Visited ${place.visitCount} times`;
  };

  const renderPlaceCard = (place: FavoritePlace) => {
    const categoryInfo = getCategoryInfo(place.category);
    const coverPhoto = place.photos.find((p) => p.id === place.coverPhotoId) || place.photos[0];

    return (
      <TouchableOpacity
        key={place.id}
        style={styles.placeCard}
        onPress={() => navigation?.navigate('PlaceDetail', { placeId: place.id })}
        onLongPress={() => handleDeletePlace(place)}
        activeOpacity={0.7}
      >
        {/* Cover Image */}
        <View style={styles.cardImageContainer}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto.uri }} style={styles.cardImage} />
          ) : (
            <View
              style={[styles.cardImagePlaceholder, { backgroundColor: categoryInfo.color + '30' }]}
            >
              <Text style={styles.cardImagePlaceholderIcon}>{categoryInfo.icon}</Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(place)}
          >
            <Text style={styles.favoriteIcon}>{place.isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>

          {/* Rating Badge */}
          {place.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName} numberOfLines={1}>
              {place.name}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryBadgeText}>{categoryInfo.icon}</Text>
            </View>
          </View>

          {place.location.city && (
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {place.location.city}
              {place.location.country ? `, ${place.location.country}` : ''}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.visitInfo}>{formatVisitInfo(place)}</Text>
            {place.tags.length > 0 && (
              <View style={styles.tagPreview}>
                <Text style={styles.tagPreviewText}>
                  {place.tags.slice(0, 2).join(', ')}
                  {place.tags.length > 2 ? ` +${place.tags.length - 2}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {currentCollection ? currentCollection.name : 'Favorite Places'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation?.navigate('AddPlace')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search places..."
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
              onPress={() => handleCategoryFilter(null)}
            >
              <Text
                style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}
              >
                All
              </Text>
            </TouchableOpacity>
            {PLACE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  selectedCategory === cat.id && styles.filterChipActive,
                  { borderColor: cat.color },
                ]}
                onPress={() => handleCategoryFilter(cat.id as PlaceCategory)}
              >
                <Text style={styles.filterChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === cat.id && styles.filterChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Collections Quick Access */}
      {!collectionId && collections.length > 0 && (
        <View style={styles.collectionsBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection.id}
                style={[styles.collectionChip, { borderColor: collection.color }]}
                onPress={() =>
                  navigation?.navigate('FavoritePlaces', { collectionId: collection.id })
                }
              >
                <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
                <Text style={styles.collectionName}>{collection.name}</Text>
                <View style={[styles.collectionCount, { backgroundColor: collection.color }]}>
                  <Text style={styles.collectionCountText}>{collection.placeCount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Places List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No places found' : 'No places yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first favorite place to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation?.navigate('AddPlace')}
              >
                <Text style={styles.emptyButtonText}>Add Place</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.placesGrid}>{filteredPlaces.map(renderPlaceCard)}</View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  clearButton: {
    fontSize: 16,
    color: '#888',
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 20,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  filterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  collectionsBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  collectionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  collectionCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  collectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  placesGrid: {
    gap: 16,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImageContainer: {
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderIcon: {
    fontSize: 48,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 18,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 16,
  },
  cardLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitInfo: {
    fontSize: 12,
    color: '#888',
  },
  tagPreview: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPreviewText: {
    fontSize: 11,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default FavoritePlacesScreen;
