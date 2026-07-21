// Paint the Town Favorite Places - Place Card Component

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FavoritePlace, PLACE_CATEGORIES } from '../types/places';

interface PlaceCardProps {
  place: FavoritePlace;
  variant?: 'full' | 'compact' | 'mini';
  onPress?: () => void;
  onLongPress?: () => void;
  onFavoritePress?: () => void;
  showFavoriteButton?: boolean;
  showVisitCount?: boolean;
  showRating?: boolean;
  showCategory?: boolean;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  variant = 'full',
  onPress,
  onLongPress,
  onFavoritePress,
  showFavoriteButton = true,
  showVisitCount = true,
  showRating = true,
  showCategory = true,
// eslint-disable-next-line complexity -- tracked in #1
}) => {
  const getCategoryInfo = (categoryId: string) => {
    return PLACE_CATEGORIES.find(c => c.id === categoryId) || 
           PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1];
  };

  const categoryInfo = getCategoryInfo(place.category);
  const coverPhoto = place.photos.find(p => p.id === place.coverPhotoId) || place.photos[0];

  const formatVisitInfo = (): string => {
    if (place.visitCount === 0) return 'Not visited yet';
    if (place.visitCount === 1) return 'Visited once';
    return `Visited ${place.visitCount} times`;
  };

  const formatLocation = (): string => {
    if (place.location.city && place.location.country) {
      return `${place.location.city}, ${place.location.country}`;
    }
    return place.location.city || place.location.country || '';
  };

  // Mini variant - horizontal compact
  if (variant === 'mini') {
    return (
      <TouchableOpacity
        style={styles.miniContainer}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.uri }} style={styles.miniImage} />
        ) : (
          <View style={[styles.miniImagePlaceholder, { backgroundColor: categoryInfo.color + '30' }]}>
            <Text style={styles.miniPlaceholderIcon}>{categoryInfo.icon}</Text>
          </View>
        )}
        <View style={styles.miniInfo}>
          <Text style={styles.miniName} numberOfLines={1}>{place.name}</Text>
          {place.location.city && (
            <Text style={styles.miniLocation} numberOfLines={1}>
              📍 {place.location.city}
            </Text>
          )}
        </View>
        {showRating && place.rating > 0 && (
          <Text style={styles.miniRating}>⭐ {place.rating}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.compactImageContainer}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto.uri }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImagePlaceholder, { backgroundColor: categoryInfo.color + '30' }]}>
              <Text style={styles.compactPlaceholderIcon}>{categoryInfo.icon}</Text>
            </View>
          )}
          {showFavoriteButton && (
            <TouchableOpacity
              style={styles.compactFavoriteButton}
              onPress={onFavoritePress}
            >
              <Text style={styles.favoriteIcon}>
                {place.isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{place.name}</Text>
          <View style={styles.compactMeta}>
            {showCategory && (
              <Text style={styles.compactCategory}>{categoryInfo.icon}</Text>
            )}
            {formatLocation() && (
              <Text style={styles.compactLocation} numberOfLines={1}>
                {formatLocation()}
              </Text>
            )}
          </View>
          {showRating && place.rating > 0 && (
            <Text style={styles.compactRating}>⭐ {place.rating.toFixed(1)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Full variant (default)
  return (
    <TouchableOpacity
      style={styles.fullContainer}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.fullImageContainer}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.uri }} style={styles.fullImage} />
        ) : (
          <View style={[styles.fullImagePlaceholder, { backgroundColor: categoryInfo.color + '30' }]}>
            <Text style={styles.fullPlaceholderIcon}>{categoryInfo.icon}</Text>
          </View>
        )}

        {/* Favorite button */}
        {showFavoriteButton && (
          <TouchableOpacity
            style={styles.fullFavoriteButton}
            onPress={onFavoritePress}
          >
            <Text style={styles.favoriteIcon}>
              {place.isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Rating badge */}
        {showRating && place.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {place.rating.toFixed(1)}</Text>
          </View>
        )}

        {/* Photo count badge */}
        {place.photos.length > 1 && (
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>📷 {place.photos.length}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.fullInfo}>
        <View style={styles.fullHeader}>
          <Text style={styles.fullName} numberOfLines={1}>{place.name}</Text>
          {showCategory && (
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            </View>
          )}
        </View>

        {formatLocation() && (
          <Text style={styles.fullLocation} numberOfLines={1}>
            📍 {formatLocation()}
          </Text>
        )}

        <View style={styles.fullFooter}>
          {showVisitCount && (
            <Text style={styles.visitInfo}>{formatVisitInfo()}</Text>
          )}
          {place.tags.length > 0 && (
            <View style={styles.tagsPreview}>
              <Text style={styles.tagsText} numberOfLines={1}>
                {place.tags.slice(0, 2).join(' • ')}
                {place.tags.length > 2 ? ` +${place.tags.length - 2}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Grid card for collection view
export const PlaceGridCard: React.FC<PlaceCardProps> = ({
  place,
  onPress,
  onFavoritePress,
}) => {
  const getCategoryInfo = (categoryId: string) => {
    return PLACE_CATEGORIES.find(c => c.id === categoryId) || 
           PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1];
  };

  const categoryInfo = getCategoryInfo(place.category);
  const coverPhoto = place.photos.find(p => p.id === place.coverPhotoId) || place.photos[0];

  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.gridImageContainer}>
        {coverPhoto ? (
          <Image source={{ uri: coverPhoto.uri }} style={styles.gridImage} />
        ) : (
          <View style={[styles.gridImagePlaceholder, { backgroundColor: categoryInfo.color + '40' }]}>
            <Text style={styles.gridPlaceholderIcon}>{categoryInfo.icon}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.gridFavoriteButton}
          onPress={onFavoritePress}
        >
          <Text style={styles.favoriteIconSmall}>
            {place.isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gridInfo}>
        <Text style={styles.gridName} numberOfLines={1}>{place.name}</Text>
        {place.rating > 0 && (
          <Text style={styles.gridRating}>⭐ {place.rating}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Map marker info card
export const PlaceMarkerCard: React.FC<PlaceCardProps> = ({
  place,
  onPress,
}) => {
  const getCategoryInfo = (categoryId: string) => {
    return PLACE_CATEGORIES.find(c => c.id === categoryId) || 
           PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1];
  };

  const categoryInfo = getCategoryInfo(place.category);
  const coverPhoto = place.photos[0];

  return (
    <TouchableOpacity
      style={styles.markerContainer}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto.uri }} style={styles.markerImage} />
      ) : (
        <View style={[styles.markerImagePlaceholder, { backgroundColor: categoryInfo.color }]}>
          <Text style={styles.markerPlaceholderIcon}>{categoryInfo.icon}</Text>
        </View>
      )}
      <View style={styles.markerInfo}>
        <Text style={styles.markerName} numberOfLines={1}>{place.name}</Text>
        <View style={styles.markerMeta}>
          <Text style={styles.markerCategory}>{categoryInfo.name}</Text>
          {place.rating > 0 && (
            <Text style={styles.markerRating}>⭐ {place.rating}</Text>
          )}
        </View>
      </View>
      <View style={styles.markerArrow}>
        <Text style={styles.markerArrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full variant
  fullContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  fullImageContainer: {
    height: 160,
    position: 'relative',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  fullImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlaceholderIcon: {
    fontSize: 48,
  },
  fullFavoriteButton: {
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
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  photoCountText: {
    fontSize: 12,
    color: '#fff',
  },
  fullInfo: {
    padding: 16,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fullName: {
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
  categoryIcon: {
    fontSize: 16,
  },
  fullLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  fullFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visitInfo: {
    fontSize: 12,
    color: '#888',
  },
  tagsPreview: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagsText: {
    fontSize: 11,
    color: '#666',
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  compactImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlaceholderIcon: {
    fontSize: 28,
  },
  compactFavoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactCategory: {
    fontSize: 14,
    marginRight: 6,
  },
  compactLocation: {
    flex: 1,
    fontSize: 13,
    color: '#888',
  },
  compactRating: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },

  // Mini variant
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
  },
  miniImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  miniImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPlaceholderIcon: {
    fontSize: 20,
  },
  miniInfo: {
    flex: 1,
    marginLeft: 10,
  },
  miniName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  miniLocation: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  miniRating: {
    fontSize: 12,
    color: '#888',
  },

  // Grid variant
  gridContainer: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridImageContainer: {
    height: 120,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlaceholderIcon: {
    fontSize: 36,
  },
  gridFavoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIconSmall: {
    fontSize: 14,
  },
  gridInfo: {
    padding: 10,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  gridRating: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  // Marker card
  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    width: 260,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  markerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPlaceholderIcon: {
    fontSize: 22,
  },
  markerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  markerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  markerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  markerCategory: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  markerRating: {
    fontSize: 12,
    color: '#888',
  },
  markerArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerArrowText: {
    fontSize: 18,
    color: '#667eea',
  },
});

export default PlaceCard;
