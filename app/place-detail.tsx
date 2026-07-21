// Paint the Town Favorite Places - Place Detail Screen

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFavoritePlaces } from '../hooks/useFavoritePlaces';
import { FavoritePlace, PlaceVisit, PLACE_CATEGORIES, PRICE_LEVELS } from '../types/places';

interface PlaceDetailScreenProps {
  navigation?: any;
  route?: { params?: { placeId?: string } };
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
const PlaceDetailScreen: React.FC<PlaceDetailScreenProps> = ({ navigation, route }) => {
  const placeId = route?.params?.placeId;

  const {
    getPlace,
    updatePlace,
    toggleFavorite,
    addVisit,
    deleteVisit,
    addToCollection,
    collections,
    addTag,
    removeTag,
  } = useFavoritePlaces();

  const [place, setPlace] = useState<FavoritePlace | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    if (placeId) {
      const p = getPlace(placeId);
      if (p) {
        setPlace(p);
        setEditedNotes(p.notes || '');
      }
    }
  }, [placeId, getPlace]);

  const handleToggleFavorite = useCallback(async () => {
    if (!place) return;
    await toggleFavorite(place.id);
    const updated = getPlace(place.id);
    if (updated) setPlace(updated);
  }, [place, toggleFavorite, getPlace]);

  const handleUpdateRating = useCallback(
    async (rating: number) => {
      if (!place) return;
      await updatePlace(place.id, { rating });
      const updated = getPlace(place.id);
      if (updated) setPlace(updated);
    },
    [place, updatePlace, getPlace]
  );

  const handleSaveNotes = useCallback(async () => {
    if (!place) return;
    await updatePlace(place.id, { notes: editedNotes });
    const updated = getPlace(place.id);
    if (updated) setPlace(updated);
    setIsEditing(false);
  }, [place, editedNotes, updatePlace, getPlace]);

  const handleAddTag = useCallback(async () => {
    if (!place || !newTag.trim()) return;
    await addTag(place.id, newTag.trim());
    const updated = getPlace(place.id);
    if (updated) setPlace(updated);
    setNewTag('');
  }, [place, newTag, addTag, getPlace]);

  const handleRemoveTag = useCallback(
    async (tag: string) => {
      if (!place) return;
      await removeTag(place.id, tag);
      const updated = getPlace(place.id);
      if (updated) setPlace(updated);
    },
    [place, removeTag, getPlace]
  );

  const handleAddToCollection = useCallback(
    async (collectionId: string) => {
      if (!place) return;
      await addToCollection(place.id, collectionId);
      const updated = getPlace(place.id);
      if (updated) setPlace(updated);
      setShowCollectionPicker(false);
    },
    [place, addToCollection, getPlace]
  );

  const handleAddVisit = useCallback(async () => {
    if (!place) return;
    const visit: Omit<PlaceVisit, 'id'> = {
      date: new Date().toISOString(),
      rating: place.rating,
    };
    await addVisit(place.id, visit);
    const updated = getPlace(place.id);
    if (updated) setPlace(updated);
    setShowAddVisit(false);
  }, [place, addVisit, getPlace]);

  const handleDeleteVisit = useCallback(
    async (visitId: string) => {
      if (!place) return;
      Alert.alert('Delete Visit', 'Are you sure you want to delete this visit?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteVisit(place.id, visitId);
            const updated = getPlace(place.id);
            if (updated) setPlace(updated);
          },
        },
      ]);
    },
    [place, deleteVisit, getPlace]
  );

  const handleOpenMaps = useCallback(() => {
    if (!place) return;
    const { latitude, longitude } = place.location;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  }, [place]);

  const handleShare = useCallback(async () => {
    if (!place) return;
    try {
      await Share.share({
        title: place.name,
        message: `Check out ${place.name}${place.location.city ? ` in ${place.location.city}` : ''}!`,
      });
    } catch (error) {
      // Handle error
    }
  }, [place]);

  const getCategoryInfo = (categoryId: string) => {
    return (
      PLACE_CATEGORIES.find((c) => c.id === categoryId) ||
      PLACE_CATEGORIES[PLACE_CATEGORIES.length - 1]
    );
  };

  const getPriceInfo = (priceLevel: string) => {
    return PRICE_LEVELS.find((p) => p.id === priceLevel);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!place) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const categoryInfo = getCategoryInfo(place.category);
  const priceInfo = place.priceLevel ? getPriceInfo(place.priceLevel) : null;
  const coverPhoto = place.photos.find((p) => p.id === place.coverPhotoId) || place.photos[0];

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <View style={styles.headerImage}>
        {place.photos.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
                );
                setActivePhotoIndex(index);
              }}
            >
              {place.photos.map((photo, index) => (
                <Image key={photo.id} source={{ uri: photo.uri }} style={styles.headerPhoto} />
              ))}
            </ScrollView>
            {place.photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {place.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      index === activePhotoIndex && styles.photoIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <LinearGradient
            colors={[categoryInfo.color, categoryInfo.color + '80']}
            style={styles.headerPlaceholder}
          >
            <Text style={styles.headerPlaceholderIcon}>{categoryInfo.icon}</Text>
          </LinearGradient>
        )}

        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction} onPress={handleShare}>
            <Text style={styles.headerActionIcon}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleToggleFavorite}>
            <Text style={styles.headerActionIcon}>{place.isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color }]}>
              <Text style={styles.categoryBadgeText}>{categoryInfo.icon}</Text>
            </View>
          </View>

          {place.location.formattedAddress || place.location.city ? (
            <TouchableOpacity style={styles.locationRow} onPress={handleOpenMaps}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>
                {place.location.formattedAddress ||
                  `${place.location.city}${place.location.country ? `, ${place.location.country}` : ''}`}
              </Text>
              <Text style={styles.locationArrow}>→</Text>
            </TouchableOpacity>
          ) : null}

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleUpdateRating(star)}>
                  <Text style={styles.ratingStar}>{star <= place.rating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Level */}
          {priceInfo && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Price Level:</Text>
              <Text style={styles.priceValue}>
                {priceInfo.symbol} {priceInfo.label}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {place.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{place.description}</Text>
          </View>
        )}

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {place.tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onLongPress={() => handleRemoveTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.addTagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add tag..."
                placeholderTextColor="#999"
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          {isEditing ? (
            <TextInput
              style={styles.notesInput}
              value={editedNotes}
              onChangeText={setEditedNotes}
              multiline
              placeholder="Add your notes about this place..."
              placeholderTextColor="#999"
              onBlur={handleSaveNotes}
            />
          ) : (
            <Text style={styles.notesText}>
              {place.notes || 'No notes yet. Tap Edit to add some.'}
            </Text>
          )}
        </View>

        {/* Recommendations */}
        {place.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {place.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <Text style={styles.recommendationWhat}>💡 {rec.what}</Text>
                {rec.tip && <Text style={styles.recommendationTip}>{rec.tip}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <TouchableOpacity onPress={() => setShowCollectionPicker(true)}>
              <Text style={styles.addButton}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.collectionsContainer}>
            {collections
              .filter((c) => place.collectionIds.includes(c.id))
              .map((collection) => (
                <View
                  key={collection.id}
                  style={[styles.collectionBadge, { borderColor: collection.color }]}
                >
                  <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
                  <Text style={styles.collectionName}>{collection.name}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Visit History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visits ({place.visitCount})</Text>
            <TouchableOpacity onPress={handleAddVisit}>
              <Text style={styles.addButton}>+ Add Visit</Text>
            </TouchableOpacity>
          </View>

          {place.visits.length === 0 ? (
            <Text style={styles.emptyVisits}>No visits recorded yet</Text>
          ) : (
            place.visits.map((visit) => (
              <TouchableOpacity
                key={visit.id}
                style={styles.visitCard}
                onLongPress={() => handleDeleteVisit(visit.id)}
              >
                <View style={styles.visitInfo}>
                  <Text style={styles.visitDate}>{formatDate(visit.date)}</Text>
                  {visit.tripName && <Text style={styles.visitTrip}>🧳 {visit.tripName}</Text>}
                </View>
                {visit.rating && <Text style={styles.visitRating}>⭐ {visit.rating}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Contact Info */}
        {place.contact && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            {place.contact.phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${place.contact!.phone}`)}
              >
                <Text style={styles.contactIcon}>📞</Text>
                <Text style={styles.contactText}>{place.contact.phone}</Text>
              </TouchableOpacity>
            )}
            {place.contact.website && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(place.contact!.website!)}
              >
                <Text style={styles.contactIcon}>🌐</Text>
                <Text style={styles.contactText}>{place.contact.website}</Text>
              </TouchableOpacity>
            )}
            {place.contact.instagram && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`https://instagram.com/${place.contact!.instagram}`)}
              >
                <Text style={styles.contactIcon}>📸</Text>
                <Text style={styles.contactText}>@{place.contact.instagram}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Collection Picker Modal */}
      {showCollectionPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Collection</Text>
              <TouchableOpacity onPress={() => setShowCollectionPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {collections
                .filter((c) => !place.collectionIds.includes(c.id))
                .map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={styles.modalOption}
                    onPress={() => handleAddToCollection(collection.id)}
                  >
                    <Text style={styles.modalOptionEmoji}>{collection.emoji}</Text>
                    <Text style={styles.modalOptionText}>{collection.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
  },
  headerImage: {
    height: 280,
    position: 'relative',
  },
  headerPhoto: {
    width: 400,
    height: 280,
  },
  headerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholderIcon: {
    fontSize: 80,
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoIndicatorActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 10,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginTop: -24,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  mainInfo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  placeName: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
  },
  locationArrow: {
    fontSize: 16,
    color: '#667eea',
  },
  ratingContainer: {
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingStar: {
    fontSize: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  editButton: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  addButton: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#667eea',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  addTagContainer: {
    minWidth: 100,
  },
  addTagInput: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    fontSize: 14,
    color: '#1a1a1a',
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  recommendationCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  recommendationWhat: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  recommendationTip: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  collectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#fff',
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
  emptyVisits: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  visitInfo: {
    flex: 1,
  },
  visitDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  visitTrip: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  visitRating: {
    fontSize: 14,
    color: '#888',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: '#667eea',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 20,
    color: '#888',
  },
  modalContent: {
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalOptionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  bottomPadding: {
    height: 40,
  },
});

export default PlaceDetailScreen;
