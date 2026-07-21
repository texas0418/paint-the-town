// Paint the Town Favorite Places - Add Place Screen

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFavoritePlaces } from '../hooks/useFavoritePlaces';
import { PlaceCategory, PriceLevel, PLACE_CATEGORIES, PRICE_LEVELS } from '../types/places';

interface AddPlaceScreenProps {
  navigation?: any;
  route?: { params?: { collectionId?: string; tripId?: string } };
}

// eslint-disable-next-line complexity, max-lines-per-function -- tracked in #1
const AddPlaceScreen: React.FC<AddPlaceScreenProps> = ({ navigation, route }) => {
  const defaultCollectionId = route?.params?.collectionId;
  const tripId = route?.params?.tripId;

  const { addPlace, collections } = useFavoritePlaces();

  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'restaurant' as PlaceCategory,
    description: '',
    latitude: 0,
    longitude: 0,
    address: '',
    city: '',
    country: '',
    priceLevel: undefined as PriceLevel | undefined,
    rating: 0,
    notes: '',
    photoUri: '',
    collectionId: defaultCollectionId || '',
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGetCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      handleFieldChange('latitude', location.coords.latitude);
      handleFieldChange('longitude', location.coords.longitude);

      // Try to get address
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode) {
          handleFieldChange('address', geocode.street || '');
          handleFieldChange('city', geocode.city || '');
          handleFieldChange('country', geocode.country || '');
        }
      } catch (error) {
        console.log('Reverse geocode failed:', error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleFieldChange('photoUri', result.assets[0].uri);
    }
  }, []);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleFieldChange('photoUri', result.assets[0].uri);
    }
  }, []);

  const handleSetRating = (rating: number) => {
    handleFieldChange('rating', formData.rating === rating ? 0 : rating);
  };

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this place.');
      return;
    }

    setIsLoading(true);
    try {
      const place = await addPlace({
        name: formData.name,
        category: formData.category,
        location: {
          latitude: formData.latitude,
          longitude: formData.longitude,
          address: formData.address || undefined,
          city: formData.city || undefined,
          country: formData.country || undefined,
        },
        rating: formData.rating,
        notes: formData.notes || undefined,
        photoUri: formData.photoUri || undefined,
        collectionId: formData.collectionId || undefined,
      });

      if (place) {
        Alert.alert('Saved!', `${formData.name} has been added to your favorites.`, [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save place. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, addPlace, navigation]);

  const getCategoryInfo = (categoryId: PlaceCategory) => {
    return PLACE_CATEGORIES.find((c) => c.id === categoryId) || PLACE_CATEGORIES[0];
  };

  const getPriceInfo = (priceId?: PriceLevel) => {
    if (!priceId) return null;
    return PRICE_LEVELS.find((p) => p.id === priceId);
  };

  const selectedCategoryInfo = getCategoryInfo(formData.category);
  const selectedPriceInfo = getPriceInfo(formData.priceLevel);
  const selectedCollection = collections.find((c) => c.id === formData.collectionId);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation?.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Place</Text>
        <TouchableOpacity
          style={[styles.saveButton, !formData.name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={styles.photoSection}>
          {formData.photoUri ? (
            <TouchableOpacity onPress={handlePickPhoto}>
              <Image source={{ uri: formData.photoUri }} style={styles.photoPreview} />
              <View style={styles.changePhotoOverlay}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.photoPlaceholder}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Text style={styles.photoButtonIcon}>📷</Text>
                <Text style={styles.photoButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                <Text style={styles.photoButtonIcon}>🖼️</Text>
                <Text style={styles.photoButtonText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleFieldChange('name', text)}
            placeholder="Enter place name"
            placeholderTextColor="#999"
            autoFocus
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowCategoryPicker(true)}>
            <Text style={styles.selectorIcon}>{selectedCategoryInfo.icon}</Text>
            <Text style={styles.selectorText}>{selectedCategoryInfo.name}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Rating</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => handleSetRating(star)}>
                <Text style={styles.ratingStar}>{star <= formData.rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Location</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleGetCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <>
                  <Text style={styles.locationButtonIcon}>📍</Text>
                  <Text style={styles.locationButtonText}>Use Current</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => handleFieldChange('address', text)}
            placeholder="Address (optional)"
            placeholderTextColor="#999"
          />

          <View style={styles.rowInputs}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={formData.city}
              onChangeText={(text) => handleFieldChange('city', text)}
              placeholder="City"
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={formData.country}
              onChangeText={(text) => handleFieldChange('country', text)}
              placeholder="Country"
              placeholderTextColor="#999"
            />
          </View>

          {formData.latitude !== 0 && (
            <Text style={styles.coordinatesText}>
              📌 {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
            </Text>
          )}
        </View>

        {/* Price Level */}
        <View style={styles.section}>
          <Text style={styles.label}>Price Level</Text>
          <View style={styles.priceLevels}>
            {PRICE_LEVELS.map((price) => (
              <TouchableOpacity
                key={price.id}
                style={[
                  styles.priceOption,
                  formData.priceLevel === price.id && styles.priceOptionActive,
                ]}
                onPress={() =>
                  handleFieldChange(
                    'priceLevel',
                    formData.priceLevel === price.id ? undefined : price.id
                  )
                }
              >
                <Text
                  style={[
                    styles.priceOptionText,
                    formData.priceLevel === price.id && styles.priceOptionTextActive,
                  ]}
                >
                  {price.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Collection */}
        <View style={styles.section}>
          <Text style={styles.label}>Add to Collection</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowCollectionPicker(true)}>
            <Text style={styles.selectorIcon}>{selectedCollection?.emoji || '📁'}</Text>
            <Text style={styles.selectorText}>
              {selectedCollection?.name || 'Choose collection...'}
            </Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => handleFieldChange('notes', text)}
            placeholder="What did you love about this place?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Category Picker */}
      {showCategoryPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {PLACE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.pickerOption,
                    formData.category === cat.id && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    handleFieldChange('category', cat.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionIcon}>{cat.icon}</Text>
                  <Text style={styles.pickerOptionText}>{cat.name}</Text>
                  {formData.category === cat.id && <Text style={styles.pickerOptionCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Collection Picker */}
      {showCollectionPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Collection</Text>
              <TouchableOpacity onPress={() => setShowCollectionPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              <TouchableOpacity
                style={[styles.pickerOption, !formData.collectionId && styles.pickerOptionActive]}
                onPress={() => {
                  handleFieldChange('collectionId', '');
                  setShowCollectionPicker(false);
                }}
              >
                <Text style={styles.pickerOptionIcon}>📍</Text>
                <Text style={styles.pickerOptionText}>No Collection</Text>
                {!formData.collectionId && <Text style={styles.pickerOptionCheck}>✓</Text>}
              </TouchableOpacity>
              {collections.map((col) => (
                <TouchableOpacity
                  key={col.id}
                  style={[
                    styles.pickerOption,
                    formData.collectionId === col.id && styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    handleFieldChange('collectionId', col.id);
                    setShowCollectionPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionIcon}>{col.emoji}</Text>
                  <Text style={styles.pickerOptionText}>{col.name}</Text>
                  {formData.collectionId === col.id && (
                    <Text style={styles.pickerOptionCheck}>✓</Text>
                  )}
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photoSection: {
    marginBottom: 24,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  changePhotoText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  photoPlaceholder: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  selectorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#888',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingStar: {
    fontSize: 36,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  locationButtonIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  priceLevels: {
    flexDirection: 'row',
    gap: 10,
  },
  priceOption: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  priceOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  priceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priceOptionTextActive: {
    color: '#fff',
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pickerClose: {
    fontSize: 20,
    color: '#888',
  },
  pickerList: {
    padding: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerOptionActive: {
    backgroundColor: '#F5F3FF',
  },
  pickerOptionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerOptionCheck: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default AddPlaceScreen;
